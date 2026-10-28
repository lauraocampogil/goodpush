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
	const dryRun = url.searchParams.has('dry');
	let sent = 0;
	let removed = 0;
	let checked = 0;

	for (let from = 0; ; from += 1000) {
		const { data, error: e } = await supabase
			.from('subscribers')
			.select('id,name,categories,hour,time_zone,lang,endpoint,p256dh,auth,last_sent_on')
			.eq('active', true)
			.order('id')
			.range(from, from + 999);
		if (e) error(500, e.message);
		const rows = (data ?? []) as Row[];

		await Promise.all(
			rows.map(async (r) => {
				checked++;
				const today = dayKey(now, r.time_zone);
				if (r.last_sent_on === today || localHour(now, r.time_zone) < r.hour) return;

				const phrase = phraseForDay(r.categories, today);
				if (dryRun) return void sent++;
				try {
					await sendPush(r, {
						title: 'GoodPush',
						body: pushBody(phrase, r.lang, r.name),
						id: phrase.id,
						url: `/today?utm_source=push`
					});
					sent++;
					await supabase.from('subscribers').update({ last_sent_on: today }).eq('id', r.id);
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
