import { error, json } from '@sveltejs/kit';
import { CRON_SECRET } from '$app/env/private';
import type { CategoryId, Lang } from '#lib/data/categories.ts';
import { dayKey, localHour, phraseForDay, pushBody } from '#lib/phrase.ts';
import { db } from '#lib/server/supabase.ts';
import { pushReady, sendPush } from '#lib/server/webpush.ts';
import type { RequestHandler } from './$types';

type Row = {
	id: string;
	name: string | null;
	categories: CategoryId[];
	hour: number;
	time_zone: string;
	lang: Lang;
	endpoint: string;
	p256dh: string;
	auth: string;
	last_sent_on: string | null;
	extra_hours: number[] | null;
	sent_slots: number[] | null;
};

/**
 * Called every hour (Supabase pg_cron or Vercel Cron).
 * Sends today's phrase to everyone whose chosen hour has arrived in their
 * own time zone and who hasn't received it yet today.
 */
export const GET: RequestHandler = async ({ request, url }) => {
	const auth = request.headers.get('authorization');
	if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) error(401, 'Unauthorized');

	const supabase = db();
	if (!supabase || !pushReady()) error(503, 'Supabase or VAPID keys not configured');

	const now = new Date();
	const { data: prem } = await supabase.from('premium_active').select('device_id');
	const premiumIds = new Set((prem ?? []).map((p: { device_id: string }) => p.device_id));
	const dryRun = url.searchParams.has('dry');
	let sent = 0;
	let removed = 0;
	let checked = 0;

	for (let from = 0; ; from += 1000) {
		const { data, error: e } = await supabase
			.from('subscribers')
			.select('id,name,categories,hour,time_zone,lang,endpoint,p256dh,auth,last_sent_on,extra_hours,sent_slots')
			.eq('active', true)
			.order('id')
			.range(from, from + 999);
		if (e) error(500, e.message);
		const rows = (data ?? []) as Row[];

		await Promise.all(
			rows.map(async (r) => {
				checked++;
				const today = dayKey(now, r.time_zone);
				const premium = premiumIds.has(r.id);
				// Slot 0 = free daily push; slots 1–2 = Premium extra pushes
				const hours = [r.hour, ...(premium ? (r.extra_hours ?? []).slice(0, 2) : [])];
				const sentToday = r.last_sent_on === today ? (r.sent_slots?.length ? r.sent_slots : [0]) : [];
				const nowHour = localHour(now, r.time_zone);
				const slot = hours.findIndex((h, k) => h <= nowHour && !sentToday.includes(k));
				if (slot === -1) return;

				const phrase = phraseForDay(r.categories, today, { slot, premium });
				if (dryRun) return void sent++;
				try {
					await sendPush(r, {
						title: slot === 0 ? 'GoodPush' : 'GoodPush ✦',
						body: pushBody(phrase, r.lang, r.name),
						id: phrase.id,
						url: `/today?utm_source=push&slot=${slot}`
					});
					sent++;
					await supabase
						.from('subscribers')
						.update({ last_sent_on: today, sent_slots: [...sentToday, slot] })
						.eq('id', r.id);
				} catch (err) {
					const status = (err as { statusCode?: number }).statusCode;
					if (status === 404 || status === 410) {
						removed++;
						await supabase.from('subscribers').update({ active: false }).eq('id', r.id);
					} else console.error('[cron] push failed', r.id, status);
				}
			})
		);
		if (rows.length < 1000) break;
	}

	return json({ ok: true, checked, sent, removed, dryRun });
};
