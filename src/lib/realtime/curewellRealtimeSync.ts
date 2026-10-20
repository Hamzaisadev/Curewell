/**
 * Bi-Directional Supabase Realtime WebSocket Synchronization Engine (Web Side)
 *
 * Bridges the Curewell Web Application and the standalone React Native Android
 * Companion App in real time (<50ms latency) with zero browser refresh:
 *
 * 1. Subscribes to `postgres_changes` on `public.medicines` and `public.doses`
 * 2. Subscribes to low-latency WebSocket `broadcast` events on channel `curewell-live-sync`
 * 3. Mirrors incoming mobile mutations into localStore (`curewell_local_doses` / `curewell_local_medicines`)
 *    and notifies mounted React views (`UnifiedMedicineHubPage`, `MedicationScheduleCard`) immediately.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { getLocalItems, setLocalItems, newId } from '../db/localStore';
import type { Medicine } from '../db/medicines';
import type { Dose } from '../db/doses';

export const CUREWELL_SYNC_CHANNEL = 'curewell-live-sync';

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
    }
  | {
      eventId: string;
      source: 'web' | 'android';
      type: 'MEDICINE_UPDATED';
      timestamp: string;
      profileId?: string;
      medicineId: string;
      medicineName?: string;
      discontinuedAt?: string | null;
    };

export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
export type CurewellSyncEventInput = DistributiveOmit<
  CurewellSyncEventPayload,
  'eventId' | 'timestamp' | 'source'
>;

type SyncListener = (event: CurewellSyncEventPayload) => void;

const listeners = new Set<SyncListener>();
const processedEventIds = new Set<string>();
let activeChannel: RealtimeChannel | null = null;
let channelReady = false;

function rememberEventId(id: string): boolean {
  if (!id) return false;
  if (processedEventIds.has(id)) return true;
  processedEventIds.add(id);
  if (processedEventIds.size > 300) {
    const first = processedEventIds.values().next().value;
    if (first) processedEventIds.delete(first);
  }
  return false;
}

/**
 * Applies an incoming mobile WebSocket event directly to the web `localStore`
 * so `getDaySchedule` / `listDosesForDate` / `listMedicines` immediately reflect
 * the mobile mutation even before or without a full remote Postgres round-trip.
 */
