import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import {
  KeyIcon,
  QrCodeIcon,
  UserIcon,
  XIcon,
  CheckIcon,
  LogOutIcon,
  AlertTriangleIcon,
} from '../icons';

export interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  sessionEmail: string | null;
  onSignOut: () => void;
  onSignInEmail: (email: string, pass: string) => Promise<void>;
  onSignInQR: (code: string) => Promise<void>;
  isLoading: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  sessionEmail,
  onSignOut,
  onSignInEmail,
  onSignInQR,
  isLoading,
}) => {
  const { theme, isDark } = useTheme();

  const [authMethod, setAuthMethod] = useState<'qr' | 'credentials'>('qr');
  const [smartQrInput, setSmartQrInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setErrorText(null);
      setSmartQrInput('');
      setEmailInput('');
      setPasswordInput('');
    }
  }, [visible]);

  const handleQrSubmit = async () => {
    if (!smartQrInput.trim()) {
      setErrorText('Please paste a Smart QR code or 6-digit pairing code.');
      return;
    }
    setErrorText(null);
    try {
      await onSignInQR(smartQrInput.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in with QR code.';
      setErrorText(msg);
    }
  };

  const handleCredentialsSubmit = async () => {
    if (!emailInput.trim() || !passwordInput.trim()) {
      setErrorText('Please enter both email and password.');
      return;
    }
    setErrorText(null);
    try {
      await onSignInEmail(emailInput.trim(), passwordInput.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please verify and retry.';
      setErrorText(msg);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.sheetContainer, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.eyebrow, { color: theme.primary }]}>AUTHENTICATION &amp; CLOUD SYNC</Text>
                <Text style={[styles.title, { color: theme.textPrimary }]}>
                  {sessionEmail ? 'Caregiver Account' : 'Connect to Medfolio'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeIconBtn, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}
                accessibilityLabel="Close dialog"
              >
                <XIcon size={16} color={theme.textMuted} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Error Banner */}
            {errorText && (
              <View style={[styles.errorBanner, { backgroundColor: theme.risk.bg, borderColor: theme.risk.border }]}>
                <AlertTriangleIcon size={16} color={theme.risk.text} />
                <Text style={[styles.errorText, { color: theme.risk.text }]}>{errorText}</Text>
              </View>
            )}

            {/* If Already Logged In */}
            {sessionEmail ? (
              <View style={[styles.activeSessionCard, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}>
                <View style={styles.sessionStatusRow}>
                  <View style={[styles.activeDot, { backgroundColor: theme.ok.dot }]} />
                  <Text style={[styles.sessionStatusText, { color: theme.ok.text }]}>ACTIVE CLOUD SESSION</Text>
                </View>

                <View style={[styles.userEmailBox, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                  <Text style={[styles.emailLabel, { color: theme.textMuted }]}>Logged in as Caregiver:</Text>
                  <Text style={[styles.userEmailText, { color: theme.textPrimary }]}>{sessionEmail}</Text>
                </View>

                <Text style={[styles.sessionHint, { color: theme.textMuted }]}>
                  Prescription schedules, clinical logs, and SOS telemetry sync securely with the
                  Medfolio Web App.
                </Text>

                <View style={styles.sessionActions}>
                  <TouchableOpacity
                    style={[styles.signOutBtn, { backgroundColor: theme.risk.bg, borderColor: theme.risk.border }]}
                    onPress={onSignOut}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={theme.risk.text} />
                    ) : (
                      <>
                        <LogOutIcon size={16} color={theme.risk.text} />
                        <Text style={[styles.signOutText, { color: theme.risk.text }]}>Sign Out of Device</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryBtn, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Not Logged In - Sign-In Tabs */
              <>
                <Text style={[styles.descriptionText, { color: theme.textMuted }]}>
                  Connect your phone to sync prescriptions, home-screen widget telemetry, and
                  clinical alerts in real time.
                </Text>

                {/* Segmented Method Selector */}
                <View style={[styles.segmentedRow, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}>
                  <TouchableOpacity
                    style={[
                      styles.segmentBtn,
                      authMethod === 'qr' && [styles.segmentBtnActive, { backgroundColor: theme.surface }],
                    ]}
                    onPress={() => {
                      setAuthMethod('qr');
                      setErrorText(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <QrCodeIcon size={14} color={authMethod === 'qr' ? theme.primary : theme.textMuted} />
                    <Text
                      style={[
                        styles.segmentBtnText,
                        { color: authMethod === 'qr' ? theme.textPrimary : theme.textMuted },
                      ]}
                    >
                      Smart QR / 6-Digit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.segmentBtn,
                      authMethod === 'credentials' && [styles.segmentBtnActive, { backgroundColor: theme.surface }],
                    ]}
                    onPress={() => {
                      setAuthMethod('credentials');
                      setErrorText(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <UserIcon size={14} color={authMethod === 'credentials' ? theme.primary : theme.textMuted} />
                    <Text
                      style={[
                        styles.segmentBtnText,
                        { color: authMethod === 'credentials' ? theme.textPrimary : theme.textMuted },
                      ]}
                    >
                      Email &amp; Password
                    </Text>
                  </TouchableOpacity>
                </View>

                {authMethod === 'qr' ? (
                  <View style={styles.tabContent}>
                    <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                      SMART QR PAIRING LINK OR 6-DIGIT CODE
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
                      placeholder="Paste 6-digit code or QR token..."
                      placeholderTextColor={theme.textSubtle}
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={smartQrInput}
                      onChangeText={setSmartQrInput}
                    />
                    <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
                      In Medfolio Web, open Settings → Mobile Companion App to get your code.
                    </Text>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.secondaryBtn, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}
                        onPress={onClose}
                        disabled={isLoading}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.secondaryBtnText, { color: theme.textMuted }]}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                        onPress={handleQrSubmit}
                        disabled={isLoading}
                        activeOpacity={0.8}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.primaryBtnText}>Auto-Sign In via QR</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.tabContent}>
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
                        placeholder="caregiver@medfolio.health"
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

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.secondaryBtn, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}
                        onPress={onClose}
                        disabled={isLoading}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.secondaryBtnText, { color: theme.textMuted }]}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                        onPress={handleCredentialsSubmit}
                        disabled={isLoading}
                        activeOpacity={0.8}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.primaryBtnText}>Sign In &amp; Sync</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  sheetContainer: {
    borderRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 18,
  },
  segmentedRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  segmentBtnActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabContent: {
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
  },
  fieldHint: {
    fontSize: 11,
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  activeSessionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sessionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  userEmailBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  emailLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  userEmailText: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  sessionHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  sessionActions: {
    gap: 8,
    marginTop: 4,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '800',
  },
});

export default AuthModal;
