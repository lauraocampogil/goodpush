export const CATEGORY_IDS = [
	'discipline',
	'calm',
	'sport',
	'study',
	'build',
	'faith',
	'selflove'
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type Lang = 'en' | 'es' | 'fr';
export const LANGS: Lang[] = ['en', 'es', 'fr'];

export const CATEGORY_EMOJI: Record<CategoryId, string> = {
	discipline: '🔥',
	calm: '🌙',
	sport: '⚽',
	study: '📚',
	build: '🚀',
	faith: '🙏',
	selflove: '💗'
};

/** Hours offered in onboarding / settings (local time of the user). */
export const SEND_HOURS = [6, 7, 8, 9, 12, 18, 21] as const;
