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
  StyleSheet,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from './src/theme';
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
  areNotificationsEnabled,
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

// SVG Icons
import {
  LogoCrossIcon,
  LockIcon,
  ShieldIcon,
  BellIcon,
  CheckIcon,
} from './src/components/icons';

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
  PairingScreen,
  SettingsScreen,
} from './src/screens';

import {
  verifyCompanionPairingToken,
  extractPairingTokenFromInput,
} from './src/lib/companionPairing';

function AppMain() {
  const { theme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<TabKey>('schedule');
  const [profiles, setProfiles] = useState<PatientProfile[]>(DEFAULT_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState<string>('');

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

  // Storage initialization state (guard)
  const [isStorageLoaded, setIsStorageLoaded] = useState<boolean>(false);

  // PIN Lock screen state
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');

  const activeProfile: PatientProfile = useMemo(() => {
    const found = profiles.find((p) => p.id === activeProfileId);
    if (found) return found;
    if (profiles.length > 0) return profiles[0]!;
    return {
      id: 'default',
      fullName: 'Medfolio Patient',
      relationship: 'Self',
      bloodGroup: 'Unknown',
      allergies: 'None recorded',
      chronicConditions: 'Primary Health Dossier',
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: '',
    };
  }, [profiles, activeProfileId]);

  const showToast = useCallback((msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => {
      setBannerNotice((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  // Request Android Notification Permission gracefully
  const requestAndroidNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Medfolio Medication Alarms',
              message:
                'Allow Medfolio to send you critical medication reminders and sound alarms on time.',
              buttonPositive: 'Allow',
              buttonNegative: 'Later',
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            return true;
          }
        }
        const expoRes = await Notifications.requestPermissionsAsync();
        return expoRes.granted;
      } catch (err) {
        console.warn('Notification permission check note:', err);
        return false;
      }
    }
    return true;
  }, []);

  // Restore state from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const [
          rawDoses,
          rawVitals,
          rawLabs,
          rawPin,
          rawProfId,
          rawSavedProfile,
          rawAlarms,
          rawSession,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.DOSES),
          AsyncStorage.getItem(STORAGE_KEYS.VITALS),
          AsyncStorage.getItem(STORAGE_KEYS.LABS),
          AsyncStorage.getItem(STORAGE_KEYS.PIN),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE_ID),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
          AsyncStorage.getItem(STORAGE_KEYS.ALARMS_ENABLED),
          AsyncStorage.getItem(STORAGE_KEYS.SESSION),
        ]);

        if (rawDoses) {
          try {
            setDoses(JSON.parse(rawDoses));
          } catch {}
        }
        if (rawVitals) {
          try {
            setVitals(JSON.parse(rawVitals));
          } catch {}
        }
        if (rawLabs) {
          try {
            setLabReports(JSON.parse(rawLabs));
          } catch {}
        }
        if (rawPin) {
          setSavedPin(rawPin);
          setIsLocked(true);
        }

        if (rawSavedProfile) {
          try {
            const parsedProf = JSON.parse(rawSavedProfile);
            if (parsedProf?.id) {
              setProfiles([parsedProf]);
              setActiveProfileId(parsedProf.id);
            }
          } catch {}
        } else if (rawProfId) {
          setActiveProfileId(rawProfId);
        }

        if (rawAlarms !== null) setAlarmsEnabled(rawAlarms === 'true');

        if (rawSession) {
          try {
            const parsed = JSON.parse(rawSession);
            if (parsed?.email) setSessionEmail(parsed.email);
          } catch {}
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

  useEffect(() => {
    if (isStorageLoaded) {
      void reconcileNativeTakenDoses();
    }
  }, [isStorageLoaded, reconcileNativeTakenDoses]);

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
    if (profiles.length === 0) return;
    const taken = doses.filter((d) => d.status === 'taken').length;
    const total = doses.length;
    const nextPending = doses.find((d) => d.status === 'pending');
    const nextDoseText = nextPending
      ? `Next: ${nextPending.medicineName} ${nextPending.strength} at ${nextPending.scheduledTime} (${nextPending.mealRelation})`
      : doses.length > 0
      ? 'All scheduled doses completed for today!'
      : 'No scheduled medications today';

    syncAndroidHomeWidget({
      profileName: activeProfile.fullName,
      takenCount: taken,
      totalCount: total,
      nextDoseText,
      bloodGroup: activeProfile.bloodGroup,
      allergies: activeProfile.allergies,
    });
  }, [doses, activeProfile, profiles.length]);

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
          showToast(`Live Sync: ${event.medicineName} marked as ${event.status} on Web`);
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
            strength: m.strength || m.dose_amount || 'Standard dose',
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

          // Arm Native Offline AlarmManager for new medicine
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
          showToast(`Live Sync: ${newSlot.medicineName} added from Web & Alarm Armed!`);
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
    showToast(`Dose marked as skipped (${reason}) & synced`);
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
      genericName: med.genericName.trim() || 'Prescribed Regimen',
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
    showToast('Flushing offline outbox queue to Medfolio Cloud...');
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
    setIsAuthLoading(true);
    try {
      const token = extractPairingTokenFromInput(rawQrOrUrl);
      const result = verifyCompanionPairingToken(token);

      if (!result.valid || !result.payload) {
        showToast(result.error || 'Invalid Smart QR code.');
        setIsAuthLoading(false);
        return;
      }

      const { payload } = result;

      if (payload.refreshToken) {
        await supabase.auth.refreshSession({ refresh_token: payload.refreshToken });
      }

      const pairedProfile: PatientProfile = {
        id: payload.profileId || payload.userId,
        fullName: payload.profileName || 'Paired Patient',
        relationship: 'Self',
        bloodGroup: 'Unknown',
        allergies: 'None recorded',
        chronicConditions: 'Synced from Medfolio Web',
        emergencyContactName: 'Emergency Contact',
        emergencyContactPhone: '',
      };

      setProfiles([pairedProfile]);
      setActiveProfileId(pairedProfile.id);
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(pairedProfile));
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_ID, pairedProfile.id);

      if (payload.userEmail) {
        setSessionEmail(payload.userEmail);
        await AsyncStorage.setItem(
          STORAGE_KEYS.SESSION,
          JSON.stringify({ email: payload.userEmail })
        );
      }

      setShowAuthModal(false);
      Vibration.vibrate([0, 40, 60, 40]);
      showToast(`Signed in automatically as ${pairedProfile.fullName}!`);
    } catch {
      showToast('Could not verify pairing code.');
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
      if (error || !data.user) {
        showToast(`Sign in error: ${error?.message || 'Authentication failed'}`);
        setIsAuthLoading(false);
        return;
      }
      setSessionEmail(data.user.email || null);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SESSION,
        JSON.stringify({ email: data.user.email })
      );

      const userProfile: PatientProfile = {
        id: data.user.id,
        fullName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Caregiver',
        relationship: 'Self',
        bloodGroup: 'Unknown',
        allergies: 'None recorded',
        chronicConditions: 'Primary Health Dossier',
        emergencyContactName: 'Emergency Contact',
        emergencyContactPhone: '',
      };

      setProfiles([userProfile]);
      setActiveProfileId(userProfile.id);
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile));
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_ID, userProfile.id);

      setShowAuthModal(false);
      showToast(`Signed in as ${data.user.email}!`);
    } catch {
      showToast('Network error during sign-in.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessionEmail(null);
    setProfiles([]);
    setActiveProfileId('');
    setDoses([]);
    setVitals([]);
    setLabReports([]);
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.SESSION,
      STORAGE_KEYS.PROFILE,
      STORAGE_KEYS.PROFILE_ID,
      STORAGE_KEYS.DOSES,
      STORAGE_KEYS.VITALS,
      STORAGE_KEYS.LABS,
    ]);
    showToast('Signed out of Medfolio. Device unpaired.');
  };

  const handlePairedSuccess = async (params: {
    profile: PatientProfile;
    sessionEmail?: string;
    doses?: DoseSlot[];
    vitals?: VitalLog[];
  }) => {
    setProfiles([params.profile]);
    setActiveProfileId(params.profile.id);
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(params.profile));
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_ID, params.profile.id);

    if (params.sessionEmail) {
      setSessionEmail(params.sessionEmail);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SESSION,
        JSON.stringify({ email: params.sessionEmail })
      );
    }

    if (params.doses && params.doses.length > 0) {
      setDoses(params.doses);
      await AsyncStorage.setItem(STORAGE_KEYS.DOSES, JSON.stringify(params.doses));
    } else {
      setDoses([]);
      await AsyncStorage.setItem(STORAGE_KEYS.DOSES, JSON.stringify([]));
    }

    if (params.vitals && params.vitals.length > 0) {
      setVitals(params.vitals);
      await AsyncStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(params.vitals));
    } else {
      setVitals([]);
      await AsyncStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify([]));
    }
  };

  const handleSetPin = async (newPin: string | null) => {
    if (newPin) {
      setSavedPin(newPin);
      await AsyncStorage.setItem(STORAGE_KEYS.PIN, newPin);
    } else {
      setSavedPin(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.PIN);
    }
  };

  const takenCount = useMemo(() => doses.filter((d) => d.status === 'taken').length, [doses]);
  const pendingCount = useMemo(() => doses.filter((d) => d.status === 'pending').length, [doses]);
  const adherencePct = useMemo(
    () => (doses.length === 0 ? 0 : Math.round((takenCount / doses.length) * 100)),
    [doses, takenCount]
  );

  // Flash guard: Initial storage reading placeholder
  if (!isStorageLoaded) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={{ alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <View style={[styles.logoMark, { backgroundColor: theme.primary, width: 44, height: 44, borderRadius: 12 }]}>
            <LogoCrossIcon size={26} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '900', letterSpacing: -0.4 }}>
            Medfolio
          </Text>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // MANDATORY AUTH / PAIRING GUARD: If unauthenticated on fresh install, render PairingScreen!
  const isPaired = Boolean(sessionEmail || (profiles.length > 0 && activeProfileId));

  if (!isPaired) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0,
          },
        ]}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Toast message={bannerNotice} />
        <PairingScreen onPairedSuccess={handlePairedSuccess} onToast={showToast} />
      </SafeAreaView>
    );
  }

  // PIN Lock Screen
  if (isLocked) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0,
          },
        ]}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Toast message={bannerNotice} />
        <View style={[lockStyles.lockContainer, { backgroundColor: theme.background }]}>
          <View style={[lockStyles.iconCircle, { backgroundColor: theme.surfaceAccent, borderColor: theme.line }]}>
            <LockIcon size={32} color={theme.primary} />
          </View>
          <Text style={[lockStyles.lockTitle, { color: theme.textPrimary }]}>
            Medfolio Health Vault
          </Text>
          <Text style={[lockStyles.lockSubtitle, { color: theme.textMuted }]}>
            Enter 4-digit PIN to access medical records
          </Text>

          <View style={lockStyles.pinDotsRow}>
            {[0, 1, 2, 3].map((idx) => {
              const filled = pinInput.length > idx;
              return (
                <View
                  key={idx}
                  style={[
                    lockStyles.pinDot,
                    {
                      backgroundColor: filled ? theme.primary : theme.surfaceSunken,
                      borderColor: filled ? theme.primary : theme.lineStrong,
                    },
                  ]}
                />
              );
            })}
          </View>

          <View style={lockStyles.numpadGrid}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((val) => (
              <TouchableOpacity
                key={val}
                style={[lockStyles.numpadKey, { backgroundColor: theme.surface, borderColor: theme.line }]}
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
                activeOpacity={0.7}
              >
                <Text style={[lockStyles.numpadKeyText, { color: theme.textPrimary }]}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={lockStyles.forgotPinBtn}
            onPress={() => {
              Alert.alert(
                'Forgot PIN?',
                'You can sign out of this device and unpair your account to reset access.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign Out & Reset', style: 'destructive', onPress: handleSignOut },
                ]
              );
            }}
          >
            <Text style={[lockStyles.forgotPinText, { color: theme.textMuted }]}>
              Forgot PIN? Sign Out &amp; Reset
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0,
        },
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

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
        style={[styles.scrollArea, { backgroundColor: theme.background }]}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
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
                    : doses.length > 0
                    ? 'All doses completed'
                    : 'No scheduled medications',
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

        {activeTab === 'settings' && (
          <SettingsScreen
            activeProfile={activeProfile}
            profiles={profiles}
            sessionEmail={sessionEmail}
            savedPin={savedPin}
            onSetPin={handleSetPin}
            onOpenProfilePicker={() => setShowProfilePickerModal(true)}
            onSignOut={handleSignOut}
            onManualSync={handleManualSync}
            isLiveConnected={isLiveConnected}
            pendingSyncCount={pendingSyncCount}
            onToast={showToast}
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

export default function App() {
  return (
    <ThemeProvider>
      <AppMain />
    </ThemeProvider>
  );
}

const lockStyles = StyleSheet.create({
  lockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  lockSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  numpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 250,
    justifyContent: 'space-between',
    gap: 14,
  },
  numpadKey: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadKeyText: {
    fontSize: 22,
    fontWeight: '800',
  },
  forgotPinBtn: {
    marginTop: 20,
    padding: 10,
  },
  forgotPinText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
