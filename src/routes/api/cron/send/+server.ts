import { error, json } from '@sveltejs/kit';
import { CRON_SECRET } from '$app/env/private';
import type { CategoryId, Lang } from '#lib/data/categories.ts';
import { dayKey, liveStreak, localHour, phraseForDay, pushBody, pushTitle, shiftDay } from '#lib/phrase.ts';
import { CATEGORY_LABEL } from '#lib/i18n/dict.ts';
import { pickQuote, quoteToPhrase, type QuoteRow } from '#lib/quotes.ts';
import type { Phrase } from '#lib/data/phrases.ts';
import { isMovieTopic, type TopicId } from '#lib/data/topics.ts';
import { db } from '#lib/server/supabase.ts';
import { pushReady, sendPush } from '#lib/server/webpush.ts';
import { captureServer } from '#lib/server/analytics.ts';
import type { RequestHandler } from './$types';

type Row = {
	id: string;
	name: string | null;
	categories: CategoryId[];
	topics: TopicId[] | null;
	hour: number;
	time_zone: string;
	lang: Lang;
	endpoint: string;
	p256dh: string;
	auth: string;
	last_sent_on: string | null;
	extra_hours: number[] | null;
	sent_slots: number[] | null;
	user_id: string | null;
	paused_until: string | null;
	days: number[] | null;
	streak_count: number | null;
	streak_last: string | null;
};

const ACTIONS = { en: ['♥ Save', '↗ Share'], es: ['♥ Guardar', '↗ Compartir'], fr: ['♥ Garder', '↗ Partager'] } as const;

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
	const { data: prem } = await supabase.from('premium_active').select('device_id,user_id');
	const premiumIds = new Set((prem ?? []).map((p: { device_id: string }) => p.device_id));
	const premiumUsers = new Set((prem ?? []).map((p: { user_id: string | null }) => p.user_id).filter(Boolean));
	// "In the news" quotes around today (time zones span ±1 day)
	const utcToday = dayKey(now, 'UTC');
	const { data: qs } = await supabase
		.from('quotes')
		.select('id,topic,author,quote_en,quote_es,quote_fr,source_url,publish_on')
		.eq('approved', true)
		.gte('publish_on', shiftDay(utcToday, -1))
		.lte('publish_on', shiftDay(utcToday, 1));
	const quotesByDay = new Map<string, Phrase[]>();
	for (const q of (qs ?? []) as QuoteRow[]) {
		const ph = quoteToPhrase(q);
		if (ph) quotesByDay.set(q.publish_on, [...(quotesByDay.get(q.publish_on) ?? []), ph]);
	}
	const dryRun = url.searchParams.has('dry');
	let sent = 0;
	let removed = 0;
	let checked = 0;
	const events: { event: string; distinct_id: string; properties: Record<string, unknown> }[] = [];

	for (let from = 0; ; from += 1000) {
		const { data, error: e } = await supabase
			.from('subscribers')
			.select('id,name,categories,topics,hour,time_zone,lang,endpoint,p256dh,auth,last_sent_on,extra_hours,sent_slots,user_id,paused_until,days,streak_count,streak_last')
			.eq('active', true)
			.order('id')
			.range(from, from + 999);
		if (e) error(500, e.message);
		const rows = (data ?? []) as Row[];

		await Promise.all(
			rows.map(async (r) => {
				checked++;
				// Respect the person's choice: paused, or not a day they want a push
				if (r.paused_until && new Date(r.paused_until) > now) return;
				const weekday = new Date(`${dayKey(now, r.time_zone)}T12:00:00Z`).getUTCDay();
				if (r.days && r.days.length && !r.days.includes(weekday)) return;
				const today = dayKey(now, r.time_zone);
				const premium = premiumIds.has(r.id) || (!!r.user_id && premiumUsers.has(r.user_id));
				// Slot 0 = free daily push; slots 1–2 = Premium extra pushes
				const hours = [r.hour, ...(premium ? (r.extra_hours ?? []).slice(0, 2) : [])];
				const sentToday = r.last_sent_on === today ? (r.sent_slots?.length ? r.sent_slots : [0]) : [];
				const nowHour = localHour(now, r.time_zone);
				const slot = hours.findIndex((h, k) => h <= nowHour && !sentToday.includes(k));
				if (slot === -1) return;

				const topics = r.topics ?? [];
				const news = slot === 0 ? pickQuote(quotesByDay.get(today) ?? [], topics, today, r.categories) : null;
				const streak = liveStreak(r.streak_count, r.streak_last, today);
				const phrase = news ?? phraseForDay(r.categories, today, { slot, premium, topics });
				if (dryRun) return void sent++;
				try {
					await sendPush(r, {
						title: pushTitle({
							lang: r.lang,
							streak,
							label: CATEGORY_LABEL[r.lang]?.[phrase.cat] ?? 'GoodPush',
							kind: news ? (news.topic && isMovieTopic(news.topic) ? 'movie' : 'news') : slot === 0 ? 'daily' : 'extra'
						}),
						body: pushBody(phrase, r.lang),
						id: phrase.id,
						streak,
						actions: ACTIONS[r.lang] ?? ACTIONS.en,
						url: `/today?utm_source=push&slot=${slot}`
					});
					sent++;
					events.push({ event: 'push_sent', distinct_id: r.id, properties: { slot, category: phrase.cat, topic: phrase.topic ?? null, phrase: phrase.id, news: !!news, lang: r.lang, premium } });
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

	events.push({ event: 'cron_run', distinct_id: 'goodpush-cron', properties: { checked, sent, removed, dryRun } });
	if (!dryRun) await captureServer(events);
	return json({ ok: true, checked, sent, removed, dryRun });
};
