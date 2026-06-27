// =============================================================================
// supabaseClient.js — server-side Supabase client (service role)
// =============================================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) console.warn('[Supabase] WARNING: SUPABASE_URL is not set');
if (!SUPABASE_SERVICE_ROLE_KEY) console.warn('[Supabase] WARNING: SUPABASE_SERVICE_ROLE_KEY is not set');

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
