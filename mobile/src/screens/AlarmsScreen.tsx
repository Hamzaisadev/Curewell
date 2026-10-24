import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import {
  BellIcon,
  BellOffIcon,
  SmartphoneIcon,
  RefreshCwIcon,
  CheckIcon,
  SlidersIcon,
  ClockIcon,
} from '../components/icons';
import { areNotificationsEnabled, openNotificationSettings } from '../native/CurewellNativeBridge';
import { DoseSlot } from '../types';

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
  const { theme, isDark } = useTheme();

  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);
  const pendingDoses = doses.filter((d) => d.status === 'pending');
  const nextDose = pendingDoses[0];
  const takenCount = doses.filter((d) => d.status === 'taken').length;

  useEffect(() => {
    (async () => {
      try {
        const enabled = await areNotificationsEnabled();
        setNotifGranted(enabled);
      } catch {
        setNotifGranted(false);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      {/* SECTION 1: ANDROID HOME-SCREEN WIDGET */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.headerTitleRow}>
            <SmartphoneIcon size={18} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Android Home-Screen Widget
            </Text>
          </View>
        </View>

        <Text style={[styles.cardBodyText, { color: theme.textMuted }]}>
          Medfolio includes an Android native home-screen widget displaying real-time daily
          adherence and your next scheduled pill on your phone launcher.
        </Text>

        {/* Live Widget Preview Box */}
        <View
          style={[
            styles.widgetPreviewBox,
            { backgroundColor: theme.surfaceSunken, borderColor: theme.line },
          ]}
        >
          <View style={styles.widgetHeaderRow}>
            <Text style={[styles.widgetEyebrow, { color: theme.primary }]}>
              WIDGET LIVE PREVIEW
            </Text>
            <View
              style={[
                styles.widgetAdherenceBadge,
                { backgroundColor: theme.surfaceAccent, borderColor: theme.line },
              ]}
            >
              <Text style={[styles.widgetAdherenceText, { color: theme.primary }]}>
                {doses.length > 0 ? Math.round((takenCount / doses.length) * 100) : 0}% Done
              </Text>
            </View>
          </View>

          <Text style={[styles.widgetNextDoseText, { color: theme.textPrimary }]}>
            {nextDose
              ? `Next: ${nextDose.medicineName} ${nextDose.strength} at ${nextDose.scheduledTime}`
              : 'All scheduled doses completed today!'}
          </Text>

          <Text style={[styles.widgetSubText, { color: theme.textMuted }]}>
            {doses.length} registered medications on daily schedule
          </Text>
        </View>

        <View style={[styles.stepBox, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}>
          <Text style={[styles.stepText, { color: theme.textPrimary }]}>
            1. Long-press an empty space on your Android Home Screen.
          </Text>
          <Text style={[styles.stepText, { color: theme.textPrimary }]}>
            2. Tap "Widgets" and find "Medfolio".
          </Text>
          <Text style={[styles.stepText, { color: theme.textPrimary }]}>
            3. Drag the "Daily Schedule" widget onto your screen.
          </Text>
        </View>
      </View>

      {/* SECTION 2: NATIVE OFFLINE ALARM MANAGER */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={styles.headerTitleRow}>
              <BellIcon size={18} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                Offline Lock-Screen Alarms
              </Text>
            </View>
            <Text style={[styles.cardBodyText, { color: theme.textMuted, marginTop: 4 }]}>
              Uses Android native AlarmManager (RTC_WAKEUP) to ring alarms with zero internet
              dependency.
            </Text>
          </View>
          <Switch
            value={alarmsEnabled}
            onValueChange={onToggleAlarms}
            trackColor={{ false: theme.line, true: theme.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Live Alarm Stats */}
        <View style={styles.alarmStatsRow}>
          <View
            style={[
              styles.alarmStatBox,
              { backgroundColor: theme.surfaceSunken, borderColor: theme.line },
            ]}
          >
            <Text style={[styles.alarmStatNumber, { color: theme.textPrimary }]}>
              {doses.length}
            </Text>
            <Text style={[styles.alarmStatLabel, { color: theme.textMuted }]}>Armed Alarms</Text>
          </View>
          <View
            style={[
              styles.alarmStatBox,
              { backgroundColor: theme.surfaceSunken, borderColor: theme.line },
            ]}
          >
            <Text style={[styles.alarmStatNumber, { color: theme.textPrimary }]}>
              {pendingDoses.length}
            </Text>
            <Text style={[styles.alarmStatLabel, { color: theme.textMuted }]}>Pending Doses</Text>
          </View>
          <View
            style={[
              styles.alarmStatBox,
              { backgroundColor: theme.surfaceSunken, borderColor: theme.line },
            ]}
          >
            <Text
              style={[
                styles.alarmStatNumber,
                { color: alarmsEnabled ? theme.ok.text : theme.textMuted },
              ]}
            >
              {alarmsEnabled ? 'ACTIVE' : 'OFF'}
            </Text>
            <Text style={[styles.alarmStatLabel, { color: theme.textMuted }]}>Engine State</Text>
          </View>
        </View>

        {/* Notification Status Banner */}
        <View
          style={[
            styles.notifStatusBanner,
            {
              backgroundColor: notifGranted ? theme.ok.bg : theme.warn.bg,
              borderColor: notifGranted ? theme.ok.border : theme.warn.border,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.notifStatusTitle,
                { color: notifGranted ? theme.ok.text : theme.warn.text },
              ]}
            >
              {notifGranted
                ? 'System Notification Permission Active'
                : 'Notification Permission Needed'}
            </Text>
            <Text style={[styles.notifStatusSubtitle, { color: theme.textMuted }]}>
              {notifGranted
                ? 'Alarms will sound heads-up notifications with Take / Snooze actions.'
                : 'Android requires notification permission to post dose alerts.'}
            </Text>
          </View>
          {!notifGranted && (
            <TouchableOpacity
              style={[styles.openSettingsBtn, { backgroundColor: theme.warn.border }]}
              onPress={() => void openNotificationSettings()}
            >
              <Text style={[styles.openSettingsBtnText, { color: theme.warn.text }]}>Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SECTION 3: OFFLINE OUTBOX & CLOUD SYNC */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.headerTitleRow}>
            <RefreshCwIcon size={18} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Offline Outbox Synchronization
            </Text>
          </View>
        </View>

        <Text style={[styles.cardBodyText, { color: theme.textMuted }]}>
          All dose actions taken without internet are queued in local encrypted storage. Once online,
          updates flush automatically to the Medfolio Web App.
        </Text>

        <View
          style={[
            styles.syncStatusCard,
            { backgroundColor: theme.surfaceSunken, borderColor: theme.line },
          ]}
        >
          <View style={styles.syncStatusRow}>
            <View
              style={[
                styles.syncDot,
                { backgroundColor: isLiveConnected ? theme.ok.dot : theme.textSubtle },
              ]}
            />
            <Text style={[styles.syncStatusTitle, { color: theme.textPrimary }]}>
              {isLiveConnected ? 'Real-Time WebSocket Sync Active' : 'Disconnected / Offline'}
            </Text>
          </View>
          <Text style={[styles.syncStatusCount, { color: theme.textMuted }]}>
            {pendingSyncCount === 0
              ? 'Zero pending sync events in outbox queue.'
              : `${pendingSyncCount} events waiting to flush to cloud.`}
          </Text>

          <TouchableOpacity
            style={[styles.flushOutboxBtn, { backgroundColor: theme.primary }]}
            onPress={onManualSync}
            activeOpacity={0.85}
          >
            <RefreshCwIcon size={14} color="#FFFFFF" />
            <Text style={styles.flushOutboxBtnText}>Flush Outbox to Cloud Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardBodyText: {
    fontSize: 12,
    lineHeight: 17,
  },
  widgetPreviewBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  widgetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  widgetEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  widgetAdherenceBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  widgetAdherenceText: {
    fontSize: 10,
    fontWeight: '800',
  },
  widgetNextDoseText: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  widgetSubText: {
    fontSize: 11,
  },
  stepBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  stepText: {
    fontSize: 11,
    lineHeight: 16,
  },
  alarmStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  alarmStatBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  alarmStatNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  alarmStatLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  notifStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  notifStatusTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  notifStatusSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  openSettingsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openSettingsBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  syncStatusCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncStatusTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  syncStatusCount: {
    fontSize: 11,
  },
  flushOutboxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 2,
  },
  flushOutboxBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
