# 0010. Caregiver Multi-Profile Engine and Persona Guardrails

We decided to implement a caregiver multi-profile engine with client-side reactive profile switching, strict clinical data isolation, and persistent persona safety guardrails across Curewell.

## Context

In Pakistan and across global healthcare realities, chronic condition management (hypertension, diabetes, cardiovascular disease) is rarely navigated by the patient in isolation. Adult sons, daughters, and spouses act as primary health caregivers—coordinating doctor appointments, administering daily medication regimens, and managing lab test archives for multiple dependents (aging parents, spouses, children).

Prior to this decision:
1. The database layer (`profiles` table) possessed `relationship: 'self' | 'parent' | 'child' | 'spouse' | 'other'`, `is_default: boolean`, and `profile_id` foreign keys across all medical tables (`medicines`, `visits`, `reports`, `side_effects`, `test_orders`, `reminder_settings`).
2. However, the client application context was strictly single-tenant: `useAuth()` only exposed a single `profile` loaded from `getDefaultProfile()`.
3. To manage an elderly father or mother, a caregiver had to log out, create a separate account with a separate email/password, or mix medications under a single profile—a severe patient safety risk where cardiovascular drugs could be confused or mistakenly logged for the wrong family member.

## Decision

1. **Multi-Profile Authentication Context (`AuthContext`)**:
   - Extended `AuthContext` to maintain the full collection of patient profiles under the authenticated user:
     - `profiles: Tables<'profiles'>[]`
     - `activeProfile: Tables<'profiles'> | null`
     - `switchProfile: (profileId: string) => Promise<void>`
     - `createFamilyProfile`, `updateFamilyProfile`, `deleteFamilyProfile`
   - Maintained `profile` as a reactive alias to `activeProfile` to ensure 100% backward compatibility with all existing database repository calls and pages.
   - Implemented profile preference caching in `localStorage` under `curewell_active_profile_id_${user.id}`, restoring the caregiver's last active family member upon page refresh or return.

2. **Persona Safety Guardrails (`ActiveProfileBanner`)**:
   - To prevent cross-patient medication logging errors, whenever `activeProfile.relationship !== 'self'`, an ambient, high-visibility persona guardrail banner is rendered across primary operational pages (`DashboardPage`, `TodaySchedulePage`).
   - The banner clearly displays: *"Viewing profile for [Full Name] ([Relationship])"*, along with an instant 1-click action to switch back to the caregiver's personal profile.

3. **Universal Profile Switcher (`ProfileSwitcher`)**:
   - Integrated into the global application header (`TopBar`), presenting the active member's initials avatar, name, and relationship badge.
   - Provides a dropdown menu for 1-click switching between family members, plus an immediate entry point to *"Add Family Member"*.

4. **30-Second Lean Dependent Onboarding (`AddFamilyProfileModal`)**:
   - Designed a rapid onboarding modal requiring only essential clinical data:
     - Full Name and Relationship (`parent`, `child`, `spouse`, `other`).
     - 1-tap pills for common South Asian chronic conditions (Hypertension, Type 2 Diabetes, Heart Disease, Asthma, Kidney Disease, Thyroid, Arthritis).
     - Optional biological sex, date of birth, blood group, and known allergies.
   - Automatically switches to the new dependent profile upon creation so the caregiver can immediately record prescriptions or lab reports.

5. **Caregiver Network Management in Settings (`SettingsPage`)**:
   - Added a dedicated *"Family Profiles & Caregiver Network"* card in Settings.
   - Provides full oversight of all managed profiles, relationship badges, active indicators, and safe deletion with confirmation dialogs (ensuring the primary `'self'` profile cannot be deleted).

## Consequences

- **Safety & Clarity**: Caregivers can switch contexts effortlessly while visual guardrails prevent accidental dose tracking or prescription entry under the wrong dependent.
- **Strict Data Isolation**: Because every view scopes database queries by `effectiveProfileId = profile?.id`, all medicine schedules, lab test histories, and doctor visit prep summaries remain cleanly partitioned.
- **Zero Regression**: Preserves seamless functionality for solo patients with no family dependents, maintaining complete compatibility with existing tests and APIs.
