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
import { THEME } from '../../constants';

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
      setErrorText('Please paste a Smart QR code or pairing token.');
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
        <View style={styles.sheetContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.eyebrow}>AUTHENTICATION & LIVE CLOUD</Text>
                <Text style={styles.title}>
                  {sessionEmail ? 'Caregiver Account' : 'Sign In to Curewell'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeIconBtn}
                accessibilityLabel="Close dialog"
              >
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Error Banner */}
            {errorText && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorText}</Text>
              </View>
            )}

            {/* If Already Logged In */}
            {sessionEmail ? (
              <View style={styles.activeSessionCard}>
                <View style={styles.sessionStatusRow}>
                  <View style={styles.activeDot} />
                  <Text style={styles.sessionStatusText}>ACTIVE CLOUD SESSION</Text>
                </View>

                <View style={styles.userEmailBox}>
                  <Text style={styles.emailLabel}>Logged in as Caregiver:</Text>
                  <Text style={styles.userEmailText}>{sessionEmail}</Text>
                </View>

                <Text style={styles.sessionHint}>
                  Prescription schedules, clinical logs, and SOS telemetry sync securely with the
                  Curewell Web Clinical OS.
                </Text>

                <View style={styles.sessionActions}>
                  <TouchableOpacity
                    style={styles.signOutBtn}
                    onPress={onSignOut}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.signOutText}>Sign Out of Device</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.secondaryBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Not Logged In - Sign-In Tabs */
              <>
                <Text style={styles.descriptionText}>
                  Connect your phone to sync prescriptions, home-screen widget telemetry, and
                  clinical alerts in real time.
                </Text>

                {/* Segmented Method Selector */}
                <View style={styles.segmentedRow}>
                  <TouchableOpacity
                    style={[styles.segmentBtn, authMethod === 'qr' && styles.segmentBtnActive]}
                    onPress={() => {
                      setAuthMethod('qr');
                      setErrorText(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        authMethod === 'qr' && styles.segmentBtnTextActive,
                      ]}
                    >
                      1. Smart QR Pairing
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.segmentBtn,
                      authMethod === 'credentials' && styles.segmentBtnActive,
                    ]}
                    onPress={() => {
                      setAuthMethod('credentials');
                      setErrorText(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        authMethod === 'credentials' && styles.segmentBtnTextActive,
                      ]}
                    >
                      2. Email & Password
                    </Text>
                  </TouchableOpacity>
                </View>

                {authMethod === 'qr' ? (
                  <View style={styles.tabContent}>
                    <Text style={styles.inputLabel}>SMART QR PAIRING LINK OR TOKEN</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Paste pairing token or QR payload from Web App..."
                      placeholderTextColor="#64748B"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={smartQrInput}
                      onChangeText={setSmartQrInput}
                    />
                    <Text style={styles.fieldHint}>
                      In Curewell Web OS, open Settings → Mobile Companion App to get your Smart QR
                      code.
                    </Text>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={onClose}
                        disabled={isLoading}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.secondaryBtnText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.primaryBtn}
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
                      <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="caregiver@curewell.med"
                        placeholderTextColor="#64748B"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                        value={emailInput}
                        onChangeText={setEmailInput}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.inputLabel}>PASSWORD</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="••••••••••••"
                        placeholderTextColor="#64748B"
                        secureTextEntry
                        value={passwordInput}
                        onChangeText={setPasswordInput}
                      />
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={onClose}
                        disabled={isLoading}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.secondaryBtnText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={handleCredentialsSubmit}
                        disabled={isLoading}
                        activeOpacity={0.8}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.primaryBtnText}>Sign In & Sync</Text>
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
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
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
    color: '#2DD4BF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  closeIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#7F1D1D44',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  descriptionText: {
    color: THEME.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: THEME.primary,
  },
  segmentBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabContent: {
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
  },
  fieldHint: {
    color: '#64748B',
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
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 2,
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  activeSessionCard: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
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
    backgroundColor: '#10B981',
  },
  sessionStatusText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  userEmailBox: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
  },
  emailLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  userEmailText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  sessionHint: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  sessionActions: {
    gap: 8,
    marginTop: 4,
  },
  signOutBtn: {
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default AuthModal;
