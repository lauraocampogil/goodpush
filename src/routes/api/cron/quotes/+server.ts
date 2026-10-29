import { error, json } from '@sveltejs/kit';
import { CRON_SECRET, QUOTES_MAX_TOPICS } from '$app/env/private';
import { isTopic, type TopicId } from '#lib/data/topics.ts';
import { dayKey, shiftDay } from '#lib/phrase.ts';
import { captureServer } from '#lib/server/analytics.ts';
import { findQuote, normalize, quoteFinderReady } from '#lib/server/quoteFinder.ts';
import { db } from '#lib/server/supabase.ts';
import type { RequestHandler } from './$types';

export const config = { maxDuration: 300 };

/**
 * Daily (≈03:00 UTC, before the first pushes): for the most-followed sub-topics,
 * Claude searches the news for a real quote; verified ones are published for today.
 * ?topic=football forces one topic · ?dry only searches, doesn't save.
 */
export const GET: RequestHandler = async ({ request, url }) => {
	if (!CRON_SECRET || request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) error(401, 'Unauthorized');
	const supabase = db();
	if (!supabase || !quoteFinderReady()) error(503, 'Supabase or ANTHROPIC_API_KEY not configured');

	const today = dayKey(new Date(), 'UTC');
	const dry = url.searchParams.has('dry');
	const forced = url.searchParams.get('topic');

	let topics: TopicId[];
	if (forced) {
		if (!isTopic(forced)) error(400, 'Unknown topic');
		topics = [forced];
	} else {
		const { data } = await supabase.from('topics_popularity').select('topic,subscribers').limit(QUOTES_MAX_TOPICS as number);
		topics = ((data ?? []) as { topic: string }[]).map((r) => r.topic).filter(isTopic);
	}
	if (!topics.length) return json({ ok: true, today, results: [], note: 'nobody picked a sub-topic yet' });

	// Skip topics that already have today's quote; avoid repeating the last 30 days
	const { data: recent } = await supabase
		.from('quotes')
		.select('topic,publish_on,quote_en,quote_es,quote_fr')
		.gte('publish_on', shiftDay(today, -30));
	const rows = (recent ?? []) as { topic: string; publish_on: string; quote_en: string | null; quote_es: string | null; quote_fr: string | null }[];
	const done = new Set(rows.filter((r) => r.publish_on === today).map((r) => r.topic));
	const seen = new Set(rows.flatMap((r) => [r.quote_en, r.quote_es, r.quote_fr]).filter(Boolean).map((t) => normalize(t!)));

	const results = await Promise.all(
		topics.map(async (topic) => {
			if (done.has(topic) && !forced) return { topic, status: 'already has one' };
			try {
				const { quote, reason, searches } = await findQuote(topic, today);
				if (!quote) return { topic, status: reason, searches };
				if (seen.has(normalize(quote.original))) return { topic, status: 'duplicate', searches };
				if (!dry) {
					const { error: e } = await supabase.from('quotes').insert({
						topic,
						author: quote.author.slice(0, 80),
						quote_en: quote.en.slice(0, 300),
						quote_es: quote.es.slice(0, 300),
						quote_fr: quote.fr.slice(0, 300),
						context: `[auto] ${quote.context ?? ''}`.slice(0, 200),
						source_url: quote.source_url,
						said_on: /^\d{4}-\d{2}-\d{2}$/.test(quote.said_on ?? '') ? quote.said_on : null,
						publish_on: today,
						approved: true
					});
					if (e) return { topic, status: `db: ${e.message}`, searches };
				}
				return { topic, status: 'published', author: quote.author, quote: quote.original, source: quote.source_url, searches };
			} catch (err) {
				return { topic, status: `error: ${(err as Error).message}` };
			}
		})
	);

	if (!dry)
		await captureServer([
			{
				event: 'quotes_run',
				distinct_id: 'goodpush-cron',
				properties: { today, topics, published: results.filter((r) => r.status === 'published').length, searches: results.reduce((n, r) => n + ((r as { searches?: number }).searches ?? 0), 0) }
			}
		]);
	return json({ ok: true, today, dry, results });
};
