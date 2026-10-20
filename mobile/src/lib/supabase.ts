import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ivxmyzxdxyxsfrdwhcpi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iUJnCRnqEu5Svl0b2VE7_A_7DrbHVTG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
