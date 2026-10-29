import { error, json } from '@sveltejs/kit';
import { CATEGORY_IDS, LANGS, type CategoryId } from '#lib/data/categories.ts';
import { db } from '#lib/server/supabase.ts';
import { getUser } from '#lib/server/auth.ts';
import type { RequestHandler } from './$types';

const isUuidish = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{8,64}$/.test(v);

/** Create / update this device's push subscription + preferences. */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	if (!body || !isUuidish(body.deviceId)) error(400, 'Invalid device');

	const sub = body.subscription;
	if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) error(400, 'Invalid subscription');
	if (!String(sub.endpoint).startsWith('https://')) error(400, 'Invalid endpoint');

	const categories = (Array.isArray(body.categories) ? body.categories : []).filter((c: string) =>
		CATEGORY_IDS.includes(c as CategoryId)
	);
	const hour = Number.isInteger(body.hour) && body.hour >= 0 && body.hour <= 23 ? body.hour : 8;
	// Premium extra pushes: max 2 distinct hours (enforced again by the cron)
	const extraHours = (Array.isArray(body.extraHours) ? body.extraHours : [])
		.filter((h: unknown) => Number.isInteger(h) && (h as number) >= 0 && (h as number) <= 23 && h !== hour)
		.slice(0, 2);
	let timeZone = 'UTC';
	try {
		timeZone = new Intl.DateTimeFormat('en', { timeZone: body.timeZone }).resolvedOptions().timeZone;
	} catch {
		/* keep UTC */
	}

	const supabase = db();
	if (!supabase) return json({ ok: true, demo: true });

	const user = await getUser(request);
	const { error: e } = await supabase.from('subscribers').upsert(
		{
			id: body.deviceId,
			...(user ? { user_id: user.id } : {}),
			name: typeof body.name === 'string' ? body.name.trim().slice(0, 40) : null,
			categories,
			hour,
			extra_hours: [...new Set(extraHours)],
			time_zone: timeZone,
			lang: LANGS.includes(body.lang) ? body.lang : 'en',
			source: typeof body.source === 'string' ? body.source.slice(0, 80) : null,
			endpoint: sub.endpoint,
			p256dh: sub.keys.p256dh,
			auth: sub.keys.auth,
			active: true,
			updated_at: new Date().toISOString()
		},
		{ onConflict: 'id', ignoreDuplicates: false }
	);
	if (e) {
		console.error('[subscribe]', e);
		error(500, 'Could not save');
	}
	return json({ ok: true });
};

/** GDPR: delete everything we have for this device. */
export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	if (!body || !isUuidish(body.deviceId)) error(400, 'Invalid device');
	const supabase = db();
	if (supabase) await supabase.from('subscribers').delete().eq('id', body.deviceId);
	return json({ ok: true });
};
