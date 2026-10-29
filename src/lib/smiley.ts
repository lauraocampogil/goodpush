import type { CategoryId } from './data/categories';

/**
 * The GoodPush smiley — a flat, geometric sticker badge (one SVG source for
 * the UI, the share-card canvas, app icons and the OG image).
 * Colored disc · thick ink ring · pill eyes · U smile · little "shine" ticks.
 */
export type SmileyMood = 'smile' | 'wink' | 'calm';

/** Sticker palette — one color per category. */
export const STICKER = {
	orange: '#FF5B1F',
	yellow: '#FFB81C',
	green: '#2F7D4A',
	mint: '#9FDBBE',
	pink: '#F7A6C9',
	purple: '#6C4DA6',
	cream: '#EEE7D2',
	sun: '#F6E36B',
	ink: '#141414'
} as const;
export type StickerColor = keyof typeof STICKER;

export const CATEGORY_COLOR: Record<CategoryId, StickerColor> = {
	discipline: 'orange',
	calm: 'purple',
	sport: 'green',
	study: 'yellow',
	build: 'mint',
	faith: 'cream',
	selflove: 'pink'
};

export function smileySvg(mood: SmileyMood = 'smile', color: StickerColor | string = 'yellow'): string {
	const bg = (STICKER as Record<string, string>)[color] ?? color;
	const line = bg === STICKER.ink ? STICKER.cream : STICKER.ink;
	const eyes =
		mood === 'wink'
			? `<rect x="38" y="35" width="7.5" height="18" rx="3.75" fill="${line}"/>
			   <path d="M55 45.5h9" stroke="${line}" stroke-width="7" stroke-linecap="round"/>`
			: mood === 'calm'
				? `<path d="M36.5 45c2.4-3.4 7.6-3.4 10 0M53.5 45c2.4-3.4 7.6-3.4 10 0" fill="none" stroke="${line}" stroke-width="5.5" stroke-linecap="round"/>`
				: `<rect x="38" y="35" width="7.5" height="18" rx="3.75" fill="${line}"/>
			   <rect x="54.5" y="35" width="7.5" height="18" rx="3.75" fill="${line}"/>`;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
	<circle cx="50" cy="50" r="50" fill="${bg}"/>
	<circle cx="50" cy="50" r="33" fill="none" stroke="${line}" stroke-width="7"/>
	${eyes}
	<path d="M33 57.5c3.6 9.4 9.8 13.8 17 13.8s13.4-4.4 17-13.8" fill="none" stroke="${line}" stroke-width="7" stroke-linecap="round"/>
	<path d="M29.5 41.5h4.5M29 49.5h3.5${mood === 'smile' ? 'M66 41.5h4.5' : ''}" stroke="${line}" stroke-width="3" stroke-linecap="round" opacity=".9"/>
</svg>`;
}

/** Data URL for <img>/canvas use. */
export const smileyDataUrl = (mood: SmileyMood = 'smile', color: StickerColor | string = 'yellow') =>
	`data:image/svg+xml;charset=utf-8,${encodeURIComponent(smileySvg(mood, color))}`;
