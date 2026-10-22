import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  Vibration,
  Linking,
  Text,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  BackHandler,
  AppState,
  AppStateStatus,
  ActivityIndicator,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/lib/supabase';
import {
  enqueueMobileSyncEvent,
  subscribeMobileRealtimeEvents,
  flushOfflineOutbox,
} from './src/lib/realtimeSync';
import {
  syncAndroidHomeWidget,
  triggerNativeDoseNotification,
  scheduleNativeOfflineAlarm,
  getNativeActionTakenDoses,
  clearNativeActionTakenDoses,
} from './src/native/CurewellNativeBridge';

import {
  TabKey,
  TimeBucket,
  MealRelation,
  DoseSlot,
  VitalLog,
  PatientProfile,
  LabReportItem,
} from './src/types';
import {
  STORAGE_KEYS,
  DEFAULT_PROFILES,
  INITIAL_DOSES,
  INITIAL_LABS,
  INITIAL_VITALS,
} from './src/constants';
import { styles } from './src/styles/commonStyles';

// Components
import { Header, TabBar, Toast } from './src/components';
import {
  AddMedicineModal,
  SkipReasonModal,
  AuthModal,
  ProfilePickerModal,
} from './src/components/modals';

// Screens
import {
  ScheduleScreen,
  VitalsScreen,
  SosScreen,
  AlarmsScreen,
  ClinicalSuiteScreen,
} from './src/screens';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('schedule');
  const [profiles, setProfiles] = useState<PatientProfile[]>(DEFAULT_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState<string>(DEFAULT_PROFILES[0].id);

  const [doses, setDoses] = useState<DoseSlot[]>(INITIAL_DOSES);
  const [vitals, setVitals] = useState<VitalLog[]>(INITIAL_VITALS);
  const [labReports, setLabReports] = useState<LabReportItem[]>(INITIAL_LABS);
  const [alarmsEnabled, setAlarmsEnabled] = useState<boolean>(true);

  // Connection & Sync state
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);

  // Modals state
  const [showAddMedModal, setShowAddMedModal] = useState<boolean>(false);
  const [showSkipModal, setShowSkipModal] = useState<boolean>(false);
  const [skipTargetId, setSkipTargetId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showProfilePickerModal, setShowProfilePickerModal] = useState<boolean>(false);

  // Toast banner notice
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Storage initialization state (PIN flash guard)
  const [isStorageLoaded, setIsStorageLoaded] = useState<boolean>(false);

  // PIN Lock screen state
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');

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

  // Runtime Notification Permission Request (Android 13+ / API 33+)
  const requestAndroidNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showToast('Medication alarms require notification permission.');
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Error requesting notification permission:', err);
        return false;
      }
    }
    return true;
  }, [showToast]);

  // Request notification permission on app mount
  useEffect(() => {
    void requestAndroidNotificationPermission();
  }, [requestAndroidNotificationPermission]);

  // Restore state from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const [rawDoses, rawVitals, rawLabs, rawPin, rawProf, rawAlarms, rawSession] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.DOSES),
            AsyncStorage.getItem(STORAGE_KEYS.VITALS),
            AsyncStorage.getItem(STORAGE_KEYS.LABS),
            AsyncStorage.getItem(STORAGE_KEYS.PIN),
            AsyncStorage.getItem(STORAGE_KEYS.PROFILE_ID),
            AsyncStorage.getItem(STORAGE_KEYS.ALARMS_ENABLED),
            AsyncStorage.getItem(STORAGE_KEYS.SESSION),
          ]);

        if (rawDoses) setDoses(JSON.parse(rawDoses));
        if (rawVitals) {
          setVitals(JSON.parse(rawVitals));
        } else {
          setVitals(INITIAL_VITALS);
        }
        if (rawLabs) setLabReports(JSON.parse(rawLabs));
        if (rawPin) {
          setSavedPin(rawPin);
          setIsLocked(true);
        }
        if (rawProf) setActiveProfileId(rawProf);
        if (rawAlarms !== null) setAlarmsEnabled(rawAlarms === 'true');
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          if (parsed?.email) setSessionEmail(parsed.email);
        }
      } catch (e) {
        console.warn('Error restoring local storage:', e);
      } finally {
        setIsStorageLoaded(true);
      }
    })();
  }, []);

  // Android Hardware Back Button listener
  useEffect(() => {
    const handleBackPress = () => {
      if (showAddMedModal) {
        setShowAddMedModal(false);
        return true;
      }
      if (showSkipModal) {
        setShowSkipModal(false);
        setSkipTargetId(null);
        return true;
      }
      if (showAuthModal) {
        setShowAuthModal(false);
        return true;
      }
      if (showProfilePickerModal) {
        setShowProfilePickerModal(false);
        return true;
      }
      if (activeTab !== 'schedule') {
        setActiveTab('schedule');
        return true;
      }
      return false;
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backSub.remove();
  }, [showAddMedModal, showSkipModal, showAuthModal, showProfilePickerModal, activeTab]);

  // Background Notification Action Reconciliation
  const reconcileNativeTakenDoses = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      const takenIds = await getNativeActionTakenDoses();
      if (!takenIds || takenIds.length === 0) return;

      const takenSet = new Set(takenIds);
      let updatedDoses: DoseSlot[] = [];
      let hadUpdates = false;

      setDoses((prevDoses) => {
        const next = prevDoses.map((d) => {
          if (takenSet.has(d.id) && d.status !== 'taken') {
            hadUpdates = true;
            return { ...d, status: 'taken' as const, skipReason: undefined };
          }
          return d;
        });
        updatedDoses = next;
        return next;
      });

      if (hadUpdates) {
        await AsyncStorage.setItem(STORAGE_KEYS.DOSES, JSON.stringify(updatedDoses));
        const todayStr = new Date().toISOString().slice(0, 10);
        for (const id of takenIds) {
          const target = updatedDoses.find((d) => d.id === id);
          if (target) {
            await enqueueMobileSyncEvent({
              type: 'DOSE_STATUS_CHANGED',
              profileId: activeProfile.id,
              doseId: target.id,
              medicineName: target.medicineName,
              strength: target.strength,
              scheduledDate: todayStr,
              scheduledMinutes: target.scheduledMinutes,
              status: 'taken',
              takenAt: new Date().toISOString(),
            });
          }
        }
        showToast('Synced doses confirmed taken from notification shade');
      }

      await clearNativeActionTakenDoses();
    } catch (err) {
      console.warn('Reconcile native taken doses error:', err);
    }
  }, [activeProfile.id, showToast]);

  // Reconcile on startup once storage is loaded
  useEffect(() => {
    if (isStorageLoaded) {
      void reconcileNativeTakenDoses();
    }
  }, [isStorageLoaded, reconcileNativeTakenDoses]);

  // Reconcile on app resume from background
  useEffect(() => {
    const appStateSub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        void reconcileNativeTakenDoses();
      }
    });
    return () => appStateSub.remove();
  }, [reconcileNativeTakenDoses]);

  const persistDoses = async (updated: DoseSlot[]) => {
    setDoses(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.DOSES, JSON.stringify(updated));
  };

  const persistVitals = async (updated: VitalLog[]) => {
    setVitals(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(updated));
  };

  const persistLabReports = async (updated: LabReportItem[]) => {
    setLabReports(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.LABS, JSON.stringify(updated));
  };

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

  // Real-time Supabase WebSocket Subscription + Outbox Status
  useEffect(() => {
    const unsubscribe = subscribeMobileRealtimeEvents(
      async (event) => {
        if (event.type === 'DOSE_STATUS_CHANGED') {
          const targetMedLower = (event.medicineName || '').trim().toLowerCase();
          setDoses((prev) => {
            const next = prev.map((d) => {
              const nameMatch =
                targetMedLower &&
                d.medicineName.trim().toLowerCase() === targetMedLower &&
                Math.abs(d.scheduledMinutes - event.scheduledMinutes) <= 120;
              if (d.id === event.doseId || nameMatch) {
                return {
                  ...d,
                  status: event.status,
                  skipReason: event.skipReason || undefined,
                };
              }
              return d;
            });
            void AsyncStorage.setItem(STORAGE_KEYS.DOSES, JSON.stringify(next));
            return next;
          });
          Vibration.vibrate(30);
          showToast(`Live WebSocket Sync: ${event.medicineName} marked as ${event.status} on Web`);
        } else if (event.type === 'MEDICINE_CREATED') {
          const m = event.medicine;
          const bucket: TimeBucket =
            m.frequency_code === 'HS'
              ? 'Bedtime'
              : m.frequency_code === 'TID'
              ? 'Afternoon'
              : 'Morning';
          const mins = bucket === 'Bedtime' ? 1350 : bucket === 'Afternoon' ? 840 : 480;
          const timeStr =
            bucket === 'Bedtime' ? '10:30 PM' : bucket === 'Afternoon' ? '02:00 PM' : '08:00 AM';

          const newSlot: DoseSlot = {
            id: m.id,
            medicineName: m.medicine_name,
            genericName: m.generic_name || 'Prescribed Regimen',
            strength: m.strength || m.dose_amount || '500mg',
            bucket,
            scheduledTime: m.scheduledTime || timeStr,
            scheduledMinutes: m.scheduledMinutes ?? mins,
            mealRelation: m.with_food === false ? 'Before Food' : 'After Food',
            status: 'pending',
          };

          setDoses((prev) => {
            if (
              prev.some(
                (d) =>
                  d.id === newSlot.id ||
                  d.medicineName.toLowerCase() === newSlot.medicineName.toLowerCase()
              )
            ) {
              return prev;
            }
            const next = [...prev, newSlot].sort((a, b) => a.scheduledMinutes - b.scheduledMinutes);
            void AsyncStorage.setItem(STORAGE_KEYS.DOSES, JSON.stringify(next));
            return next;
          });

          // Arm Native Offline AlarmManager for new medicine from Web
          const target = new Date();
          target.setHours(
            Math.floor(newSlot.scheduledMinutes / 60),
            newSlot.scheduledMinutes % 60,
            0,
            0
          );
          if (target.getTime() <= Date.now()) {
            target.setDate(target.getDate() + 1);
          }
          await scheduleNativeOfflineAlarm(
            Math.floor(Math.random() * 5000) + 3000,
            target.getTime(),
            `Time for ${newSlot.medicineName} (${newSlot.strength})`,
            `${newSlot.bucket} Dose • Take ${newSlot.mealRelation} (${newSlot.scheduledTime})`
          );

          Vibration.vibrate([0, 40, 60, 40]);
          showToast(`Live WebSocket Sync: ${newSlot.medicineName} added from Web & Alarm Armed!`);
        }
      },
      (connected, outboxCount) => {
        setIsLiveConnected(connected);
        setPendingSyncCount(outboxCount);
      }
    );

    return unsubscribe;
  }, [showToast]);

  // Deep link listener for Smart QR (`curewell://pair?pair=...`)
  useEffect(() => {
    const handleUrl = (url?: string | null) => {
      if (url && url.includes('pair=')) {
        void handleSmartQrSignIn(url);
      }
    };

    Linking.getInitialURL().then(handleUrl).catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  const handleTakeDose = async (id: string) => {
    Vibration.vibrate([0, 40, 60, 40]);
    const target = doses.find((d) => d.id === id);
    const updated = doses.map((d) =>
      d.id === id ? { ...d, status: 'taken' as const, skipReason: undefined } : d
    );
    await persistDoses(updated);
    if (target) {
      showToast(`Logged ${target.medicineName} ${target.strength} as Taken`);
      const todayStr = new Date().toISOString().slice(0, 10);
      await enqueueMobileSyncEvent({
        type: 'DOSE_STATUS_CHANGED',
        profileId: activeProfile.id,
        doseId: target.id,
        medicineName: target.medicineName,
        strength: target.strength,
        scheduledDate: todayStr,
        scheduledMinutes: target.scheduledMinutes,
        status: 'taken',
        takenAt: new Date().toISOString(),
      });
    }
  };

  const handleOpenSkipModal = (id: string) => {
    setSkipTargetId(id);
    setShowSkipModal(true);
  };

  const handleConfirmSkip = async (reason: string) => {
    if (!skipTargetId) return;
    Vibration.vibrate(50);
    const target = doses.find((d) => d.id === skipTargetId);
    const updated = doses.map((d) =>
      d.id === skipTargetId ? { ...d, status: 'skipped' as const, skipReason: reason } : d
    );
    await persistDoses(updated);
    setShowSkipModal(false);
    setSkipTargetId(null);
    showToast(`Dose marked as skipped (${reason}) & synced to Web`);
    if (target) {
      const todayStr = new Date().toISOString().slice(0, 10);
      await enqueueMobileSyncEvent({
        type: 'DOSE_STATUS_CHANGED',
        profileId: activeProfile.id,
        doseId: target.id,
        medicineName: target.medicineName,
        strength: target.strength,
        scheduledDate: todayStr,
        scheduledMinutes: target.scheduledMinutes,
        status: 'skipped',
        skipReason: reason,
      });
    }
  };

  const handleSnoozeDose = async (id: string) => {
    const target = doses.find((d) => d.id === id);
    if (!target) return;
    Vibration.vibrate(40);
    const snoozeTime = Date.now() + 15 * 60 * 1000;
    await scheduleNativeOfflineAlarm(
      Math.floor(Math.random() * 5000) + 1000,
      snoozeTime,
      `Snoozed Dose: ${target.medicineName} (${target.strength})`,
      `Reminder in 15 mins • ${target.bucket} Dose`
    );
    showToast(`Snoozed ${target.medicineName} for 15 minutes! Alarm set.`);
  };

  const handleAddMedicine = async (med: {
    medicineName: string;
    genericName: string;
    strength: string;
    bucket: TimeBucket;
    scheduledTime: string;
    mealRelation: MealRelation;
  }) => {
    const bucketMins: Record<TimeBucket, number> = {
      Morning: 480,
      Afternoon: 840,
      Evening: 1200,
      Bedtime: 1350,
    };
    const slot: DoseSlot = {
      id: `dose-${Date.now()}`,
      medicineName: med.medicineName.trim(),
      genericName: med.genericName.trim() || 'Active Prescription',
      strength: med.strength.trim() || '1 tab',
      bucket: med.bucket,
      scheduledTime: med.scheduledTime,
      scheduledMinutes: bucketMins[med.bucket],
      mealRelation: med.mealRelation,
      status: 'pending',
    };
    const updated = [...doses, slot].sort((a, b) => a.scheduledMinutes - b.scheduledMinutes);
    await persistDoses(updated);
    setShowAddMedModal(false);
    showToast(`Added ${slot.medicineName} to schedule & armed alarm!`);

    const todayStr = new Date().toISOString().slice(0, 10);
    await enqueueMobileSyncEvent({
      type: 'MEDICINE_CREATED',
      profileId: activeProfile.id,
      medicine: {
        id: slot.id,
        medicine_name: slot.medicineName,
        generic_name: slot.genericName,
        strength: slot.strength,
        form: 'Tablet',
        dose_amount: '1 tab',
        frequency_code: slot.bucket === 'Bedtime' ? 'HS' : 'OD',
        frequency_raw: 'Once daily',
        with_food: slot.mealRelation !== 'Before Food',
        start_date: todayStr,
        is_ongoing: true,
        duration_days: 30,
        scheduledMinutes: slot.scheduledMinutes,
        scheduledTime: slot.scheduledTime,
        bucket: slot.bucket,
      },
    });
  };

  const handleSaveVital = async (vitalInput: Omit<VitalLog, 'id' | 'timestamp'>) => {
    const newLog: VitalLog = {
      ...vitalInput,
      id: `vital-${Date.now()}`,
      timestamp: 'Just now',
    };
    const nextVitals = [newLog, ...vitals];
    await persistVitals(nextVitals);
    showToast(
      vitalInput.type === 'bp'
        ? `Logged BP ${vitalInput.primaryVal}/${vitalInput.secondaryVal} mmHg`
        : `Logged Glucose ${vitalInput.primaryVal} mg/dL (${vitalInput.context})`
    );
  };

  const handleAddLabReport = async (report: LabReportItem) => {
    const updated = [report, ...labReports];
    await persistLabReports(updated);
    showToast(`Saved ${report.testName} to Lab Vault!`);
  };

  const handleToggleAlarms = async (val: boolean) => {
    if (val) {
      const granted = await requestAndroidNotificationPermission();
      if (!granted) {
        showToast('Medication alarms require notification permission.');
      }
    }
    setAlarmsEnabled(val);
    await AsyncStorage.setItem(STORAGE_KEYS.ALARMS_ENABLED, String(val));
    if (val) {
      showToast('Native Lockscreen Alarms enabled (AlarmManager active)');
    } else {
      showToast('Native Lockscreen Alarms paused');
    }
  };

  const handleManualSync = async () => {
    Vibration.vibrate(40);
    showToast('Flushing offline outbox queue to Curewell Cloud...');
    await flushOfflineOutbox();
  };

  const handleDial = (phone: string) => {
    Vibration.vibrate(50);
    const cleanNumber = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      showToast(`Cannot dial ${phone} on this device.`);
    });
  };

  const handleSmartQrSignIn = async (rawQrOrUrl: string) => {
    const trimmed = rawQrOrUrl.trim();
    if (!trimmed) return;
    setIsAuthLoading(true);

    const decompressUuid = (val: string): string => {
      if (!val.startsWith('~') || val.length !== 23 || !globalThis.atob) return val;
      try {
        const b64 = val.slice(1).replace(/-/g, '+').replace(/_/g, '/') + '==';
        const bin = globalThis.atob(b64);
        let hex = '';
        for (let i = 0; i < bin.length; i++) {
          hex += bin.charCodeAt(i).toString(16).padStart(2, '0');
        }
        if (hex.length !== 32) return val;
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      } catch {
        return val;
      }
    };

    let token = trimmed;
    if (trimmed.includes('pair=')) {
      const match = trimmed.match(/[?&]pair=([^&#\s]+)/);
      if (match?.[1]) token = decodeURIComponent(match[1]);
    }

    try {
      let userId = '';
      let profileId = '';
      let profileName = 'Paired Patient';
      let userEmail = '';
      let refreshToken = '';

      if (token.startsWith('c1.')) {
        const b64url = token.slice(3);
        const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
        const decodedStr = decodeURIComponent(
          Array.prototype.map
            .call(globalThis.atob ? globalThis.atob(padded) : '', (c: string) =>
              '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            )
            .join('')
        );
        if (decodedStr.startsWith('{')) {
          const wire = JSON.parse(decodedStr);
          userId = decompressUuid(wire.u || '');
          profileId = decompressUuid(wire.p || userId);
          profileName = wire.n || 'Paired Patient';
          userEmail = wire.e || '';
          refreshToken = wire.r || '';
        } else {
          const parts = decodedStr.split('|');
          userId = decompressUuid(parts[0] || '');
          profileId = parts[1] === '.' ? userId : decompressUuid(parts[1] || userId);
          profileName = parts[2] || 'Paired Patient';
          const extra = parts[5] || '';
          if (extra.startsWith('r:')) refreshToken = extra.slice(2);
          else if (extra.startsWith('e:')) userEmail = extra.slice(2);
        }
      } else if (globalThis.atob) {
        const decoded = JSON.parse(decodeURIComponent(globalThis.atob(token)));
        userId = decompressUuid(decoded.userId || '');
        profileId = decompressUuid(decoded.profileId || userId);
        profileName = decoded.profileName || 'Paired Patient';
        userEmail = decoded.userEmail || '';
        refreshToken = decoded.refreshToken || '';
      }

      if (!userId) {
        showToast('Invalid Smart QR token. Please scan the QR code from Web dashboard.');
        setIsAuthLoading(false);
        return;
      }

      if (refreshToken) {
        const { data } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });
        if (data?.user?.email) {
          userEmail = data.user.email;
          setSessionEmail(userEmail);
        }
      }

      const pairedProfile: PatientProfile = {
        id: profileId || userId,
        fullName: profileName,
        relationship: 'Self',
        bloodGroup: 'O+',
        allergies: 'Synced via Smart QR',
        chronicConditions: 'Synced from Curewell Web',
        emergencyContactName: 'Emergency Contact',
        emergencyContactPhone: '1122',
      };

      setProfiles((prev) => {
        const exists = prev.some((p) => p.id === pairedProfile.id);
        return exists ? prev : [pairedProfile, ...prev];
      });
      setActiveProfileId(pairedProfile.id);
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_ID, pairedProfile.id);

      setShowAuthModal(false);
      Vibration.vibrate([0, 40, 60, 40]);
      showToast(`Signed in automatically as ${profileName}!`);
    } catch {
      showToast('Could not verify Smart QR token.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailSignIn = async (email: string, pass: string) => {
    setIsAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: pass,
      });
      if (error) {
        showToast(`Sign in error: ${error.message}`);
        setIsAuthLoading(false);
        return;
      }
      if (data.user) {
        setSessionEmail(data.user.email || null);
        await AsyncStorage.setItem(
          STORAGE_KEYS.SESSION,
          JSON.stringify({ email: data.user.email })
        );
        setShowAuthModal(false);
        showToast(`Signed in as ${data.user.email}!`);
      }
    } catch {
      showToast('Network error during sign-in.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessionEmail(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
    showToast('Signed out of Curewell account.');
  };

  const takenCount = useMemo(() => doses.filter((d) => d.status === 'taken').length, [doses]);
  const pendingCount = useMemo(() => doses.filter((d) => d.status === 'pending').length, [doses]);
  const adherencePct = useMemo(
    () => (doses.length === 0 ? 0 : Math.round((takenCount / doses.length) * 100)),
    [doses, takenCount]
  );

  // Flash guard: While storage is being read asynchronously on startup, render splash placeholder
  if (!isStorageLoaded) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#020617',
          },
        ]}
      >
        <StatusBar style="light" />
        <View style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <View style={styles.logoMark}>
            <Text style={styles.logoCross}>+</Text>
          </View>
          <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: '800' }}>Curewell</Text>
          <ActivityIndicator size="small" color="#0D9488" />
        </View>
      </SafeAreaView>
    );
  }

  // If user has locked app with a PIN
  if (isLocked) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0 },
        ]}
      >
        <StatusBar style="light" />
        <View style={styles.lockContainer}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
          <Text style={styles.lockTitle}>Curewell Health Vault</Text>
          <Text style={styles.lockSubtitle}>Enter 4-digit PIN to access medical records</Text>

          <View style={styles.pinDotsRow}>
            {[0, 1, 2, 3].map((idx) => (
              <View
                key={idx}
                style={[styles.pinDot, pinInput.length > idx && styles.pinDotActive]}
              />
            ))}
          </View>

          <View style={styles.numpadGrid}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((val) => (
              <TouchableOpacity
                key={val}
                style={styles.numpadKey}
                onPress={() => {
                  Vibration.vibrate(20);
                  if (val === 'C') {
                    setPinInput('');
                  } else if (val === '⌫') {
                    setPinInput((p) => p.slice(0, -1));
                  } else if (pinInput.length < 4) {
                    const next = pinInput + val;
                    setPinInput(next);
                    if (next === savedPin) {
                      Vibration.vibrate([0, 40, 60, 40]);
                      setIsLocked(false);
                      setPinInput('');
                    } else if (next.length === 4) {
                      Vibration.vibrate(200);
                      showToast('Incorrect PIN. Try again.');
                      setTimeout(() => setPinInput(''), 600);
                    }
                  }
                }}
              >
                <Text style={styles.numpadKeyText}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0 },
      ]}
    >
      <StatusBar style="light" />

      {/* Floating Toast Notification */}
      <Toast message={bannerNotice} />

      {/* Top Header */}
      <Header
        activeProfile={activeProfile}
        isLiveConnected={isLiveConnected}
        onOpenProfilePicker={() => setShowProfilePickerModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Active Screen View */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'schedule' && (
          <ScheduleScreen
            doses={doses}
            adherencePct={adherencePct}
            takenCount={takenCount}
            onTakeDose={handleTakeDose}
            onOpenSkipModal={handleOpenSkipModal}
            onSnoozeDose={handleSnoozeDose}
            onOpenAddMedModal={() => setShowAddMedModal(true)}
            onSyncWidget={() => {
              syncAndroidHomeWidget({
                profileName: activeProfile.fullName,
                takenCount,
                totalCount: doses.length,
                nextDoseText:
                  doses.find((d) => d.status === 'pending')
                    ? `Next: ${doses.find((d) => d.status === 'pending')?.medicineName}`
                    : 'All doses completed',
                bloodGroup: activeProfile.bloodGroup,
                allergies: activeProfile.allergies,
              });
              showToast('Android Home Widget updated!');
            }}
            isLiveConnected={isLiveConnected}
          />
        )}

        {activeTab === 'vitals' && (
          <VitalsScreen
            vitals={vitals}
            onSaveVital={handleSaveVital}
            onToast={showToast}
          />
        )}

        {activeTab === 'sos' && (
          <SosScreen
            activeProfile={activeProfile}
            doses={doses}
            onDial={handleDial}
          />
        )}

        {activeTab === 'alarms' && (
          <AlarmsScreen
            alarmsEnabled={alarmsEnabled}
            onToggleAlarms={handleToggleAlarms}
            onManualSync={handleManualSync}
            isLiveConnected={isLiveConnected}
            pendingSyncCount={pendingSyncCount}
            doses={doses}
          />
        )}

        {activeTab === 'full_app' && (
          <ClinicalSuiteScreen
            activeProfile={activeProfile}
            doses={doses}
            vitals={vitals}
            labReports={labReports}
            onAddLabReport={handleAddLabReport}
            onOpenAddMedModal={() => setShowAddMedModal(true)}
            onOpenAuthModal={() => setShowAuthModal(true)}
            onTakeDose={handleTakeDose}
            onToast={showToast}
          />
        )}
      </ScrollView>

      {/* Bottom Navigation Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingDosesCount={pendingCount}
      />

      {/* Modals */}
      <AddMedicineModal
        visible={showAddMedModal}
        onClose={() => setShowAddMedModal(false)}
        onAddMedicine={handleAddMedicine}
      />

      <SkipReasonModal
        visible={showSkipModal}
        onClose={() => {
          setShowSkipModal(false);
          setSkipTargetId(null);
        }}
        onConfirmSkip={handleConfirmSkip}
      />

      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        sessionEmail={sessionEmail}
        onSignOut={handleSignOut}
        onSignInEmail={handleEmailSignIn}
        onSignInQR={handleSmartQrSignIn}
        isLoading={isAuthLoading}
      />

      <ProfilePickerModal
        visible={showProfilePickerModal}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={(p) => setActiveProfileId(p.id)}
        onClose={() => setShowProfilePickerModal(false)}
      />
    </SafeAreaView>
  );
}
