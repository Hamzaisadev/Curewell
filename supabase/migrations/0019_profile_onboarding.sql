-- 0019_profile_onboarding.sql
-- Add onboarding_completed flag to profiles table for Shifa's Medical Passport flow

alter table profiles add column if not exists onboarding_completed boolean not null default false;

-- Add index on onboarding status for fast lookups
create index if not exists idx_profiles_onboarding_completed on profiles (user_id, onboarding_completed);
