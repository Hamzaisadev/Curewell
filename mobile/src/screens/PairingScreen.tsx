import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Vibration,
  Platform,
  PermissionsAndroid,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../theme';
import {
  LogoCrossIcon,
  KeyIcon,
  QrCodeIcon,
  UserIcon,
  BellIcon,
  CheckIcon,
  ShieldIcon,
  AlertTriangleIcon,
} from '../components/icons';
import {
  verifyCompanionPairingToken,
  extractPairingTokenFromInput,
} from '../lib/companionPairing';
import { areNotificationsEnabled, openNotificationSettings } from '../native/CurewellNativeBridge';
import { supabase } from '../lib/supabase';
import { PatientProfile, DoseSlot, VitalLog } from '../types';

export interface PairingScreenProps {
  onPairedSuccess: (params: {
    profile: PatientProfile;
    sessionEmail?: string;
    doses?: DoseSlot[];
    vitals?: VitalLog[];
  }) => void;
  onToast: (msg: string) => void;
}

type PairingTab = 'code' | 'qr' | 'email';

export const PairingScreen: React.FC<PairingScreenProps> = ({ onPairedSuccess, onToast }) => {
  const { theme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<PairingTab>('code');
  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [smartQrInput, setSmartQrInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Notification permission state
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);
  const [isRequestingNotif, setIsRequestingNotif] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const enabled = await areNotificationsEnabled();
        setNotifGranted(enabled);
      } catch {
        setNotifGranted(false);
      }
    })();
  }, []);

  const handleRequestNotificationPermission = async () => {
    setIsRequestingNotif(true);
    Vibration.vibrate(30);

    try {
      let granted = false;

      // 1. Android 13+ native permission request on direct user gesture
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Medfolio Medication Alarms',
            message:
              'Allow Medfolio to send you critical medication reminders and sound alarms on time.',
            buttonPositive: 'Allow Alarms',
            buttonNegative: 'Not Now',
          }
        );
        granted = result === PermissionsAndroid.RESULTS.GRANTED;
      }

      // 2. Expo Notifications permission request
      const expoResult = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      if (expoResult.granted || expoResult.status === 'granted') {
        granted = true;
      }

      const nativeCheck = await areNotificationsEnabled();
      const finalGranted = granted || nativeCheck;

      setNotifGranted(finalGranted);
      if (finalGranted) {
        onToast('Notification permission granted for medication alarms.');
      } else {
        onToast('Notifications disabled. You can enable them anytime in Settings.');
      }
    } catch (e: any) {
      console.warn('Error requesting notifications:', e);
      onToast('Could not request notification permission.');
    } finally {
      setIsRequestingNotif(false);
    }
  };

  // Helper to fetch real medicines & doses from Supabase for paired patient
  const fetchPatientCloudData = async (
    userId: string,
    profileId: string
  ): Promise<{ profile: PatientProfile; doses: DoseSlot[]; vitals: VitalLog[] }> => {
    let profileData: PatientProfile = {
      id: profileId,
      fullName: 'Paired Patient',
      relationship: 'Self',
      bloodGroup: 'Unknown',
      allergies: 'None recorded',
      chronicConditions: 'Primary Health Dossier',
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: '',
    };

    // 1. Fetch real profile from Supabase
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (prof) {
        profileData = {
          id: prof.id,
          fullName: prof.full_name || 'Paired Patient',
          relationship: prof.relationship || 'Self',
          bloodGroup: prof.blood_group || 'Unknown',
          allergies: prof.allergies || 'None recorded',
          chronicConditions: prof.chronic_conditions || 'Primary Health Dossier',
          emergencyContactName: prof.emergency_contact_name || 'Emergency Contact',
          emergencyContactPhone: prof.emergency_contact_phone || '',
        };
      }
    } catch (err) {
      console.warn('Profile fetch note:', err);
    }

    // 2. Fetch real active medicines from Supabase
    const loadedDoses: DoseSlot[] = [];
    try {
      const { data: meds } = await supabase
        .from('medicines')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_ongoing', true);

      if (meds && Array.isArray(meds)) {
        for (const m of meds) {
          const bucket =
            m.frequency_code === 'HS'
              ? 'Bedtime'
              : m.frequency_code === 'TID'
              ? 'Afternoon'
              : 'Morning';
          const mins = bucket === 'Bedtime' ? 1350 : bucket === 'Afternoon' ? 840 : 480;
          const timeStr =
            bucket === 'Bedtime' ? '10:30 PM' : bucket === 'Afternoon' ? '02:00 PM' : '08:00 AM';

          loadedDoses.push({
            id: m.id,
            medicineName: m.medicine_name,
            genericName: m.generic_name || 'Prescribed Regimen',
            strength: m.strength || m.dose_amount || 'Standard dose',
            bucket,
            scheduledTime: timeStr,
            scheduledMinutes: mins,
            mealRelation: m.with_food === false ? 'Before Food' : 'After Food',
            status: 'pending',
          });
        }
      }
    } catch (err) {
      console.warn('Medicines fetch note:', err);
    }

    return { profile: profileData, doses: loadedDoses, vitals: [] };
  };

  const handleVerifyPairingCode = async () => {
    const raw = pairingCodeInput.trim().replace(/\D/g, '');
    if (raw.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code (e.g. 482910).');
      return;
    }

    setErrorMessage(null);
    setIsVerifying(true);
    Vibration.vibrate(30);

    try {
      const token = extractPairingTokenFromInput(raw);
      const result = verifyCompanionPairingToken(token);

      if (!result.valid || !result.payload) {
        setErrorMessage(
          result.error ||
            'Invalid or expired 6-digit code. Please generate a fresh code in Medfolio Web Settings.'
        );
        setIsVerifying(false);
        return;
      }

      const { payload } = result;

      // Authenticate cloud session if refresh token was bundled
      if (payload.refreshToken) {
        try {
          await supabase.auth.refreshSession({ refresh_token: payload.refreshToken });
        } catch {
          // ignore
        }
      }

      const cloudData = await fetchPatientCloudData(payload.userId, payload.profileId);
      if (payload.profileName && payload.profileName !== 'Paired Patient') {
        cloudData.profile.fullName = payload.profileName;
      }

      Vibration.vibrate([0, 50, 100, 50]);
      onToast(`Connected successfully to ${cloudData.profile.fullName}!`);
      onPairedSuccess({
        profile: cloudData.profile,
        sessionEmail: payload.userEmail,
        doses: cloudData.doses,
        vitals: cloudData.vitals,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed. Please check connection and retry.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifySmartQr = async () => {
    const raw = smartQrInput.trim();
    if (!raw) {
      setErrorMessage('Please paste your Smart QR token or pairing URL.');
      return;
    }

    setErrorMessage(null);
    setIsVerifying(true);
    Vibration.vibrate(30);

    try {
      const token = extractPairingTokenFromInput(raw);
      const result = verifyCompanionPairingToken(token);

      if (!result.valid || !result.payload) {
        setErrorMessage(
          result.error ||
            'Invalid Smart QR payload. Please scan or copy the QR code from Medfolio Web.'
        );
        setIsVerifying(false);
        return;
      }

      const { payload } = result;

      if (payload.refreshToken) {
        try {
          await supabase.auth.refreshSession({ refresh_token: payload.refreshToken });
        } catch {
          // ignore
        }
      }

      const cloudData = await fetchPatientCloudData(payload.userId, payload.profileId);
      if (payload.profileName && payload.profileName !== 'Paired Patient') {
        cloudData.profile.fullName = payload.profileName;
      }

      Vibration.vibrate([0, 50, 100, 50]);
      onToast(`Smart QR verified for ${cloudData.profile.fullName}!`);
      onPairedSuccess({
        profile: cloudData.profile,
        sessionEmail: payload.userEmail,
        doses: cloudData.doses,
        vitals: cloudData.vitals,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to verify Smart QR token.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!emailInput.trim() || !passwordInput.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setErrorMessage(null);
    setIsVerifying(true);
    Vibration.vibrate(30);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim().toLowerCase(),
        password: passwordInput,
      });

      if (error || !data.user) {
        setErrorMessage(error?.message || 'Sign in failed. Check your email and password.');
        setIsVerifying(false);
        return;
      }

      const userId = data.user.id;
      const cloudData = await fetchPatientCloudData(userId, userId);
      cloudData.profile.fullName =
        data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Caregiver';

      Vibration.vibrate([0, 50, 100, 50]);
      onToast(`Signed in as ${data.user.email}!`);
      onPairedSuccess({
        profile: cloudData.profile,
        sessionEmail: data.user.email || undefined,
        doses: cloudData.doses,
        vitals: cloudData.vitals,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error during sign-in.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandHero}>
          <View style={[styles.logoIconCircle, { backgroundColor: theme.primary }]}>
            <LogoCrossIcon size={26} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>Medfolio</Text>
          <Text style={[styles.brandSubtitle, { color: theme.textMuted }]}>
            Mobile Companion &amp; Offline Regimen Vault
          </Text>
          <View style={[styles.securityBadge, { backgroundColor: theme.surfaceAccent, borderColor: theme.line }]}>
            <ShieldIcon size={14} color={theme.primary} />
            <Text style={[styles.securityBadgeText, { color: theme.primary }]}>
              Zero-Falsification • Medical Grade • End-to-End Encrypted
            </Text>
          </View>
        </View>

        {/* Notification Permission Card (Critical for Android Alarms) */}
        <View
          style={[
            styles.notifCard,
            {
              backgroundColor: notifGranted ? theme.ok.bg : theme.surface,
              borderColor: notifGranted ? theme.ok.border : theme.line,
            },
          ]}
        >
          <View style={styles.notifRow}>
            <View
              style={[
                styles.notifIconCircle,
                { backgroundColor: notifGranted ? theme.ok.text + '20' : theme.primary + '15' },
              ]}
            >
              {notifGranted ? (
                <CheckIcon size={20} color={theme.ok.text} strokeWidth={2.5} />
              ) : (
                <BellIcon size={20} color={theme.primary} strokeWidth={2} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.notifTitle,
                  { color: notifGranted ? theme.ok.text : theme.textPrimary },
                ]}
              >
                {notifGranted
                  ? 'Medication Alarms & Notifications Active'
                  : 'Enable Medication Reminders'}
              </Text>
              <Text style={[styles.notifSubtitle, { color: theme.textMuted }]}>
                {notifGranted
                  ? 'Your device will sound lock-screen alarms on time for scheduled medicines.'
                  : 'Allow Medfolio to send you timely dose reminders even when your screen is locked.'}
              </Text>
            </View>
          </View>

          {!notifGranted && (
            <TouchableOpacity
              style={[styles.grantNotifBtn, { backgroundColor: theme.primary }]}
              onPress={handleRequestNotificationPermission}
              disabled={isRequestingNotif}
              activeOpacity={0.8}
            >
              {isRequestingNotif ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.grantNotifBtnText}>Allow Notification Alarms</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Error Notice */}
        {errorMessage && (
          <View style={[styles.errorCard, { backgroundColor: theme.risk.bg, borderColor: theme.risk.border }]}>
            <AlertTriangleIcon size={16} color={theme.risk.text} />
            <Text style={[styles.errorText, { color: theme.risk.text }]}>{errorMessage}</Text>
          </View>
        )}

        {/* Pairing Workspace */}
        <View style={[styles.workspaceCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          {/* Segmented Selector */}
          <View style={[styles.segmentedBar, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}>
            <TouchableOpacity
              style={[
                styles.segmentItem,
                activeTab === 'code' && [styles.segmentItemActive, { backgroundColor: theme.surface }],
              ]}
              onPress={() => {
                setActiveTab('code');
                setErrorMessage(null);
              }}
              activeOpacity={0.8}
            >
              <KeyIcon size={14} color={activeTab === 'code' ? theme.primary : theme.textMuted} />
              <Text
                style={[
                  styles.segmentText,
                  { color: activeTab === 'code' ? theme.textPrimary : theme.textMuted },
                ]}
              >
                6-Digit Code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentItem,
                activeTab === 'qr' && [styles.segmentItemActive, { backgroundColor: theme.surface }],
              ]}
              onPress={() => {
                setActiveTab('qr');
                setErrorMessage(null);
              }}
              activeOpacity={0.8}
            >
              <QrCodeIcon size={14} color={activeTab === 'qr' ? theme.primary : theme.textMuted} />
              <Text
                style={[
                  styles.segmentText,
                  { color: activeTab === 'qr' ? theme.textPrimary : theme.textMuted },
                ]}
              >
                Smart QR
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentItem,
                activeTab === 'email' && [styles.segmentItemActive, { backgroundColor: theme.surface }],
              ]}
              onPress={() => {
                setActiveTab('email');
                setErrorMessage(null);
              }}
              activeOpacity={0.8}
            >
              <UserIcon size={14} color={activeTab === 'email' ? theme.primary : theme.textMuted} />
              <Text
                style={[
                  styles.segmentText,
                  { color: activeTab === 'email' ? theme.textPrimary : theme.textMuted },
                ]}
              >
                Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: 6-DIGIT CODE */}
          {activeTab === 'code' && (
            <View style={styles.formContainer}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                ENTER 6-DIGIT PAIRING CODE
              </Text>
              <TextInput
                style={[
                  styles.codeInput,
                  {
                    backgroundColor: theme.surfaceSunken,
                    borderColor: theme.lineStrong,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="482910"
                placeholderTextColor={theme.textSubtle}
                keyboardType="number-pad"
                maxLength={6}
                value={pairingCodeInput}
                onChangeText={(val) => {
                  const cleaned = val.replace(/\D/g, '');
                  setPairingCodeInput(cleaned);
                  if (cleaned.length === 6) {
                    setErrorMessage(null);
                  }
                }}
              />
              <Text style={[styles.hintText, { color: theme.textMuted }]}>
                On Medfolio Web, open Settings → Mobile Companion App to find your instant 6-digit code.
              </Text>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                onPress={handleVerifyPairingCode}
                disabled={isVerifying}
                activeOpacity={0.85}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryActionBtnText}>Connect &amp; Sync Patient Records</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 2: SMART QR */}
          {activeTab === 'qr' && (
            <View style={styles.formContainer}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                PASTE SMART QR LINK OR TOKEN
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surfaceSunken,
                    borderColor: theme.lineStrong,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Paste token or link (c1... or curewell://pair?pair=...)"
                placeholderTextColor={theme.textSubtle}
                autoCapitalize="none"
                autoCorrect={false}
                value={smartQrInput}
                onChangeText={setSmartQrInput}
              />
              <Text style={[styles.hintText, { color: theme.textMuted }]}>
                You can copy the pairing link from your computer or camera QR scanner and paste it here.
              </Text>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                onPress={handleVerifySmartQr}
                disabled={isVerifying}
                activeOpacity={0.85}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryActionBtnText}>Verify Smart QR</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 3: EMAIL & PASSWORD */}
          {activeTab === 'email' && (
            <View style={styles.formContainer}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>EMAIL ADDRESS</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.surfaceSunken,
                      borderColor: theme.lineStrong,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="patient@medfolio.health"
                  placeholderTextColor={theme.textSubtle}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  value={emailInput}
                  onChangeText={setEmailInput}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>PASSWORD</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.surfaceSunken,
                      borderColor: theme.lineStrong,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="••••••••••••"
                  placeholderTextColor={theme.textSubtle}
                  secureTextEntry
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                onPress={handleEmailSignIn}
                disabled={isVerifying}
                activeOpacity={0.85}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryActionBtnText}>Sign In &amp; Load Health Vault</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Step Guide */}
        <View style={[styles.guideCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Text style={[styles.guideHeading, { color: theme.textPrimary }]}>How to Pair in 10 Seconds:</Text>
          <View style={styles.guideStep}>
            <Text style={[styles.stepNum, { color: theme.primary }]}>1</Text>
            <Text style={[styles.stepDesc, { color: theme.textMuted }]}>
              Log in to Medfolio on your PC or browser.
            </Text>
          </View>
          <View style={styles.guideStep}>
            <Text style={[styles.stepNum, { color: theme.primary }]}>2</Text>
            <Text style={[styles.stepDesc, { color: theme.textMuted }]}>
              Click <Text style={{ fontWeight: '700', color: theme.textPrimary }}>Settings</Text> →{' '}
              <Text style={{ fontWeight: '700', color: theme.textPrimary }}>Phone App / Companion</Text>.
            </Text>
          </View>
          <View style={styles.guideStep}>
            <Text style={[styles.stepNum, { color: theme.primary }]}>3</Text>
            <Text style={[styles.stepDesc, { color: theme.textMuted }]}>
              Type the 6-digit code or scan the Smart QR code above.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 36,
    paddingBottom: 40,
    gap: 16,
  },
  brandHero: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  logoIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  securityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  notifCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  notifSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  grantNotifBtn: {
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantNotifBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  workspaceCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentedBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  segmentItemActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  formContainer: {
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  codeInput: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  textInput: {
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  hintText: {
    fontSize: 11,
    lineHeight: 16,
  },
  primaryActionBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  guideCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  guideHeading: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNum: {
    fontSize: 13,
    fontWeight: '900',
    width: 18,
  },
  stepDesc: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
