import { error, json } from '@sveltejs/kit';
import { CATEGORY_IDS, LANGS, type CategoryId } from '#lib/data/categories.ts';
import { db } from '#lib/server/supabase.ts';
import { isTopic } from '#lib/data/topics.ts';
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
	const topics = [...new Set((Array.isArray(body.topics) ? body.topics : []).filter(isTopic))].slice(0, 30);
	const streakCount = Number.isInteger(body.streak?.count) && body.streak.count >= 0 ? Math.min(body.streak.count, 100000) : null;
	const streakLast = typeof body.streak?.last === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.streak.last) ? body.streak.last : null;
	const hour = Number.isInteger(body.hour) && body.hour >= 0 && body.hour <= 23 ? body.hour : 8;
	// Premium extra pushes: max 2 distinct hours (enforced again by the cron)
	const extraHours = (Array.isArray(body.extraHours) ? body.extraHours : [])
		.filter((h: unknown) => Number.isInteger(h) && (h as number) >= 0 && (h as number) <= 23 && h !== hour)
		.slice(0, 2);
	const days = (Array.isArray(body.days) ? body.days : [0, 1, 2, 3, 4, 5, 6]).filter(
		(d: unknown) => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6
	);
	const pausedUntil = typeof body.pausedUntil === 'string' && !Number.isNaN(Date.parse(body.pausedUntil)) ? new Date(body.pausedUntil).toISOString() : null;
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
			topics,
			...(streakCount !== null ? { streak_count: streakCount, streak_last: streakLast } : {}),
			hour,
			extra_hours: [...new Set(extraHours)],
			days: days.length ? [...new Set(days)] : [0, 1, 2, 3, 4, 5, 6],
			paused_until: pausedUntil,
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
