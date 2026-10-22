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
import { THEME } from '../../constants';
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
  const [medicineName, setMedicineName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [strength, setStrength] = useState('');
  const [bucket, setBucket] = useState<TimeBucket>('Morning');
  const [mealRelation, setMealRelation] = useState<MealRelation>('After Food');
  const [scheduledTime, setScheduledTime] = useState(DEFAULT_BUCKET_TIMES.Morning);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset form when modal opens
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
    // If the scheduledTime matches one of the defaults, update to new bucket default
    setScheduledTime(DEFAULT_BUCKET_TIMES[selectedBucket]);
  };

  const handleSave = () => {
    if (!medicineName.trim()) {
      setErrorMsg('Please enter a medicine or brand name.');
      return;
    }

    onAddMedicine({
      medicineName: medicineName.trim(),
      genericName: genericName.trim() || 'General Formulation',
      strength: strength.trim() || 'Standard Dose',
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
        <View style={styles.sheetContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Modal Title & Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.eyebrow}>PRESCRIPTION & FORMULATION</Text>
                <Text style={styles.title}>Add Medicine to Schedule</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeIconBtn}
                accessibilityLabel="Close dialog"
              >
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>
            </View>

            {errorMsg && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>MEDICINE / BRAND NAME *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Panadol, Risek, Glucophage"
                placeholderTextColor="#64748B"
                value={medicineName}
                onChangeText={(val) => {
                  setMedicineName(val);
                  if (errorMsg) setErrorMsg(null);
                }}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>ACTIVE GENERIC SALT / COMPOSITION</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Paracetamol, Omeprazole, Metformin"
                placeholderTextColor="#64748B"
                value={genericName}
                onChangeText={setGenericName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>STRENGTH / DOSAGE FORM</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500mg, 20mg, 1 tablet, 5ml"
                placeholderTextColor="#64748B"
                value={strength}
                onChangeText={setStrength}
              />
            </View>

            {/* Time Bucket Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>SCHEDULE TIME BUCKET</Text>
              <View style={styles.pillsRow}>
                {BUCKETS.map((b) => {
                  const isSelected = bucket === b;
                  return (
                    <TouchableOpacity
                      key={b}
                      style={[styles.pill, isSelected && styles.pillActive]}
                      onPress={() => handleSelectBucket(b)}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                        {b}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Scheduled Time String Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>SPECIFIC DOSE TIME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 08:00 AM"
                placeholderTextColor="#64748B"
                value={scheduledTime}
                onChangeText={setScheduledTime}
              />
            </View>

            {/* Meal Relation Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>MEAL RELATION</Text>
              <View style={styles.pillsRow}>
                {MEAL_RELATIONS.map((mr) => {
                  const isSelected = mealRelation === mr;
                  return (
                    <TouchableOpacity
                      key={mr}
                      style={[styles.pill, isSelected && styles.pillActive]}
                      onPress={() => setMealRelation(mr)}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                        {mr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>Save Medicine</Text>
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
    marginBottom: 4,
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
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexGrow: 1,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: THEME.primary,
    borderColor: '#14B8A6',
  },
  pillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
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
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default AddMedicineModal;
