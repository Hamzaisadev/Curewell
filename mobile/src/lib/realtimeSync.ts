import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export const CUREWELL_SYNC_CHANNEL = 'curewell-live-sync';
export const OUTBOX_STORAGE_KEY = 'curewell_rn_outbox_v4';

export type CurewellSyncEventPayload =
  | {
      eventId: string;
      source: 'web' | 'android';
      type: 'DOSE_STATUS_CHANGED';
      timestamp: string;
      profileId?: string;
      doseId: string;
      medicineId?: string;
      medicineName: string;
      strength?: string;
      scheduledDate: string;
      scheduledMinutes: number;
      status: 'taken' | 'skipped' | 'pending';
      takenAt?: string | null;
      skipReason?: string | null;
    }
  | {
      eventId: string;
      source: 'web' | 'android';
      type: 'MEDICINE_CREATED';
      timestamp: string;
      profileId?: string;
      medicine: {
        id: string;
        medicine_name: string;
        generic_name?: string | null;
        strength?: string | null;
        form?: string | null;
        dose_amount?: string | null;
        frequency_code?: string | null;
        frequency_raw?: string | null;
        with_food?: boolean | null;
        start_date: string;
        is_ongoing?: boolean | null;
        duration_days?: number | null;
        scheduledMinutes?: number;
        scheduledTime?: string;
        bucket?: string;
      };
    };

export interface OutboxMutation {
  id: string;
  createdAt: string;
  event: CurewellSyncEventPayload;
}

type SyncListener = (event: CurewellSyncEventPayload) => void;
type ConnectionListener = (connected: boolean, pendingOutboxCount: number) => void;

const eventListeners = new Set<SyncListener>();
const statusListeners = new Set<ConnectionListener>();
const processedEventIds = new Set<string>();

let activeChannel: RealtimeChannel | null = null;
let isChannelSubscribed = false;
let isFlushing = false;

function makeUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function rememberEventId(id: string): boolean {
  if (!id) return false;
  if (processedEventIds.has(id)) return true;
  processedEventIds.add(id);
  if (processedEventIds.size > 250) {
    const first = processedEventIds.values().next().value;
    if (first) processedEventIds.delete(first);
  }
  return false;
}

export async function getOutboxQueue(): Promise<OutboxMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveOutboxQueue(queue: OutboxMutation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(queue));
    notifyStatusListeners(queue.length);
  } catch {
    // ignore storage error
  }
}

function notifyStatusListeners(outboxCount: number): void {
  for (const cb of statusListeners) {
    try {
      cb(isChannelSubscribed, outboxCount);
    } catch {
      // ignore
    }
  }
}

/**
 * Initializes the persistent Supabase Realtime WebSocket channel (`curewell-live-sync`)
 * listening to both low-latency WebSocket `broadcast` packets and `postgres_changes`
 * on `public.medicines` and `public.doses`.
 */
export function ensureMobileRealtimeChannel(): RealtimeChannel {
  if (activeChannel) return activeChannel;

  const channel = supabase.channel(CUREWELL_SYNC_CHANNEL, {
    config: {
      broadcast: { self: false, ack: true },
    },
  });

  // 1. Sub-50ms WebSocket Broadcast listener from Web App
  channel.on('broadcast', { event: 'curewell_sync_event' }, ({ payload }) => {
    const event = payload as CurewellSyncEventPayload | undefined;
    if (!event || !event.eventId) return;
    if (rememberEventId(event.eventId)) return;

    for (const cb of eventListeners) {
      try {
        cb(event);
      } catch (e) {
        console.warn('Mobile realtime listener error:', e);
      }
    }
  });

  // 2. Postgres Logical Replication listener (`public.medicines`)
  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'medicines' },
    (change) => {
      const row = change.new as Record<string, any> | undefined;
      if (!row || !row.id || !row.medicine_name) return;
      const syntheticId = `pg-med-${row.id}`;
      if (rememberEventId(syntheticId)) return;

      const event: CurewellSyncEventPayload = {
        eventId: syntheticId,
        source: 'web',
        type: 'MEDICINE_CREATED',
        timestamp: new Date().toISOString(),
        profileId: row.profile_id,
        medicine: {
          id: String(row.id),
          medicine_name: String(row.medicine_name),
          generic_name: row.generic_name ?? 'Prescribed Regimen',
          strength: row.strength ?? row.dose_amount ?? '500mg',
          form: row.form ?? 'Tablet',
          dose_amount: row.dose_amount ?? '1 tab',
          frequency_code: row.frequency_code ?? 'OD',
          frequency_raw: row.frequency_raw ?? 'Once daily',
          with_food: row.with_food ?? true,
          start_date: row.start_date ?? new Date().toISOString().slice(0, 10),
          is_ongoing: row.is_ongoing ?? true,
          duration_days: row.duration_days ?? 30,
        },
      };

      for (const cb of eventListeners) {
        try {
          cb(event);
        } catch (e) {
          console.warn('Postgres medicine listener error:', e);
        }
      }
    }
  );

  // 3. Postgres Logical Replication listener (`public.doses`)
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'doses' },
    (change) => {
      const row = (change.new || change.old) as Record<string, any> | undefined;
      if (!row || !row.id) return;
      const syntheticId = `pg-dose-${row.id}-${row.status}-${row.updated_at || Date.now()}`;
      if (rememberEventId(syntheticId)) return;

      const event: CurewellSyncEventPayload = {
        eventId: syntheticId,
        source: 'web',
        type: 'DOSE_STATUS_CHANGED',
        timestamp: new Date().toISOString(),
        profileId: row.profile_id,
        doseId: String(row.id),
        medicineId: row.medicine_id ? String(row.medicine_id) : undefined,
        medicineName: row.medicine_name || 'Scheduled Dose',
        scheduledDate: row.scheduled_date || new Date().toISOString().slice(0, 10),
        scheduledMinutes: typeof row.scheduled_minutes === 'number' ? row.scheduled_minutes : 480,
        status: (row.status as 'taken' | 'skipped' | 'pending') || 'pending',
        takenAt: row.taken_at,
        skipReason: row.skipped_reason,
      };

      for (const cb of eventListeners) {
        try {
          cb(event);
        } catch (e) {
          console.warn('Postgres dose listener error:', e);
        }
      }
    }
  );

  channel.subscribe(async (status) => {
    isChannelSubscribed = status === 'SUBSCRIBED';
    const queue = await getOutboxQueue();
    notifyStatusListeners(queue.length);
    if (isChannelSubscribed && queue.length > 0) {
      void flushOfflineOutbox();
    }
  });

  activeChannel = channel;
  return channel;
}

