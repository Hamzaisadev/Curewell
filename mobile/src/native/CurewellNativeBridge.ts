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

export async function cancelNativeOfflineAlarm(alarmId: number): Promise<boolean> {
  if (Platform.OS !== 'android' || !CurewellNative?.cancelOfflineAlarm) return false;
  try {
    await CurewellNative.cancelOfflineAlarm(alarmId);
    return true;
  } catch (err) {
    console.warn('Cancel native alarm warning:', err);
    return false;
  }
}

export async function canScheduleExactAlarms(): Promise<boolean> {
  if (Platform.OS !== 'android' || !CurewellNative?.canScheduleExactAlarms) return true;
  try {
    return await CurewellNative.canScheduleExactAlarms();
  } catch (err) {
    console.warn('canScheduleExactAlarms warning:', err);
    return false;
  }
}

export async function getNativeActionTakenDoses(): Promise<string[]> {
  if (Platform.OS !== 'android' || !CurewellNative?.getNativeActionTakenDoses) return [];
  try {
    const result = await CurewellNative.getNativeActionTakenDoses();
    return Array.isArray(result) ? result : [];
  } catch (err) {
    console.warn('getNativeActionTakenDoses warning:', err);
    return [];
  }
}

export async function clearNativeActionTakenDoses(): Promise<void> {
  if (Platform.OS !== 'android' || !CurewellNative?.clearNativeActionTakenDoses) return;
  try {
    await CurewellNative.clearNativeActionTakenDoses();
  } catch (err) {
    console.warn('clearNativeActionTakenDoses warning:', err);
  }
}