function applyIncomingEventToLocalStore(event: CurewellSyncEventPayload): void {
  if (event.type === 'DOSE_STATUS_CHANGED') {
    const doses = getLocalItems<Dose>('doses');
    const medicines = getLocalItems<Medicine>('medicines');
    const targetMedNameLower = (event.medicineName || '').trim().toLowerCase();

    // Find matching medicine by ID or by name
    const matchingMed = medicines.find(
      (m) =>
        (event.medicineId && m.id === event.medicineId) ||
        (targetMedNameLower && (m.medicine_name || '').trim().toLowerCase() === targetMedNameLower)
    );

    let matched = false;
    const updatedDoses = doses.map((d) => {
      const idMatches = d.id === event.doseId;
      const medAndSlotMatches =
        matchingMed &&
        d.medicine_id === matchingMed.id &&
        d.scheduled_date === event.scheduledDate &&
        Math.abs(d.scheduled_minutes - event.scheduledMinutes) <= 120;

      if (idMatches || medAndSlotMatches) {
        matched = true;
        return {
          ...d,
          status: event.status,
          taken_at:
            event.status === 'taken' ? event.takenAt || new Date().toISOString() : null,
          skipped_reason: event.status === 'skipped' ? event.skipReason || null : null,
          updated_at: new Date().toISOString(),
        };
      }
      return d;
    });

    if (matched) {
      setLocalItems('doses', updatedDoses);
    } else if (matchingMed) {
      // Create the dose slot if it didn't exist locally yet
      const nowIso = new Date().toISOString();
      const newDose: Dose = {
        id: event.doseId.startsWith('dose-') ? newId() : event.doseId,
        user_id: matchingMed.user_id,
        profile_id: event.profileId || matchingMed.profile_id,
        medicine_id: matchingMed.id,
        scheduled_date: event.scheduledDate,
        scheduled_minutes: event.scheduledMinutes,
        status: event.status,
        taken_at: event.status === 'taken' ? event.takenAt || nowIso : null,
        skipped_reason: event.status === 'skipped' ? event.skipReason || null : null,
        snoozed_until: null,
        created_at: nowIso,
        updated_at: nowIso,
      };
      setLocalItems('doses', [newDose, ...doses]);
    }
  } else if (event.type === 'MEDICINE_CREATED') {
    const medicines = getLocalItems<Medicine>('medicines');
    const exists = medicines.some(
      (m) =>
        m.id === event.medicine.id ||
        ((m.medicine_name || '').trim().toLowerCase() ===
          event.medicine.medicine_name.trim().toLowerCase() &&
          !m.discontinued_at)
    );
    if (!exists) {
      const nowIso = new Date().toISOString();
      const medId = event.medicine.id.startsWith('dose-') || event.medicine.id.startsWith('med-')
        ? newId()
        : event.medicine.id;
      const fallbackProfileId =
        event.profileId || medicines[0]?.profile_id || 'self-profile';
      const fallbackUserId = medicines[0]?.user_id || fallbackProfileId;

      const newMed: Medicine = {
        id: medId,
        user_id: fallbackUserId,
        profile_id: fallbackProfileId,
        visit_id: null,
        medicine_name: event.medicine.medicine_name,
        strength: event.medicine.strength || '500mg',
        form: event.medicine.form || 'Tablet',
        dose_amount: event.medicine.dose_amount || '1 tab',
        frequency_code: (event.medicine.frequency_code as Medicine['frequency_code']) || 'OD',
        frequency_raw: event.medicine.frequency_raw || 'Once daily',
        with_food: event.medicine.with_food ?? true,
        start_date: event.medicine.start_date,
        end_date: null,
        duration_raw: null,
        duration_days: event.medicine.duration_days ?? 30,
        is_ongoing: event.medicine.is_ongoing ?? true,
        is_otc: false,
        discontinued_at: null,
        instructions: null,
        unit_cost: null,
        currency: 'PKR',
        created_at: nowIso,
        updated_at: nowIso,
      };
      setLocalItems('medicines', [newMed, ...medicines]);

      // Also create today's scheduled dose slot in localStore so it renders immediately
      const doses = getLocalItems<Dose>('doses');
      const newDose: Dose = {
        id: newId(),
        user_id: fallbackUserId,
        profile_id: fallbackProfileId,
        medicine_id: medId,
        scheduled_date: event.medicine.start_date,
        scheduled_minutes: event.medicine.scheduledMinutes ?? 480,
        status: 'pending',
        taken_at: null,
        skipped_reason: null,
        snoozed_until: null,
        created_at: nowIso,
        updated_at: nowIso,
      };
      setLocalItems('doses', [newDose, ...doses]);
    }
  }
}

