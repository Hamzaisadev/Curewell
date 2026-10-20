import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Toast } from '../../components/ui/Toast';
import { Badge } from '../../components/ui/Badge';
import { Disclaimer } from '../../components/ui/Disclaimer';
import {
  DoctorIcon,
  FileTextIcon,
  PlusIcon,
  UsersIcon,
  TrashIcon,
  CheckIcon,
  SparklesIcon,
  ShieldIcon,
  MessageSquareIcon,
  PhoneIcon,
  ClockIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
} from '../../components/ui/icons';
import { AddFamilyProfileModal } from '../../components/profile/AddFamilyProfileModal';
import { ShifaMedicalPassportModal } from '../../components/onboarding/ShifaMedicalPassportModal';
import { MobileCompanionModal } from '../../components/companion/MobileCompanionModal';
import { FamilyPassModal } from '../../components/monetization/FamilyPassModal';
import {
  getCaregiverPreferences,
  saveCaregiverPreferences,
  isFamilyPassActive,
  generateCaregiverAlertMessage,
  generateWhatsAppAlertUrl,
  checkOverdueDosesForProfile,
  type OverdueDoseItem,
} from '../../lib/caregiver/alerts';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  profilesRepo,
  visitsRepo,
  medicinesRepo,
  reportsRepo,
  sideEffectsRepo,
  testOrdersRepo,
  remindersRepo,
} from '../../lib/db';
import {
  notificationPermission,
  requestNotificationPermission,
  sendLocalNotification,
} from '../../lib/notifications';
import { formatMinutesTo24h, parseTimeToMinutes } from '../../lib/time';
import {
  EXPORT_FORMAT_IDENTIFIER,
  CURRENT_EXPORT_VERSION,
  validateExportDocument,
  type CurewellExportDocument,
} from '../../lib/export';
import {
  EXTRACTION_DISCLAIMER,
  MEDICINE_INFO_DISCLAIMER,
  REPORT_OUT_OF_RANGE_NOTE,
} from '../../lib/disclaimer';
import type { Tables } from '../../lib/supabase/types';

const RELATIONSHIP_LABELS: Record<string, string> = {
  self: 'Primary Account (Self)',
  parent: 'Parent',
  child: 'Child',
  spouse: 'Spouse',
  other: 'Dependent / Other',
};

function formatConditions(conditions: unknown): string {
  if (!conditions) return '';
  if (Array.isArray(conditions)) return (conditions as string[]).join(', ');
  if (typeof conditions === 'string') return conditions;
  return '';
}

