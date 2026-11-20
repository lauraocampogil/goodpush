import { error, json } from '@sveltejs/kit';
import { CRON_SECRET } from '$app/env/private';
import type { CategoryId, Lang } from '#lib/data/categories.ts';
import { dayKey, dayNumber, liveStreak, localMinutes, phraseForDay, pushHeadline, shiftDay } from '#lib/phrase.ts';
import { PUBLIC_CONTACT_EMAIL, PUBLIC_SITE_URL } from '$app/env/public';
import { sendEmail } from '#lib/server/brevo.ts';
import { pickQuote, quoteToPhrase, type QuoteRow } from '#lib/quotes.ts';
import type { Phrase } from '#lib/data/phrases.ts';
import { type TopicId } from '#lib/data/topics.ts';
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
	minute?: number | null;
	extra_minutes?: number[] | null;
	trial_end_notified?: boolean | null;
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
	trial_started_at: string | null;
	created_at: string;
};

const TRIAL_DAYS = 14;

const TRIAL_END = {
	en: { push: ['Your 14 free days are over', 'Keep your daily push for €4.99 a year → tap here'], subject: 'Your GoodPush free days are over', h: 'Your 14 free days are over', p: 'We hope those pushes helped. Keep yours coming every day — the GoodPush Pass is €4.99 a year, less than a coffee.', cta: 'Keep my daily push' },
	es: { push: ['Tus 14 días gratis han terminado', 'Sigue con tu empujón diario por 4,99 € al año → toca aquí'], subject: 'Tus días gratis de GoodPush han terminado', h: 'Tus 14 días gratis han terminado', p: 'Esperamos que esos empujones te hayan ayudado. Sigue recibiéndolos cada día: el GoodPush Pass cuesta 4,99 € al año, menos que un café.', cta: 'Quiero seguir con mi push' },
	fr: { push: ['Tes 14 jours gratuits sont terminés', 'Garde ton push quotidien pour 4,99 € par an → touche ici'], subject: 'Tes jours gratuits GoodPush sont terminés', h: 'Tes 14 jours gratuits sont terminés', p: 'On espère que ces push t’ont aidé. Continue à les recevoir chaque jour : le GoodPush Pass coûte 4,99 € par an, moins qu’un café.', cta: 'Garder mon push' }
} as const;
const trialEmail = (lang: Lang, url: string) => {
	const t = TRIAL_END[lang] ?? TRIAL_END.en;
	return `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0D0D0E"><p style="font-size:44px;margin:0">🙂</p><h1 style="font-size:30px;line-height:1.1;margin:16px 0">${t.h}</h1><p style="font-size:17px;line-height:1.5;color:#3a3a3a">${t.p}</p><p style="margin:28px 0"><a href="${url}" style="display:inline-block;background:#D5FF00;color:#0D0D0E;font-weight:700;text-decoration:none;padding:16px 28px;border-radius:999px">${t.cta} →</a></p><p style="font-size:13px;color:#888">GoodPush · goodpush.vercel.app</p></div>`;
};

const ACTIONS = { en: ['🔥 Keep my streak', '↗ Share'], es: ['🔥 Sumar a mi racha', '↗ Compartir'], fr: ['🔥 Garder ma série', '↗ Partager'] } as const;

