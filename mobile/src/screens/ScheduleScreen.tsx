import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { useTheme } from '../theme';
import {
  PillIcon,
  SunriseIcon,
  SunIcon,
  SunsetIcon,
  MoonIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  PlusIcon,
  RefreshCwIcon,
  SparklesIcon,
} from '../components/icons';
import { DoseSlot, TimeBucket } from '../types';

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

const TIME_BUCKETS: { bucket: TimeBucket; icon: React.FC<any>; label: string }[] = [
  { bucket: 'Morning', icon: SunriseIcon, label: 'Morning Slot (06:00 - 11:59)' },
  { bucket: 'Afternoon', icon: SunIcon, label: 'Afternoon Slot (12:00 - 16:59)' },
  { bucket: 'Evening', icon: SunsetIcon, label: 'Evening Slot (17:00 - 20:59)' },
  { bucket: 'Bedtime', icon: MoonIcon, label: 'Bedtime Slot (21:00 - 05:59)' },
];

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
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* HERO ADHERENCE CARD */}
      <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.syncRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isLiveConnected ? theme.ok.dot : theme.textSubtle },
                ]}
              />
              <Text style={[styles.eyebrowText, { color: theme.primary }]}>
                {isLiveConnected ? 'REAL-TIME CLOUD CONNECTED' : 'OFFLINE REGIMEN VAULT'}
              </Text>
            </View>

            <Text style={[styles.heroHeadline, { color: theme.textPrimary }]}>
              {doses.length === 0
                ? 'No Scheduled Doses'
                : `${takenCount} of ${doses.length} Doses Taken`}
            </Text>
            <Text style={[styles.heroSubtext, { color: theme.textMuted }]}>
              {doses.length === 0
                ? 'Your medication regimen for today is currently empty.'
                : 'Synced with Android Home Widget & Offline Lock-Screen Alarms'}
            </Text>
          </View>

          {/* Adherence Percentage Badge */}
          <View
            style={[
              styles.adherenceBadge,
              { backgroundColor: theme.surfaceAccent, borderColor: theme.line },
            ]}
          >
            <Text style={[styles.adherencePctText, { color: theme.primary }]}>
              {doses.length === 0 ? '0%' : `${adherencePct}%`}
            </Text>
            <Text style={[styles.adherenceLabel, { color: theme.textMuted }]}>ADHERENCE</Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.heroActionsRow}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
            onPress={onOpenAddMedModal}
            activeOpacity={0.8}
          >
            <PlusIcon size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.primaryActionBtnText}>Add Medicine</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryActionBtn,
              { backgroundColor: theme.surfaceSunken, borderColor: theme.line },
            ]}
            onPress={onSyncWidget}
            activeOpacity={0.7}
          >
            <RefreshCwIcon size={14} color={theme.textPrimary} />
            <Text style={[styles.secondaryActionBtnText, { color: theme.textPrimary }]}>
              Sync Widget
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* HONEST EMPTY STATE (ADR 0004) */}
      {doses.length === 0 ? (
        <View
          style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.line }]}
        >
          <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceAccent }]}>
            <PillIcon size={28} color={theme.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            No Scheduled Medications
          </Text>
          <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
            Medfolio strictly prohibits synthetic placeholder data (ADR 0004). You have zero active
            prescriptions scheduled for today.
          </Text>
          <TouchableOpacity
            style={[styles.emptyCtaBtn, { backgroundColor: theme.primary }]}
            onPress={onOpenAddMedModal}
            activeOpacity={0.85}
          >
            <PlusIcon size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.emptyCtaBtnText}>Add Prescribed Medicine</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* TIME-OF-DAY BUCKET SECTIONS */
        TIME_BUCKETS.map(({ bucket, icon: BucketIcon, label }) => {
          const bucketDoses = doses.filter((d) => d.bucket === bucket);
          if (bucketDoses.length === 0) return null;

          const bucketDone = bucketDoses.filter((d) => d.status === 'taken').length;
          const slotTheme =
            bucket === 'Morning'
              ? theme.slot.morning
              : bucket === 'Afternoon'
              ? theme.slot.afternoon
              : bucket === 'Evening'
              ? theme.slot.evening
              : theme.slot.bedtime;

          return (
            <View key={bucket} style={styles.bucketSection}>
              {/* Slot Header */}
              <View style={[styles.bucketHeader, { backgroundColor: slotTheme.bg, borderColor: slotTheme.border }]}>
                <View style={styles.bucketTitleRow}>
                  <BucketIcon size={18} color={slotTheme.text} strokeWidth={2.2} />
                  <Text style={[styles.bucketTitle, { color: slotTheme.text }]}>
                    {bucket.toUpperCase()} ROUTINE
                  </Text>
                </View>
                <Text style={[styles.bucketCount, { color: slotTheme.text }]}>
                  {bucketDone}/{bucketDoses.length} Taken
                </Text>
              </View>

              {/* Doses in this slot */}
              {bucketDoses.map((dose) => {
                const isTaken = dose.status === 'taken';
                const isSkipped = dose.status === 'skipped';

                return (
                  <View
                    key={dose.id}
                    style={[
                      styles.doseCard,
                      {
                        backgroundColor: isTaken
                          ? theme.ok.bg
                          : isSkipped
                          ? theme.surfaceSunken
                          : theme.surface,
                        borderColor: isTaken
                          ? theme.ok.border
                          : isSkipped
                          ? theme.line
                          : theme.line,
                      },
                    ]}
                  >
                    <View style={styles.doseInfo}>
                      {/* Meta badges: Time & Food relation */}
                      <View style={styles.doseMetaRow}>
                        <View style={[styles.timeBadge, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}>
                          <ClockIcon size={12} color={theme.textMuted} />
                          <Text style={[styles.timeBadgeText, { color: theme.textPrimary }]}>
                            {dose.scheduledTime}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.mealBadge,
                            {
                              backgroundColor:
                                dose.mealRelation === 'Before Food'
                                  ? theme.warn.bg
                                  : theme.surfaceSunken,
                              borderColor:
                                dose.mealRelation === 'Before Food'
                                  ? theme.warn.border
                                  : theme.line,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.mealBadgeText,
                              {
                                color:
                                  dose.mealRelation === 'Before Food'
                                    ? theme.warn.text
                                    : theme.textMuted,
                              },
                            ]}
                          >
                            {dose.mealRelation}
                          </Text>
                        </View>
                      </View>

                      {/* Medicine name & strength */}
                      <Text style={[styles.medNameText, { color: theme.textPrimary }]}>
                        {dose.medicineName}{' '}
                        <Text style={[styles.medStrengthText, { color: theme.primary }]}>
                          {dose.strength}
                        </Text>
                      </Text>

                      {/* Active Salt (Mandatory clinical transparency) */}
                      <Text style={[styles.genericNameText, { color: theme.textMuted }]}>
                        Active Salt: {dose.genericName}
                      </Text>

                      {/* Clinical status indicator */}
                      {isTaken && (
                        <View style={styles.statusTakenRow}>
                          <CheckIcon size={14} color={theme.ok.text} strokeWidth={2.5} />
                          <Text style={[styles.statusTakenLabel, { color: theme.ok.text }]}>
                            Confirmed Taken
                          </Text>
                        </View>
                      )}
                      {isSkipped && (
                        <View style={styles.statusSkippedRow}>
                          <XIcon size={14} color={theme.textMuted} strokeWidth={2.5} />
                          <Text style={[styles.statusSkippedLabel, { color: theme.textMuted }]}>
                            Skipped ({dose.skipReason || 'Excused'})
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Action Buttons Column */}
                    <View style={styles.doseButtonsCol}>
                      {dose.status === 'pending' ? (
                        <>
                          <TouchableOpacity
                            style={[styles.takeBtn, { backgroundColor: theme.primary }]}
                            onPress={() => onTakeDose(dose.id)}
                            activeOpacity={0.8}
                          >
                            <CheckIcon size={14} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.takeBtnText}>Take</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.skipBtn,
                              { backgroundColor: theme.surfaceSunken, borderColor: theme.line },
                            ]}
                            onPress={() => onOpenSkipModal(dose.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.skipBtnText, { color: theme.textMuted }]}>
                              Skip
                            </Text>
                          </TouchableOpacity>

                          {onSnoozeDose && (
                            <TouchableOpacity
                              style={[styles.snoozeBtn, { borderColor: theme.line }]}
                              onPress={() => onSnoozeDose(dose.id)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.snoozeBtnText, { color: theme.textSubtle }]}>
                                +15m
                              </Text>
                            </TouchableOpacity>
                          )}
                        </>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.undoBtn,
                            { backgroundColor: theme.surfaceSunken, borderColor: theme.line },
                          ]}
                          onPress={() => onTakeDose(dose.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.undoBtnText, { color: theme.textMuted }]}>
                            Undo
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
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
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  heroHeadline: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  heroSubtext: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  adherenceBadge: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adherencePctText: {
    fontSize: 22,
    fontWeight: '900',
  },
  adherenceLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyBody: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  emptyCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  bucketSection: {
    gap: 10,
  },
  bucketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  bucketTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bucketTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bucketCount: {
    fontSize: 11,
    fontWeight: '800',
  },
  doseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  doseInfo: {
    flex: 1,
    gap: 5,
  },
  doseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mealBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  mealBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  medNameText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  medStrengthText: {
    fontSize: 14,
    fontWeight: '800',
  },
  genericNameText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTakenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusTakenLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusSkippedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusSkippedLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  doseButtonsCol: {
    gap: 6,
    minWidth: 84,
  },
  takeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  takeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  skipBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  snoozeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  snoozeBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  undoBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  undoBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
