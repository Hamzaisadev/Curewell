import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProfile, type Profile } from '../profiles';
import { getLocalItems } from '../localStore';

const {
  mockGetUser,
  mockUpdate,
  mockUpsert,
  mockMaybeSingle,
  mockSingle,
} = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn();
  const mockSingle = vi.fn();

  const mockUpdate = vi.fn((_payload?: Record<string, unknown>) => ({
    eq: vi.fn(() => ({
      select: vi.fn(() => ({
        maybeSingle: mockMaybeSingle,
      })),
    })),
  }));

  const mockUpsert = vi.fn((_payload?: Record<string, unknown>, _opts?: Record<string, unknown>) => ({
    select: vi.fn(() => ({
      single: mockSingle,
    })),
  }));

  const mockGetUser = vi.fn();

  return {
    mockGetUser,
    mockUpdate,
    mockUpsert,
    mockMaybeSingle,
    mockSingle,
  };
});

vi.mock('../../supabase/client', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          update: mockUpdate,
          upsert: mockUpsert,
          select: vi.fn(() => ({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            maybeSingle: mockMaybeSingle,
            single: mockSingle,
          })),
        };
      }
      return {};
    },
  },
  isSupabaseConfigured: true,
}));

describe('profilesRepo.updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('updates an existing profile via .update() and syncs to local storage even when user_id is omitted from updates', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-user-123' } },
      error: null,
    });

    const existingProfile: Profile = {
      id: 'profile-1',
      user_id: 'auth-user-123',
      full_name: 'Jane Doe',
      relationship: 'self',
      date_of_birth: '1990-01-01',
      sex: 'female',
      blood_group: 'O+',
      height_cm: 165,
      weight_kg: 60,
      allergies: 'Peanuts',
      chronic_conditions: 'Asthma',
      emergency_contact_name: 'John Doe',
      emergency_contact_phone: '+1234567890',
      is_default: true,
      onboarding_completed: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    mockMaybeSingle.mockResolvedValueOnce({
      data: existingProfile,
      error: null,
    });

    const result = await updateProfile('profile-1', {
      full_name: 'Jane Doe',
      blood_group: 'O+',
      allergies: 'Peanuts',
      // user_id omitted
    });

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Jane Doe',
        blood_group: 'O+',
        allergies: 'Peanuts',
      })
    );
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(result.id).toBe('profile-1');
    expect(result.blood_group).toBe('O+');

    // Verify local storage synchronization
    const localItems = getLocalItems<Profile>('profiles');
    const localSaved = localItems.find((p) => p.id === 'profile-1');
    expect(localSaved).toBeDefined();
    expect(localSaved?.full_name).toBe('Jane Doe');
    expect(localSaved?.blood_group).toBe('O+');
  });

  it('falls back to .upsert() with resolved user_id when .update() returns null (row does not exist yet)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-user-resolved-789' } },
      error: null,
    });

    // .update() returns null data (row does not exist yet) and no error
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const upsertedProfile: Profile = {
      id: 'new-profile-99',
      user_id: 'auth-user-resolved-789',
      full_name: 'New Patient',
      relationship: 'self',
      date_of_birth: null,
      sex: 'undisclosed',
      blood_group: 'B+',
      height_cm: null,
      weight_kg: null,
      allergies: null,
      chronic_conditions: 'Diabetes',
      emergency_contact_name: null,
      emergency_contact_phone: null,
      is_default: true,
      onboarding_completed: false,
      created_at: '2026-10-21T00:00:00Z',
      updated_at: '2026-10-21T00:00:00Z',
    };

    mockSingle.mockResolvedValueOnce({
      data: upsertedProfile,
      error: null,
    });

    const result = await updateProfile('new-profile-99', {
      full_name: 'New Patient',
      chronic_conditions: 'Diabetes',
      blood_group: 'B+',
      // user_id omitted
    });

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'new-profile-99',
        user_id: 'auth-user-resolved-789',
        chronic_conditions: 'Diabetes',
        blood_group: 'B+',
      }),
      { onConflict: 'id' }
    );
    expect(result.id).toBe('new-profile-99');
    expect(result.user_id).toBe('auth-user-resolved-789');

    // Verify local storage synchronization
    const localItems = getLocalItems<Profile>('profiles');
    const localSaved = localItems.find((p) => p.id === 'new-profile-99');
    expect(localSaved).toBeDefined();
    expect(localSaved?.user_id).toBe('auth-user-resolved-789');
    expect(localSaved?.chronic_conditions).toBe('Diabetes');
  });

  it('automatically retries without onboarding_completed when Supabase throws a missing-column (PGRST204) error, saving all other medical fields to Supabase', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-user-123' } },
      error: null,
    });

    // 1st attempt: fails with missing onboarding_completed column
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Could not find the 'onboarding_completed' column of 'profiles' in the schema cache",
        code: 'PGRST204',
        details: null,
        hint: null,
      },
    });

    // 2nd attempt: succeeds without onboarding_completed
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: 'profile-1',
        user_id: 'auth-user-123',
        full_name: 'Sarah Medical',
        relationship: 'self',
        date_of_birth: '1988-08-08',
        sex: 'female',
        blood_group: 'AB+',
        height_cm: 170,
        weight_kg: 65,
        allergies: 'Sulfa',
        chronic_conditions: 'Hypertension',
        emergency_contact_name: 'Bob',
        emergency_contact_phone: '+9876543210',
        is_default: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-10-21T00:00:00Z',
      },
      error: null,
    });

    const result = await updateProfile('profile-1', {
      full_name: 'Sarah Medical',
      blood_group: 'AB+',
      height_cm: 170,
      weight_kg: 65,
      allergies: 'Sulfa',
      chronic_conditions: 'Hypertension',
      emergency_contact_name: 'Bob',
      emergency_contact_phone: '+9876543210',
      onboarding_completed: true,
    });

    // Verify .update was called twice
    expect(mockUpdate).toHaveBeenCalledTimes(2);

    // 1st call included onboarding_completed
    expect(mockUpdate.mock.calls[0]?.[0]?.onboarding_completed).toBe(true);

    // 2nd call stripped onboarding_completed and preserved all other medical fields
    expect(mockUpdate.mock.calls[1]?.[0]?.onboarding_completed).toBeUndefined();
    expect(mockUpdate.mock.calls[1]?.[0]?.allergies).toBe('Sulfa');
    expect(mockUpdate.mock.calls[1]?.[0]?.chronic_conditions).toBe('Hypertension');
    expect(mockUpdate.mock.calls[1]?.[0]?.blood_group).toBe('AB+');
    expect(mockUpdate.mock.calls[1]?.[0]?.emergency_contact_name).toBe('Bob');

    // Returned saved profile contains saved medical fields
    expect(result.allergies).toBe('Sulfa');
    expect(result.chronic_conditions).toBe('Hypertension');
    expect(result.blood_group).toBe('AB+');

    // Local storage has synchronized item
    const localSaved = getLocalItems<Profile>('profiles').find((p) => p.id === 'profile-1');
    expect(localSaved).toBeDefined();
    expect(localSaved?.allergies).toBe('Sulfa');
    expect(localSaved?.onboarding_completed).toBe(true);
  });

  it('retries upsert without onboarding_completed when upsert encounters PGRST204 error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-user-upsert-retry' } },
      error: null,
    });

    // .update() returns null (new row)
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    // 1st .upsert() fails with PGRST204
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Could not find the 'onboarding_completed' column of 'profiles' in the schema cache",
        code: 'PGRST204',
      },
    });

    // 2nd .upsert() succeeds
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'new-p-1',
        user_id: 'auth-user-upsert-retry',
        full_name: 'Upsert Patient',
        relationship: 'self',
        date_of_birth: null,
        sex: 'undisclosed',
        blood_group: 'A+',
        height_cm: null,
        weight_kg: null,
        allergies: 'None',
        chronic_conditions: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        is_default: true,
        created_at: '2026-10-21T00:00:00Z',
        updated_at: '2026-10-21T00:00:00Z',
      },
      error: null,
    });

    const result = await updateProfile('new-p-1', {
      full_name: 'Upsert Patient',
      blood_group: 'A+',
      allergies: 'None',
      onboarding_completed: true,
    });

    expect(mockUpsert).toHaveBeenCalledTimes(2);
    expect(mockUpsert.mock.calls[0]?.[0]?.onboarding_completed).toBe(true);
    expect(mockUpsert.mock.calls[1]?.[0]?.onboarding_completed).toBeUndefined();
    expect(result.allergies).toBe('None');
    expect(result.blood_group).toBe('A+');
  });
});
