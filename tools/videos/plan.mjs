// GoodPush content plan generator — any week, forever. Same rules as the Sheets calendar
// (build_calendar.py): one theme per weekday, 3 slots a day, phrases rotate through the library.
//   planRange('2026-11-02', 7) → [{ date, slot, theme, format, hook, phrases, caption, hashtags, publish }]
// `auto: true` (used by the robot) swaps formats that need a human for ones it can make alone:
//   C (screen recording) → R (real footage) · some D evenings → R.
import { PHRASES, TOPIC_PHRASES } from '../../src/lib/data/phrases.ts';

const LANGS = ['en', 'es', 'fr'];
const P = [...PHRASES, ...TOPIC_PHRASES].filter((p) => !p.premium);
const clean = (t) => t.replace(/\*/g, '');

const THEMES = ['discipline', 'study', 'calm', 'sport', 'build', 'selflove', 'faith']; // Mon..Sun
const TL = {
	discipline: ['Discipline', 'Disciplina', 'Discipline'], study: ['Study', 'Estudios', 'Études'], calm: ['Calm', 'Calma', 'Calme'],
	sport: ['Sport', 'Deporte', 'Sport'], build: ['Build', 'Emprender', 'Entreprendre'], selflove: ['Self-love', 'Amor propio', 'Amour de soi'], faith: ['Faith', 'Fe', 'Foi']
};
const HOOK = {
	A: ['Your push for today 🔔', 'Tu push de hoy 🔔', 'Ton push du jour 🔔'],
	B: ['Which one do you need today? 1, 2 or 3', '¿Cuál necesitas hoy? 1, 2 o 3', "Lequel il te faut aujourd'hui ? 1, 2 ou 3"],
	C: ['POV: your phone motivates you every morning', 'POV: tu móvil te motiva cada mañana', 'POV : ton téléphone te motive chaque matin'],
	D: ['Read this before you give up', 'Lee esto antes de rendirte', "Lis ça avant d'abandonner"],
	R: ['Read this before you give up', 'Lee esto antes de rendirte', "Lis ça avant d'abandonner"],
	E: ['{t}: 4 reminders you needed', '{t}: 4 frases que necesitabas', '{t} : 4 rappels dont tu avais besoin'],
	F: ['Day {n} of a good push every day 🔥', 'Día {n} recibiendo un buen empujón 🔥', "Jour {n} d'un bon push chaque jour 🔥"]
};
// "Cine" posts (R) talk like TikTok, not like an ad — one hook per day, rotating
const HOOK_R = [
	['pov: you needed to hear this today', 'pov: necesitabas leer esto hoy', "pov : tu avais besoin de lire ça aujourd'hui"],
	['save this for the hard days', 'guárdalo para los días difíciles', 'garde ça pour les jours difficiles'],
	['a reminder for whoever needs it', 'para quien lo necesite', "pour celui ou celle qui en a besoin"],
	["if you're seeing this, it's for you", 'si te sale esto, es para ti', "si tu vois ça, c'est pour toi"],
	['read this twice', 'léelo dos veces', 'lis ça deux fois'],
	["this one's for the overthinkers", 'para los que piensan demasiado', 'pour ceux qui réfléchissent trop'],
	['the sign you asked for', 'la señal que pedías', 'le signe que tu attendais']
];
const CLOSER = [['Now go get it.', 'Ahora ve a por ello.', 'Maintenant, vas-y.'], ["You've got this.", 'Tú puedes.', 'Tu peux le faire.'], ['Start today.', 'Empieza hoy.', "Commence aujourd'hui."]];
const CTA_LINE = ['Get one every day on your lock screen — link in bio. 14 days free.', 'Recibe una cada día en tu pantalla de bloqueo — link en la bio. 14 días gratis.', 'Reçois-en une chaque jour sur ton écran verrouillé — lien en bio. 14 jours gratuits.'];
const SOFT = ['Save it for later 💛', 'Guárdala para luego 💛', 'Garde-la pour plus tard 💛'];
const SHARE = ['Send this to someone who needs it 💛', 'Envíaselo a quien lo necesite 💛', "Envoie-le à quelqu'un qui en a besoin 💛"];
const ASK = ['Comment your number 👇', 'Comenta tu número 👇', 'Commente ton numéro 👇'];
const HASH_BASE = ['#motivation #dailymotivation #mindset #goodpush', '#motivación #frasesmotivadoras #mentalidad #goodpush', '#motivation #citationdujour #mindset #goodpush'];
const HASH_THEME = {
	discipline: ['#discipline #habits #selfimprovement', '#disciplina #habitos #superacion', '#discipline #habitudes #developpementpersonnel'],
	study: ['#studymotivation #studytok #exams', '#estudiar #motivacionestudio #examenes', '#motivationetudes #etudiant #examens'],
	calm: ['#calm #anxietyrelief #mentalhealth', '#calma #ansiedad #saludmental', '#calme #anxiete #santementale'],
	sport: ['#gymmotivation #fitnessmotivation #football', '#motivaciondeportiva #gym #futbol', '#motivationsport #salledesport #foot'],
	build: ['#entrepreneur #startup #buildinpublic', '#emprendedor #emprendimiento #negocios', '#entrepreneur #startup #business'],
	selflove: ['#selflove #confidence #healing', '#amorpropio #autoestima #sanar', '#amourdesoi #confianceensoi #guerison'],
	faith: ['#gratitude #hope #faith', '#gratitud #esperanza #fe', '#gratitude #espoir #foi']
};

