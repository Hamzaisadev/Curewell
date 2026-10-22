import { supabase } from '../supabase/client';
import type { Tables, InsertTables, UpdateTables } from '../supabase/types';
import { getLocalItems, insertLocalItem, updateLocalItem, newId, deleteLocalItem } from './localStore';
import { listWithFallback } from './offlineFallback';

export type Profile = Tables<'profiles'>;
export type ProfileInsert = InsertTables<'profiles'>;
export type ProfileUpdate = UpdateTables<'profiles'>;

export const MIN_HEIGHT_CM = 30;
export const MAX_HEIGHT_CM = 250;
export const MIN_WEIGHT_KG = 1;
export const MAX_WEIGHT_KG = 350;

export function sanitizeHeightCm(val: number | null | undefined): number | null {
  if (val === null || val === undefined || typeof val !== 'number' || Number.isNaN(val)) {
    return null;
  }
  if (val < MIN_HEIGHT_CM || val > MAX_HEIGHT_CM) {
    return null;
  }
  return Math.round(val * 10) / 10;
}

export function sanitizeWeightKg(val: number | null | undefined): number | null {
  if (val === null || val === undefined || typeof val !== 'number' || Number.isNaN(val)) {
    return null;
  }
  if (val < MIN_WEIGHT_KG || val > MAX_WEIGHT_KG) {
    return null;
  }
  return Math.round(val * 10) / 10;
}

function sanitizeProfileRow(profile: Profile | null): Profile | null {
  if (!profile) return null;
  const inferredCompleted = Boolean(
    profile.onboarding_completed ||
    profile.chronic_conditions ||
    profile.allergies ||
    profile.emergency_contact_phone
  );
  return {
    ...profile,
    height_cm: sanitizeHeightCm(profile.height_cm),
    weight_kg: sanitizeWeightKg(profile.weight_kg),
    onboarding_completed: inferredCompleted,
  };
}

function isOnboardingColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const errObj = error as { message?: string; details?: string; hint?: string; code?: string };
  const str = `${errObj.message || ''} ${errObj.details || ''} ${errObj.hint || ''} ${errObj.code || ''}`.toLowerCase();
  return (
    str.includes('onboarding_completed') ||
    (str.includes('schema cache') && str.includes('column')) ||
    str.includes('pgrst204')
  );
}

