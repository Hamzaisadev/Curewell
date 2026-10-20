import { NativeModules, Platform } from 'react-native';

const { CurewellNative } = NativeModules;

export async function syncAndroidHomeWidget(params: {
  profileName: string;
  takenCount: number;
  totalCount: number;
  nextDoseText: string;
  bloodGroup?: string | null;
  allergies?: string | null;
}): Promise<void> {
  if (Platform.OS !== 'android' || !CurewellNative?.updateHomeWidget) return;

  const pct = params.totalCount > 0 ? Math.round((params.takenCount / params.totalCount) * 100) : 100;
  const adherenceSummary = `${params.takenCount}/${params.totalCount} Taken (${pct}%)`;
  const emergencyMeta = `Blood: ${params.bloodGroup || 'O+'} • Allergies: ${params.allergies || 'None'}`;

  try {
    await CurewellNative.updateHomeWidget(
      params.profileName,
      adherenceSummary,
      params.nextDoseText,
      emergencyMeta
    );
  } catch (err) {
    console.warn('Widget sync warning:', err);
  }
}

export async function triggerNativeDoseNotification(title: string, body: string): Promise<boolean> {
  if (Platform.OS !== 'android' || !CurewellNative?.triggerInstantDoseNotification) return false;
  try {
    await CurewellNative.triggerInstantDoseNotification(title, body);
    return true;
  } catch (err) {
    console.warn('Native notification warning:', err);
    return false;
  }
}

export async function scheduleNativeOfflineAlarm(
  alarmId: number,
  triggerAtMillis: number,
  title: string,
  body: string
): Promise<boolean> {
  if (Platform.OS !== 'android' || !CurewellNative?.scheduleOfflineAlarm) return false;
  try {
    await CurewellNative.scheduleOfflineAlarm(alarmId, triggerAtMillis, title, body);
    return true;
  } catch (err) {
    console.warn('Schedule native alarm warning:', err);
    return false;
  }
}