/**
 * Called every 5 minutes (Supabase pg_cron).
 * Sends today's phrase to everyone whose chosen time (08:15…) has arrived in their
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
		const cols = 'id,name,categories,topics,hour,time_zone,lang,endpoint,p256dh,auth,last_sent_on,extra_hours,sent_slots,user_id,paused_until,days,streak_count,streak_last,trial_started_at,created_at';
		const fetchPage = async (c: string): Promise<{ data: unknown[] | null; error: { message: string } | null }> => {
			const r = await supabase.from('subscribers').select(c).eq('active', true).order('id').range(from, from + 999);
			return { data: r.data as unknown[] | null, error: r.error };
		};
		// minute / extra_minutes / trial_end_notified exist once migration 0012 has run
		let res = await fetchPage(`${cols},minute,extra_minutes,trial_end_notified`);
		const newCols = !res.error;
		if (res.error) res = await fetchPage(cols);
		const { data, error: e } = res;
		if (e) error(500, e.message);
		const rows = (data ?? []) as unknown as Row[];

		await Promise.all(
			rows.map(async (r) => {
				checked++;
				// Respect the person's choice: paused, or not a day they want a push
				if (r.paused_until && new Date(r.paused_until) > now) return;
				const weekday = new Date(`${dayKey(now, r.time_zone)}T12:00:00Z`).getUTCDay();
				if (r.days && r.days.length && !r.days.includes(weekday)) return;
				const today = dayKey(now, r.time_zone);
				const premium = premiumIds.has(r.id) || (!!r.user_id && premiumUsers.has(r.user_id));
				// 14-day free trial, then only paid Pass holders get pushes
				const trialStart = (r.trial_started_at ?? r.created_at).slice(0, 10);
				const trialLeft = Math.max(0, TRIAL_DAYS - (dayNumber(today) - dayNumber(trialStart)));
				if (!premium && trialLeft === 0) {
					// Once, right after the trial: one push + one email inviting to the Pass
					const endedDaysAgo = dayNumber(today) - dayNumber(trialStart) - TRIAL_DAYS;
					if (!newCols || dryRun || r.trial_end_notified || endedDaysAgo > 7) return;
					const t = TRIAL_END[r.lang] ?? TRIAL_END.en;
					const site = (PUBLIC_SITE_URL || 'https://goodpush.vercel.app').replace(/\/$/, '');
					await sendPush(r, { title: t.push[0], body: t.push[1], url: '/premium?utm_source=push_trial_end' }).catch(() => {});
					if (r.user_id && PUBLIC_CONTACT_EMAIL) {
						const { data: u } = await supabase.auth.admin.getUserById(r.user_id).catch(() => ({ data: null }));
						const email = u?.user?.email;
						if (email) await sendEmail({ to: email, subject: t.subject, html: trialEmail(r.lang, `${site}/premium?utm_source=email_trial_end`), senderEmail: PUBLIC_CONTACT_EMAIL }).catch((err) => console.error('[cron] trial email', err));
					}
					await supabase.from('subscribers').update({ trial_end_notified: true }).eq('id', r.id);
					events.push({ event: 'trial_end_notified', distinct_id: r.id, properties: { lang: r.lang, email: !!r.user_id } });
					return;
				}
				const access = premium || trialLeft > 0;
				// Slot 0 = free daily push; slots 1–2 = Premium extra pushes
				// Slot times in minutes since local midnight (08:15 → 495); extras are Pass only
				const times = [r.hour * 60 + (r.minute ?? 0), ...(premium ? (r.extra_hours ?? []).slice(0, 2).map((h, k) => h * 60 + (r.extra_minutes?.[k] ?? 0)) : [])];
				const sentToday = r.last_sent_on === today ? (r.sent_slots?.length ? r.sent_slots : [0]) : [];
				const nowMin = localMinutes(now, r.time_zone);
				const slot = times.findIndex((m, k) => m <= nowMin && !sentToday.includes(k));
				if (slot === -1) return;

				const topics = r.topics ?? [];
				const news = slot === 0 ? pickQuote(quotesByDay.get(today) ?? [], topics, today, r.categories) : null;
				const streak = liveStreak(r.streak_count, r.streak_last, today);
				const phrase = news ?? phraseForDay(r.categories, today, { slot, premium: access, topics });
				if (dryRun) return void sent++;
				try {
					await sendPush(r, {
						// Only the phrase — no author, vibe or streak. It goes in the body because iOS cuts the bold
						// title to one line; with an empty title the whole phrase is visible.
						title: '',
						body: pushHeadline(phrase, r.lang),
						id: phrase.id,
						streak,
						actions: ACTIONS[r.lang] ?? ACTIONS.en,
						url: !premium && slot === 0 && trialLeft <= 2 ? `/premium?utm_source=push_trial&left=${trialLeft}` : `/today?utm_source=push&slot=${slot}`
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
