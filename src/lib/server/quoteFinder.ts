import { ANTHROPIC_API_KEY, QUOTES_MODEL } from '$app/env/private';
import { TOPIC_CAT, TOPIC_LABEL, isMovieTopic, type TopicId } from '#lib/data/topics.ts';
import { CATEGORY_LABEL } from '#lib/i18n/dict.ts';

/**
 * Finds ONE real, recent, uplifting quote for a sub-topic with Claude + web search,
 * then checks it against the source before we publish it.
 *
 * Never invents words for real people: a quote is kept only if its exact words
 * are found in the article (or in the passage Claude cited from it).
 */
export type FoundQuote = {
	author: string;
	original: string;
	original_lang: 'en' | 'es' | 'fr' | 'other';
	en: string;
	es: string;
	fr: string;
	source_url: string;
	said_on: string | null;
	context: string;
};

type Block =
	| { type: 'text'; text: string; citations?: { url: string; cited_text?: string }[] }
	| { type: string; [k: string]: unknown };

export const quoteFinderReady = () => !!ANTHROPIC_API_KEY;

const JSON_SHAPE = `{"found": true, "author": "Full Name", "original": "exact words in the original language", "original_lang": "en|es|fr|other", "en": "faithful English translation (or the original if English)", "es": "faithful Spanish translation", "fr": "faithful French translation", "source_url": "https://… the page where the exact words appear", "said_on": "YYYY-MM-DD or null", "context": "one short line"}
or {"found": false}`;

function moviePrompt(topic: TopicId, today: string, avoid: string[]) {
	const theme = CATEGORY_LABEL.en[TOPIC_CAT[topic]].toLowerCase();
	return `Today is ${today}. You curate GoodPush, an app that sends one uplifting line per day. This person follows the theme "${theme}".

Find ONE famous line of dialogue from a well-known film (any era, live action or animation) that fits the theme "${theme}" — the kind of line people quote to push themselves.

Hard rules:
- EXACT dialogue as written on a reliable quote page (Wikiquote, IMDb quotes, or a reputable article) that you found with search. Never paraphrase or invent.
- One or two sentences, max 180 characters. Uplifting, safe for all ages, no violence or swearing.
- Not one of these (already used): ${avoid.length ? avoid.slice(0, 30).join(' | ') : 'none'}.
- "author" must be "Character · Film title (year)". "said_on" is null. "context": one short line about the scene.

Reply with ONLY one JSON object, no markdown:
${JSON_SHAPE}`;
}

function prompt(topic: TopicId, today: string, avoid: string[] = []) {
	if (isMovieTopic(topic)) return moviePrompt(topic, today, avoid);
	const name = TOPIC_LABEL.en[topic];
	return `Today is ${today}. You curate GoodPush, an app that sends one uplifting line per day.

Search the news for ONE real quote said in the last 7 days by a well-known person in "${name}" (athlete, coach, founder, artist, scientist… whatever fits the topic) that is motivating, positive or inspiring for ordinary people.

Hard rules:
- It must be the person's EXACT words as printed in a reputable news article you found (interview, press conference, post-match reaction…). Never paraphrase, never combine sentences, never invent.
- Short: max 180 characters in the original language.
- Positive and safe: no politics, religion debates, insults, injuries/death, betting, scandals or trash talk.
- Prefer famous names people follow right now.
- If you cannot find one that meets every rule, say so.

Reply with ONLY one JSON object, no markdown:
${JSON_SHAPE}`;
}

/** Lowercase, no accents, no punctuation/quotes, single spaces. */
export const normalize = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();

function parseJson(text: string): Record<string, unknown> | null {
	const m = text.match(/\{[\s\S]*\}/);
	if (!m) return null;
	try {
		return JSON.parse(m[0]);
	} catch {
		return null;
	}
}

async function pageText(url: string): Promise<string> {
	try {
		const res = await fetch(url, {
			headers: { 'user-agent': 'Mozilla/5.0 (compatible; GoodPushBot/1.0; +https://goodpush.app)' },
			signal: AbortSignal.timeout(8000),
			redirect: 'follow'
		});
		if (!res.ok) return '';
		const html = await res.text();
		return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
	} catch {
		return '';
	}
}

/** The exact words must appear in the article, or in what Claude cited from it. */
async function verify(q: FoundQuote, citations: { url: string; cited_text?: string }[]): Promise<boolean> {
	const words = normalize(q.original);
	if (words.length < 12) return false;
	const page = normalize(await pageText(q.source_url));
	if (page.includes(words)) return true;
	// Paywalls / bot blocks: accept only if a cited passage contains the full quote (or a long exact chunk of it)
	const chunk = words.length > 60 ? words.slice(0, 60) : words;
	return citations.some((c) => {
		const cited = normalize(c.cited_text ?? '');
		return cited.includes(chunk) || (cited.length >= Math.max(40, words.length * 0.7) && words.includes(cited));
	});
}

export async function findQuote(topic: TopicId, today: string, avoid: string[] = []): Promise<{ quote: FoundQuote | null; reason: string; searches: number }> {
	const res = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'x-api-key': ANTHROPIC_API_KEY!,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model: QUOTES_MODEL,
			max_tokens: 1500,
			tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
			messages: [{ role: 'user', content: prompt(topic, today, avoid) }]
		}),
		signal: AbortSignal.timeout(90_000)
	});
	if (!res.ok) return { quote: null, reason: `api ${res.status}: ${(await res.text()).slice(0, 200)}`, searches: 0 };
	const data = (await res.json()) as { content: Block[]; usage?: { server_tool_use?: { web_search_requests?: number } } };
	const searches = data.usage?.server_tool_use?.web_search_requests ?? 0;
	const texts = data.content.filter((b): b is Extract<Block, { type: 'text' }> => b.type === 'text');
	const citations = texts.flatMap((t) => t.citations ?? []);
	const json = parseJson(texts.map((t) => t.text).join('\n'));
	if (!json || json.found !== true) return { quote: null, reason: 'none found', searches };

	const q = json as unknown as FoundQuote;
	const ok =
		typeof q.author === 'string' &&
		typeof q.original === 'string' &&
		q.original.length <= 220 &&
		typeof q.source_url === 'string' &&
		/^https:\/\//.test(q.source_url) &&
		['en', 'es', 'fr'].every((l) => typeof q[l as 'en'] === 'string' && q[l as 'en'].length > 0);
	if (!ok) return { quote: null, reason: 'bad format', searches };
	if (!(await verify(q, citations))) return { quote: null, reason: 'not verified in source', searches };
	// Original language keeps the exact words
	if (q.original_lang === 'en' || q.original_lang === 'es' || q.original_lang === 'fr') q[q.original_lang] = q.original;
	return { quote: q, reason: 'ok', searches };
}