export type CurewellSyncEventInput =
  | {
      type: 'DOSE_STATUS_CHANGED';
      profileId?: string;
      doseId: string;
      medicineId?: string;
      medicineName: string;
      strength?: string;
      scheduledDate: string;
      scheduledMinutes: number;
      status: 'taken' | 'skipped' | 'pending';
      takenAt?: string | null;
      skipReason?: string | null;
    }
  | {
      type: 'MEDICINE_CREATED';
      profileId?: string;
      medicine: {
        id: string;
        medicine_name: string;
        generic_name?: string | null;
        strength?: string | null;
        form?: string | null;
        dose_amount?: string | null;
        frequency_code?: string | null;
        frequency_raw?: string | null;
        with_food?: boolean | null;
        start_date: string;
        is_ongoing?: boolean | null;
        duration_days?: number | null;
        scheduledMinutes?: number;
        scheduledTime?: string;
        bucket?: string;
      };
    };

/**
 * Pushes a mutation to the persistent AsyncStorage Outbox (`curewell_rn_outbox_v4`)
 * and immediately attempts to flush it over the Supabase WebSocket & REST API.
 * If the phone is offline (Airplane Mode), the mutation stays queued in AsyncStorage
 * and automatically syncs to the Web App the moment connectivity returns.
 */
export async function enqueueMobileSyncEvent(
  payload: CurewellSyncEventInput
): Promise<void> {
  const fullEvent = {
    ...payload,
    eventId: makeUuid(),
    source: 'android' as const,
    timestamp: new Date().toISOString(),
  } as CurewellSyncEventPayload;

  rememberEventId(fullEvent.eventId);

  const currentQueue = await getOutboxQueue();
  const nextQueue: OutboxMutation[] = [
    ...currentQueue,
    {
      id: fullEvent.eventId,
      createdAt: fullEvent.timestamp,
      event: fullEvent,
    },
  ];
  await saveOutboxQueue(nextQueue);

  await flushOfflineOutbox();
}

/**
 * Drains the offline AsyncStorage Outbox queue in FIFO order:
 * 1. Broadcasts each event over the live Supabase WebSocket channel (`curewell-live-sync`)
 * 2. Persists the change to Supabase PostgreSQL (`doses` / `medicines`) if authenticated
 * 3. Removes successfully delivered items from `curewell_rn_outbox_v4`
 */
