import { CATEGORY_IDS, type CategoryId, type Lang } from './data/categories';
import { PHRASES, TOPIC_PHRASES, type Phrase } from './data/phrases';
import { TOPICS as CATEGORY_TOPICS, type TopicId } from './data/topics';
import { JOY, JOY_CAT, JOY_TOPIC } from './data/joy';

/** 'YYYY-MM-DD' for a given time zone (defaults to the device's). */
export function dayKey(date = new Date(), timeZone?: string): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(date);
}

/** Minutes since local midnight (08:15 → 495) in a time zone. */
export function localMinutes(date: Date, timeZone: string): number {
	const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date).split(':').map(Number);
	return h * 60 + m;
}

/** Local hour (0–23) in a time zone. */
export function localHour(date: Date, timeZone: string): number {
	const h = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(date);
	return Number(h);
}

export function dayNumber(key: string): number {
	const [y, m, d] = key.split('-').map(Number);
	return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function shiftDay(key: string, delta: number): string {
	const n = dayNumber(key) + delta;
	return new Date(n * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Deterministic phrase of the day. The server (push) and the app use the
 * same function, so the notification and the app always show the same phrase.
 */
export function phraseForDay(
	categories: CategoryId[],
	key: string,
	opts: { slot?: number; premium?: boolean; topics?: TopicId[] } = {}
): Phrase {
	const slot = opts.slot ?? 0;
	// The free daily push is a happy one-liner (GoodPush tone); the vibe still decides the card colour.
	if (slot === 0) {
		const cs = (categories.length ? categories : [...CATEGORY_IDS]).filter((c) => CATEGORY_IDS.includes(c));
		const n0 = dayNumber(key);
		const cat = cs[n0 % cs.length];
		// Your sub-topics first (2 days out of 3): football → football lines, exams → study lines…
		const mine = (opts.topics ?? []).filter((t) => JOY_TOPIC[t]?.length && (CATEGORY_TOPICS[cat] as readonly string[] | undefined)?.includes(t));
		const any = (opts.topics ?? []).filter((t) => JOY_TOPIC[t]?.length);
		const pickFrom = mine.length ? mine : any;
		if (pickFrom.length && n0 % 3 !== 2) {
			const k = n0 - Math.floor((n0 + 1) / 3); // counts only the topic days → a new line every time
			const t = pickFrom[k % pickFrom.length];
			const list = JOY_TOPIC[t];
			return { ...list[Math.floor(k / pickFrom.length) % list.length], cat, topic: t };
		}
		const pool = JOY_CAT[cat]?.length ? JOY_CAT[cat] : JOY.map((_, i) => i);
		return { ...JOY[pool[Math.floor(n0 / cs.length) % pool.length]], cat };
	}
	const cats = (categories.length ? categories : [...CATEGORY_IDS]).filter((c) =>
		CATEGORY_IDS.includes(c)
	);
	const n = dayNumber(key);
	const cat = cats[(n + slot) % cats.length];
	// Slot 0 is the free daily push. Premium extra slots (1, 2) draw from the Premium drops first.
	const all = PHRASES.filter((p) => p.cat === cat);
	const premiumPool = all.filter((p) => p.premium);
	const base =
		slot > 0 && opts.premium && premiumPool.length
			? premiumPool
			: all.filter((p) => !p.premium);
	// Picked sub-topics (e.g. football) are mixed in — twice, so they come up often.
	const picked = TOPIC_PHRASES.filter((p) => p.cat === cat && p.topic && opts.topics?.includes(p.topic));
	const pool = picked.length ? interleave(base, picked) : base;
	// Divide by number of categories so each category walks through its own list.
	return pool[(Math.floor(n / cats.length) + slot * 3) % pool.length];
}

/** base[0], topic[0], base[1], topic[1]… (topic list repeats) — stable order. */
function interleave(base: Phrase[], topic: Phrase[]): Phrase[] {
	const out: Phrase[] = [];
	base.forEach((p, k) => out.push(p, topic[k % topic.length]));
	return out;
}

export type Segment = { text: string; hl: boolean };

/** Splits "Do it *now*." into segments; the starred part is highlighted. */
export function segments(text: string): Segment[] {
	return text
		.split(/(\*[^*]+\*)/g)
		.filter(Boolean)
		.map((part) =>
			part.startsWith('*') && part.endsWith('*')
				? { text: part.slice(1, -1), hl: true }
				: { text: part, hl: false }
		);
}

export const plain = (text: string) => text.replace(/\*/g, '');

export function phraseText(p: Phrase, lang: Lang): string {
	return p[lang] || p.en || p.es || p.fr;
}

/** Notification body, personalised with the name when there is one. */
/** Notification text: just the phrase (no name), or “quote” — author. */
export function pushBody(p: Phrase, lang: Lang): string {
	const t = plain(phraseText(p, lang));
	return p.author ? `“${t}” — ${p.author}` : t;
}

const STREAK_WORD: Record<Lang, [string, string]> = { en: ['day streak', 'day streak'], es: ['día seguido', 'días seguidos'], fr: ['jour d’affilée', 'jours d’affilée'] };
/** Notification title: the streak when there is one (🔥 12 días seguidos), else the vibe. Never "GoodPush" (the phone already shows the app name). */
export function pushTitle(o: { lang: Lang; streak: number; label: string; kind: 'daily' | 'extra' | 'news' | 'movie' }): string {
	const icon = { daily: '', extra: '✦ ', news: '🗞 ', movie: '🎬 ' }[o.kind];
	if (o.streak > 0 && o.kind === 'daily') return `🔥 ${o.streak} ${STREAK_WORD[o.lang][o.streak === 1 ? 0 : 1]}`;
	return `${icon}${o.label}`;
}

/** Streak as it stands on `today` given the last visit day (alive if visited today or yesterday). */
export function liveStreak(count: number | null, last: string | null, today: string): number {
	if (!count || !last) return 0;
	return last === today || last === shiftDay(today, -1) ? count : 0;
}

/**
 * The notification's small second line (the phrase itself is the bold title, so it stands out among other apps):
 * 🔥 12 días seguidos · Disciplina — or just the vibe when there's no streak yet.
 */
export function pushMeta(o: { lang: Lang; streak: number; label: string; kind: 'daily' | 'extra' | 'news' | 'movie'; author?: string | null }): string {
	const icon = { daily: '', extra: '✦ ', news: '🗞 ', movie: '🎬 ' }[o.kind];
	const who = o.author ? `— ${o.author} · ` : '';
	if (o.streak > 0 && o.kind === 'daily') return `${who}🔥 ${o.streak} ${STREAK_WORD[o.lang][o.streak === 1 ? 0 : 1]} · ${o.label}`;
	return `${who}${icon}${o.label}`;
}
/** The phrase as a notification title (no quotes/author — the author goes in pushMeta). */
export function pushHeadline(p: Phrase, lang: Lang): string {
	return plain(phraseText(p, lang));
}
