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
import { THEME } from '../../constants';

export interface SkipReasonModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmSkip: (reason: string) => void;
}

const CLINICAL_REASONS: { label: string; icon: string }[] = [
  { label: 'Doctor Advised to Hold', icon: '👨‍⚕️' },
  { label: 'Nausea / Felt Sick', icon: '🤢' },
  { label: 'Already Took Dose Earlier', icon: '⏱️' },
  { label: 'Ran Out of Medicine', icon: '📦' },
  { label: 'Fasting / Procedure', icon: '🩺' },
];

export const SkipReasonModal: React.FC<SkipReasonModalProps> = ({
  visible,
  onClose,
  onConfirmSkip,
}) => {
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
        <View style={styles.sheetContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.badgeRow}>
                <Text style={styles.badgeText}>CLINICAL COMPLIANCE LOG</Text>
              </View>
              <Text style={styles.title}>Reason for Holding / Skipping Dose</Text>
              <Text style={styles.subtitle}>
                Recorded in patient history and caregiver audit logs for safety.
              </Text>
            </View>

            {/* Predefined Clinical Reasons */}
            <View style={styles.reasonsList}>
              {CLINICAL_REASONS.map(({ label, icon }) => (
                <TouchableOpacity
                  key={label}
                  style={styles.reasonBtn}
                  onPress={() => handleSelectPredefined(label)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reasonIcon}>{icon}</Text>
                  <Text style={styles.reasonText}>{label}</Text>
                  <Text style={styles.arrowIcon}>›</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Reason Field */}
            <View style={styles.customGroup}>
              <Text style={styles.inputLabel}>OR SPECIFY OTHER CLINICAL REASON</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Awaiting lab results, allergy symptoms..."
                placeholderTextColor="#64748B"
                value={customReason}
                onChangeText={setCustomReason}
              />
              {customReason.trim().length > 0 && (
                <TouchableOpacity
                  style={styles.confirmCustomBtn}
                  onPress={handleCustomConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmCustomText}>Confirm Custom Reason</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setCustomReason('');
                setSelectedReason(null);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Dismiss / Keep Dose Active</Text>
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
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    padding: 18,
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
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
  },
  badgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  subtitle: {
    color: '#94A3B8',
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
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  reasonIcon: {
    fontSize: 16,
  },
  reasonText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  arrowIcon: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: '600',
  },
  customGroup: {
    gap: 6,
    marginTop: 4,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
  },
  confirmCustomBtn: {
    backgroundColor: THEME.primary,
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
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 4,
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default SkipReasonModal;
