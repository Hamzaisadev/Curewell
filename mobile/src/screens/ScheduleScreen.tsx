import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DoseSlot, TimeBucket } from '../types';
import { styles } from '../styles/commonStyles';

export interface ScheduleScreenProps {
  doses: DoseSlot[];
  adherencePct: number;
  takenCount: number;
  onTakeDose: (id: string) => void;
  onOpenSkipModal: (id: string) => void;
  onSnoozeDose?: (id: string) => void;
  onOpenAddMedModal: () => void;
  onSyncWidget: () => void;
  isLiveConnected?: boolean;
}

const TIME_BUCKETS: TimeBucket[] = ['Morning', 'Afternoon', 'Evening', 'Bedtime'];

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({
  doses,
  adherencePct,
  takenCount,
  onTakeDose,
  onOpenSkipModal,
  onSnoozeDose,
  onOpenAddMedModal,
  onSyncWidget,
  isLiveConnected = false,
}) => {
  return (
    <View style={styles.sectionStack}>
      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <View style={screenStyles.syncRow}>
              <View
                style={[
                  screenStyles.statusDot,
                  { backgroundColor: isLiveConnected ? '#10B981' : '#64748B' },
                ]}
              />
              <Text style={styles.eyebrowText}>
                {isLiveConnected ? 'REAL-TIME CLOUD CONNECTED' : 'OFFLINE MEDICAL SCHEDULE'}
              </Text>
            </View>
            <Text style={styles.heroHeadline}>
              {takenCount} of {doses.length} Doses Taken
            </Text>
            <Text style={styles.heroSubtext}>
              Synced with Android Home-Screen Widget & Offline Alarms
            </Text>
          </View>
          <View style={styles.adherenceCircle}>
            <Text style={styles.adherencePctText}>{adherencePct}%</Text>
            <Text style={styles.adherenceLabel}>ADHERENCE</Text>
          </View>
        </View>

        <View style={styles.heroActionsRow}>
          <TouchableOpacity style={styles.primaryActionBtn} onPress={onOpenAddMedModal}>
            <Text style={styles.primaryActionBtnText}>+ Add Medicine</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryActionBtn} onPress={onSyncWidget}>
            <Text style={styles.secondaryActionBtnText}>Sync Home Widget</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Bucketed Doses */}
      {TIME_BUCKETS.map((bucket) => {
        const bucketDoses = doses.filter((d) => d.bucket === bucket);
        if (bucketDoses.length === 0) return null;

        const bucketDone = bucketDoses.filter((d) => d.status === 'taken').length;

        return (
          <View key={bucket} style={styles.bucketSection}>
            <View style={styles.bucketHeader}>
              <Text style={styles.bucketTitle}>{bucket.toUpperCase()} ROUTINE</Text>
              <Text style={styles.bucketCount}>
                {bucketDone}/{bucketDoses.length} Done
              </Text>
            </View>

            {bucketDoses.map((dose) => {
              const isTaken = dose.status === 'taken';
              const isSkipped = dose.status === 'skipped';

              return (
                <View
                  key={dose.id}
                  style={[
                    styles.doseCard,
                    isTaken && styles.doseCardTaken,
                    isSkipped && styles.doseCardSkipped,
                  ]}
                >
                  <View style={styles.doseInfo}>
                    <View style={styles.doseMetaRow}>
                      <View style={styles.timeBadge}>
                        <Text style={styles.timeBadgeText}>{dose.scheduledTime}</Text>
                      </View>
                      <View style={styles.mealBadge}>
                        <Text style={styles.mealBadgeText}>{dose.mealRelation}</Text>
                      </View>
                    </View>

                    <Text style={styles.medNameText}>
                      {dose.medicineName}{' '}
                      <Text style={styles.medStrengthText}>{dose.strength}</Text>
                    </Text>
                    <Text style={styles.genericNameText}>Active Salt: {dose.genericName}</Text>

                    {isTaken && <Text style={styles.statusTakenLabel}>✓ Confirmed Taken</Text>}
                    {isSkipped && (
                      <Text style={styles.statusSkippedLabel}>
                        ✕ Skipped ({dose.skipReason || 'Excused'})
                      </Text>
                    )}
                  </View>

                  <View style={styles.doseButtonsCol}>
                    {dose.status === 'pending' ? (
                      <>
                        <TouchableOpacity
                          style={styles.takeBtn}
                          onPress={() => onTakeDose(dose.id)}
                        >
                          <Text style={styles.takeBtnText}>✓ Take</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.skipBtn}
                          onPress={() => onOpenSkipModal(dose.id)}
                        >
                          <Text style={styles.skipBtnText}>Skip</Text>
                        </TouchableOpacity>
                        {onSnoozeDose && (
                          <TouchableOpacity
                            style={screenStyles.snoozeBtn}
                            onPress={() => onSnoozeDose(dose.id)}
                          >
                            <Text style={screenStyles.snoozeBtnText}>Snooze</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    ) : (
                      <TouchableOpacity
                        style={styles.undoBtn}
                        onPress={() => onTakeDose(dose.id)}
                      >
                        <Text style={styles.undoBtnText}>Undo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}

      {/* Bottom Floating Action Bar */}
      <TouchableOpacity
        style={screenStyles.floatingAddBtn}
        onPress={onOpenAddMedModal}
        activeOpacity={0.8}
      >
        <Text style={screenStyles.floatingAddText}>+ Add Medicine</Text>
      </TouchableOpacity>
    </View>
  );
};

const screenStyles = StyleSheet.create({
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  snoozeBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  snoozeBtnText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  floatingAddBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#14B8A6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingAddText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default ScheduleScreen;