function ensureRealtimeChannel(): RealtimeChannel | null {
  if (activeChannel) return activeChannel;
  if (typeof supabase?.channel !== 'function') return null;

  try {
    const channel = supabase.channel(CUREWELL_SYNC_CHANNEL, {
      config: {
        broadcast: { self: false, ack: false },
      },
    });

    // 1. Low-latency WebSocket Broadcast listener (Android <-> Web)
    channel.on('broadcast', { event: 'curewell_sync_event' }, ({ payload }) => {
      const event = payload as CurewellSyncEventPayload | undefined;
      if (!event || !event.eventId) return;
      if (rememberEventId(event.eventId)) return;

      applyIncomingEventToLocalStore(event);
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (err) {
          console.warn('Realtime sync listener error:', err);
        }
      }
    });

    // 2. Database-level Postgres Logical Replication listener (`medicines` & `doses`)
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'doses' },
      (change) => {
        const row = (change.new || change.old) as Partial<Dose> | undefined;
        if (!row || !row.id) return;
        const syntheticId = `pg-dose-${row.id}-${row.status}-${row.updated_at || Date.now()}`;
        if (rememberEventId(syntheticId)) return;

        const medicines = getLocalItems<Medicine>('medicines');
        const med = medicines.find((m) => m.id === row.medicine_id);

        const event: CurewellSyncEventPayload = {
          eventId: syntheticId,
          source: 'android',
          type: 'DOSE_STATUS_CHANGED',
          timestamp: new Date().toISOString(),
          profileId: row.profile_id,
          doseId: row.id,
          medicineId: row.medicine_id,
          medicineName: med?.medicine_name || 'Medication',
          strength: med?.strength || undefined,
          scheduledDate: row.scheduled_date || new Date().toISOString().slice(0, 10),
          scheduledMinutes: row.scheduled_minutes ?? 480,
          status: (row.status as 'taken' | 'skipped' | 'pending') || 'pending',
          takenAt: row.taken_at,
          skipReason: row.skipped_reason,
        };

        applyIncomingEventToLocalStore(event);
        for (const listener of listeners) {
          try {
            listener(event);
          } catch (err) {
            console.warn('Postgres dose change listener error:', err);
          }
        }
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'medicines' },
      (change) => {
        const row = change.new as Partial<Medicine> | undefined;
        if (!row || !row.id || !row.medicine_name) return;
        const syntheticId = `pg-med-${row.id}`;
        if (rememberEventId(syntheticId)) return;

        const event: CurewellSyncEventPayload = {
          eventId: syntheticId,
          source: 'android',
          type: 'MEDICINE_CREATED',
          timestamp: new Date().toISOString(),
          profileId: row.profile_id,
          medicine: {
            id: row.id,
            medicine_name: row.medicine_name,
            strength: row.strength,
            form: row.form,
            dose_amount: row.dose_amount,
            frequency_code: row.frequency_code,
            frequency_raw: row.frequency_raw,
            with_food: row.with_food,
            start_date: row.start_date || new Date().toISOString().slice(0, 10),
            is_ongoing: row.is_ongoing,
            duration_days: row.duration_days,
          },
        };

        applyIncomingEventToLocalStore(event);
        for (const listener of listeners) {
          try {
            listener(event);
          } catch (err) {
            console.warn('Postgres medicine insert listener error:', err);
          }
        }
      }
    );

    channel.subscribe((status) => {
      channelReady = status === 'SUBSCRIBED';
    });

    activeChannel = channel;
    return channel;
  } catch (err) {
    console.warn('Could not initialize Supabase Realtime channel:', err);
    return null;
  }
}

/**
 * Broadcasts a medication or dose change over the Supabase Realtime WebSocket
 * channel so the Android app (and any other open browser tabs) receives it immediately.
 */
export async function broadcastCurewellSyncEvent(
  payload: CurewellSyncEventInput
): Promise<void> {
  const fullPayload = {
    ...payload,
    eventId: newId(),
    source: 'web' as const,
    timestamp: new Date().toISOString(),
  } as CurewellSyncEventPayload;

  rememberEventId(fullPayload.eventId);

  const channel = ensureRealtimeChannel();
  if (!channel) return;

  try {
    await channel.send({
      type: 'broadcast',
      event: 'curewell_sync_event',
      payload: fullPayload,
    });
  } catch (err) {
    console.warn('WebSocket broadcast skipped (offline):', err);
  }
}

/**
 * Subscribes a React component (`UnifiedMedicineHubPage`, `MedicationScheduleCard`, etc.)
 * to live incoming WebSocket events from the Android Companion App.
 */
export function subscribeToCurewellRealtime(listener: SyncListener): () => void {
  ensureRealtimeChannel();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isRealtimeConnected(): boolean {
  return channelReady;
}
