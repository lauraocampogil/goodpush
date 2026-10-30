import { PUBLIC_AMAZON_TAG } from '$app/env/public';
import type { CategoryId } from './categories';

/**
 * Affiliate recommendations, one per category (add more freely).
 * Links go to an Amazon search with your Associates tag. Swap `url` for any
 * other affiliate link (Bol.com, a journal brand, an app...) when you have one.
 */
export type Pick = { title: string; by: string; query: string; url?: string };

export const AMAZON_DOMAIN = 'https://www.amazon.com.be';

export const PICKS: Record<CategoryId, Pick[]> = {
	discipline: [{ title: 'Atomic Habits', by: 'James Clear', query: 'Atomic Habits James Clear' }],
	calm: [{ title: 'Wherever You Go, There You Are', by: 'Jon Kabat-Zinn', query: 'Wherever You Go There You Are Kabat-Zinn' }],
	sport: [{ title: 'Relentless', by: 'Tim S. Grover', query: 'Relentless Tim Grover' }],
	study: [{ title: 'Deep Work', by: 'Cal Newport', query: 'Deep Work Cal Newport' }],
	build: [{ title: 'The Mom Test', by: 'Rob Fitzpatrick', query: 'The Mom Test Rob Fitzpatrick' }],
	faith: [{ title: 'A 5-minute gratitude journal', by: 'Journal', query: 'five minute journal' }],
	selflove: [{ title: 'The Gifts of Imperfection', by: 'Brené Brown', query: 'The Gifts of Imperfection Brene Brown' }],
	movies: [{ title: 'Rocky — the complete saga', by: 'Blu-ray', query: 'Rocky complete saga blu-ray' }]
};

export function pickUrl(p: Pick): string {
	if (p.url) return p.url;
	const tag = PUBLIC_AMAZON_TAG ? `&tag=${encodeURIComponent(PUBLIC_AMAZON_TAG)}` : '';
	return `${AMAZON_DOMAIN}/s?k=${encodeURIComponent(p.query)}${tag}`;
}