/** When each account posts — local time of its audience. */
export const SCHEDULE = {
	en: { tz: 'America/New_York', Morning: '08:00', Midday: '12:00', Evening: '17:00' },
	es: { tz: 'Europe/Madrid', Morning: '08:00', Midday: '14:00', Evening: '21:00' },
	fr: { tz: 'Europe/Paris', Morning: '07:30', Midday: '12:30', Evening: '20:30' }
};

/** Local wall-clock time in a time zone → UTC ISO string (DST-safe). */
export function zonedToUtc(date, hhmm, tz) {
	const [h, m] = hhmm.split(':').map(Number);
	const guess = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10), h, m);
	const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
	const asLocal = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
	return new Date(guess - (asLocal - guess)).toISOString();
}

export const START = '2026-11-02';
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const weekday = (d) => (new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7; // Mon=0

/** Rows for [from, from+days). Deterministic: always simulated from START so rotations never repeat early. */
export function planRange(from, days = 7, { auto = false } = {}) {
	const to = addDays(from, days);
	const used = {};
	const take = (theme, k) => {
		const pool = P.filter((p) => p.cat === theme);
		const i = used[theme] ?? 0;
		used[theme] = i + k;
		return Array.from({ length: k }, (_, j) => pool[(i + j) % pool.length]);
	};
	const rows = [];
	let streak = 0;
	for (let date = START; date < to; date = addDays(date, 1)) {
		const wd = weekday(date);
		const theme = THEMES[wd];
		const morning = wd === 6 ? 'F' : 'A';
		const mid = wd === 1 || wd === 4 ? 'C' : 'B';
		const eve = wd === 2 || wd === 5 ? 'E' : 'D';
		for (const [slot, f0] of [['Morning', morning], ['Midday', mid], ['Evening', eve]]) {
			// Robot mode: K = fast cuts + voice-over + big captions (the TikTok edit style) on most slots.
			// Brand formats keep a few: A on Mon/Thu mornings, B quiz middays, E carousels Wed/Sat evenings, F streak on Sundays.
			const format = !auto ? f0 : f0 === 'C' || f0 === 'D' ? 'K' : f0 === 'A' && ![0, 3].includes(wd) ? 'K' : f0;
			const n = format === 'B' || format === 'K' ? 3 : format === 'E' ? 4 : 1;
			const ph = take(theme, n);
			if (f0 === 'F') streak += 7;
			if (date < from) continue;
			const cta = ['A', 'C', 'E', 'F', 'K'].includes(format);
			const L = (fn) => Object.fromEntries(LANGS.map((l, li) => [l, fn(l, li)]));
			const dayN = Math.round((Date.parse(date) - Date.parse(START)) / 864e5);
			const hookSrc = format === 'R' || format === 'K' ? HOOK_R[(dayN * 3 + ['Morning', 'Midday', 'Evening'].indexOf(slot)) % HOOK_R.length] : HOOK[format];
			const hook = L((l, li) => hookSrc[li].replace('{t}', TL[theme][li]).replace('{n}', String(streak || 7)));
			rows.push({
				date, slot, theme, format, streak: format === 'F' ? streak : 0,
				hook,
				phrases: ph.map((p) => ({ id: p.id, en: p.en, es: p.es, fr: p.fr })),
				caption: L((l, li) => `${n === 1 || format === 'K' ? clean(ph[0][l]) : hook[l]}\n\n${cta ? CTA_LINE[li] : format === 'B' ? ASK[li] : format === 'R' ? SHARE[li] : SOFT[li]}`),
				...(format === 'K' ? { script: L((l, li) => [((h) => `${h[0].toUpperCase()}${h.slice(1)}.`)(hook[l].replace(/^pov ?: ?/i, '')).replace(/([.!?])\.$/, '$1'), ...ph.map((p) => p[l]), CLOSER[dayN % CLOSER.length][li]]) } : {}),
				hashtags: L((l, li) => `${HASH_THEME[theme][li]} ${HASH_BASE[li]}`),
				publish: L((l) => zonedToUtc(date, SCHEDULE[l][slot], SCHEDULE[l].tz))
			});
		}
	}
	return rows;
}
