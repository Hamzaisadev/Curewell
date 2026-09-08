import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes('placeholder') &&
  rawUrl.startsWith('http')
);

// Fallback dummy URL so createClient never crashes during module import evaluation.
const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder-curewell.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'placeholder-anon-key';

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    '⚠️ Curewell: Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. Running in local/offline fallback mode.'
  );
}

if (typeof window !== 'undefined') {
  try {
    const oldToken = localStorage.getItem('medfolio-auth-token');
    if (oldToken && !localStorage.getItem('curewell-auth-token')) {
      localStorage.setItem('curewell-auth-token', oldToken);
    }
  } catch {
    // ignore
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isSupabaseConfigured,
    autoRefreshToken: isSupabaseConfigured,
    detectSessionInUrl: isSupabaseConfigured,
    // Unique storage key prevents session collisions when multiple Supabase
    // apps run on localhost during development.
    storageKey: 'curewell-auth-token',
    // PKCE flow is more secure for SPAs — it avoids exposing tokens in URL
    // fragments and works correctly with email confirmation redirects.
    flowType: 'pkce',
  },
});
