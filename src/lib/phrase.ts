import { CATEGORY_IDS, type CategoryId, type Lang } from './data/categories';
import { PHRASES, type Phrase } from './data/phrases';

/** 'YYYY-MM-DD' for a given time zone (defaults to the device's). */
export function dayKey(date = new Date(), timeZone?: string): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(date);
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
export function phraseForDay(categories: CategoryId[], key: string): Phrase {
	const cats = (categories.length ? categories : [...CATEGORY_IDS]).filter((c) =>
		CATEGORY_IDS.includes(c)
	);
	const n = dayNumber(key);
	const cat = cats[n % cats.length];
	const pool = PHRASES.filter((p) => p.cat === cat);
	// Divide by number of categories so each category walks through its own list.
	return pool[Math.floor(n / cats.length) % pool.length];
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
	return p[lang] ?? p.en;
}

/** Notification body, personalised with the name when there is one. */
export function pushBody(p: Phrase, lang: Lang, name?: string | null): string {
	const t = plain(phraseText(p, lang));
	return name ? `${name}, ${t.charAt(0).toLowerCase()}${t.slice(1)}` : t;
}
