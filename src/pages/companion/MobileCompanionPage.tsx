import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  isCompanionLocked,
  recordCompanionActivity,
  hasCompanionPin,
  verifyCompanionPairingToken,
  isBiometricsAvailable,
  isBiometricsEnabled,
  setBiometricsEnabled,
} from '../../lib/security/companionPairing';
import { CompanionLockScreen } from '../../components/companion/CompanionLockScreen';
import { getDaySchedule, recordDoseAction } from '../../domain/medicationRegimen';
import { todayInAppTz, formatMinutesTo24h } from '../../lib/time';
import { vitalsRepo } from '../../lib/db';
import type { GlucoseReading, BloodPressureReading } from '../../domain/vitals';
import {
  notificationPermission,
  requestNotificationPermission,
  sendLocalNotification,
} from '../../lib/notifications';
import { Logo } from '../../components/ui/Logo';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import {
  CheckIcon,
  ClockIcon,
  LockIcon,
  PhoneIcon,
  AlertTriangleIcon,
  AndroidIcon,
  DownloadIcon,
} from '../../components/ui/icons';
import type { Tables } from '../../lib/supabase/types';

type Dose = Tables<'doses'>;
type Medicine = Tables<'medicines'>;
type ActiveTab = 'doses' | 'vitals' | 'sos' | 'settings';

