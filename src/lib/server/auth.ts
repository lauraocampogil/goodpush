import type { User } from '@supabase/supabase-js';
import { db } from './supabase.ts';

/** Reads `Authorization: Bearer <supabase access token>` and returns the user (or null). */
export async function getUser(request: Request): Promise<User | null> {
	const header = request.headers.get('authorization');
	const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
	const supabase = db();
	if (!token || !supabase) return null;
	const { data, error } = await supabase.auth.getUser(token);
	return error ? null : data.user;
}

/** Is this device — or the account it belongs to — Premium? */
export async function isPremium(deviceId: string | null, userId: string | null): Promise<boolean> {
	const supabase = db();
	if (!supabase) return false;
	let q = supabase.from('premium_active').select('device_id').limit(1);
	if (deviceId && userId) q = q.or(`device_id.eq.${deviceId},user_id.eq.${userId}`);
	else if (deviceId) q = q.eq('device_id', deviceId);
	else if (userId) q = q.eq('user_id', userId);
	else return false;
	const { data } = await q;
	return !!data?.length;
}
