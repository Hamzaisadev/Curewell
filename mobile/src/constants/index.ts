import { DoseSlot, LabReportItem, PatientProfile, VitalLog } from '../types';

export const STORAGE_KEYS = {
  DOSES: 'curewell_rn_doses_v4',
  VITALS: 'curewell_rn_vitals_v4',
  PROFILE: 'curewell_rn_profile_v4',
  PROFILE_ID: 'curewell_rn_profile_v4',
  PAIRED_PROFILE: 'curewell_paired_profile_v1',
  SESSION: 'curewell_rn_session_v4',
  LABS: 'curewell_rn_labs_v4',
  PIN: 'curewell_rn_pin_v4',
  ALARMS_ENABLED: 'curewell_rn_alarms_v4',
  THEME_MODE: 'curewell_theme_mode',
  NOTIFICATIONS_REQUESTED: 'curewell_notif_requested_v1',
} as const;

/**
 * Strictly ZERO synthetic or fake placeholder data on fresh install (ADR 0004).
 * Real data must be paired via 6-digit code or QR code from Medfolio Web App or signed in via email.
 */
export const DEFAULT_PROFILES: PatientProfile[] = [];
export const INITIAL_DOSES: DoseSlot[] = [];
export const INITIAL_LABS: LabReportItem[] = [];
export const INITIAL_VITALS: VitalLog[] = [];

export const THEME = {
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  primary: '#0D9488',
  primaryDark: '#0F766E',
  accent: '#14B8A6',
  textLight: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  ok: '#10B981',
  warn: '#F59E0B',
  risk: '#EF4444',
} as const;