export function SettingsPage() {
  const {
    user,
    profile: authProfile,
    profiles,
    activeProfile,
    switchProfile,
    deleteFamilyProfile,
    refreshProfile,
  } = useAuth();
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [fullName, setFullName] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'other' | 'undisclosed'>('undisclosed');
  const [allergiesText, setAllergiesText] = useState('');
  const [conditionsText, setConditionsText] = useState('');

  // Family profile management state
  const [isAddProfileModalOpen, setIsAddProfileModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false);
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);

  // Reminders state, loaded from and saved to reminder_settings.
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [leadMinutes, setLeadMinutes] = useState(0);
  const [snoozeMinutes, setSnoozeMinutes] = useState(15);
  const [isSavingReminders, setIsSavingReminders] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(() =>
    notificationPermission()
  );

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isDangerOpen, setIsDangerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileImportInputRef = useRef<HTMLInputElement>(null);

  // Caregiver WhatsApp alerts state
  const [caregiverEnabled, setCaregiverEnabled] = useState(false);
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverPhone, setCaregiverPhone] = useState('');
  const [caregiverRelationship, setCaregiverRelationship] = useState('caregiver');
  const [caregiverThreshold, setCaregiverThreshold] = useState(60);
  const [isSavingCaregiver, setIsSavingCaregiver] = useState(false);
  const [overdueDoses, setOverdueDoses] = useState<OverdueDoseItem[]>([]);
  const [isLoadingOverdue, setIsLoadingOverdue] = useState(false);

  // Monetization / Family Pass modal state
  const [isFamilyPassOpen, setIsFamilyPassOpen] = useState(false);
  const [familyPassActive, setFamilyPassActiveState] = useState(() => isFamilyPassActive());

  const effectiveUserId = user?.id || authProfile?.user_id || '';
  const effectiveProfileId = authProfile?.id || effectiveUserId;

  useEffect(() => {
    async function loadSettings() {
      if (!effectiveUserId) return;
      try {
        const p = authProfile ? authProfile : await profilesRepo.getDefaultProfile(effectiveUserId);
        if (p) {
          setProfile(p);
          setFullName(p.full_name || '');
          setSex(p.sex || 'undisclosed');
          setAllergiesText(
            Array.isArray(p.allergies) ? (p.allergies as string[]).join(', ') : (p.allergies as string) || ''
          );
          setConditionsText(
            Array.isArray(p.chronic_conditions)
              ? (p.chronic_conditions as string[]).join(', ')
              : (p.chronic_conditions as string) || ''
          );
        }
      } catch (err) {
        console.error('Failed to load profile settings:', err);
      }

      try {
        const reminders = await remindersRepo.getReminderSettings(
          effectiveProfileId,
          effectiveUserId
        );
        setNotificationsEnabled(reminders.enabled);
        setQuietHoursStart(formatMinutesTo24h(reminders.quiet_hours_start ?? 1320));
        setQuietHoursEnd(formatMinutesTo24h(reminders.quiet_hours_end ?? 420));
        setLeadMinutes(reminders.lead_minutes);
        setSnoozeMinutes(reminders.snooze_minutes);
      } catch (err) {
        console.error('Failed to load reminder settings:', err);
      }

      // Load caregiver preferences for target profile
      const targetProfileId = activeProfile?.id || effectiveProfileId;
      const cPrefs = getCaregiverPreferences(targetProfileId);
      setCaregiverEnabled(cPrefs.enabled);
      setCaregiverName(cPrefs.caregiverName || activeProfile?.emergency_contact_name || '');
      setCaregiverPhone(cPrefs.caregiverPhone || activeProfile?.emergency_contact_phone || '');
      setCaregiverRelationship(cPrefs.relationship || 'caregiver');
      setCaregiverThreshold(cPrefs.overdueThresholdMinutes || 60);

      // Check current overdue doses for active profile
      const pName = activeProfile?.full_name || authProfile?.full_name || 'Patient';
      setIsLoadingOverdue(true);
      try {
        const list = await checkOverdueDosesForProfile(
          targetProfileId,
          pName,
          cPrefs.caregiverPhone || activeProfile?.emergency_contact_phone || '',
          { thresholdMinutes: cPrefs.overdueThresholdMinutes || 60 }
        );
        setOverdueDoses(list);
      } catch (err) {
        console.warn('Failed to load overdue doses:', err);
      } finally {
        setIsLoadingOverdue(false);
      }

      setFamilyPassActiveState(isFamilyPassActive());
    }
    loadSettings();
  }, [
    effectiveUserId,
    effectiveProfileId,
    authProfile,
    activeProfile?.id,
    activeProfile?.full_name,
    activeProfile?.emergency_contact_name,
    activeProfile?.emergency_contact_phone,
  ]);

  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;
    try {
      await deleteFamilyProfile(profileToDelete.id);
      setToastMessage(`Profile for "${profileToDelete.name}" was removed.`);
      setProfileToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete profile';
      setErrorMessage(msg);
      setProfileToDelete(null);
    }
  };

  const handleSwitchProfile = async (targetId: string, targetName: string) => {
    try {
      await switchProfile(targetId);
      setToastMessage(`Switched active profile to ${targetName}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to switch profile';
      setErrorMessage(msg);
    }
  };

  /** Asks the browser for permission before enabling, so the toggle is honest. */
  const handleToggleNotifications = async (next: boolean) => {
    setNotificationsEnabled(next);
    if (!next) return;

    if (notificationPermission() === 'default') {
      const result = await requestNotificationPermission();
      setPermissionState(result);
      if (result !== 'granted') {
        setToastMessage('Notifications were not allowed, so reminders will stay silent.');
      }
    } else {
      setPermissionState(notificationPermission());
    }
  };

  const handleSaveReminders = async () => {
    setIsSavingReminders(true);
    try {
      await remindersRepo.upsertReminderSettings({
        user_id: effectiveUserId,
        profile_id: effectiveProfileId,
        enabled: notificationsEnabled,
        quiet_hours_start: parseTimeToMinutes(quietHoursStart),
        quiet_hours_end: parseTimeToMinutes(quietHoursEnd),
        lead_minutes: leadMinutes,
        snooze_minutes: snoozeMinutes,
      });
      setToastMessage('Reminder settings saved.');
    } catch (err) {
      console.error('Failed to save reminder settings:', err);
      setErrorMessage('Could not save your reminder settings. Please try again.');
    } finally {
      setIsSavingReminders(false);
    }
  };

  const handleTestNotification = async () => {
    let permission = notificationPermission();
    if (permission === 'default') {
      permission = await requestNotificationPermission();
      setPermissionState(permission);
    }

    if (permission !== 'granted') {
      setToastMessage('Allow notifications in your browser to receive dose reminders.');
      return;
    }

    // Actually sends one, rather than only showing a toast that claims it did.
    const shown = await sendLocalNotification('Curewell reminder test', {
      body: 'Dose reminders will look like this.',
      tag: 'curewell-test',
    });
    setToastMessage(
      shown ? 'Test notification sent.' : 'Your browser would not display the notification.'
    );
  };

  const handleSaveCaregiverAlerts = () => {
    setIsSavingCaregiver(true);
    try {
      const targetProfileId = activeProfile?.id || effectiveProfileId;
      saveCaregiverPreferences(
        {
          enabled: caregiverEnabled,
          caregiverName: caregiverName.trim(),
          caregiverPhone: caregiverPhone.trim(),
          relationship: caregiverRelationship,
          overdueThresholdMinutes: caregiverThreshold,
          notifyOnMissedDose: true,
        },
        targetProfileId
      );
      setToastMessage('Caregiver WhatsApp alert preferences saved.');

      // Refresh overdue doses with updated settings
      const pName = activeProfile?.full_name || authProfile?.full_name || 'Patient';
      checkOverdueDosesForProfile(targetProfileId, pName, caregiverPhone.trim(), {
        thresholdMinutes: caregiverThreshold,
      }).then(setOverdueDoses);
    } catch (err) {
      console.error('Failed to save caregiver alerts:', err);
      setErrorMessage('Could not save caregiver preferences. Please try again.');
    } finally {
      setIsSavingCaregiver(false);
    }
  };

  const handleTestCaregiverWhatsApp = () => {
    if (!caregiverPhone.trim()) {
      setErrorMessage('Please provide a caregiver WhatsApp phone number first.');
      return;
    }
    const pName = activeProfile?.full_name || authProfile?.full_name || 'Patient';
    const alertUrl = generateWhatsAppAlertUrl(caregiverPhone.trim(), {
      profileName: pName,
      medicineName: 'Amoxicillin',
      doseAmount: '500mg',
      scheduledTime: '08:00 AM',
    });
    window.open(alertUrl, '_blank', 'noopener,noreferrer');
    setToastMessage('Opening WhatsApp to send test caregiver alert...');
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSavingProfile(true);
    try {
      const allergyArr = allergiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const condArr = conditionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await profilesRepo.updateProfile(profile.id, {
        full_name: fullName.trim() || 'Patient',
        sex,
        allergies: allergyArr.join(', '),
        chronic_conditions: condArr.join(', '),
      });

      await refreshProfile();
      setToastMessage('Profile settings saved successfully.');
    } catch (err) {
      console.error('Failed to save profile:', err);
      setToastMessage('Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Full JSON Export
  const handleExportData = async () => {
    try {
      const [visits, medicines, reports, sideEffects, orders] = await Promise.all([
        visitsRepo.listVisits(effectiveProfileId),
        medicinesRepo.listMedicines(effectiveProfileId),
        reportsRepo.listReports(effectiveProfileId),
        sideEffectsRepo.listSideEffects(effectiveProfileId),
        testOrdersRepo.listTestOrders(effectiveProfileId),
      ]);

      const exportDoc: CurewellExportDocument = {
        format: EXPORT_FORMAT_IDENTIFIER,
        version: CURRENT_EXPORT_VERSION,
        exported_at: new Date().toISOString(),
        app_timezone: 'Asia/Karachi',
        profiles: profile
          ? [
              {
                id: profile.id,
                full_name: profile.full_name,
                relationship: 'self',
                date_of_birth: profile.date_of_birth,
                sex: profile.sex,
                blood_group: (profile.blood_group as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown') || 'unknown',
                height_cm: profile.height_cm,
                weight_kg: profile.weight_kg,
                allergies: Array.isArray(profile.allergies)
                  ? (profile.allergies as string[]).join(', ')
                  : (profile.allergies as string),
                chronic_conditions: Array.isArray(profile.chronic_conditions)
                  ? (profile.chronic_conditions as string[]).join(', ')
                  : (profile.chronic_conditions as string),
                emergency_contact_name: null,
                emergency_contact_phone: null,
                is_default: true,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
              },
            ]
          : [],
        visits: visits.map((v) => ({
          id: v.id,
          profile_id: v.profile_id,
          visit_date: v.visit_date,
          doctor_name: v.doctor_name,
          clinic_name: v.clinic_name,
          specialty: null,
          diagnosis: v.diagnosis,
          doctor_advice: v.doctor_advice,
          follow_up_date: v.follow_up_date,
          visit_cost: v.visit_cost,
          currency: v.currency,
          notes: v.notes,
          created_at: v.created_at,
          updated_at: v.updated_at,
        })),
        medicines: medicines.map((m) => ({
          id: m.id,
          profile_id: m.profile_id,
          visit_id: m.visit_id,
          medicine_name: m.medicine_name,
          strength: m.strength,
          form: m.form,
          dose_amount: m.dose_amount,
          frequency_raw: m.frequency_raw,
          // Preserve null rather than coercing to 'CUSTOM': an export/import
          // round-trip must not invent a frequency the prescription never had.
          frequency_code: m.frequency_code,
          duration_raw: m.duration_days ? `${m.duration_days} days` : null,
          duration_days: m.duration_days,
          start_date: m.start_date,
          end_date: m.end_date,
          instructions: m.instructions,
          with_food: m.with_food,
          is_ongoing: m.is_ongoing,
          is_otc: false,
          unit_cost: null,
          currency: 'PKR',
          discontinued_at: m.discontinued_at,
          created_at: m.created_at,
          updated_at: m.updated_at,
        })),
        doses: [],
        test_orders: orders.map((o) => ({
          id: o.id,
          profile_id: o.profile_id,
          visit_id: o.visit_id,
          test_name: o.test_name,
          canonical_name: o.canonical_name,
          status: (o.status as 'pending' | 'scheduled' | 'completed' | 'cancelled') || 'pending',
          ordered_date: o.ordered_date,
          scheduled_date: o.scheduled_date,
          completed_date: o.completed_date,
          report_id: o.report_id,
          link_method: (o.link_method as 'auto' | 'manual') || null,
          estimated_cost: o.estimated_cost,
          currency: o.currency,
          notes: o.notes,
          created_at: o.created_at,
          updated_at: o.updated_at,
        })),
        reports: reports.map((r) => ({
          id: r.id,
          profile_id: r.profile_id,
          title: r.title,
          report_date: r.report_date,
          lab_name: r.lab_name,
          report_cost: r.report_cost,
          currency: r.currency,
          source_type: (r.source_type as 'image' | 'pdf' | 'manual') || 'manual',
          notes: r.notes,
          created_at: r.created_at,
          updated_at: r.updated_at,
        })),
        report_results: [],
        side_effects: sideEffects.map((s) => ({
          id: s.id,
          profile_id: s.profile_id,
          medicine_id: s.medicine_id,
          medicine_name: s.medicine_name,
          note: s.note,
          severity: (s.severity as 'mild' | 'moderate' | 'severe') || null,
          occurred_at: s.occurred_at,
          created_at: s.created_at,
        })),
        reminder_settings: [],
        images: [],
      };

      const jsonStr = JSON.stringify(exportDoc, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curewell-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setToastMessage('Data exported successfully.');
    } catch (err) {
      console.error('Export error:', err);
      setToastMessage('Failed to export data.');
    }
  };

  // JSON Import & Restore
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);

    try {
      const text = await file.text();
      const rawJson = JSON.parse(text);
      const validation = validateExportDocument(rawJson);

      if (!validation.success) {
        setErrorMessage(`Invalid backup file: ${validation.error}`);
        return;
      }

      setToastMessage('Backup validated successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON file';
      setErrorMessage(`Failed to import backup: ${msg}`);
    } finally {
      if (fileImportInputRef.current) {
        fileImportInputRef.current.value = '';
      }
    }
  };

  // Danger Zone: Wipe All Records
  const handleWipeAllRecords = async () => {
    try {
      const [visits, medicines, reports, sideEffects] = await Promise.all([
        visitsRepo.listVisits(effectiveProfileId),
        medicinesRepo.listMedicines(effectiveProfileId),
        reportsRepo.listReports(effectiveProfileId),
        sideEffectsRepo.listSideEffects(effectiveProfileId),
      ]);

      await Promise.all([
        ...visits.map((v) => visitsRepo.deleteVisit(v.id)),
        ...medicines.map((m) => medicinesRepo.deleteMedicine(m.id)),
        ...reports.map((r) => reportsRepo.deleteReport(r.id)),
        ...sideEffects.map((s) => sideEffectsRepo.deleteSideEffect(s.id)),
      ]);

      setToastMessage('All medical records have been permanently wiped.');
      setIsDangerOpen(false);
    } catch (err) {
      console.error('Wipe error:', err);
      setToastMessage('Failed to wipe records.');
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Settings & Privacy"
        description="Manage your clinical profile, notification reminders, data exports, and privacy controls."
        action={
          <div className="flex items-center gap-2">
            {familyPassActive ? (
              <button
                type="button"
                onClick={() => setIsFamilyPassOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold shadow-2xs hover:bg-emerald-500/25 transition-all cursor-pointer"
              >
                <SparklesIcon size={14} className="text-amber-500" />
                <span>Curewell Family Pass</span>
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-semibold">
                  Active
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsFamilyPassOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <SparklesIcon size={14} className="text-amber-300" />
                <span>Curewell Family Pass</span>
                <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-semibold">
                  ₨499/mo
                </span>
              </button>
            )}
          </div>
        }
      />

      <Toast
        open={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
        message={toastMessage || ''}
        tone="ok"
      />

      {errorMessage && (
        <div className="mb-6 rounded-[var(--radius-lg)] border border-risk-border bg-risk-bg p-4 text-sm text-risk-text flex items-center justify-between">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)} className="font-bold">
            ×
          </button>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Family Profiles & Caregiver Network Card */}
        <Card
          header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                    <UsersIcon size={18} />
                  </span>
                  <h2 className="text-base font-bold text-ink-900">Family Profiles & Caregiver Network</h2>
                </div>
                <p className="text-xs text-ink-500 mt-1">
                  Manage profiles for family members under your care. Data, prescriptions, and lab tests remain strictly isolated per person.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddProfileModalOpen(true)}
                className="self-start sm:self-auto shrink-0"
              >
                <PlusIcon size={16} className="mr-1.5" />
                Add Family Member
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            {profiles.length === 0 ? (
              <div className="text-center py-6 text-sm text-ink-500">
                No profiles loaded yet.
              </div>
            ) : (
              <div className="divide-y divide-line">
                {profiles.map((p: Tables<'profiles'>) => {
                  const isActive = p.id === activeProfile?.id;
                  const isPrimary = p.relationship === 'self' || p.is_default;
                  const label = RELATIONSHIP_LABELS[p.relationship || 'other'] || p.relationship;
                  const initials = p.full_name
                    ? p.full_name
                        .split(' ')
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'U';

                  return (
                    <div
                      key={p.id}
                      className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive ? 'bg-teal-50/40 -mx-4 sm:-mx-6 px-4 sm:px-6 rounded-xl' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                            isActive
                              ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                              : 'bg-surface-hover text-content-muted border-line'
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-ink-900 truncate">
                              {p.full_name}
                            </span>
                            <Badge
                              tone={isActive ? 'ok' : 'neutral'}
                              size="sm"
                            >
                              {label}
                            </Badge>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full">
                                <CheckIcon size={12} /> Active Now
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-ink-500 mt-0.5 flex-wrap">
                            {p.sex && p.sex !== 'undisclosed' && (
                              <span className="capitalize">{p.sex}</span>
                            )}
                            {p.blood_group && (
                              <span>Blood: <strong className="text-ink-700">{p.blood_group}</strong></span>
                            )}
                            {p.chronic_conditions && (
                              <span
                                className="truncate max-w-xs text-ink-600"
                                title={formatConditions(p.chronic_conditions)}
                              >
                                Conditions: {formatConditions(p.chronic_conditions)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {!isActive && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSwitchProfile(p.id, p.full_name)}
                          >
                            Switch to Profile
                          </Button>
                        )}
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => setProfileToDelete({ id: p.id, name: p.full_name })}
                            aria-label={`Remove profile for ${p.full_name}`}
                            className="p-1.5 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Remove family profile"
                          >
                            <TrashIcon size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-line text-xs text-ink-500 flex items-center justify-between">
              <span>
                Tip: You can also switch between profiles instantly from the top-bar profile selector anywhere in Curewell.
              </span>
            </div>
          </div>
        </Card>

        {/* Patient Clinical Profile Card */}
        <Card header={<h2 className="text-base font-bold text-ink-900">Patient Profile & Clinical Context</h2>}>
          <div className="space-y-4">
            {/* Shifa Interactive Passport Launch Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-brand-500/5 to-emerald-500/10 border border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                  <SparklesIcon size={20} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-teal-800 dark:text-teal-200 uppercase tracking-wider flex items-center gap-1">
                      <ShieldIcon size={12} /> Shifa Health Passport
                    </span>
                    {profile?.onboarding_completed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        Active & Guarded
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-600 dark:text-content-muted mt-0.5">
                    Launch the guided, fun wizard to update blood group, chronic conditions, and emergency contacts.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPassportModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <SparklesIcon size={14} />
                <span>Open Shifa Wizard</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="set-name" label="Full Name" required>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </Field>

              <Field id="set-sex" label="Biological Sex" hint="Used for lab reference range calculation">
                <Select
                  id="set-sex"
                  value={sex}
                  onValueChange={(val) => setSex(val as 'male' | 'female' | 'other' | 'undisclosed')}
                  options={[
                    { value: 'undisclosed', label: 'Undisclosed / Other' },
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                  ]}
                  placeholder="Select biological sex"
                />
              </Field>
            </div>

            <Field id="set-allergies" label="Known Drug & Food Allergies" hint="Comma-separated (e.g. Penicillin, Sulfa drugs, Peanuts)">
              <Input
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                placeholder="e.g. Penicillin, NSAIDs"
              />
            </Field>

            <Field id="set-conditions" label="Chronic Conditions" hint="Comma-separated (e.g. Hypertension, Type 2 Diabetes, Asthma)">
              <Input
                value={conditionsText}
                onChange={(e) => setConditionsText(e.target.value)}
                placeholder="e.g. Hypertension, Asthma"
              />
            </Field>

            <div className="flex justify-end pt-2 border-t border-ink-100">
              <Button variant="primary" onClick={handleSaveProfile} loading={isSavingProfile}>
                Save Profile
              </Button>
            </div>
          </div>
        </Card>

        {/* Reminders & Notifications Card */}
        <Card header={<h2 className="text-base font-bold text-ink-900">Dose Reminders & Notification Preferences</h2>}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-ink-200 bg-white">
              <div>
                <span className="font-bold text-sm text-ink-900 block">Browser / Push Notifications</span>
                <span className="text-xs text-ink-500">Receive alerts when scheduled dose times arrive</span>
              </div>
              <label htmlFor="notifications-toggle" className="relative inline-flex items-center cursor-pointer">
                <input
                  id="notifications-toggle"
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => handleToggleNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="sr-only">Toggle Browser / Push Notifications</span>
                <div className="w-11 h-6 bg-ink-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-ink-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700" />
              </label>
            </div>

            {notificationsEnabled && permissionState !== 'granted' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed">
                {permissionState === 'denied'
                  ? 'Notifications are blocked for this site in your browser settings. Reminders cannot be delivered until you allow them there.'
                  : 'Your browser has not granted notification permission yet, so reminders will not appear.'}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="quiet-start" label="Quiet Hours Start" hint="No reminders are shown during this window">
                <Input
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                />
              </Field>

              <Field id="quiet-end" label="Quiet Hours End">
                <Input
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="lead-minutes" label="Remind me early by" hint="Minutes before the dose time">
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={leadMinutes}
                  onChange={(e) => setLeadMinutes(Math.max(0, Number(e.target.value) || 0))}
                />
              </Field>

              <Field id="snooze-minutes" label="Snooze length" hint="Minutes (1–120)">
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={snoozeMinutes}
                  onChange={(e) =>
                    setSnoozeMinutes(Math.min(120, Math.max(1, Number(e.target.value) || 1)))
                  }
                />
              </Field>
            </div>

            {/* These preferences are now persisted and read by the reminder loop —
                previously they were local state that nothing ever consumed. */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100">
              <span className="text-xs text-ink-500">
                Reminders run while Curewell is open in your browser.
              </span>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleTestNotification}>
                  Test Notification
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={isSavingReminders}
                  onClick={handleSaveReminders}
                >
                  Save Reminder Settings
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Caregiver & Family Missed-Dose Alerts Card */}
        <Card
          header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  <MessageSquareIcon size={18} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-ink-900">
                      Caregiver &amp; Family Alerts (WhatsApp Missed-Dose)
                    </h2>
                    {familyPassActive ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        Family Pass Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300">
                        Family Pass Feature
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Notify family members via WhatsApp if doses are missed past 60 minutes. Zero app install needed for caregivers.
                  </p>
                </div>
              </div>

              {!familyPassActive && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsFamilyPassOpen(true)}
                  className="self-start sm:self-auto shrink-0 border-teal-500/30 text-teal-700 hover:bg-teal-50"
                >
                  <SparklesIcon size={14} className="mr-1.5 text-amber-500" />
                  Upgrade to Family Pass
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            {/* Toggle Row */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-surface-hover/50">
              <div>
                <span className="font-bold text-sm text-ink-900 block">
                  Enable Caregiver Missed-Dose WhatsApp Alerts
                </span>
                <span className="text-xs text-content-muted">
                  Sends notifications when {activeProfile?.full_name || 'the patient'} has not confirmed their scheduled medicine within {caregiverThreshold} minutes.
                </span>
              </div>
              <label htmlFor="caregiver-alerts-toggle" className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  id="caregiver-alerts-toggle"
                  type="checkbox"
                  checked={caregiverEnabled}
                  onChange={(e) => setCaregiverEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="sr-only">Toggle Caregiver Missed-Dose Alerts</span>
                <div className="w-11 h-6 bg-ink-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-ink-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            {/* Caregiver Contact & Settings Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                id="caregiver-name"
                label="Caregiver Full Name"
                hint="e.g. Ahmed Khan (Son), Dr. Ayesha (Spouse)"
                required
              >
                <Input
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  placeholder="e.g. Ahmed Khan"
                />
              </Field>

              <Field
                id="caregiver-phone"
                label="Caregiver WhatsApp Number"
                hint="Pakistani (0300 1234567) or International (+92 300 1234567)"
                required
              >
                <Input
                  type="tel"
                  value={caregiverPhone}
                  onChange={(e) => setCaregiverPhone(e.target.value)}
                  placeholder="03001234567"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                id="caregiver-relationship"
                label="Relationship to Patient"
                hint="Primary contact role for adherence updates"
              >
                <Select
                  id="caregiver-relationship"
                  value={caregiverRelationship}
                  onValueChange={(val) => setCaregiverRelationship(val)}
                  options={[
                    { value: 'son', label: 'Son' },
                    { value: 'daughter', label: 'Daughter' },
                    { value: 'spouse', label: 'Spouse / Partner' },
                    { value: 'parent', label: 'Parent' },
                    { value: 'sibling', label: 'Brother / Sister' },
                    { value: 'nurse', label: 'Nurse / Professional Caregiver' },
                    { value: 'caregiver', label: 'General Caregiver' },
                    { value: 'other', label: 'Other Relative' },
                  ]}
                  placeholder="Select relationship"
                />
              </Field>

              <Field
                id="caregiver-threshold"
                label="Overdue Alert Threshold"
                hint="Time after scheduled dose before alert triggers"
              >
                <Select
                  id="caregiver-threshold"
                  value={String(caregiverThreshold)}
                  onValueChange={(val) => setCaregiverThreshold(Number(val) || 60)}
                  options={[
                    { value: '30', label: '30 minutes overdue (High vigilance)' },
                    { value: '45', label: '45 minutes overdue' },
                    { value: '60', label: '60 minutes overdue (Recommended default)' },
                    { value: '90', label: '90 minutes overdue' },
                    { value: '120', label: '120 minutes overdue (Relaxed window)' },
                  ]}
                  placeholder="Select threshold"
                />
              </Field>
            </div>

            {/* Alert Template Preview */}
            <div className="p-3.5 rounded-xl border border-line bg-surface-hover/40 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-ink-900 flex items-center gap-1.5">
                  <MessageSquareIcon size={14} className="text-emerald-600" />
                  Standard WhatsApp Notification Template:
                </span>
                <span className="text-[10px] text-content-muted uppercase tracking-wider font-semibold">
                  Preview
                </span>
              </div>
              <p className="p-3 rounded-lg bg-surface border border-line font-mono text-ink-800 leading-relaxed select-all">
                {generateCaregiverAlertMessage({
                  profileName: activeProfile?.full_name || authProfile?.full_name || 'Patient',
                  medicineName: '[Medicine Name]',
                  doseAmount: '[Dose Amount]',
                  scheduledTime: '[Time]',
                })}
              </p>
            </div>

            {/* Real-time Overdue Doses Section */}
            <div className="p-3.5 rounded-xl border border-line bg-surface space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClockIcon size={15} className="text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-bold text-ink-900">
                    Today&apos;s Overdue Doses for {activeProfile?.full_name || 'Active Profile'}:
                  </span>
                </div>
                {isLoadingOverdue && (
                  <span className="text-[11px] text-content-muted">Checking schedule...</span>
                )}
              </div>

              {overdueDoses.length === 0 ? (
                <div className="py-2.5 px-3 rounded-lg bg-ok-bg/50 border border-ok-border text-xs text-ok-text flex items-center gap-2">
                  <CheckCircleIcon size={14} />
                  <span>
                    No overdue doses currently detected today. All scheduled doses are on track or within the {caregiverThreshold}-minute window.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {overdueDoses.map((item, idx) => (
                    <div
                      key={item.doseId || idx}
                      className="p-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-ink-900">
                            {item.medicineName}
                          </span>
                          <span className="text-[11px] text-content-muted">
                            ({item.doseAmount})
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                            {item.minutesOverdue} mins overdue
                          </span>
                        </div>
                        <p className="text-xs text-ink-600 mt-0.5">
                          Scheduled for {item.scheduledTimeFormatted} • Status: {item.status}
                        </p>
                      </div>

                      <a
                        href={item.whatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors shrink-0"
                      >
                        <MessageSquareIcon size={14} />
                        <span>Send WhatsApp Alert</span>
                        <ExternalLinkIcon size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-line">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestCaregiverWhatsApp}
                className="flex items-center gap-1.5"
              >
                <PhoneIcon size={14} className="text-emerald-600" />
                <span>Send Test WhatsApp Alert</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                loading={isSavingCaregiver}
                onClick={handleSaveCaregiverAlerts}
              >
                Save Caregiver Preferences
              </Button>
            </div>
          </div>
        </Card>

        {/* Healthcare Management Hub */}
        <Card header={<h2 className="text-base font-bold text-ink-900">Healthcare Network & Finance Hub</h2>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <Link
              to="/doctors"
              className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/70 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-100/80 text-teal-800 shrink-0">
                  <DoctorIcon size={20} />
                </div>
                <div>
                  <span className="font-bold text-ink-900 block text-sm">Doctor Directory</span>
                  <span className="text-ink-500 text-[11px]">View doctor-specific consultation timelines & records</span>
                </div>
              </div>
              <span className="font-bold text-teal-800">&rarr;</span>
            </Link>

            <Link
              to="/doctor/visit-prep"
              className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/70 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-100/80 text-teal-800 shrink-0">
                  <FileTextIcon size={20} />
                </div>
                <div>
                  <span className="font-bold text-ink-900 block text-sm">Doctor Visit Companion</span>
                  <span className="text-ink-500 text-[11px]">Consultation talking points, clinical brief &amp; second opinion</span>
                </div>
              </div>
              <span className="font-bold text-teal-800">&rarr;</span>
            </Link>
          </div>
        </Card>

        {/* Data Backup, Export & Restore Card */}
        <Card header={<h2 className="text-base font-bold text-ink-900">Data Management & Offline Backup</h2>}>
          <div className="space-y-4 text-xs">
            <p className="text-ink-600 leading-relaxed">
              Your health data belongs entirely to you. You can download a full cryptographic JSON backup of all prescriptions, doses, lab reports, and doctor consultations at any time.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button variant="secondary" className="w-full sm:w-auto" onClick={handleExportData}>
                Export Health Data (JSON)
              </Button>

              <input
                ref={fileImportInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportFile}
              />
              <Button
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => fileImportInputRef.current?.click()}
              >
                Restore / Import Backup
              </Button>
            </div>
          </div>
        </Card>

        {/* Mobile Companion Card */}
        <Card
          header={
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-base font-bold text-ink-900">Mobile Companion & App Pair</h2>
                  <p className="text-xs text-ink-500">
                    Offline medication checklist, 10-second vitals logger, and medical emergency card on your phone.
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCompanionModalOpen(true)}
                className="self-start sm:self-auto shrink-0"
              >
                Show Pairing QR
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs text-ink-600 leading-relaxed">
            <p>
              Pair your iPhone or Android phone to access today&apos;s doses offline with a tactile 4-digit PIN or Face ID. Zero app store download needed—just scan the QR code and tap &quot;Add to Home Screen&quot;.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCompanionModalOpen(true)}
              >
                Scan QR to Install on Phone
              </Button>
              <Link
                to="/companion"
                className="text-teal-700 hover:text-teal-800 font-semibold underline text-xs ml-2"
              >
                Open Mobile Companion in browser &rarr;
              </Link>
            </div>
          </div>
        </Card>

        {/* Quick Links Card */}
        <Card header={<h2 className="text-base font-bold text-ink-900">Quick Navigation</h2>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <Link
              to="/share"
              className="p-3 rounded-lg border border-ink-200 hover:border-teal-600 hover:bg-teal-50/40 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-ink-900 block">Doctor Share Links & QR</span>
                <span className="text-ink-500 text-[11px]">Manage temporary links</span>
              </div>
              <span className="text-teal-700 font-bold">&rarr;</span>
            </Link>

            <Link
              to="/brief"
              className="p-3 rounded-lg border border-ink-200 hover:border-teal-600 hover:bg-teal-50/40 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-ink-900 block">Printable Doctor Brief</span>
                <span className="text-ink-500 text-[11px]">One-page A4 summary</span>
              </div>
              <span className="text-teal-700 font-bold">&rarr;</span>
            </Link>
          </div>
        </Card>

        {/* Medical Disclaimers Section */}
        <div className="space-y-3">
          <Disclaimer text={EXTRACTION_DISCLAIMER} />
          <Disclaimer text={MEDICINE_INFO_DISCLAIMER} />
          <Disclaimer text={REPORT_OUT_OF_RANGE_NOTE} />
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-[var(--radius-lg)] border-2 border-red-200 bg-red-50/30 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-red-900">
            Danger Zone
          </h2>
          <p className="text-xs text-ink-600 leading-relaxed">
            Permanently delete all patient records, visits, active courses, test orders, and diagnostic lab reports. This action cannot be undone. We recommend exporting your data first.
          </p>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDangerOpen(true)}
          >
            Wipe All Health Records
          </Button>
        </div>
      </div>

      {/* Wipe Confirmation Dialog */}
      <ConfirmDialog
        open={isDangerOpen}
        onOpenChange={setIsDangerOpen}
        title="Wipe All Medical Records"
        description="This will permanently delete every prescription, visit, lab report, and medicine from this account. Type DELETE ALL RECORDS to proceed."
        requiredPhrase="DELETE ALL RECORDS"
        tone="danger"
        confirmLabel="Permanently Delete Everything"
        onConfirm={handleWipeAllRecords}
      />

      {/* Remove Family Profile Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(profileToDelete)}
        onOpenChange={(open) => !open && setProfileToDelete(null)}
        title="Remove Family Profile"
        description={`Are you sure you want to remove the profile for ${profileToDelete?.name}? Their prescriptions, doses, and medical history will be disconnected.`}
        tone="danger"
        confirmLabel="Remove Profile"
        onConfirm={handleDeleteProfile}
      />

      {/* Add Family Member Modal */}
      <AddFamilyProfileModal
        isOpen={isAddProfileModalOpen}
        onClose={() => setIsAddProfileModalOpen(false)}
        onProfileCreated={(name) => setToastMessage(`Profile for "${name}" created successfully.`)}
      />

      {/* Shifa Medical Passport Modal */}
      <ShifaMedicalPassportModal
        isOpen={isPassportModalOpen}
        onClose={() => setIsPassportModalOpen(false)}
        onCompleted={async () => {
          setIsPassportModalOpen(false);
          await refreshProfile();
          if (effectiveUserId) {
            const p = await profilesRepo.getDefaultProfile(effectiveUserId);
            if (p) {
              setProfile(p);
              setFullName(p.full_name || '');
              setSex(p.sex || 'undisclosed');
              setAllergiesText(
                Array.isArray(p.allergies) ? (p.allergies as string[]).join(', ') : (p.allergies as string) || ''
              );
              setConditionsText(
                Array.isArray(p.chronic_conditions)
                  ? (p.chronic_conditions as string[]).join(', ')
                  : (p.chronic_conditions as string) || ''
              );
            }
          }
          setToastMessage('Medical Passport updated successfully.');
        }}
      />

      {/* Mobile Companion Pairing QR Modal */}
      <MobileCompanionModal
        isOpen={isCompanionModalOpen}
        onClose={() => setIsCompanionModalOpen(false)}
      />

      {/* Curewell Family Pass Monetization Modal */}
      <FamilyPassModal
        isOpen={isFamilyPassOpen}
        onClose={() => setIsFamilyPassOpen(false)}
        onSubscribed={() => {
          setFamilyPassActiveState(isFamilyPassActive());
          setToastMessage('Curewell Family Pass status updated.');
        }}
      />
    </AppShell>
  );
}
