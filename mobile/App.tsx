import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Vibration,
  Linking,
  SafeAreaView,
  StatusBar,
  Modal,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/lib/supabase';
import {
  syncAndroidHomeWidget,
  triggerNativeDoseNotification,
  scheduleNativeOfflineAlarm,
} from './src/native/CurewellNativeBridge';

type TabKey = 'schedule' | 'vitals' | 'sos' | 'alarms';
type TimeBucket = 'Morning' | 'Afternoon' | 'Evening' | 'Bedtime';

interface DoseSlot {
  id: string;
  medicineName: string;
  genericName: string;
  strength: string;
  bucket: TimeBucket;
  scheduledTime: string;
  scheduledMinutes: number;
  mealRelation: 'Before Food' | 'After Food' | 'With Water';
  status: 'pending' | 'taken' | 'skipped';
  skipReason?: string;
}

interface VitalLog {
  id: string;
  type: 'bp' | 'glucose';
  primaryVal: number;
  secondaryVal?: number;
  pulse?: number;
  context?: string;
  classification: string;
  tone: 'ok' | 'warn' | 'risk';
  timestamp: string;
}

interface PatientProfile {
  id: string;
  fullName: string;
  relationship: string;
  bloodGroup: string;
  allergies: string;
  chronicConditions: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

const DEFAULT_PROFILES: PatientProfile[] = [
  {
    id: 'self-profile',
    fullName: 'Hamza Ishaq (Self)',
    relationship: 'Self',
    bloodGroup: 'B+',
    allergies: 'None known',
    chronicConditions: 'Routine Preventive Care',
    emergencyContactName: 'Family Emergency Contact',
    emergencyContactPhone: '1122',
  },
  {
    id: 'father-profile',
    fullName: 'Muhammad Ali (Father)',
    relationship: 'Parent',
    bloodGroup: 'O+',
    allergies: 'Penicillin, Sulfa Drugs',
    chronicConditions: 'Type 2 Diabetes, Hypertension',
    emergencyContactName: 'Hamza Ishaq (Caregiver)',
    emergencyContactPhone: '+923001234567',
  },
];

const INITIAL_DOSES: DoseSlot[] = [
  {
    id: 'dose-1',
    medicineName: 'Risek',
    genericName: 'Omeprazole',
    strength: '20mg',
    bucket: 'Morning',
    scheduledTime: '07:30 AM',
    scheduledMinutes: 450,
    mealRelation: 'Before Food',
    status: 'pending',
  },
  {
    id: 'dose-2',
    medicineName: 'Glucophage',
    genericName: 'Metformin HCl',
    strength: '500mg',
    bucket: 'Morning',
    scheduledTime: '08:30 AM',
    scheduledMinutes: 510,
    mealRelation: 'After Food',
    status: 'pending',
  },
  {
    id: 'dose-3',
    medicineName: 'Concor',
    genericName: 'Bisoprolol',
    strength: '5mg',
    bucket: 'Afternoon',
    scheduledTime: '02:00 PM',
    scheduledMinutes: 840,
    mealRelation: 'After Food',
    status: 'pending',
  },
  {
    id: 'dose-4',
    medicineName: 'Glucophage',
    genericName: 'Metformin HCl',
    strength: '500mg',
    bucket: 'Evening',
    scheduledTime: '08:30 PM',
    scheduledMinutes: 1230,
    mealRelation: 'After Food',
    status: 'pending',
  },
  {
    id: 'dose-5',
    medicineName: 'Lipiget',
    genericName: 'Atorvastatin',
    strength: '20mg',
    bucket: 'Bedtime',
    scheduledTime: '10:30 PM',
    scheduledMinutes: 1350,
    mealRelation: 'With Water',
    status: 'pending',
  },
];

const STORAGE_KEYS = {
  DOSES: 'curewell_rn_doses_v4',
  VITALS: 'curewell_rn_vitals_v4',
  PIN: 'curewell_rn_pin_v4',
  PROFILE_ID: 'curewell_rn_profile_v4',
  ALARMS_ENABLED: 'curewell_rn_alarms_v4',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('schedule');
  const [profiles, setProfiles] = useState<PatientProfile[]>(DEFAULT_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState<string>(DEFAULT_PROFILES[0].id);

  const [doses, setDoses] = useState<DoseSlot[]>(INITIAL_DOSES);
  const [vitals, setVitals] = useState<VitalLog[]>([]);
  const [alarmsEnabled, setAlarmsEnabled] = useState<boolean>(true);

  // Add Medicine Modal
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedGeneric, setNewMedGeneric] = useState('');
  const [newMedStrength, setNewMedStrength] = useState('500mg');
  const [newMedBucket, setNewMedBucket] = useState<TimeBucket>('Morning');
  const [newMedMeal, setNewMedMeal] = useState<'Before Food' | 'After Food' | 'With Water'>('After Food');

  // Skip Reason Modal
  const [skipTargetId, setSkipTargetId] = useState<string | null>(null);

  // Vitals Intake State
  const [vitalMode, setVitalMode] = useState<'bp' | 'glucose'>('bp');
  const [systolic, setSystolic] = useState('122');
  const [diastolic, setDiastolic] = useState('78');
  const [pulse, setPulse] = useState('72');
  const [glucose, setGlucose] = useState('108');
  const [glucoseContext, setGlucoseContext] = useState<'Fasting' | 'After Meal' | 'Random'>('Fasting');

  // PIN Lock & Sync Modal
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [syncStatus, setSyncStatus] = useState<string>('Offline-First Local Vault Active');
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) || profiles[0],
    [profiles, activeProfileId]
  );

  const showToast = useCallback((msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => {
      setBannerNotice((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  // Load persisted state from AsyncStorage + optional Supabase sync
  useEffect(() => {
    (async () => {
      try {
        const [rawDoses, rawVitals, rawPin, rawProf, rawAlarms] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.DOSES),
          AsyncStorage.getItem(STORAGE_KEYS.VITALS),
          AsyncStorage.getItem(STORAGE_KEYS.PIN),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE_ID),
          AsyncStorage.getItem(STORAGE_KEYS.ALARMS_ENABLED),
        ]);

        if (rawDoses) setDoses(JSON.parse(rawDoses));
        if (rawVitals) setVitals(JSON.parse(rawVitals));
        if (rawPin) {
          setSavedPin(rawPin);
          setIsLocked(true);
        }
        if (rawProf) setActiveProfileId(rawProf);
        if (rawAlarms !== null) setAlarmsEnabled(rawAlarms === 'true');
      } catch (e) {
        console.warn('Error restoring local storage:', e);
      }
    })();
  }, []);

  // Sync Native Android Home-Screen Widget whenever doses or profile change
  useEffect(() => {
    const takenCount = doses.filter((d) => d.status === 'taken').length;
    const totalCount = doses.length;
    const nextPending = doses.find((d) => d.status === 'pending');
    const nextDoseText = nextPending
      ? `Next: ${nextPending.medicineName} ${nextPending.strength} at ${nextPending.scheduledTime} (${nextPending.mealRelation})`
      : 'All scheduled doses completed for today!';

    syncAndroidHomeWidget({
      profileName: activeProfile.fullName,
      takenCount,
      totalCount,
      nextDoseText,
      bloodGroup: activeProfile.bloodGroup,
      allergies: activeProfile.allergies,
    });
  }, [doses, activeProfile]);

  const persistDoses = async (updated: DoseSlot[]) => {
    setDoses(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.DOSES, JSON.stringify(updated));
  };

  const handleTakeDose = async (id: string) => {
    Vibration.vibrate([0, 40, 60, 40]);
    const target = doses.find((d) => d.id === id);
    const updated = doses.map((d) =>
      d.id === id ? { ...d, status: 'taken' as const, skipReason: undefined } : d
    );
    await persistDoses(updated);
    if (target) {
      showToast(`Logged ${target.medicineName} ${target.strength} as Taken`);
    }
  };

  const handleResetDose = async (id: string) => {
    const updated = doses.map((d) =>
      d.id === id ? { ...d, status: 'pending' as const, skipReason: undefined } : d
    );
    await persistDoses(updated);
  };

  const handleConfirmSkip = async (reason: string) => {
    if (!skipTargetId) return;
    Vibration.vibrate(50);
    const updated = doses.map((d) =>
      d.id === skipTargetId ? { ...d, status: 'skipped' as const, skipReason: reason } : d
    );
    await persistDoses(updated);
    setSkipTargetId(null);
    showToast(`Dose marked as skipped (${reason})`);
  };

  const handleAddMedicine = async () => {
    if (!newMedName.trim()) return;
    const bucketTimes: Record<TimeBucket, { time: string; mins: number }> = {
      Morning: { time: '08:00 AM', mins: 480 },
      Afternoon: { time: '02:00 PM', mins: 840 },
      Evening: { time: '08:00 PM', mins: 1200 },
      Bedtime: { time: '10:30 PM', mins: 1350 },
    };
    const slot: DoseSlot = {
      id: `dose-${Date.now()}`,
      medicineName: newMedName.trim(),
      genericName: newMedGeneric.trim() || 'Active Prescription',
      strength: newMedStrength.trim() || '1 tab',
      bucket: newMedBucket,
      scheduledTime: bucketTimes[newMedBucket].time,
      scheduledMinutes: bucketTimes[newMedBucket].mins,
      mealRelation: newMedMeal,
      status: 'pending',
    };
    const updated = [...doses, slot].sort((a, b) => a.scheduledMinutes - b.scheduledMinutes);
    await persistDoses(updated);
    setNewMedName('');
    setNewMedGeneric('');
    setShowAddMedModal(false);
    showToast(`Added ${slot.medicineName} to ${slot.bucket} schedule & Android Widget`);
  };

  // Vitals Evaluation
  const bpClass = useMemo(() => {
    const s = parseInt(systolic, 10);
    const d = parseInt(diastolic, 10);
    if (isNaN(s) || isNaN(d)) return { label: 'Enter reading', tone: 'ok' as const };
    if (s >= 180 || d >= 120) return { label: 'Hypertensive Crisis (Seek Care)', tone: 'risk' as const };
    if (s >= 140 || d >= 90) return { label: 'Stage 2 Hypertension', tone: 'risk' as const };
    if (s >= 130 || d >= 80) return { label: 'Stage 1 Elevated', tone: 'warn' as const };
    return { label: 'Optimal / Normal BP', tone: 'ok' as const };
  }, [systolic, diastolic]);

  const glucoseClass = useMemo(() => {
    const g = parseFloat(glucose);
    if (isNaN(g)) return { label: 'Enter reading', tone: 'ok' as const };
    if (g < 70) return { label: 'Hypoglycemia Low Alert (<70)', tone: 'risk' as const };
    if (glucoseContext === 'Fasting') {
      if (g >= 126) return { label: 'High Fasting Range', tone: 'risk' as const };
      if (g >= 100) return { label: 'Elevated Fasting', tone: 'warn' as const };
      return { label: 'Normal Fasting (70-99)', tone: 'ok' as const };
    }
    if (g >= 200) return { label: 'High Post-Meal Range', tone: 'risk' as const };
    if (g >= 140) return { label: 'Elevated Post-Meal', tone: 'warn' as const };
    return { label: 'Normal Post-Meal (<140)', tone: 'ok' as const };
  }, [glucose, glucoseContext]);

  const handleLogVital = async () => {
    Vibration.vibrate(40);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let entry: VitalLog;

    if (vitalMode === 'bp') {
      const s = parseInt(systolic, 10) || 120;
      const d = parseInt(diastolic, 10) || 80;
      const p = parseInt(pulse, 10) || 72;
      entry = {
        id: `vital-${Date.now()}`,
        type: 'bp',
        primaryVal: s,
        secondaryVal: d,
        pulse: p,
        classification: bpClass.label,
        tone: bpClass.tone,
        timestamp: `Today, ${nowStr}`,
      };
    } else {
      const g = parseFloat(glucose) || 100;
      entry = {
        id: `vital-${Date.now()}`,
        type: 'glucose',
        primaryVal: g,
        context: glucoseContext,
        classification: glucoseClass.label,
        tone: glucoseClass.tone,
        timestamp: `Today, ${nowStr}`,
      };
    }

    const updated = [entry, ...vitals].slice(0, 25);
    setVitals(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(updated));
    showToast(
      vitalMode === 'bp'
        ? `Saved BP: ${entry.primaryVal}/${entry.secondaryVal} mmHg`
        : `Saved Glucose: ${entry.primaryVal} mg/dL (${entry.context})`
    );
  };

  // Schedule Native Android AlarmManager Notifications
  const handleScheduleAllOfflineAlarms = async () => {
    Vibration.vibrate([0, 50, 80, 50]);
    const now = new Date();
    let scheduledCount = 0;

    for (let i = 0; i < doses.length; i++) {
      const d = doses[i];
      if (d.status === 'taken') continue;
      const target = new Date();
      target.setHours(Math.floor(d.scheduledMinutes / 60), d.scheduledMinutes % 60, 0, 0);
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      await scheduleNativeOfflineAlarm(
        2000 + i,
        target.getTime(),
        `Time for ${d.medicineName} (${d.strength})`,
        `${d.bucket} Dose • Take ${d.mealRelation} (${d.scheduledTime})`
      );
      scheduledCount++;
    }

    // Also fire an immediate native Android notification so user can see and test Lock-Screen "Mark Taken" button right now
    const nextMed = doses.find((d) => d.status === 'pending') || doses[0];
    await triggerNativeDoseNotification(
      `Time for ${nextMed.medicineName} ${nextMed.strength}`,
      `${nextMed.bucket} Dose (${nextMed.scheduledTime}) • ${nextMed.mealRelation}. Tap 'Mark Taken' directly from notification.`
    );

    showToast(`Armed ${scheduledCount} offline Android alarms + sent live notification!`);
  };

  // Cloud Sync with Supabase
  const handleSupabaseSignIn = async () => {
    if (!emailInput.trim() || !passwordInput.trim()) return;
    setSyncStatus('Connecting to Curewell Cloud...');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim().toLowerCase(),
        password: passwordInput,
      });
      if (error) {
        setSyncStatus(`Sync error: ${error.message}`);
        return;
      }
      if (data.user) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id);

        if (profs && profs.length > 0) {
          const mapped: PatientProfile[] = profs.map((p: any) => ({
            id: p.id,
            fullName: p.full_name || 'Patient',
            relationship: p.relationship || 'Self',
            bloodGroup: p.blood_group || 'O+',
            allergies: p.allergies || 'None recorded',
            chronicConditions: p.chronic_conditions || 'None',
            emergencyContactName: p.emergency_contact_name || 'Emergency Contact',
            emergencyContactPhone: p.emergency_contact_phone || '1122',
          }));
          setProfiles(mapped);
          setActiveProfileId(mapped[0].id);
        }

        const { data: cloudMeds } = await supabase
          .from('medicines')
          .select('*')
          .eq('user_id', data.user.id);

        if (cloudMeds && cloudMeds.length > 0) {
          const syncedDoses: DoseSlot[] = cloudMeds.slice(0, 8).map((m: any, idx: number) => ({
            id: m.id || `cloud-${idx}`,
            medicineName: m.medicine_name,
            genericName: m.generic_name || 'Prescribed Regimen',
            strength: m.strength || m.dose_amount || '1 tab',
            bucket: idx % 3 === 0 ? 'Morning' : idx % 3 === 1 ? 'Afternoon' : 'Evening',
            scheduledTime: idx % 3 === 0 ? '08:00 AM' : idx % 3 === 1 ? '02:00 PM' : '08:30 PM',
            scheduledMinutes: idx % 3 === 0 ? 480 : idx % 3 === 1 ? 840 : 1230,
            mealRelation: m.with_food === false ? 'Before Food' : 'After Food',
            status: 'pending',
          }));
          await persistDoses(syncedDoses);
        }

        setSyncStatus(`Synced with ${data.user.email}`);
        setShowAuthModal(false);
        showToast('Cloud profile & medicines synced to phone!');
      }
    } catch {
      setSyncStatus('Offline mode active');
    }
  };

  // PIN Lock Screen
  if (isLocked && savedPin) {
    return (
      <SafeAreaView style={styles.lockContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#020617" />
        <View style={styles.lockCard}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>CUREWELL ANDROID COMPANION</Text>
          </View>
          <Text style={styles.lockTitle}>Enter 4-Digit Companion PIN</Text>
          <Text style={styles.lockSubtitle}>
            Protecting medical schedule & emergency ID for {activeProfile.fullName}
          </Text>

          <View style={styles.pinDotsRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  pinInput.length > i && styles.pinDotActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.numpadGrid}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL'].map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.numpadKey}
                onPress={() => {
                  Vibration.vibrate(20);
                  if (key === 'CLR') {
                    setPinInput('');
                  } else if (key === 'DEL') {
                    setPinInput((p) => p.slice(0, -1));
                  } else {
                    const next = (pinInput + key).slice(0, 4);
                    setPinInput(next);
                    if (next.length === 4) {
                      if (next === savedPin) {
                        setPinInput('');
                        setIsLocked(false);
                      } else {
                        Vibration.vibrate([0, 80, 50, 80]);
                        setPinInput('');
                      }
                    }
                  }
                }}
              >
                <Text style={styles.numpadKeyText}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const takenCount = doses.filter((d) => d.status === 'taken').length;
  const adherencePct = doses.length > 0 ? Math.round((takenCount / doses.length) * 100) : 100;
  const buckets: TimeBucket[] = ['Morning', 'Afternoon', 'Evening', 'Bedtime'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      {/* Top Native Companion App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoMark}>
            <Text style={styles.logoCross}>+</Text>
          </View>
          <View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Curewell</Text>
              <View style={styles.nativePill}>
                <Text style={styles.nativePillText}>NATIVE ANDROID</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>{activeProfile.fullName}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.profileSwitchBtn}
            onPress={() => {
              const idx = profiles.findIndex((p) => p.id === activeProfile.id);
              const next = profiles[(idx + 1) % profiles.length];
              setActiveProfileId(next.id);
              AsyncStorage.setItem(STORAGE_KEYS.PROFILE_ID, next.id);
              showToast(`Switched care profile to ${next.fullName}`);
            }}
          >
            <Text style={styles.profileSwitchText}>Switch Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Toast Notice Banner */}
      {bannerNotice && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastBannerText}>{bannerNotice}</Text>
        </View>
      )}

      {/* Main Content Area */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* ================================================================= */}
        {/* TAB 1: MEDICAL SCHEDULE & HOME WIDGET SYNC                        */}
        {/* ================================================================= */}
        {activeTab === 'schedule' && (
          <View style={styles.sectionStack}>
            {/* Adherence & Widget Status Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eyebrowText}>TODAY'S MEDICAL SCHEDULE</Text>
                  <Text style={styles.heroHeadline}>
                    {takenCount} of {doses.length} Doses Taken
                  </Text>
                  <Text style={styles.heroSubtext}>
                    Synced with Android Home-Screen Widget & Offline Alarms
                  </Text>
                </View>
                <View style={styles.adherenceCircle}>
                  <Text style={styles.adherencePctText}>{adherencePct}%</Text>
                  <Text style={styles.adherenceLabel}>ADHERENCE</Text>
                </View>
              </View>

              <View style={styles.heroActionsRow}>
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => setShowAddMedModal(true)}
                >
                  <Text style={styles.primaryActionBtnText}>+ Add Medicine</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryActionBtn}
                  onPress={handleScheduleAllOfflineAlarms}
                >
                  <Text style={styles.secondaryActionBtnText}>Test Lock-Screen Alarm</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Time Bucketed Doses */}
            {buckets.map((bucket) => {
              const bucketDoses = doses.filter((d) => d.bucket === bucket);
              if (bucketDoses.length === 0) return null;

              return (
                <View key={bucket} style={styles.bucketSection}>
                  <View style={styles.bucketHeader}>
                    <Text style={styles.bucketTitle}>{bucket.toUpperCase()} ROUTINE</Text>
                    <Text style={styles.bucketCount}>
                      {bucketDoses.filter((d) => d.status === 'taken').length}/{bucketDoses.length} Done
                    </Text>
                  </View>

                  {bucketDoses.map((dose) => {
                    const isTaken = dose.status === 'taken';
                    const isSkipped = dose.status === 'skipped';

                    return (
                      <View
                        key={dose.id}
                        style={[
                          styles.doseCard,
                          isTaken && styles.doseCardTaken,
                          isSkipped && styles.doseCardSkipped,
                        ]}
                      >
                        <View style={styles.doseInfo}>
                          <View style={styles.doseMetaRow}>
                            <View style={styles.timeBadge}>
                              <Text style={styles.timeBadgeText}>{dose.scheduledTime}</Text>
                            </View>
                            <View style={styles.mealBadge}>
                              <Text style={styles.mealBadgeText}>{dose.mealRelation}</Text>
                            </View>
                          </View>

                          <Text style={styles.medNameText}>
                            {dose.medicineName}{' '}
                            <Text style={styles.medStrengthText}>{dose.strength}</Text>
                          </Text>
                          <Text style={styles.genericNameText}>
                            Active Salt: {dose.genericName}
                          </Text>

                          {isTaken && (
                            <Text style={styles.statusTakenLabel}>✓ Confirmed Taken</Text>
                          )}
                          {isSkipped && (
                            <Text style={styles.statusSkippedLabel}>
                              ✕ Skipped ({dose.skipReason || 'Excused'})
                            </Text>
                          )}
                        </View>

                        <View style={styles.doseButtonsCol}>
                          {dose.status === 'pending' ? (
                            <>
                              <TouchableOpacity
                                style={styles.takeBtn}
                                onPress={() => handleTakeDose(dose.id)}
                              >
                                <Text style={styles.takeBtnText}>Take</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.skipBtn}
                                onPress={() => setSkipTargetId(dose.id)}
                              >
                                <Text style={styles.skipBtnText}>Skip</Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <TouchableOpacity
                              style={styles.undoBtn}
                              onPress={() => handleResetDose(dose.id)}
                            >
                              <Text style={styles.undoBtnText}>Undo</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}

        {/* ================================================================= */}
        {/* TAB 2: 10-SECOND VITALS LOGGER                                    */}
        {/* ================================================================= */}
        {activeTab === 'vitals' && (
          <View style={styles.sectionStack}>
            <View style={styles.segmentedRow}>
              <TouchableOpacity
                style={[styles.segmentBtn, vitalMode === 'bp' && styles.segmentBtnActive]}
                onPress={() => setVitalMode('bp')}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    vitalMode === 'bp' && styles.segmentBtnTextActive,
                  ]}
                >
                  Blood Pressure (mmHg)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, vitalMode === 'glucose' && styles.segmentBtnActive]}
                onPress={() => setVitalMode('glucose')}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    vitalMode === 'glucose' && styles.segmentBtnTextActive,
                  ]}
                >
                  Blood Glucose (mg/dL)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              {vitalMode === 'bp' ? (
                <>
                  <Text style={styles.cardTitle}>10-Second Blood Pressure Intake</Text>
                  <View style={styles.vitalInputsRow}>
                    <View style={styles.vitalInputBox}>
                      <Text style={styles.inputLabel}>SYSTOLIC</Text>
                      <TextInput
                        style={styles.bigNumericInput}
                        keyboardType="numeric"
                        value={systolic}
                        onChangeText={setSystolic}
                        maxLength={3}
                      />
                    </View>
                    <View style={styles.vitalInputBox}>
                      <Text style={styles.inputLabel}>DIASTOLIC</Text>
                      <TextInput
                        style={styles.bigNumericInput}
                        keyboardType="numeric"
                        value={diastolic}
                        onChangeText={setDiastolic}
                        maxLength={3}
                      />
                    </View>
                    <View style={styles.vitalInputBox}>
                      <Text style={styles.inputLabel}>PULSE (BPM)</Text>
                      <TextInput
                        style={styles.bigNumericInput}
                        keyboardType="numeric"
                        value={pulse}
                        onChangeText={setPulse}
                        maxLength={3}
                      />
                    </View>
                  </View>

                  <View
                    style={[
                      styles.stagingBanner,
                      bpClass.tone === 'risk'
                        ? styles.stagingRisk
                        : bpClass.tone === 'warn'
                        ? styles.stagingWarn
                        : styles.stagingOk,
                    ]}
                  >
                    <Text style={styles.stagingText}>AHA Stage: {bpClass.label}</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.cardTitle}>10-Second Blood Glucose Intake</Text>
                  <View style={styles.vitalInputBox}>
                    <Text style={styles.inputLabel}>GLUCOSE READING (mg/dL)</Text>
                    <TextInput
                      style={styles.bigNumericInput}
                      keyboardType="numeric"
                      value={glucose}
                      onChangeText={setGlucose}
                      maxLength={3}
                    />
                  </View>

                  <View style={styles.contextPillsRow}>
                    {(['Fasting', 'After Meal', 'Random'] as const).map((ctx) => (
                      <TouchableOpacity
                        key={ctx}
                        style={[
                          styles.contextPill,
                          glucoseContext === ctx && styles.contextPillActive,
                        ]}
                        onPress={() => setGlucoseContext(ctx)}
                      >
                        <Text
                          style={[
                            styles.contextPillText,
                            glucoseContext === ctx && styles.contextPillTextActive,
                          ]}
                        >
                          {ctx}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View
                    style={[
                      styles.stagingBanner,
                      glucoseClass.tone === 'risk'
                        ? styles.stagingRisk
                        : glucoseClass.tone === 'warn'
                        ? styles.stagingWarn
                        : styles.stagingOk,
                    ]}
                  >
                    <Text style={styles.stagingText}>ADA Target: {glucoseClass.label}</Text>
                  </View>
                </>
              )}

              <TouchableOpacity style={styles.saveVitalBtn} onPress={handleLogVital}>
                <Text style={styles.saveVitalBtnText}>Record Reading Offline</Text>
              </TouchableOpacity>
            </View>

            {/* Vitals History */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Logged Vitals ({vitals.length})</Text>
              {vitals.length === 0 ? (
                <Text style={styles.emptyText}>
                  No vitals recorded on this phone yet. Log a reading above.
                </Text>
              ) : (
                vitals.map((v) => (
                  <View key={v.id} style={styles.vitalHistoryRow}>
                    <View>
                      <Text style={styles.vitalHistoryValue}>
                        {v.type === 'bp'
                          ? `BP: ${v.primaryVal}/${v.secondaryVal} mmHg (${v.pulse} bpm)`
                          : `Glucose: ${v.primaryVal} mg/dL (${v.context})`}
                      </Text>
                      <Text style={styles.vitalHistoryClass}>{v.classification}</Text>
                    </View>
                    <Text style={styles.vitalHistoryTime}>{v.timestamp}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* TAB 3: OFFLINE PARAMEDIC EMERGENCY SOS CARD                       */}
        {/* ================================================================= */}
        {activeTab === 'sos' && (
          <View style={styles.sectionStack}>
            <View style={styles.sosCard}>
              <View style={styles.sosHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sosBadge}>EMERGENCY PARAMEDIC MEDICAL ID</Text>
                  <Text style={styles.sosPatientName}>{activeProfile.fullName}</Text>
                  <Text style={styles.sosRelationText}>
                    Relationship: {activeProfile.relationship}
                  </Text>
                </View>
                <View style={styles.bloodBadge}>
                  <Text style={styles.bloodBadgeLabel}>BLOOD</Text>
                  <Text style={styles.bloodBadgeValue}>{activeProfile.bloodGroup}</Text>
                </View>
              </View>

              <View style={styles.sosBlock}>
                <Text style={styles.sosBlockLabel}>⚠️ KNOWN DRUG ALLERGIES</Text>
                <Text style={styles.sosBlockValue}>{activeProfile.allergies}</Text>
              </View>

              <View style={styles.sosBlock}>
                <Text style={styles.sosBlockLabel}>CHRONIC CONDITIONS</Text>
                <Text style={styles.sosBlockValue}>{activeProfile.chronicConditions}</Text>
              </View>

              <View style={styles.sosBlock}>
                <Text style={styles.sosBlockLabel}>ACTIVE MEDICATIONS ({doses.length})</Text>
                {doses.map((d) => (
                  <Text key={d.id} style={styles.sosMedItem}>
                    • {d.medicineName} {d.strength} ({d.genericName}) — {d.bucket}
                  </Text>
                ))}
              </View>

              <TouchableOpacity
                style={styles.emergencyCallBtn}
                onPress={() => Linking.openURL(`tel:${activeProfile.emergencyContactPhone}`)}
              >
                <Text style={styles.emergencyCallBtnText}>
                  📞 Call {activeProfile.emergencyContactName} ({activeProfile.emergencyContactPhone})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.emergencyCallBtn, { backgroundColor: '#991B1B', marginTop: 8 }]}
                onPress={() => Linking.openURL('tel:1122')}
              >
                <Text style={styles.emergencyCallBtnText}>
                  🚑 Dial Rescue 1122 Emergency Ambulance
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* TAB 4: ANDROID WIDGETS, OFFLINE ALARMS & CLOUD SYNC               */}
        {/* ================================================================= */}
        {activeTab === 'alarms' && (
          <View style={styles.sectionStack}>
            {/* Home Screen Widget Guide Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📱 Android Home-Screen Widget</Text>
              <Text style={styles.cardBodyText}>
                Curewell includes a native Android Home-Screen Widget that displays your real-time dose adherence and next scheduled pill directly on your phone launcher.
              </Text>
              <View style={styles.stepBox}>
                <Text style={styles.stepText}>1. Long-press on your Android Home Screen.</Text>
                <Text style={styles.stepText}>2. Tap "Widgets" and select "Curewell".</Text>
                <Text style={styles.stepText}>
                  3. Drag the "Curewell Daily Schedule" widget onto your home screen.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => {
                  const taken = doses.filter((d) => d.status === 'taken').length;
                  const next = doses.find((d) => d.status === 'pending');
                  syncAndroidHomeWidget({
                    profileName: activeProfile.fullName,
                    takenCount: taken,
                    totalCount: doses.length,
                    nextDoseText: next
                      ? `Next: ${next.medicineName} ${next.strength} at ${next.scheduledTime}`
                      : 'All doses completed today!',
                    bloodGroup: activeProfile.bloodGroup,
                    allergies: activeProfile.allergies,
                  });
                  showToast('Home-screen widget refreshed!');
                }}
              >
                <Text style={styles.primaryActionBtnText}>Force Sync Home-Screen Widget Now</Text>
              </TouchableOpacity>
            </View>

            {/* Offline Alarm Manager Card */}
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>⏰ Offline Dose Alarm Engine</Text>
                  <Text style={styles.cardBodyText}>
                    Uses Android native AlarmManager (RTC_WAKEUP) to fire lock-screen notifications even with zero internet.
                  </Text>
                </View>
                <Switch
                  value={alarmsEnabled}
                  onValueChange={(val) => {
                    setAlarmsEnabled(val);
                    AsyncStorage.setItem(STORAGE_KEYS.ALARMS_ENABLED, String(val));
                    if (val) handleScheduleAllOfflineAlarms();
                  }}
                  trackColor={{ false: '#334155', true: '#0D9488' }}
                />
              </View>

              <TouchableOpacity
                style={[styles.secondaryActionBtn, { marginTop: 12 }]}
                onPress={handleScheduleAllOfflineAlarms}
              >
                <Text style={styles.secondaryActionBtnText}>
                  Fire Test Lock-Screen Notification & Arm Alarms
                </Text>
              </TouchableOpacity>
            </View>

            {/* 4-Digit PIN Lock Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔒 Local 4-Digit PIN Protection</Text>
              <Text style={styles.cardBodyText}>
                {savedPin
                  ? '4-Digit PIN is active. You can lock the app immediately or clear your PIN.'
                  : 'Protect your medical schedule and emergency records with a quick 4-digit PIN.'}
              </Text>
              <View style={styles.heroActionsRow}>
                {savedPin ? (
                  <>
                    <TouchableOpacity
                      style={styles.primaryActionBtn}
                      onPress={() => setIsLocked(true)}
                    >
                      <Text style={styles.primaryActionBtnText}>Lock App Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryActionBtn}
                      onPress={async () => {
                        await AsyncStorage.removeItem(STORAGE_KEYS.PIN);
                        setSavedPin(null);
                        showToast('PIN lock removed');
                      }}
                    >
                      <Text style={styles.secondaryActionBtnText}>Remove PIN</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={async () => {
                      await AsyncStorage.setItem(STORAGE_KEYS.PIN, '1234');
                      setSavedPin('1234');
                      showToast('Default PIN 1234 enabled! Tap Lock App Now to test.');
                    }}
                  >
                    <Text style={styles.primaryActionBtnText}>Enable Quick PIN (1234)</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Supabase Cloud Account Sync Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>☁️ Curewell Cloud Vault Sync</Text>
              <Text style={styles.cardBodyText}>Status: {syncStatus}</Text>
              <TouchableOpacity
                style={[styles.secondaryActionBtn, { marginTop: 10 }]}
                onPress={() => setShowAuthModal(true)}
              >
                <Text style={styles.secondaryActionBtnText}>
                  Sign In to Sync Prescriptions from Web Vault
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Medicine Modal */}
      <Modal visible={showAddMedModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Medicine to Mobile Schedule</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Brand Name (e.g. Panadol, Augmentin)"
              placeholderTextColor="#64748B"
              value={newMedName}
              onChangeText={setNewMedName}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Active Generic Salt (e.g. Paracetamol)"
              placeholderTextColor="#64748B"
              value={newMedGeneric}
              onChangeText={setNewMedGeneric}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Strength / Dose (e.g. 500mg, 1 tablet)"
              placeholderTextColor="#64748B"
              value={newMedStrength}
              onChangeText={setNewMedStrength}
            />

            <Text style={styles.inputLabel}>TIME BUCKET</Text>
            <View style={styles.contextPillsRow}>
              {buckets.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.contextPill, newMedBucket === b && styles.contextPillActive]}
                  onPress={() => setNewMedBucket(b)}
                >
                  <Text
                    style={[
                      styles.contextPillText,
                      newMedBucket === b && styles.contextPillTextActive,
                    ]}
                  >
                    {b}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.heroActionsRow}>
              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => setShowAddMedModal(false)}
              >
                <Text style={styles.secondaryActionBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleAddMedicine}>
                <Text style={styles.primaryActionBtnText}>Save to Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Skip Dose Reason Modal */}
      <Modal visible={Boolean(skipTargetId)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Why are you skipping this dose?</Text>
            {[
              'Doctor advised to hold',
              'Already took earlier',
              ' Experiencing side effect',
              'Out of medicine supply',
            ].map((reason) => (
              <TouchableOpacity
                key={reason}
                style={styles.reasonOptionBtn}
                onPress={() => handleConfirmSkip(reason.trim())}
              >
                <Text style={styles.reasonOptionText}>{reason.trim()}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.secondaryActionBtn, { marginTop: 8 }]}
              onPress={() => setSkipTargetId(null)}
            >
              <Text style={styles.secondaryActionBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Supabase Cloud Sign-In Modal */}
      <Modal visible={showAuthModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Sync with Curewell Cloud</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Email address"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              keyboardType="email-address"
              value={emailInput}
              onChangeText={setEmailInput}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor="#64748B"
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
            />
            <View style={styles.heroActionsRow}>
              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => setShowAuthModal(false)}
              >
                <Text style={styles.secondaryActionBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleSupabaseSignIn}>
                <Text style={styles.primaryActionBtnText}>Sign In & Sync</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Native Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {(
          [
            { key: 'schedule', icon: '💊', label: 'Schedule' },
            { key: 'vitals', icon: '🩸', label: 'Vitals' },
            { key: 'sos', icon: '🚨', label: 'SOS ID' },
            { key: 'alarms', icon: '📲', label: 'Widgets & Alarms' },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.navTab, active && styles.navTabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={styles.navIcon}>{tab.icon}</Text>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCross: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
  },
  nativePill: {
    backgroundColor: '#0D948833',
    borderColor: '#0D9488',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  nativePillText: {
    color: '#2DD4BF',
    fontSize: 9,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileSwitchBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  profileSwitchText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  toastBanner: {
    backgroundColor: '#0D9488',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  toastBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionStack: {
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 14,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrowText: {
    color: '#2DD4BF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroHeadline: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  heroSubtext: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  adherenceCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0D948822',
    borderWidth: 2.5,
    borderColor: '#14B8A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adherencePctText: {
    color: '#2DD4BF',
    fontSize: 16,
    fontWeight: '900',
  },
  adherenceLabel: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '700',
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: '#0D9488',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  bucketSection: {
    gap: 8,
  },
  bucketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  bucketTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bucketCount: {
    color: '#2DD4BF',
    fontSize: 11,
    fontWeight: '700',
  },
  doseCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  doseCardTaken: {
    borderColor: '#065F46',
    backgroundColor: '#064E3B22',
  },
  doseCardSkipped: {
    borderColor: '#78350F',
    backgroundColor: '#78350F22',
  },
  doseInfo: {
    flex: 1,
    gap: 3,
  },
  doseMetaRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  timeBadge: {
    backgroundColor: '#134E4A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeBadgeText: {
    color: '#2DD4BF',
    fontSize: 11,
    fontWeight: '700',
  },
  mealBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mealBadgeText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  medNameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  medStrengthText: {
    color: '#2DD4BF',
    fontSize: 14,
    fontWeight: '700',
  },
  genericNameText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  statusTakenLabel: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  statusSkippedLabel: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  doseButtonsCol: {
    gap: 6,
  },
  takeBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  takeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  skipBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  skipBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  undoBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  undoBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#0D9488',
  },
  segmentBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 10,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  cardBodyText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  vitalInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  vitalInputBox: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  bigNumericInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 10,
  },
  contextPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  contextPill: {
    flex: 1,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  contextPillActive: {
    backgroundColor: '#0D9488',
    borderColor: '#14B8A6',
  },
  contextPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  contextPillTextActive: {
    color: '#FFFFFF',
  },
  stagingBanner: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  stagingOk: {
    backgroundColor: '#064E3B55',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  stagingWarn: {
    backgroundColor: '#78350F55',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  stagingRisk: {
    backgroundColor: '#7F1D1D66',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  stagingText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  saveVitalBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveVitalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
  vitalHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  vitalHistoryValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  vitalHistoryClass: {
    color: '#2DD4BF',
    fontSize: 11,
  },
  vitalHistoryTime: {
    color: '#64748B',
    fontSize: 11,
  },
  sosCard: {
    backgroundColor: '#1F0910',
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E11D48',
    gap: 14,
  },
  sosHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sosBadge: {
    color: '#FDA4AF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sosPatientName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  sosRelationText: {
    color: '#FECDD3',
    fontSize: 12,
  },
  bloodBadge: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
  },
  bloodBadgeLabel: {
    color: '#FFE4E6',
    fontSize: 9,
    fontWeight: '800',
  },
  bloodBadgeValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  sosBlock: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#881337',
    gap: 4,
  },
  sosBlockLabel: {
    color: '#FDA4AF',
    fontSize: 10,
    fontWeight: '800',
  },
  sosBlockValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sosMedItem: {
    color: '#E2E8F0',
    fontSize: 12,
    marginTop: 2,
  },
  emergencyCallBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  emergencyCallBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  stepBox: {
    backgroundColor: '#020617',
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  stepText: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  navTabActive: {
    backgroundColor: '#0D948822',
  },
  navIcon: {
    fontSize: 16,
  },
  navLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#2DD4BF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.82)',
    justifyContent: 'center',
    padding: 20,
  },
  modalSheet: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  reasonOptionBtn: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
  },
  reasonOptionText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  lockContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    padding: 24,
  },
  lockCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    gap: 12,
  },
  brandBadge: {
    backgroundColor: '#0D948833',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  brandBadgeText: {
    color: '#2DD4BF',
    fontSize: 10,
    fontWeight: '800',
  },
  lockTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  lockSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 14,
    marginVertical: 12,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#475569',
  },
  pinDotActive: {
    backgroundColor: '#2DD4BF',
    borderColor: '#2DD4BF',
  },
  numpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  numpadKey: {
    width: '28%',
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  numpadKeyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
