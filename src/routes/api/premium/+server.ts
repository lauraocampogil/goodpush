import { error, json } from '@sveltejs/kit';
import { db } from '#lib/server/supabase.ts';
import { ACTIVE, isDeviceId } from '#lib/server/stripe.ts';
import type { RequestHandler } from './$types';

/** Is this device Premium? (The app caches the answer.) */
export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const deviceId = url.searchParams.get('deviceId');
	if (!isDeviceId(deviceId)) error(400, 'Invalid device');
	setHeaders({ 'cache-control': 'no-store' });

	const supabase = db();
	if (!supabase) return json({ premium: false, demo: true });

	const { data } = await supabase.from('premium').select('status,current_period_end').eq('device_id', deviceId).maybeSingle();
	const premium = !!data && ACTIVE.includes(data.status);
	return json({ premium, until: data?.current_period_end ?? null });
};
