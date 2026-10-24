import React, { useState, useEffect } from 'react';
import {
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
import { PillIcon, XIcon, PlusIcon, ClockIcon } from '../icons';
import { MealRelation, TimeBucket } from '../../types';

export interface AddMedicineModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMedicine: (med: {
    medicineName: string;
    genericName: string;
    strength: string;
    bucket: TimeBucket;
    scheduledTime: string;
    mealRelation: MealRelation;
  }) => void;
}

const DEFAULT_BUCKET_TIMES: Record<TimeBucket, string> = {
  Morning: '08:00 AM',
  Afternoon: '02:00 PM',
  Evening: '08:00 PM',
  Bedtime: '10:30 PM',
};

const BUCKETS: TimeBucket[] = ['Morning', 'Afternoon', 'Evening', 'Bedtime'];
const MEAL_RELATIONS: MealRelation[] = ['Before Food', 'After Food', 'With Water'];

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  visible,
  onClose,
  onAddMedicine,
}) => {
  const { theme, isDark } = useTheme();

  const [medicineName, setMedicineName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [strength, setStrength] = useState('');
  const [bucket, setBucket] = useState<TimeBucket>('Morning');
  const [mealRelation, setMealRelation] = useState<MealRelation>('After Food');
  const [scheduledTime, setScheduledTime] = useState(DEFAULT_BUCKET_TIMES.Morning);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setMedicineName('');
      setGenericName('');
      setStrength('');
      setBucket('Morning');
      setMealRelation('After Food');
      setScheduledTime(DEFAULT_BUCKET_TIMES.Morning);
      setErrorMsg(null);
    }
  }, [visible]);

  const handleSelectBucket = (selectedBucket: TimeBucket) => {
    setBucket(selectedBucket);
    setScheduledTime(DEFAULT_BUCKET_TIMES[selectedBucket]);
  };

  const handleSave = () => {
    if (!medicineName.trim()) {
      setErrorMsg('Please enter a medicine or brand name.');
      return;
    }

    onAddMedicine({
      medicineName: medicineName.trim(),
      genericName: genericName.trim() || 'Prescribed Regimen',
      strength: strength.trim() || '1 tab',
      bucket,
      scheduledTime: scheduledTime.trim() || DEFAULT_BUCKET_TIMES[bucket],
      mealRelation,
    });

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.sheetContainer, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Modal Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.eyebrow, { color: theme.primary }]}>NEW MEDICATION</Text>
                <Text style={[styles.title, { color: theme.textPrimary }]}>Add Prescribed Dose</Text>
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
            {errorMsg && (
              <View style={[styles.errorBanner, { backgroundColor: theme.risk.bg, borderColor: theme.risk.border }]}>
                <Text style={[styles.errorText, { color: theme.risk.text }]}>{errorMsg}</Text>
              </View>
            )}

            {/* Medicine Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                MEDICINE / BRAND NAME *
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
                placeholder="e.g. Glucophage, Concor, Risek"
                placeholderTextColor={theme.textSubtle}
                value={medicineName}
                onChangeText={setMedicineName}
              />
            </View>

            {/* Strength & Generic Name Row */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>STRENGTH / DOSE</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.surfaceSunken,
                      borderColor: theme.lineStrong,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="500mg, 1 tab"
                  placeholderTextColor={theme.textSubtle}
                  value={strength}
                  onChangeText={setStrength}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1.5 }]}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>ACTIVE GENERIC SALT</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.surfaceSunken,
                      borderColor: theme.lineStrong,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="e.g. Metformin HCl"
                  placeholderTextColor={theme.textSubtle}
                  value={genericName}
                  onChangeText={setGenericName}
                />
              </View>
            </View>

            {/* Time-of-Day Bucket Selector */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                DAILY SCHEDULE SLOT
              </Text>
              <View style={styles.pillsGrid}>
                {BUCKETS.map((b) => {
                  const active = bucket === b;
                  return (
                    <TouchableOpacity
                      key={b}
                      style={[
                        styles.pillOption,
                        {
                          backgroundColor: active ? theme.primary : theme.surfaceSunken,
                          borderColor: active ? theme.primary : theme.line,
                        },
                      ]}
                      onPress={() => handleSelectBucket(b)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.pillOptionText,
                          { color: active ? '#FFFFFF' : theme.textMuted },
                        ]}
                      >
                        {b}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Scheduled Time & Food Timing */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>ALARM TIME</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.surfaceSunken,
                      borderColor: theme.lineStrong,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="08:00 AM"
                  placeholderTextColor={theme.textSubtle}
                  value={scheduledTime}
                  onChangeText={setScheduledTime}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1.4 }]}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>FOOD RELATION</Text>
                <View style={styles.mealPillsRow}>
                  {MEAL_RELATIONS.map((rel) => {
                    const active = mealRelation === rel;
                    return (
                      <TouchableOpacity
                        key={rel}
                        style={[
                          styles.mealPill,
                          {
                            backgroundColor: active ? theme.primary : theme.surfaceSunken,
                            borderColor: active ? theme.primary : theme.line,
                          },
                        ]}
                        onPress={() => setMealRelation(rel)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.mealPillText,
                            { color: active ? '#FFFFFF' : theme.textMuted },
                          ]}
                          numberOfLines={1}
                        >
                          {rel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryBtnText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <PlusIcon size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.primaryBtnText}>Arm Offline Alarm</Text>
              </TouchableOpacity>
            </View>
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 6,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  pillsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  pillOption: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  pillOptionText: {
    fontSize: 11,
    fontWeight: '800',
  },
  mealPillsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  mealPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  mealPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default AddMedicineModal;
