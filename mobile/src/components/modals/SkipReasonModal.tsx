import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme';
import {
  ShieldIcon,
  ClockIcon,
  PillIcon,
  StethoscopeIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
} from '../icons';

export interface SkipReasonModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmSkip: (reason: string) => void;
}

const CLINICAL_REASONS: { label: string; icon: React.FC<any> }[] = [
  { label: 'Doctor Advised to Hold', icon: StethoscopeIcon },
  { label: 'Nausea / Felt Sick', icon: AlertTriangleIcon },
  { label: 'Already Took Dose Earlier', icon: ClockIcon },
  { label: 'Ran Out of Medicine / Refill Needed', icon: PillIcon },
  { label: 'Fasting for Lab / Diagnostic Procedure', icon: ShieldIcon },
];

export const SkipReasonModal: React.FC<SkipReasonModalProps> = ({
  visible,
  onClose,
  onConfirmSkip,
}) => {
  const { theme, isDark } = useTheme();

  const [customReason, setCustomReason] = useState('');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const handleSelectPredefined = (reason: string) => {
    setSelectedReason(reason);
    setCustomReason('');
    onConfirmSkip(reason);
    onClose();
  };

  const handleCustomConfirm = () => {
    const finalReason = customReason.trim() || selectedReason || 'Patient Discretion';
    onConfirmSkip(finalReason);
    setCustomReason('');
    setSelectedReason(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheetContainer, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.badgeRow, { backgroundColor: theme.warn.bg, borderColor: theme.warn.border }]}>
                <Text style={[styles.badgeText, { color: theme.warn.text }]}>
                  CLINICAL SAFETY AUDIT
                </Text>
              </View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Reason for Holding / Skipping Dose
              </Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Recorded in patient history and caregiver safety audit logs.
              </Text>
            </View>

            {/* Predefined Clinical Reasons */}
            <View style={styles.reasonsList}>
              {CLINICAL_REASONS.map(({ label, icon: IconComponent }) => (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.reasonBtn,
                    { backgroundColor: theme.surfaceSunken, borderColor: theme.line },
                  ]}
                  onPress={() => handleSelectPredefined(label)}
                  activeOpacity={0.7}
                >
                  <IconComponent size={18} color={theme.primary} />
                  <Text style={[styles.reasonText, { color: theme.textPrimary }]}>{label}</Text>
                  <ChevronRightIcon size={16} color={theme.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Reason Field */}
            <View style={styles.customGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                OR SPECIFY OTHER CLINICAL REASON
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
                placeholder="e.g. Awaiting lab results, allergy symptoms..."
                placeholderTextColor={theme.textSubtle}
                value={customReason}
                onChangeText={setCustomReason}
              />
              {customReason.trim().length > 0 && (
                <TouchableOpacity
                  style={[styles.confirmCustomBtn, { backgroundColor: theme.primary }]}
                  onPress={handleCustomConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmCustomText}>Confirm Custom Reason</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}
              onPress={() => {
                setCustomReason('');
                setSelectedReason(null);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>
                Dismiss / Keep Dose Active
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 18,
  },
  sheetContainer: {
    borderRadius: 20,
    borderWidth: 1,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
    gap: 14,
  },
  header: {
    gap: 4,
  },
  badgeRow: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  reasonsList: {
    gap: 8,
    marginTop: 4,
  },
  reasonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  reasonText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  customGroup: {
    gap: 6,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
  },
  confirmCustomBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmCustomText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelBtn: {
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default SkipReasonModal;
