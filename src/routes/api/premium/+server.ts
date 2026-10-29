import { error, json } from '@sveltejs/kit';
import { db } from '#lib/server/supabase.ts';
import { getUser, isPremium } from '#lib/server/auth.ts';
import { isDeviceId } from '#lib/server/stripe.ts';
import type { RequestHandler } from './$types';

/** Is this device (or the signed-in account) Premium? The app caches the answer. */
export const GET: RequestHandler = async ({ url, request, setHeaders }) => {
	const deviceId = url.searchParams.get('deviceId');
	if (!isDeviceId(deviceId)) error(400, 'Invalid device');
	setHeaders({ 'cache-control': 'no-store' });
	if (!db()) return json({ premium: false, demo: true });
	const user = await getUser(request);
	return json({ premium: await isPremium(deviceId, user?.id ?? null) });
};