export async function flushOfflineOutbox(): Promise<number> {
  if (isFlushing) return 0;
  isFlushing = true;

  let flushedCount = 0;
  try {
    const queue = await getOutboxQueue();
    if (queue.length === 0) {
      isFlushing = false;
      return 0;
    }

    const channel = ensureMobileRealtimeChannel();
    const remaining: OutboxMutation[] = [];

    for (const item of queue) {
      let delivered = false;

      // 1. Send over Supabase Realtime WebSocket Broadcast (best-effort notification to active peers)
      if (isChannelSubscribed) {
        try {
          await channel.send({
            type: 'broadcast',
            event: 'curewell_sync_event',
            payload: item.event,
          });
        } catch {
          // ignore broadcast failure; database persistence is authoritative
        }
      }

      // 2. Persist to Supabase PostgreSQL tables - delivered is ONLY true when DB write succeeds
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        if (item.event.type === 'DOSE_STATUS_CHANGED') {
          const e = item.event;
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            e.doseId
          );

          if (isUuid) {
            const { error } = await supabase
              .from('doses')
              .update({
                status: e.status,
                taken_at: e.status === 'taken' ? e.takenAt || new Date().toISOString() : null,
                skipped_reason: e.status === 'skipped' ? e.skipReason || null : null,
              })
              .eq('id', e.doseId);
            if (!error) delivered = true;
          } else {
            // doseId is not a valid UUID (e.g. dose-1729...)
            // Search or update by medicineName & scheduledMinutes, or record it cleanly
            let targetMedId =
              e.medicineId &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                e.medicineId
              )
                ? e.medicineId
                : null;

            if (!targetMedId && e.medicineName) {
              let medQuery = supabase
                .from('medicines')
                .select('id')
                .ilike('medicine_name', e.medicineName.trim());
              if (
                e.profileId &&
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                  e.profileId
                )
              ) {
                medQuery = medQuery.eq('profile_id', e.profileId);
              } else if (userId) {
                medQuery = medQuery.eq('user_id', userId);
              }
              const { data: medData } = await medQuery.limit(1).maybeSingle();
              if (medData?.id) {
                targetMedId = medData.id;
              }
            }

            if (targetMedId) {
              // Try updating existing dose row matching targetMedId, scheduledDate, scheduledMinutes
              let doseQuery = supabase
                .from('doses')
                .select('id')
                .eq('medicine_id', targetMedId)
                .eq('scheduled_date', e.scheduledDate)
                .eq('scheduled_minutes', e.scheduledMinutes);

              if (
                e.profileId &&
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                  e.profileId
                )
              ) {
                doseQuery = doseQuery.eq('profile_id', e.profileId);
              }

              const { data: existingDose } = await doseQuery.limit(1).maybeSingle();

              if (existingDose?.id) {
                const { error: updateErr } = await supabase
                  .from('doses')
                  .update({
                    status: e.status,
                    taken_at: e.status === 'taken' ? e.takenAt || new Date().toISOString() : null,
                    skipped_reason: e.status === 'skipped' ? e.skipReason || null : null,
                  })
                  .eq('id', existingDose.id);
                if (!updateErr) delivered = true;
              } else if (userId) {
                // If no dose row exists for today yet, insert it cleanly
                const targetProfileId =
                  e.profileId &&
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                    e.profileId
                  )
                    ? e.profileId
                    : userId;

                const { error: insertErr } = await supabase.from('doses').insert({
                  user_id: userId,
                  profile_id: targetProfileId,
                  medicine_id: targetMedId,
                  scheduled_date: e.scheduledDate,
                  scheduled_minutes: e.scheduledMinutes,
                  status: e.status,
                  taken_at: e.status === 'taken' ? e.takenAt || new Date().toISOString() : null,
                  skipped_reason: e.status === 'skipped' ? e.skipReason || null : null,
                });
                if (!insertErr) delivered = true;
              }
            }
          }
        } else if (item.event.type === 'MEDICINE_CREATED') {
          if (userId) {
            const m = item.event.medicine;
            const targetProfileId =
              item.event.profileId &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                item.event.profileId
              )
                ? item.event.profileId
                : userId;

            const { error } = await supabase.from('medicines').insert({
              user_id: userId,
              profile_id: targetProfileId,
              medicine_name: m.medicine_name,
              generic_name: m.generic_name,
              strength: m.strength,
              form: m.form || 'Tablet',
              dose_amount: m.dose_amount || '1 tab',
              frequency_code: m.frequency_code || 'OD',
              frequency_raw: m.frequency_raw || 'Once daily',
              with_food: m.with_food ?? true,
              start_date: m.start_date,
              is_ongoing: m.is_ongoing ?? true,
              duration_days: m.duration_days ?? 30,
            });
            if (!error) delivered = true;
          }
        }
      } catch (err) {
        console.warn('DB sync error in flushOfflineOutbox:', err);
      }

      if (delivered) {
        flushedCount++;
      } else {
        remaining.push(item);
      }
    }

    await saveOutboxQueue(remaining);
  } finally {
    isFlushing = false;
  }

  return flushedCount;
}

export function subscribeMobileRealtimeEvents(
  onEvent: SyncListener,
  onStatus?: ConnectionListener
): () => void {
  ensureMobileRealtimeChannel();
  eventListeners.add(onEvent);
  if (onStatus) {
    statusListeners.add(onStatus);
    void getOutboxQueue().then((q) => onStatus(isChannelSubscribed, q.length));
  }

  // Periodic 8-second heartbeat to flush any offline outbox mutations automatically
  const interval = setInterval(() => {
    void flushOfflineOutbox();
  }, 8000);

  return () => {
    eventListeners.delete(onEvent);
    if (onStatus) statusListeners.delete(onStatus);
    clearInterval(interval);
  };
}
