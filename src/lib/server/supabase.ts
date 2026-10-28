import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '$app/env/private';

let client: SupabaseClient | null = null;

/** Server-only Supabase client (service role). Returns null in demo mode. */
export function db(): SupabaseClient | null {
	if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
	client ??= createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
	return client;
}