function blankProfile(userId: string): Profile {
  const nowIso = new Date().toISOString();
  return {
    id: userId,
    user_id: userId,
    full_name: 'Patient',
    relationship: 'self',
    date_of_birth: null,
    sex: 'undisclosed',
    blood_group: 'unknown',
    height_cm: null,
    weight_kg: null,
    allergies: null,
    chronic_conditions: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    is_default: true,
    avatar_url: null,
    onboarding_completed: false,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

/**
 * Returns the user's default profile, or null if they do not have one yet.
 *
 * Returning null is meaningful: the caller creates the real profile. Previously
 * this fabricated and persisted a local placeholder even when the database was
 * reachable, which masked "this user has no profile" and could shadow the real
 * row once it appeared.
 */
export async function getDefaultProfile(userId: string): Promise<Profile | null> {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return sanitizeProfileRow(data ?? null);
  } catch (err) {
    console.warn('getDefaultProfile failed, falling back to local store:', err);
    const local = getLocalItems<Profile>('profiles');
    return sanitizeProfileRow(local.find((p) => p.user_id === userId) ?? null);
  }
}

export async function getProfileById(profileId: string): Promise<Profile | null> {
  if (!profileId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return sanitizeProfileRow(data ?? null);
  } catch (err) {
    console.warn('getProfileById failed, falling back to local store:', err);
    const local = getLocalItems<Profile>('profiles');
    return sanitizeProfileRow(local.find((p) => p.id === profileId) ?? null);
  }
}

export async function listProfiles(userId: string): Promise<Profile[]> {
  const rows = await listWithFallback<Profile>(
    'listProfiles',
    'profiles',
    () =>
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
    (items) => items.filter((p) => p.user_id === userId)
  );
  return rows.map((r) => sanitizeProfileRow(r)!);
}

/**
 * Updates a profile, creating it if it does not exist yet.
 *
 * Uses update first (only evaluates UPDATE RLS policy), falling back to
 * upsert if the profile does not exist yet.
 */
export async function updateProfile(id: string, updates: ProfileUpdate): Promise<Profile> {
  // 1. Resolve userId from updates.user_id or Supabase auth session, defaulting to id
  let resolvedUserId = updates.user_id;
  if (!resolvedUserId) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      resolvedUserId = updates.user_id || authData?.user?.id || id;
    } catch {
      resolvedUserId = id;
    }
  }

  // 2. Set updated_at timestamp and sanitize measurements
  const sanitizedUpdates: ProfileUpdate = {
    ...updates,
    ...(updates.height_cm !== undefined ? { height_cm: sanitizeHeightCm(updates.height_cm) } : {}),
    ...(updates.weight_kg !== undefined ? { weight_kg: sanitizeWeightKg(updates.weight_kg) } : {}),
    updated_at: new Date().toISOString(),
  };

  try {
    let currentPayload = { ...sanitizedUpdates };

    // 3. First attempt a standard UPDATE (only evaluates the UPDATE RLS policy)
    let updateRes = await supabase
      .from('profiles')
      .update(currentPayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    // Auto-strip onboarding_completed if live schema lacks column
    if (updateRes.error && isOnboardingColumnError(updateRes.error) && 'onboarding_completed' in currentPayload) {
      console.warn('Live schema lacks onboarding_completed, retrying update without it');
      const { onboarding_completed: _, ...stripped } = currentPayload;
      currentPayload = stripped;
      updateRes = await supabase
        .from('profiles')
        .update(currentPayload)
        .eq('id', id)
        .select()
        .maybeSingle();
    }

    if (updateRes.error) {
      throw new Error(updateRes.error.message);
    }

    // If update returned row data, remote Supabase save succeeded
    if (updateRes.data) {
      const saved = sanitizeProfileRow(updateRes.data as Profile)!;
      const localSync: Profile = {
        ...saved,
        ...(updates.onboarding_completed !== undefined ? { onboarding_completed: updates.onboarding_completed } : {}),
      };
      const localUpdated = updateLocalItem<Profile>('profiles', id, localSync);
      if (!localUpdated) insertLocalItem<Profile>('profiles', localSync);
      return saved;
    }

    // 4. If update returned no row (!data and no error), row doesn't exist yet -> UPSERT
    let upsertPayload: InsertTables<'profiles'> = {
      ...currentPayload,
      id,
      user_id: resolvedUserId,
    } as InsertTables<'profiles'>;

    let upsertRes = await supabase
      .from('profiles')
      .upsert(upsertPayload, { onConflict: 'id' })
      .select()
      .single();

    if (upsertRes.error && isOnboardingColumnError(upsertRes.error) && 'onboarding_completed' in upsertPayload) {
      console.warn('Live schema lacks onboarding_completed, retrying upsert without it');
      const { onboarding_completed: _, ...strippedUpsert } = upsertPayload;
      upsertPayload = strippedUpsert as InsertTables<'profiles'>;
      upsertRes = await supabase
        .from('profiles')
        .upsert(upsertPayload, { onConflict: 'id' })
        .select()
        .single();
    }

    if (upsertRes.error) {
      throw new Error(upsertRes.error.message);
    }

    if (upsertRes.data) {
      const saved = sanitizeProfileRow(upsertRes.data as Profile)!;
      const localSync: Profile = {
        ...saved,
        ...(updates.onboarding_completed !== undefined ? { onboarding_completed: updates.onboarding_completed } : {}),
      };
      const localUpdated = updateLocalItem<Profile>('profiles', id, localSync);
      if (!localUpdated) insertLocalItem<Profile>('profiles', localSync);
      return saved;
    }
  } catch (err) {
    console.warn('updateProfile failed, updating local store:', err);
  }

  const localUpdated = updateLocalItem<Profile>('profiles', id, sanitizedUpdates as Partial<Profile>);
  if (localUpdated) return sanitizeProfileRow(localUpdated)!;

  return sanitizeProfileRow(
    insertLocalItem<Profile>('profiles', {
      ...blankProfile(resolvedUserId || id),
      ...sanitizedUpdates,
      id,
    } as Profile)
  )!;
}

export async function createProfile(profileData: ProfileInsert): Promise<Profile> {
  const id = profileData.id || newId();
  const nowIso = new Date().toISOString();
  let payload: ProfileInsert = {
    ...profileData,
    id,
    height_cm: sanitizeHeightCm(profileData.height_cm),
    weight_kg: sanitizeWeightKg(profileData.weight_kg),
    is_default: profileData.is_default ?? false,
    relationship: profileData.relationship || 'other',
    created_at: profileData.created_at || nowIso,
    updated_at: profileData.updated_at || nowIso,
  };

  try {
    let res = await supabase
      .from('profiles')
      .insert(payload)
      .select()
      .single();

    if (res.error && isOnboardingColumnError(res.error) && 'onboarding_completed' in payload) {
      console.warn('Live schema lacks onboarding_completed, retrying insert without it');
      const { onboarding_completed: _, ...strippedInsert } = payload;
      payload = strippedInsert as ProfileInsert;
      res = await supabase
        .from('profiles')
        .insert(payload)
        .select()
        .single();
    }

    if (res.error) throw new Error(res.error.message);
    if (res.data) {
      const saved = sanitizeProfileRow(res.data as Profile)!;
      const localSync: Profile = {
        ...saved,
        ...(profileData.onboarding_completed !== undefined ? { onboarding_completed: profileData.onboarding_completed } : {}),
      };
      const localUpdated = updateLocalItem<Profile>('profiles', id, localSync);
      if (!localUpdated) insertLocalItem<Profile>('profiles', localSync);
      return saved;
    }
  } catch (err) {
    console.warn('createProfile remote insert failed, saving to local store:', err);
  }

  return sanitizeProfileRow(
    insertLocalItem<Profile>('profiles', {
      ...blankProfile(payload.user_id),
      ...payload,
      id,
    } as Profile)
  )!;
}

export async function deleteProfile(profileId: string): Promise<void> {
  if (!profileId) return;
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (error) throw new Error(error.message);
  } catch (err) {
    console.warn('deleteProfile remote failed, deleting from local store:', err);
  }
  deleteLocalItem<Profile>('profiles', profileId);
}
