import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  Vibration,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useTheme, ThemeMode } from '../theme';
import {
  SettingsIcon,
  SunIcon,
  MoonIcon,
  LockIcon,
  KeyIcon,
  BellIcon,
  BellOffIcon,
  UserIcon,
  UsersIcon,
  LogOutIcon,
  RefreshCwIcon,
  ShieldIcon,
  ChevronRightIcon,
  SmartphoneIcon,
  CheckIcon,
} from '../components/icons';
import {
  areNotificationsEnabled,
  openNotificationSettings,
  triggerNativeDoseNotification,
} from '../native/CurewellNativeBridge';
import { PatientProfile } from '../types';

export interface SettingsScreenProps {
  activeProfile: PatientProfile;
  profiles: PatientProfile[];
  sessionEmail: string | null;
  savedPin: string | null;
  onSetPin: (newPin: string | null) => void;
  onOpenProfilePicker: () => void;
  onSignOut: () => void;
  onManualSync: () => void;
  isLiveConnected: boolean;
  pendingSyncCount: number;
  onToast: (msg: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  activeProfile,
  profiles,
  sessionEmail,
  savedPin,
  onSetPin,
  onOpenProfilePicker,
  onSignOut,
  onManualSync,
  isLiveConnected,
  pendingSyncCount,
  onToast,
}) => {
  const { theme, themeMode, setThemeMode, isDark } = useTheme();

  const [notifEnabled, setNotifEnabled] = useState<boolean | null>(null);
  const [isTestingNotif, setIsTestingNotif] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const enabled = await areNotificationsEnabled();
        setNotifEnabled(enabled);
      } catch {
        setNotifEnabled(false);
      }
    })();
  }, []);

  const handleTestNotification = async () => {
    setIsTestingNotif(true);
    Vibration.vibrate([0, 50, 100, 50]);
    try {
      const ok = await triggerNativeDoseNotification(
        'Medfolio Dose Alarm Test',
        `Scheduled dose reminder for ${activeProfile.fullName} is armed.`
      );
      if (ok) {
        onToast('Test alarm notification triggered.');
      } else {
        onToast('Could not trigger test notification.');
      }
    } catch {
      onToast('Error triggering test alarm.');
    } finally {
      setIsTestingNotif(false);
    }
  };

  const handleTogglePin = () => {
    if (savedPin) {
      Alert.alert(
        'Remove 4-Digit Vault PIN',
        'Are you sure you want to disable PIN lock on this phone?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove PIN',
            style: 'destructive',
            onPress: () => {
              onSetPin(null);
              onToast('4-digit PIN lock disabled.');
            },
          },
        ]
      );
    } else {
      Alert.prompt
        ? Alert.prompt(
            'Set 4-Digit PIN',
            'Enter a 4-digit numeric PIN to protect medical records:',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Save PIN',
                onPress: (pin?: string) => {
                  if (pin && /^\d{4}$/.test(pin)) {
                    onSetPin(pin);
                    onToast('4-digit PIN lock configured successfully.');
                  } else {
                    onToast('PIN must be exactly 4 digits.');
                  }
                },
              },
            ],
            'plain-text',
            '',
            'number-pad'
          )
        : Alert.alert('PIN Lock', 'Configure your 4-digit PIN via the Companion Setup flow.');
    }
  };

  return (
    <View style={styles.container}>
      {/* SECTION 1: APPEARANCE & THEME */}
      <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>APPEARANCE &amp; THEME</Text>
          <Text style={[styles.sectionSub, { color: theme.textMuted }]}>
            Medfolio defaults to crisp Clinical Light mode matching the Web App.
          </Text>
        </View>

        <View style={styles.themeSelectorRow}>
          {(
            [
              { mode: 'light' as ThemeMode, label: 'Light', desc: 'Clinical White (Web default)', icon: SunIcon },
              { mode: 'dark' as ThemeMode, label: 'Dark', desc: 'Obsidian Minimalist', icon: MoonIcon },
              { mode: 'system' as ThemeMode, label: 'System', desc: 'Match Android OS', icon: SmartphoneIcon },
            ] as const
          ).map((item) => {
            const isSelected = themeMode === item.mode;
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.mode}
                style={[
                  styles.themeOptionBtn,
                  {
                    backgroundColor: isSelected ? theme.surfaceAccent : theme.surfaceSunken,
                    borderColor: isSelected ? theme.primary : theme.line,
                  },
                ]}
                onPress={() => {
                  Vibration.vibrate(20);
                  void setThemeMode(item.mode);
                }}
                activeOpacity={0.8}
              >
                <IconComponent
                  size={18}
                  color={isSelected ? theme.primary : theme.textMuted}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.themeOptionTitle,
                    { color: isSelected ? theme.primary : theme.textPrimary },
                  ]}
                >
                  {item.label}
                </Text>
                <Text style={[styles.themeOptionDesc, { color: theme.textMuted }]}>
                  {item.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SECTION 2: NOTIFICATIONS & ALARM MANAGER */}
      <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>NOTIFICATIONS &amp; ALARMS</Text>
          <Text style={[styles.sectionSub, { color: theme.textMuted }]}>
            Exact lock-screen alarms powered by Android AlarmManager (RTC_WAKEUP).
          </Text>
        </View>

        <View style={[styles.rowItem, { borderBottomColor: theme.line }]}>
          <View style={styles.rowLeft}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: notifEnabled ? theme.ok.bg : theme.warn.bg },
              ]}
            >
              {notifEnabled ? (
                <BellIcon size={18} color={theme.ok.text} />
              ) : (
                <BellOffIcon size={18} color={theme.warn.text} />
              )}
            </View>
            <View>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>
                {notifEnabled ? 'Notifications Allowed' : 'Notifications Blocked'}
              </Text>
              <Text style={[styles.rowSubtitle, { color: theme.textMuted }]}>
                {notifEnabled
                  ? 'Medication alarms can ring lock-screen alerts.'
                  : 'Tap below to grant permission in Android settings.'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.smallActionBtn, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}
            onPress={() => void openNotificationSettings()}
          >
            <Text style={[styles.smallActionBtnText, { color: theme.textPrimary }]}>Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rowItem}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBadge, { backgroundColor: theme.info.bg }]}>
              <SmartphoneIcon size={18} color={theme.info.text} />
            </View>
            <View>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Test Alarm Sound</Text>
              <Text style={[styles.rowSubtitle, { color: theme.textMuted }]}>
                Ring a sample lock-screen alert right now.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.smallActionBtn, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
            onPress={handleTestNotification}
            disabled={isTestingNotif}
          >
            {isTestingNotif ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.smallActionBtnText, { color: theme.primaryDark }]}>Test Alarm</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION 3: PRIVACY & 4-DIGIT PIN */}
      <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>PRIVACY &amp; HEALTH VAULT</Text>
          <Text style={[styles.sectionSub, { color: theme.textMuted }]}>
            Local salted PIN encryption and auto-lock guardrails (ADR 0011).
          </Text>
        </View>

        <View style={styles.rowItem}>
          <View style={styles.rowLeft}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: savedPin ? theme.ok.bg : theme.surfaceSunken },
              ]}
            >
              <LockIcon size={18} color={savedPin ? theme.ok.text : theme.textMuted} />
            </View>
            <View>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>
                {savedPin ? '4-Digit PIN Lock Active' : 'No PIN Configured'}
              </Text>
              <Text style={[styles.rowSubtitle, { color: theme.textMuted }]}>
                {savedPin
                  ? 'Vault locks when app is closed or after 5 mins of inactivity.'
                  : 'Protect sensitive dosages from unauthorized view.'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.smallActionBtn,
              {
                backgroundColor: savedPin ? theme.risk.bg : theme.primaryLight,
                borderColor: savedPin ? theme.risk.border : theme.primary,
              },
            ]}
            onPress={handleTogglePin}
          >
            <Text
              style={[
                styles.smallActionBtnText,
                { color: savedPin ? theme.risk.text : theme.primaryDark },
              ]}
            >
              {savedPin ? 'Remove PIN' : 'Set PIN'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION 4: PAIRED PROFILE & CLOUD SYNCHRONIZATION */}
      <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            PAIRED PATIENT &amp; CLOUD SYNC
          </Text>
          <Text style={[styles.sectionSub, { color: theme.textMuted }]}>
            Connected via secure Smart QR or caregiver credentials.
          </Text>
        </View>

        <View style={[styles.rowItem, { borderBottomColor: theme.line }]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBadge, { backgroundColor: theme.primaryLight }]}>
              <UserIcon size={18} color={theme.primaryDark} />
            </View>
            <View>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>
                {activeProfile.fullName}
              </Text>
              <Text style={[styles.rowSubtitle, { color: theme.textMuted }]}>
                {activeProfile.relationship || 'Self'} • Blood: {activeProfile.bloodGroup || 'Unknown'}
              </Text>
            </View>
          </View>
          {profiles.length > 1 && (
            <TouchableOpacity
              style={[styles.smallActionBtn, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}
              onPress={onOpenProfilePicker}
            >
              <Text style={[styles.smallActionBtnText, { color: theme.textPrimary }]}>Switch</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.rowItem, { borderBottomColor: theme.line }]}>
          <View style={styles.rowLeft}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: isLiveConnected ? theme.ok.bg : theme.surfaceSunken },
              ]}
            >
              <RefreshCwIcon
                size={18}
                color={isLiveConnected ? theme.ok.text : theme.textMuted}
              />
            </View>
            <View>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>
                {isLiveConnected ? 'Live Cloud Sync Active' : 'Offline / Standalone Mode'}
              </Text>
              <Text style={[styles.rowSubtitle, { color: theme.textMuted }]}>
                {pendingSyncCount > 0
                  ? `${pendingSyncCount} dose updates queued in offline outbox.`
                  : 'All records in sync with Medfolio Web.'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.smallActionBtn, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}
            onPress={onManualSync}
          >
            <Text style={[styles.smallActionBtnText, { color: theme.textPrimary }]}>Sync Now</Text>
          </TouchableOpacity>
        </View>

        {sessionEmail && (
          <View style={[styles.rowItem, { borderBottomColor: theme.line }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBadge, { backgroundColor: theme.info.bg }]}>
                <ShieldIcon size={18} color={theme.info.text} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Caregiver Account</Text>
                <Text style={[styles.rowSubtitle, { color: theme.textMuted }]}>{sessionEmail}</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: theme.risk.bg, borderColor: theme.risk.border }]}
          onPress={() => {
            Alert.alert(
              'Unpair Mobile Device',
              'Are you sure you want to sign out and unpair this phone from Medfolio?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Unpair & Sign Out',
                  style: 'destructive',
                  onPress: onSignOut,
                },
              ]
            );
          }}
          activeOpacity={0.8}
        >
          <LogOutIcon size={16} color={theme.risk.text} />
          <Text style={[styles.signOutBtnText, { color: theme.risk.text }]}>
            Unpair Device &amp; Sign Out
          </Text>
        </TouchableOpacity>
      </View>

      {/* SECTION 5: APP SYSTEM INFO */}
      <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>BUILD &amp; ENGINE</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Application</Text>
          <Text style={[styles.infoValue, { color: theme.textPrimary }]}>Medfolio Companion v4.0.0</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Runtime Engine</Text>
          <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
            React Native 0.88 • Hermes Engine
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Native Extensions</Text>
          <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
            Android Home Widget • AlarmManager
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Integrity Standard</Text>
          <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
            ADR 0004 Zero-Falsification Compliant
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  sectionSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  themeOptionBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  themeOptionTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  themeOptionDesc: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    gap: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  smallActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  smallActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    marginTop: 4,
  },
  signOutBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
  },
});
