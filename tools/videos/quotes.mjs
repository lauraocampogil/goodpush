// Real quotes from real people. `enOriginal` is copied word for word from a public-domain translation and was
// checked against the source text on Wikisource (Nov 2026). `en` (modern English) and `es` are our own faithful
// translations of those same passages — same meaning, today's words, so they hit on TikTok. Never add a quote here without checking it in its original source:
// motivational quotes are very often misattributed or invented.
//   Marcus Aurelius — "The Thoughts of the Emperor Marcus Aurelius Antoninus", tr. George Long (1862)
//   Seneca — "Moral letters to Lucilius", tr. Richard M. Gummere (1917–1925)
const MA = { who: 'Marcus Aurelius', whoEs: 'Marco Aurelio' };
const SE = { who: 'Seneca', whoEs: 'Séneca' };

export const QUOTES = [
	{ id: 'ma-10-16', ...MA, src: 'Meditations X.16', theme: 'discipline', en: 'Stop talking about what a good person should be. *Be one.*', enOriginal: 'No longer talk at all about the kind of man that a good man ought to be, but *be such.*', es: 'Deja de hablar de cómo debe ser una buena persona, y *sélo.*' },
	{ id: 'ma-12-17', ...MA, src: 'Meditations XII.17', theme: 'faith', en: 'If it’s not right, don’t do it. If it’s not true, *don’t say it.*', enOriginal: 'If it is not right, do not do it: if it is not true, *do not say it.*', es: 'Si no está bien, no lo hagas; si no es verdad, *no lo digas.*' },
	{ id: 'ma-7-67', ...MA, src: 'Meditations VII.67', theme: 'selflove', en: 'Very little is needed to *live a happy life.*', enOriginal: 'Very little indeed is necessary for *living a happy life.*', es: 'Muy poco es necesario para *vivir una vida feliz.*' },
	{ id: 'ma-6-6', ...MA, src: 'Meditations VI.6', theme: 'selflove', en: 'The best revenge is *not to become like the one who wronged you.*', enOriginal: 'The best way of avenging thyself is *not to become like the wrong-doer.*', es: 'La mejor venganza es *no parecerte a quien te hizo daño.*' },
	{ id: 'ma-5-20', ...MA, src: 'Meditations V.20', theme: 'build', en: 'What stands in the way *becomes the way.*', enOriginal: 'That which is an obstacle on the road *helps us on this road.*', es: 'Lo que es un obstáculo en el camino *nos ayuda a avanzar en él.*' },
	{ id: 'ma-8-47', ...MA, src: 'Meditations VIII.47', theme: 'calm', en: 'If something outside you is causing you pain, it’s not the thing that hurts you. *It’s your judgment of it.*', enOriginal: 'If thou art pained by any external thing, it is not this thing that disturbs thee, but *thy own judgment about it.*', es: 'Si algo de fuera te duele, no es eso lo que te perturba, sino *tu propio juicio sobre ello.*' },
	{ id: 'ma-2-5', ...MA, src: 'Meditations II.5', theme: 'discipline', en: 'Do every act of your life *as if it were your last.*', enOriginal: 'Do every act of thy life *as if it were the last.*', es: 'Haz cada acto de tu vida *como si fuera el último.*' },
	{ id: 'ma-5-1', ...MA, src: 'Meditations V.1', theme: 'discipline', en: 'In the morning, when you don’t want to get up, tell yourself: *I’m getting up to do the work of a human being.*', enOriginal: 'In the morning when thou risest unwillingly, let this thought be present: *I am rising to the work of a human being.*', es: 'Por la mañana, cuando te cueste levantarte, piensa: *me levanto para hacer el trabajo de un ser humano.*' },
	{ id: 'ma-8-16', ...MA, src: 'Meditations VIII.16', theme: 'study', en: 'Changing your mind and following the person who corrects you is *just as free* as staying wrong.', enOriginal: 'To change thy opinion and to follow him who corrects thy error is *as consistent with freedom* as it is to persist in thy error.', es: 'Cambiar de opinión y seguir a quien corrige tu error es *tan propio de la libertad* como persistir en él.' },
	{ id: 'ma-4-3b', ...MA, src: 'Meditations IV.3', theme: 'calm', en: 'Whenever you choose, you can *retreat into yourself.*', enOriginal: 'It is in thy power whenever thou shalt choose *to retire into thyself.*', es: 'Está en tu poder, cuando quieras, *retirarte dentro de ti.*' },
	{ id: 'ma-3-5', ...MA, src: 'Meditations III.5', theme: 'sport', en: 'Stand up straight. *On your own.* Not held up by others.', enOriginal: 'A man then must *stand erect,* not be kept erect by others.', es: 'Uno debe *mantenerse en pie* por sí mismo, no porque otros lo sostengan.' },
	{ id: 'se-13', ...SE, src: 'Letters to Lucilius 13', theme: 'calm', en: 'We are frightened more often than we are hurt. We suffer more *in imagination than in reality.*', enOriginal: 'There are more things likely to frighten us than there are to crush us; we suffer more often *in imagination than in reality.*', es: 'Hay más cosas que nos asustan que cosas que nos aplastan; sufrimos más a menudo *en la imaginación que en la realidad.*' },
	{ id: 'se-101', ...SE, src: 'Letters to Lucilius 101', theme: 'discipline', en: 'Start living now, and *count each day as a whole life.*', enOriginal: 'Begin at once to live, and *count each separate day as a separate life.*', es: 'Empieza a vivir ya, y *cuenta cada día como una vida entera.*' },
	{ id: 'se-1', ...SE, src: 'Letters to Lucilius 1', theme: 'study', en: 'Hold on to every hour. Seize today’s task and you’ll depend less on tomorrow. *While we put things off, life rushes by.*', enOriginal: 'Hold every hour in your grasp. Lay hold of to-day’s task, and you will not need to depend so much upon to-morrow’s. *While we are postponing, life speeds by.*', es: 'Aprovecha cada hora. Agarra la tarea de hoy y no dependerás tanto de la de mañana. *Mientras lo aplazamos, la vida pasa volando.*' },
	{ id: 'se-71', ...SE, src: 'Letters to Lucilius 71', theme: 'build', en: 'If you don’t know which harbour you’re sailing for, *no wind is the right wind.*', enOriginal: 'When a man does not know what harbour he is making for, *no wind is the right wind.*', es: 'Cuando uno no sabe a qué puerto va, *ningún viento es el bueno.*' },
	{ id: 'se-2', ...SE, src: 'Letters to Lucilius 2', theme: 'study', en: '*To be everywhere is to be nowhere.*', enOriginal: '*Everywhere means nowhere.*', es: '*Estar en todas partes es no estar en ninguna.*' },
	{ id: 'se-28', ...SE, src: 'Letters to Lucilius 28', theme: 'faith', en: 'I wasn’t born for one corner of the world. *The whole world is my home.*', enOriginal: 'I am not born for any one corner of the universe; *this whole world is my country.*', es: 'No he nacido para un solo rincón del universo; *el mundo entero es mi patria.*' }
];

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
/** A quote for a post: prefers the day's theme, rotates so the same one doesn't come back for weeks. */
export function quoteFor(theme, seed) {
	const pool = QUOTES.filter((q) => q.theme === theme);
	const list = pool.length >= 2 ? pool : QUOTES;
	return list[hash(seed) % list.length];
}
export const author = (q, lang) => (lang === 'es' ? q.whoEs ?? q.who : q.who);
export const srcOf = (q, lang) => (lang === 'es' ? q.src.replace('Meditations', 'Meditaciones').replace('Letters to Lucilius', 'Cartas a Lucilio') : q.src);
