import type { CategoryId, Lang } from './categories';

/**
 * Sub-topics inside each vibe. Optional: they make the daily phrase more specific
 * and unlock "in the news" quotes (real quotes you add in Supabase → table `quotes`).
 * Keep ids stable forever — they are stored on devices and in the database.
 */
export const TOPICS = {
	discipline: ['habits', 'mornings', 'focus'],
	calm: ['anxiety', 'sleep', 'mindfulness'],
	sport: ['football', 'basketball', 'tennis', 'running', 'gym', 'combat', 'cycling', 'f1'],
	study: ['exams', 'languages', 'university'],
	build: ['startup', 'creator', 'career'],
	faith: ['gratitude', 'hope', 'prayer'],
	selflove: ['confidence', 'body', 'heartbreak']
} as const satisfies Record<CategoryId, readonly string[]>;

export type TopicId = (typeof TOPICS)[CategoryId][number];

export const ALL_TOPICS = Object.values(TOPICS).flat() as TopicId[];

export const TOPIC_CAT = Object.fromEntries(
	(Object.entries(TOPICS) as [CategoryId, readonly TopicId[]][]).flatMap(([c, ts]) => ts.map((t) => [t, c]))
) as Record<TopicId, CategoryId>;

export const isTopic = (v: unknown): v is TopicId => typeof v === 'string' && (ALL_TOPICS as string[]).includes(v);

export const TOPIC_EMOJI: Record<TopicId, string> = {
	habits: '🔁',
	mornings: '🌅',
	focus: '🎯',
	anxiety: '🫧',
	sleep: '😴',
	mindfulness: '🧘',
	football: '⚽',
	basketball: '🏀',
	tennis: '🎾',
	running: '🏃',
	gym: '🏋️',
	combat: '🥊',
	cycling: '🚴',
	f1: '🏎️',
	exams: '📝',
	languages: '🗣️',
	university: '🎓',
	startup: '🚀',
	creator: '🎬',
	career: '💼',
	gratitude: '🌻',
	hope: '🌈',
	prayer: '🙏',
	confidence: '💪',
	body: '🫶',
	heartbreak: '💔'
};

export const TOPIC_LABEL: Record<Lang, Record<TopicId, string>> = {
	en: {
		habits: 'Habits',
		mornings: 'Mornings',
		focus: 'Focus',
		anxiety: 'Anxiety',
		sleep: 'Sleep',
		mindfulness: 'Mindfulness',
		football: 'Football',
		basketball: 'Basketball',
		tennis: 'Tennis',
		running: 'Running',
		gym: 'Gym',
		combat: 'Boxing & fight',
		cycling: 'Cycling',
		f1: 'Formula 1',
		exams: 'Exams',
		languages: 'Languages',
		university: 'University',
		startup: 'Startup',
		creator: 'Content creator',
		career: 'Career',
		gratitude: 'Gratitude',
		hope: 'Hope',
		prayer: 'Prayer',
		confidence: 'Confidence',
		body: 'Body image',
		heartbreak: 'Heartbreak'
	},
	es: {
		habits: 'Hábitos',
		mornings: 'Mañanas',
		focus: 'Concentración',
		anxiety: 'Ansiedad',
		sleep: 'Dormir',
		mindfulness: 'Mindfulness',
		football: 'Fútbol',
		basketball: 'Baloncesto',
		tennis: 'Tenis',
		running: 'Running',
		gym: 'Gimnasio',
		combat: 'Boxeo y lucha',
		cycling: 'Ciclismo',
		f1: 'Fórmula 1',
		exams: 'Exámenes',
		languages: 'Idiomas',
		university: 'Universidad',
		startup: 'Startup',
		creator: 'Creador de contenido',
		career: 'Carrera',
		gratitude: 'Gratitud',
		hope: 'Esperanza',
		prayer: 'Oración',
		confidence: 'Confianza',
		body: 'Mi cuerpo',
		heartbreak: 'Ruptura'
	},
	fr: {
		habits: 'Habitudes',
		mornings: 'Matins',
		focus: 'Concentration',
		anxiety: 'Anxiété',
		sleep: 'Sommeil',
		mindfulness: 'Pleine conscience',
		football: 'Football',
		basketball: 'Basket',
		tennis: 'Tennis',
		running: 'Course à pied',
		gym: 'Salle de sport',
		combat: 'Boxe et combat',
		cycling: 'Vélo',
		f1: 'Formule 1',
		exams: 'Examens',
		languages: 'Langues',
		university: 'Université',
		startup: 'Startup',
		creator: 'Créateur de contenu',
		career: 'Carrière',
		gratitude: 'Gratitude',
		hope: 'Espoir',
		prayer: 'Prière',
		confidence: 'Confiance',
		body: 'Image de soi',
		heartbreak: 'Rupture'
	}
};
