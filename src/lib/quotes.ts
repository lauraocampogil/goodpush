import type { Phrase } from './data/phrases';
import type { CategoryId } from './data/categories';
import { TOPIC_CAT, isTopic, type TopicId } from './data/topics';
import { dayNumber } from './phrase';

/**
 * "In the news" quotes: real things athletes, founders… said this week.
 * You add them in Supabase → Table editor → `quotes` (with the source link) and
 * tick `approved`. On `publish_on`, people who picked that sub-topic get it
 * instead of the usual phrase (push + app).
 */
export type QuoteRow = {
	id: number;
	topic: string;
	author: string;
	quote_en: string | null;
	quote_es: string | null;
	quote_fr: string | null;
	source_url: string;
	publish_on: string;
};

export function quoteToPhrase(q: QuoteRow): Phrase | null {
	if (!isTopic(q.topic)) return null;
	// No translation yet → show the original words
	const original = q.quote_en || q.quote_es || q.quote_fr;
	if (!original) return null;
	return {
		id: `q${q.id}`,
		cat: TOPIC_CAT[q.topic],
		topic: q.topic,
		author: q.author,
		source: q.source_url,
		en: q.quote_en || original,
		es: q.quote_es || original,
		fr: q.quote_fr || original
	};
}

/** Same pick on the server (push) and in the app, so both show the same quote. */
export function pickQuote(quotes: Phrase[], topics: TopicId[], key: string, categories: CategoryId[] = []): Phrase | null {
	// Only quotes of sub-topics this person picked, inside categories they still follow
	const mine = quotes.filter((q) => q.topic && topics.includes(q.topic) && (!categories.length || categories.includes(q.cat))).sort((a, b) => (a.id < b.id ? -1 : 1));
	return mine.length ? mine[dayNumber(key) % mine.length] : null;
}

/** App: today's quote for this person, or null (never blocks longer than `ms`). */
export async function todaysQuote(day: string, topics: TopicId[], categories: CategoryId[] = [], ms = 1500): Promise<Phrase | null> {
	if (!topics.length) return null;
	const load = fetch(`/api/quotes?day=${day}`)
		.then((r) => (r.ok ? (r.json() as Promise<{ quotes: Phrase[] }>) : { quotes: [] }))
		.then(({ quotes }) => pickQuote(quotes, topics, day, categories))
		.catch(() => null);
	const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
	return Promise.race([load, timeout]);
}