export function MobileCompanionPage() {
  const navigate = useNavigate();
  const { user, profile, profiles, activeProfile, switchProfile, signOut } = useAuth();

  const [isLocked, setIsLocked] = useState(() => isCompanionLocked());
  const [activeTab, setActiveTab] = useState<ActiveTab>('doses');
  const [selectedDate] = useState<string>(todayInAppTz());
  const [doses, setDoses] = useState<Dose[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicinesMap, setMedicinesMap] = useState<Record<string, Medicine>>({});
  const [isLoadingDoses, setIsLoadingDoses] = useState(true);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vitals State
  const [vitalType, setVitalType] = useState<'bp' | 'glucose'>('bp');
  const [systolic, setSystolic] = useState<string>('120');
  const [diastolic, setDiastolic] = useState<string>('80');
  const [pulse, setPulse] = useState<string>('72');
  const [glucoseVal, setGlucoseVal] = useState<string>('105');
  const [mealContext, setMealContext] = useState<'fasting' | 'post_prandial' | 'random'>('fasting');
  const [isSavingVitals, setIsSavingVitals] = useState(false);
  const [recentBps, setRecentBps] = useState<BloodPressureReading[]>([]);
  const [recentGlucose, setRecentGlucose] = useState<GlucoseReading[]>([]);

  // Companion Settings & Security state
  const [biometricsAvail, setBiometricsAvail] = useState(false);
  const [biometricActive, setBiometricActive] = useState(() => isBiometricsEnabled());
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [notifState, setNotifState] = useState<NotificationPermission>(() => notificationPermission());

  // Skip dose modal state
  const [skipDoseTarget, setSkipDoseTarget] = useState<Dose | null>(null);
  const [skipReason, setSkipReason] = useState<string>('Forgot');

  const effectiveProfileId = activeProfile?.id || profile?.id || user?.id || '';

  // 1. Process QR Pairing Token from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pairToken = params.get('pair');

    if (pairToken) {
      verifyCompanionPairingToken(pairToken).then((res) => {
        if (res.valid && res.payload) {
          if (res.payload.profileId) {
            switchProfile(res.payload.profileId).catch(console.warn);
          }
          setToastMessage(`Device paired successfully for ${res.payload.profileName}!`);
          if (!hasCompanionPin()) {
            setShowPinSetup(true);
          }
          window.history.replaceState({}, '', window.location.pathname);
        } else if (res.error) {
          setToastMessage(res.error);
        }
      });
    }
  }, [switchProfile]);

  // 2. Online / Offline listeners & auto-lock timeout
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        recordCompanionActivity();
      } else if (document.visibilityState === 'visible') {
        if (isCompanionLocked()) {
          setIsLocked(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    isBiometricsAvailable().then(setBiometricsAvail);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // 3. Load Day's Schedule
  const loadSchedule = useCallback(async () => {
    if (!effectiveProfileId) return;
    setIsLoadingDoses(true);
    try {
      const result = await getDaySchedule(effectiveProfileId, selectedDate, user?.id);
      setDoses(result.doses);
      setMedicines(result.medicines);
      setMedicinesMap(result.medicinesMap);
    } catch (err) {
      console.error('Failed to load companion doses:', err);
    } finally {
      setIsLoadingDoses(false);
    }
  }, [effectiveProfileId, selectedDate, user?.id]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // 4. Load Vitals History
  const loadVitalsHistory = useCallback(async () => {
    if (!effectiveProfileId) return;
    try {
      const [bps, glucoses] = await Promise.all([
        vitalsRepo.listBloodPressureReadings(effectiveProfileId),
        vitalsRepo.listGlucoseReadings(effectiveProfileId),
      ]);
      setRecentBps(bps.slice(0, 3));
      setRecentGlucose(glucoses.slice(0, 3));
    } catch (err) {
      console.error('Failed to load companion vitals:', err);
    }
  }, [effectiveProfileId]);

  useEffect(() => {
    loadVitalsHistory();
  }, [loadVitalsHistory]);

  // Doses Actions
  const handleTakeDose = async (dose: Dose) => {
    try {
      await recordDoseAction({
        dose,
        newStatus: 'taken',
        profileId: effectiveProfileId,
      });
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([30, 50, 30]);
      }
      const medName = medicinesMap[dose.medicine_id]?.medicine_name || 'Prescription Medicine';
      setToastMessage(`Dose of ${medName} logged as taken.`);
      await loadSchedule();
    } catch (err) {
      console.error('Failed to log dose:', err);
      setToastMessage('Failed to record dose.');
    }
  };

  const handleConfirmSkip = async () => {
    if (!skipDoseTarget) return;
    try {
      await recordDoseAction({
        dose: skipDoseTarget,
        newStatus: 'skipped',
        profileId: effectiveProfileId,
        skipReason,
      });
      setToastMessage(`Dose marked as skipped (${skipReason}).`);
      setSkipDoseTarget(null);
      await loadSchedule();
    } catch (err) {
      console.error('Failed to skip dose:', err);
      setToastMessage('Failed to skip dose.');
    }
  };

  // Vitals Save
  const handleSaveVital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveProfileId) return;
    setIsSavingVitals(true);

    try {
      if (vitalType === 'bp') {
        const sysNum = parseInt(systolic, 10);
        const diaNum = parseInt(diastolic, 10);
        const pulNum = parseInt(pulse, 10) || undefined;

        if (isNaN(sysNum) || isNaN(diaNum)) {
          setToastMessage('Please enter valid blood pressure numbers.');
          return;
        }

        await vitalsRepo.createBloodPressureReading({
          id: '',
          user_id: user?.id || effectiveProfileId,
          profile_id: effectiveProfileId,
          systolic: sysNum,
          diastolic: diaNum,
          pulse_bpm: pulNum,
          measured_at: new Date().toISOString(),
          arm: 'left',
          posture: 'sitting',
          notes: undefined,
        });

        setToastMessage(`BP recorded: ${sysNum}/${diaNum} mmHg`);
      } else {
        const valNum = parseFloat(glucoseVal);
        if (isNaN(valNum)) {
          setToastMessage('Please enter a valid glucose level.');
          return;
        }

        await vitalsRepo.createGlucoseReading({
          id: '',
          user_id: user?.id || effectiveProfileId,
          profile_id: effectiveProfileId,
          value_mg_dl: valNum,
          type: mealContext,
          meal_context: mealContext,
          measured_at: new Date().toISOString(),
          notes: undefined,
        });

        setToastMessage(`Glucose recorded: ${valNum} mg/dL (${mealContext})`);
      }

      await loadVitalsHistory();
    } catch (err) {
      console.error('Failed to record vitals:', err);
      setToastMessage('Failed to save reading.');
    } finally {
      setIsSavingVitals(false);
    }
  };

  // Calculations
  const takenCount = doses.filter((d) => d.status === 'taken').length;
  const totalCount = doses.length;
  const adherencePercent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  // BP Evaluation
  const bpEvaluation = useMemo(() => {
    const s = parseInt(systolic, 10);
    const d = parseInt(diastolic, 10);
    if (isNaN(s) || isNaN(d)) return { text: 'Enter values', tone: 'neutral' as const };
    if (s >= 180 || d >= 120) return { text: 'Hypertensive Crisis', tone: 'risk' as const };
    if (s >= 140 || d >= 90) return { text: 'Stage 2 Hypertension', tone: 'risk' as const };
    if (s >= 130 || d >= 80) return { text: 'Stage 1 Hypertension', tone: 'warn' as const };
    if (s >= 120 && d < 80) return { text: 'Elevated BP', tone: 'warn' as const };
    return { text: 'Normal BP', tone: 'ok' as const };
  }, [systolic, diastolic]);

  // Glucose Evaluation
  const glucoseEvaluation = useMemo(() => {
    const v = parseFloat(glucoseVal);
    if (isNaN(v)) return { text: 'Enter value', tone: 'neutral' as const };
    if (mealContext === 'fasting') {
      if (v >= 126) return { text: 'High (Diabetic range)', tone: 'risk' as const };
      if (v >= 100) return { text: 'Elevated (Pre-diabetic)', tone: 'warn' as const };
      if (v < 70) return { text: 'Low (Hypoglycemia alert)', tone: 'risk' as const };
      return { text: 'Normal Fasting', tone: 'ok' as const };
    } else {
      if (v >= 200) return { text: 'High (Diabetic range)', tone: 'risk' as const };
      if (v >= 140) return { text: 'Elevated Post-meal', tone: 'warn' as const };
      if (v < 70) return { text: 'Low (Hypoglycemia alert)', tone: 'risk' as const };
      return { text: 'Normal Post-meal', tone: 'ok' as const };
    }
  }, [glucoseVal, mealContext]);

  // Emergency Age calculation
  const emergencyAge = useMemo(() => {
    if (!activeProfile?.date_of_birth) return null;
    const diff = Date.now() - new Date(activeProfile.date_of_birth).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  }, [activeProfile?.date_of_birth]);

  // Test Alarm
  const handleTestAlarm = async () => {
    if (notificationPermission() !== 'granted') {
      const p = await requestNotificationPermission();
      setNotifState(p);
      if (p !== 'granted') {
        setToastMessage('Please enable notification permissions in browser settings.');
        return;
      }
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([200, 100, 200, 100, 300]);
    }

    const firstMedName = doses[0] ? medicinesMap[doses[0].medicine_id]?.medicine_name : null;
    await sendLocalNotification('Curewell Dose Alarm Test', {
      body: `Time for ${firstMedName || 'Metformin 500mg'} (Morning dose)`,
      tag: 'dose-test',
    });

    setToastMessage('Test dose alarm triggered.');
  };

  // Lock Screen Interceptor
  if (isLocked || showPinSetup) {
    return (
      <CompanionLockScreen
        initialMode={showPinSetup ? 'setup' : undefined}
        profileName={activeProfile?.full_name || 'Caregiver'}
        onUnlocked={() => {
          setIsLocked(false);
          setShowPinSetup(false);
          recordCompanionActivity();
        }}
        onSignOutFallback={() => {
          signOut().then(() => navigate('/login'));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto relative select-none pb-20">
      {/* Toast Notification */}
      <Toast
        open={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
        message={toastMessage || ''}
        tone="ok"
      />

      {/* Sticky Companion TopBar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Persona Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link to="/" className="shrink-0" aria-label="Curewell home">
              <Logo size="sm" />
            </Link>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Companion
            </span>
            {!isOnline && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Offline
              </span>
            )}
          </div>

          {/* Quick Profile Switcher & Manual Lock */}
          <div className="flex items-center gap-1.5 shrink-0">
            {profiles.length > 1 && (
              <select
                value={activeProfile?.id}
                onChange={(e) => switchProfile(e.target.value)}
                className="bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-teal-500 max-w-[130px] truncate"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.relationship === 'self' ? 'Self' : p.relationship})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => {
                recordCompanionActivity();
                setIsLocked(true);
              }}
              title="Lock Companion App"
              aria-label="Lock App"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
            >
              <LockIcon size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Content */}
      <main className="flex-1 p-4 space-y-4">
        {/* ================================================================= */}
        {/* TAB 1: TODAY'S DOSES WORKSPACE                                    */}
        {/* ================================================================= */}
        {activeTab === 'doses' && (
          <div className="space-y-4">
            {/* Header Strip with Date & Progress Ring */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center justify-between">
              <div>
                <p className="text-2xs font-bold uppercase tracking-wider text-teal-400">
                  {activeProfile?.full_name || 'Patient'}
                </p>
                <h2 className="text-lg font-bold text-white">
                  Today’s Medicines
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {takenCount} of {totalCount} doses recorded ({adherencePercent}%)
                </p>
              </div>

              {/* Circular Adherence Ring */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-teal-400 transition-all duration-500 ease-out"
                    strokeDasharray={`${adherencePercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-white">
                  {adherencePercent}%
                </span>
              </div>
            </div>

            {/* Doses List */}
            {isLoadingDoses ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Loading schedule...
              </div>
            ) : doses.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
                <span className="inline-flex p-3 rounded-full bg-teal-500/10 text-teal-400">
                  <CheckIcon size={24} />
                </span>
                <h3 className="font-bold text-slate-200">No Doses Scheduled</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  There are no scheduled medications for this date. Check active prescriptions in the full portal.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {doses.map((dose) => {
                  const isTaken = dose.status === 'taken';
                  const isSkipped = dose.status === 'skipped';
                  const med = medicinesMap[dose.medicine_id];
                  const medName = med?.medicine_name || 'Prescription Medicine';
                  const doseAmount = med?.dose_amount || '1 tablet';
                  const instructions = med?.instructions;
                  const scheduledTime = formatMinutesTo24h(dose.scheduled_minutes);

                  return (
                    <div
                      key={dose.id}
                      className={`p-4 rounded-3xl border transition-all ${
                        isTaken
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                          : isSkipped
                          ? 'bg-amber-950/20 border-amber-900/40'
                          : 'bg-slate-900 border-slate-800 shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-800/40">
                              <ClockIcon size={12} />
                              {scheduledTime}
                            </span>
                            {isTaken && (
                              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                <CheckIcon size={12} /> Taken
                              </span>
                            )}
                            {isSkipped && (
                              <span className="text-[11px] font-bold text-amber-400">
                                Skipped ({dose.skipped_reason || 'N/A'})
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-white truncate">
                            {medName}
                          </h3>

                          <p className="text-xs text-slate-400">
                            {doseAmount}
                            {instructions ? ` • ${instructions}` : ''}
                          </p>
                        </div>

                        {/* Dose Action Buttons */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {!isTaken ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleTakeDose(dose)}
                                className="px-4 py-2 rounded-2xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 touch-manipulation"
                              >
                                <CheckIcon size={14} /> Take
                              </button>
                              <button
                                type="button"
                                onClick={() => setSkipDoseTarget(dose)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition-colors"
                              >
                                Skip
                              </button>
                            </>
                          ) : (
                            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-center">
                              <CheckIcon size={18} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: RAPID VITALS INTAKE WORKSPACE                              */}
        {/* ================================================================= */}
        {activeTab === 'vitals' && (
          <div className="space-y-4">
            {/* Vital Type Selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setVitalType('bp')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  vitalType === 'bp'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Blood Pressure
              </button>
              <button
                type="button"
                onClick={() => setVitalType('glucose')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  vitalType === 'glucose'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Blood Glucose
              </button>
            </div>

            {/* Quick Intake Form */}
            <form
              onSubmit={handleSaveVital}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4"
            >
              {vitalType === 'bp' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="vital-systolic" className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                        Systolic (mmHg)
                      </label>
                      <input
                        id="vital-systolic"
                        type="number"
                        inputMode="numeric"
                        value={systolic}
                        onChange={(e) => setSystolic(e.target.value)}
                        className="w-full h-14 bg-slate-950 border border-slate-800 rounded-2xl text-center text-2xl font-bold text-white focus:outline-none focus:border-teal-500"
                        placeholder="120"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="vital-diastolic" className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                        Diastolic (mmHg)
                      </label>
                      <input
                        id="vital-diastolic"
                        type="number"
                        inputMode="numeric"
                        value={diastolic}
                        onChange={(e) => setDiastolic(e.target.value)}
                        className="w-full h-14 bg-slate-950 border border-slate-800 rounded-2xl text-center text-2xl font-bold text-white focus:outline-none focus:border-teal-500"
                        placeholder="80"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="vital-pulse" className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                      Heart Pulse (BPM - Optional)
                    </label>
                    <input
                      id="vital-pulse"
                      type="number"
                      inputMode="numeric"
                      value={pulse}
                      onChange={(e) => setPulse(e.target.value)}
                      className="w-full h-12 bg-slate-950 border border-slate-800 rounded-2xl text-center text-lg font-semibold text-white focus:outline-none focus:border-teal-500"
                      placeholder="72"
                    />
                  </div>

                  {/* Clinical Classification Badge */}
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Clinical Status:</span>
                    <Badge tone={bpEvaluation.tone} size="sm">
                      {bpEvaluation.text}
                    </Badge>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="vital-glucose" className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                      Glucose Level (mg/dL)
                    </label>
                    <input
                      id="vital-glucose"
                      type="number"
                      inputMode="decimal"
                      value={glucoseVal}
                      onChange={(e) => setGlucoseVal(e.target.value)}
                      className="w-full h-14 bg-slate-950 border border-slate-800 rounded-2xl text-center text-2xl font-bold text-white focus:outline-none focus:border-teal-500"
                      placeholder="105"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                      Timing / Meal Context
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['fasting', 'post_prandial', 'random'] as const).map((ctx) => (
                        <button
                          key={ctx}
                          type="button"
                          onClick={() => setMealContext(ctx)}
                          className={`py-2 px-1 text-2xs font-bold rounded-xl border transition-all ${
                            mealContext === ctx
                              ? 'bg-teal-600 text-white border-teal-500'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {ctx === 'fasting'
                            ? 'Fasting'
                            : ctx === 'post_prandial'
                            ? 'After Meal'
                            : 'Random'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clinical Classification Badge */}
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Clinical Status:</span>
                    <Badge tone={glucoseEvaluation.tone} size="sm">
                      {glucoseEvaluation.text}
                    </Badge>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isSavingVitals}
                className="w-full h-12 rounded-2xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                {isSavingVitals ? 'Saving...' : 'Record Reading Now'}
              </button>
            </form>

            {/* Recent Readings Strip */}
            <div className="space-y-2">
              <h3 className="text-2xs font-bold uppercase tracking-wider text-slate-400 px-1">
                Recent 3 Readings
              </h3>
              <div className="space-y-1.5">
                {vitalType === 'bp' ? (
                  recentBps.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">No blood pressure readings recorded yet.</p>
                  ) : (
                    recentBps.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-white">
                          {b.systolic}/{b.diastolic} mmHg
                          {b.pulse_bpm ? ` • ${b.pulse_bpm} bpm` : ''}
                        </span>
                        <span className="text-2xs text-slate-400">
                          {new Date(b.measured_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )
                ) : (
                  recentGlucose.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">No glucose readings recorded yet.</p>
                  ) : (
                    recentGlucose.map((g) => (
                      <div
                        key={g.id}
                        className="p-3 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-white">
                          {g.value_mg_dl} mg/dL ({g.type})
                        </span>
                        <span className="text-2xs text-slate-400">
                          {new Date(g.measured_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: EMERGENCY MEDICAL ID & FIRST RESPONDER SOS                 */}
        {/* ================================================================= */}
        {activeTab === 'sos' && (
          <div className="space-y-4">
            {/* Red Alert Medical ID Card */}
            <div className="bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-900 border-2 border-rose-500/40 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30 uppercase tracking-wide">
                    Emergency Medical Card
                  </span>
                  <h2 className="text-xl font-black text-white mt-1.5">
                    {activeProfile?.full_name || 'Patient'}
                  </h2>
                  <p className="text-xs text-slate-300">
                    {emergencyAge ? `${emergencyAge} yrs` : ''}
                    {activeProfile?.sex ? ` • ${activeProfile.sex}` : ''}
                  </p>
                </div>

                {/* Blood Group Badge */}
                <div className="px-3.5 py-2 rounded-2xl bg-rose-600 text-white font-black text-lg text-center shadow-lg shadow-rose-600/30 border border-rose-400">
                  <span className="block text-[9px] uppercase tracking-wider opacity-80">Blood</span>
                  {activeProfile?.blood_group || 'Unknown'}
                </div>
              </div>

              {/* Critical Drug Allergies Warning */}
              <div className="p-3.5 rounded-2xl bg-rose-900/30 border border-rose-500/30 space-y-1">
                <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangleIcon size={14} /> Known Drug Allergies
                </span>
                <p className="text-xs font-semibold text-rose-100">
                  {activeProfile?.allergies || 'No critical drug allergies recorded.'}
                </p>
              </div>

              {/* Chronic Diagnoses */}
              {activeProfile?.chronic_conditions && (
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                    Chronic Conditions
                  </span>
                  <p className="text-xs text-slate-200">
                    {typeof activeProfile.chronic_conditions === 'string'
                      ? activeProfile.chronic_conditions
                      : Array.isArray(activeProfile.chronic_conditions)
                      ? (activeProfile.chronic_conditions as string[]).join(', ')
                      : 'None'}
                  </p>
                </div>
              )}

              {/* 1-Tap Emergency Call Action */}
              <div className="space-y-2 pt-1">
                <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                  Designated Emergency Contact
                </span>
                {activeProfile?.emergency_contact_phone ? (
                  <a
                    href={`tel:${activeProfile.emergency_contact_phone}`}
                    className="w-full h-13 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    <PhoneIcon size={18} /> Call {activeProfile.emergency_contact_name || 'Emergency Contact'} (
                    {activeProfile.emergency_contact_phone})
                  </a>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                    No emergency contact phone set in Profile settings.
                  </div>
                )}
              </div>
            </div>

            {/* First Responder Active Meds Overview */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Active Prescription Regimen ({medicines.length})
              </h3>
              {medicines.length === 0 ? (
                <p className="text-xs text-slate-500">No active medicines recorded.</p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {medicines.map((m) => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{m.medicine_name}</span>
                        <span className="text-slate-400 text-2xs">
                          {m.dose_amount || '1 tablet'} • {m.frequency_code || 'Daily'}
                        </span>
                      </div>
                      <span className="text-2xs font-medium text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-800/40">
                        {m.with_food ? 'With Food' : 'Empty Stomach'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: COMPANION SETTINGS, PWA GUIDE & PIN SECURITY               */}
        {/* ================================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Install & Mobile Apps Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                    <AndroidIcon size={16} />
                  </span>
                  Mobile App &amp; APK
                </h3>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">
                  v4.0.0
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <strong className="text-xs font-bold text-white block">Download Android Package (.APK)</strong>
                <p className="text-2xs text-slate-300 leading-relaxed">
                  Standalone application for Android devices with full offline cache, dose reminders, and zero app store requirements.
                </p>
                <div className="pt-1">
                  <a
                    href="/downloads/Curewell.apk"
                    download="Curewell.apk"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
                  >
                    <DownloadIcon size={14} />
                    <span>Download Curewell.apk</span>
                  </a>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <span className="text-xs font-bold text-slate-200 block">Instant Web App (Home Screen)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-2xs text-slate-300">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-teal-400 block font-bold">iOS Safari:</strong>
                    Tap the <strong className="text-white">Share</strong> button at bottom &gt; tap <strong className="text-white">&quot;Add to Home Screen&quot;</strong>.
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-teal-400 block font-bold">Android Chrome:</strong>
                    Tap the <strong className="text-white">Three Dots (⋮)</strong> menu &gt; tap <strong className="text-white">&quot;Install App&quot;</strong>.
                  </div>
                </div>
              </div>
            </div>

            {/* Quick PIN & Biometrics Security Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <LockIcon size={16} className="text-teal-400" />
                Quick PIN & Biometrics
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white block">4-Digit Access PIN</span>
                    <span className="text-2xs text-slate-400">
                      {hasCompanionPin() ? 'Configured and active' : 'No PIN configured'}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowPinSetup(true)}
                  >
                    {hasCompanionPin() ? 'Change PIN' : 'Set PIN'}
                  </Button>
                </div>

                {biometricsAvail && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                    <div>
                      <span className="font-semibold text-white block">Biometric Unlock</span>
                      <span className="text-2xs text-slate-400">Face ID / Touch ID / Fingerprint</span>
                    </div>
                    <label htmlFor="biometric-toggle-input" className="relative inline-flex items-center cursor-pointer">
                      <span className="sr-only">Enable Biometric Unlock</span>
                      <input
                        id="biometric-toggle-input"
                        type="checkbox"
                        checked={biometricActive}
                        onChange={(e) => {
                          setBiometricActive(e.target.checked);
                          setBiometricsEnabled(e.target.checked);
                          setToastMessage(
                            e.target.checked
                              ? 'Biometric unlock enabled.'
                              : 'Biometric unlock disabled.'
                          );
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Dose Alarms & Notifications */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ClockIcon size={16} className="text-teal-400" />
                Dose Alarms & Audio Alerts
              </h3>
              <p className="text-xs text-slate-300">
                Trigger high-priority audio & haptic alerts when medicines are due.
              </p>

              <div className="flex items-center justify-between pt-1">
                <span className="text-2xs font-semibold text-slate-400">
                  Notification Status:{' '}
                  <strong className={notifState === 'granted' ? 'text-emerald-400' : 'text-amber-400'}>
                    {notifState}
                  </strong>
                </span>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTestAlarm}
                >
                  Test Alarm
                </Button>
              </div>
            </div>

            {/* Desktop Portal Escape Hatch */}
            <div className="pt-2 text-center">
              <Link
                to="/dashboard"
                className="text-xs text-teal-400 hover:text-teal-300 underline font-semibold transition-colors"
              >
                Switch to Full Desktop EHR Portal &rarr;
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Skip Dose Modal */}
      {skipDoseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="font-bold text-white text-base">Skip Dose</h3>
            <p className="text-xs text-slate-400">
              Why are you skipping {medicinesMap[skipDoseTarget.medicine_id]?.medicine_name || 'this medicine'}?
            </p>
            <div className="space-y-1.5">
              {['Forgot', 'Side effect', 'Doctor told me to stop', 'Out of stock', 'Other'].map(
                (reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSkipReason(reason)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      skipReason === reason
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {reason}
                  </button>
                )
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSkipDoseTarget(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmSkip}
                className="flex-1"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Tab Navigation */}
      <nav
        aria-label="Companion Navigation"
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-2 flex items-center justify-around"
      >
        <button
          type="button"
          onClick={() => setActiveTab('doses')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'doses'
              ? 'text-teal-400 font-bold bg-teal-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="p-1 rounded-xl">
            <CheckIcon size={18} />
          </span>
          <span className="text-[10px]">Today</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vitals')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'vitals'
              ? 'text-teal-400 font-bold bg-teal-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="p-1 rounded-xl">
            <ClockIcon size={18} />
          </span>
          <span className="text-[10px]">Vitals</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sos')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'sos'
              ? 'text-rose-400 font-bold bg-rose-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="p-1 rounded-xl">
            <PhoneIcon size={18} />
          </span>
          <span className="text-[10px]">Med ID</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'settings'
              ? 'text-teal-400 font-bold bg-teal-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="p-1 rounded-xl">
            <LockIcon size={18} />
          </span>
          <span className="text-[10px]">App & PIN</span>
        </button>
      </nav>
    </div>
  );
}
