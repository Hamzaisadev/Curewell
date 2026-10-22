import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { DoseSlot } from '../types';
import { styles } from '../styles/commonStyles';

export interface AlarmsScreenProps {
  alarmsEnabled: boolean;
  onToggleAlarms: (val: boolean) => void;
  onManualSync: () => void;
  isLiveConnected: boolean;
  pendingSyncCount: number;
  doses: DoseSlot[];
}

export const AlarmsScreen: React.FC<AlarmsScreenProps> = ({
  alarmsEnabled,
  onToggleAlarms,
  onManualSync,
  isLiveConnected,
  pendingSyncCount,
  doses,
}) => {
  const pendingDoses = doses.filter((d) => d.status === 'pending');
  const nextDose = pendingDoses[0];
  const takenCount = doses.filter((d) => d.status === 'taken').length;

  return (
    <View style={styles.sectionStack}>
      {/* Android Home-Screen Widget Guide & Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📱 Android Home-Screen Widget</Text>
        <Text style={styles.cardBodyText}>
          Curewell includes a native Android Home-Screen Widget that displays your real-time dose adherence and next scheduled pill directly on your phone launcher.
        </Text>

        <View style={screenStyles.widgetPreviewBox}>
          <View style={styles.rowBetween}>
            <Text style={styles.eyebrowText}>WIDGET LIVE PREVIEW</Text>
            <View style={screenStyles.widgetAdherenceBadge}>
              <Text style={screenStyles.widgetAdherenceText}>
                {doses.length > 0 ? Math.round((takenCount / doses.length) * 100) : 0}% Done
              </Text>
            </View>
          </View>
          <Text style={screenStyles.widgetNextDoseText}>
            {nextDose
              ? `Next: ${nextDose.medicineName} ${nextDose.strength} at ${nextDose.scheduledTime}`
              : 'All scheduled doses completed today!'}
          </Text>
          <Text style={screenStyles.widgetSubText}>
            {doses.length} registered medications on daily schedule
          </Text>
        </View>

        <View style={styles.stepBox}>
          <Text style={styles.stepText}>1. Long-press an empty space on your Android Home Screen.</Text>
          <Text style={styles.stepText}>2. Tap "Widgets" and find "Curewell".</Text>
          <Text style={styles.stepText}>
            3. Drag the "Curewell Daily Schedule" widget onto your home screen.
          </Text>
        </View>
      </View>

      {/* Native Offline Lockscreen Alarms Toggle Card */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.cardTitle}>⏰ Native Offline Lock-Screen Alarms</Text>
            <Text style={styles.cardBodyText}>
              Uses Android native AlarmManager (RTC_WAKEUP) to ring alarms and display heads-up lockscreen alerts with zero internet requirement.
            </Text>
          </View>
          <Switch
            value={alarmsEnabled}
            onValueChange={onToggleAlarms}
            trackColor={{ false: '#334155', true: '#0D9488' }}
            thumbColor={alarmsEnabled ? '#2DD4BF' : '#94A3B8'}
          />
        </View>

        <View style={screenStyles.alarmStatsRow}>
          <View style={screenStyles.alarmStatBox}>
            <Text style={screenStyles.alarmStatNumber}>{doses.length}</Text>
            <Text style={screenStyles.alarmStatLabel}>Armed Alarms</Text>
          </View>
          <View style={screenStyles.alarmStatBox}>
            <Text style={screenStyles.alarmStatNumber}>{pendingDoses.length}</Text>
            <Text style={screenStyles.alarmStatLabel}>Pending Doses</Text>
          </View>
          <View style={screenStyles.alarmStatBox}>
            <Text style={screenStyles.alarmStatNumber}>
              {alarmsEnabled ? 'ACTIVE' : 'OFF'}
            </Text>
            <Text style={screenStyles.alarmStatLabel}>Alarm Engine</Text>
          </View>
        </View>

        <View
          style={[
            styles.stagingBanner,
            alarmsEnabled ? styles.stagingOk : styles.stagingWarn,
          ]}
        >
          <Text style={styles.stagingText}>
            {alarmsEnabled
              ? `✓ ${doses.length} alarms scheduled with Android RTC_WAKEUP engine`
              : '⚠️ Alarms are currently disabled. Enable to receive dose reminders.'}
          </Text>
        </View>
      </View>

      {/* Cloud & Real-time WebSocket Sync Card */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>☁️ Cloud & Real-time WebSocket Sync</Text>
          <View style={screenStyles.liveStatusRow}>
            <View
              style={[
                screenStyles.liveDot,
                { backgroundColor: isLiveConnected ? '#10B981' : '#F59E0B' },
              ]}
            />
            <Text
              style={[
                screenStyles.liveStatusText,
                { color: isLiveConnected ? '#10B981' : '#F59E0B' },
              ]}
            >
              {isLiveConnected ? 'Live Cloud Synced' : 'Offline Mode'}
            </Text>
          </View>
        </View>

        <Text style={styles.cardBodyText}>
          {isLiveConnected
            ? 'Connected via live bi-directional WebSocket to Curewell Cloud. Local changes sync instantaneously.'
            : 'Running offline with local storage. Changes are automatically queued and synced when connection returns.'}
        </Text>

        <View style={screenStyles.syncDetailsCard}>
          <View style={styles.rowBetween}>
            <Text style={screenStyles.syncDetailLabel}>Offline Queue Backlog:</Text>
            <Text
              style={[
                screenStyles.syncDetailValue,
                pendingSyncCount > 0 && { color: '#F59E0B' },
              ]}
            >
              {pendingSyncCount} events pending
            </Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={screenStyles.syncDetailLabel}>Local Storage Cache:</Text>
            <Text style={screenStyles.syncDetailValue}>Device Local Storage Cache (AsyncStorage)</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={onManualSync}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryActionBtnText}>
            {pendingSyncCount > 0
              ? `Force Cloud Sync Now (${pendingSyncCount} Pending)`
              : 'Force Cloud Sync Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const screenStyles = StyleSheet.create({
  widgetPreviewBox: {
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  widgetAdherenceBadge: {
    backgroundColor: '#0D948833',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0D9488',
  },
  widgetAdherenceText: {
    color: '#2DD4BF',
    fontSize: 11,
    fontWeight: '800',
  },
  widgetNextDoseText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  widgetSubText: {
    color: '#64748B',
    fontSize: 11,
  },
  alarmStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  alarmStatBox: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  alarmStatNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  alarmStatLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  liveStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  syncDetailsCard: {
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 6,
  },
  syncDetailLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  syncDetailValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default AlarmsScreen;
