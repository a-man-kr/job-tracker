/**
 * Supabase Client Configuration
 * Initializes and exports the Supabase client for cloud storage operations
 * Requirements: 2.1, 6.1
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Cloud storage will be unavailable.');
}

/**
 * Supabase client singleton instance
 * Typed with Database interface for type-safe queries
 */
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export default supabase;
