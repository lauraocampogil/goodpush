import { ANTHROPIC_API_KEY, QUOTES_MODEL } from '$app/env/private';
import { PUBLIC_INSTAGRAM_URL, PUBLIC_SITE_URL, PUBLIC_TIKTOK_URL } from '$app/env/public';
import { CATEGORY_IDS, type Lang } from '#lib/data/categories.ts';
import { PHRASES, type Phrase } from '#lib/data/phrases.ts';
import { PICKS, pickUrl, type Pick } from '#lib/data/picks.ts';
import { isMovieTopic } from '#lib/data/topics.ts';
import { dayNumber, segments } from '#lib/phrase.ts';
import { quoteToPhrase, type QuoteRow } from '#lib/quotes.ts';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * "The Good Weekly" — written automatically every week, in each reader's language.
 * - Push of the week: from the phrase library (rotates through every vibe)
 * - Intro + 30-second habit: written by Claude when ANTHROPIC_API_KEY is set, otherwise from the tip bank below
 * - Movie line / In the news: real, verified quotes from the `quotes` table (cards are hidden if none)
 * - Pick of the week: rotates through the affiliate picks
 */

type L3 = Record<Lang, string>;
type Tip = { title: L3; body: L3 };

/** Fallback tips (used when there's no AI key). One per week, in rotation. */
const TIPS: Tip[] = [
	{
		title: { en: 'Make it so small you can’t say no', es: 'Hazlo tan pequeño que no puedas decir que no', fr: 'Rends-le si petit que tu ne peux pas dire non' },
		body: {
			en: 'Want to read more? Read one page. Just one. Tomorrow, one more. Starting is the hard part — so make starting ridiculous.',
			es: '¿Quieres leer más? Lee una página. Solo una. Mañana, otra. Lo difícil es empezar, así que haz que empezar sea ridículamente fácil.',
			fr: 'Tu veux lire plus ? Lis une page. Une seule. Demain, une autre. Le plus dur, c’est de commencer — alors rends le départ ridiculement facile.'
		}
	},
	{
		title: { en: 'Put it where you can see it', es: 'Ponlo donde lo veas', fr: 'Mets-le là où tu le vois' },
		body: {
			en: 'Gym bag by the door. Water bottle on the desk. Book on your pillow. Your environment decides more than your willpower.',
			es: 'La mochila del gym junto a la puerta. La botella de agua en el escritorio. El libro en la almohada. Tu entorno decide más que tu fuerza de voluntad.',
			fr: 'Le sac de sport près de la porte. La gourde sur le bureau. Le livre sur l’oreiller. Ton environnement décide plus que ta volonté.'
		}
	},
	{
		title: { en: 'Stack it on a habit you already have', es: 'Encadénalo a un hábito que ya tienes', fr: 'Accroche-le à une habitude que tu as déjà' },
		body: {
			en: '“After I pour my coffee, I write one line in my journal.” Hook the new habit onto something you already do every day.',
			es: '“Después de servirme el café, escribo una línea en mi diario.” Engancha el nuevo hábito a algo que ya haces cada día.',
			fr: '« Après mon café, j’écris une ligne dans mon carnet. » Accroche la nouvelle habitude à quelque chose que tu fais déjà chaque jour.'
		}
	},
	{
		title: { en: 'The 2-minute reset', es: 'El reset de 2 minutos', fr: 'Le reset de 2 minutes' },
		body: {
			en: 'Feeling overwhelmed? Set a timer for 2 minutes. Breathe in for 4, out for 6. Then pick the ONE next small step.',
			es: '¿Agobio? Pon un temporizador de 2 minutos. Inspira en 4, espira en 6. Después elige UN solo paso pequeño.',
			fr: 'Débordé ? Mets un minuteur de 2 minutes. Inspire sur 4, expire sur 6. Puis choisis UNE seule petite étape.'
		}
	},
	{
		title: { en: 'Never miss twice', es: 'Nunca falles dos veces', fr: 'Ne rate jamais deux fois' },
		body: {
			en: 'Missing one day is life. Missing two is the start of a new habit. Had a bad day? Make tomorrow tiny, but do it.',
			es: 'Fallar un día es la vida. Fallar dos es empezar un hábito nuevo. ¿Mal día? Que mañana sea pequeño, pero hazlo.',
			fr: 'Rater un jour, c’est la vie. Rater deux jours, c’est le début d’une nouvelle habitude. Mauvaise journée ? Fais petit demain, mais fais-le.'
		}
	},
	{
		title: { en: 'Write tomorrow tonight', es: 'Escribe mañana esta noche', fr: 'Écris demain ce soir' },
		body: {
			en: 'Before bed, write the 3 things that would make tomorrow a good day. You’ll wake up with a plan instead of a phone.',
			es: 'Antes de dormir, escribe las 3 cosas que harían de mañana un buen día. Te despertarás con un plan, no con el móvil.',
			fr: 'Avant de dormir, note les 3 choses qui feraient de demain une bonne journée. Tu te réveilleras avec un plan, pas avec ton téléphone.'
		}
	},
	{
		title: { en: 'Celebrate the small win', es: 'Celebra la pequeña victoria', fr: 'Fête la petite victoire' },
		body: {
			en: 'Did the thing? Say “nice” out loud. Silly, but your brain loves a reward — and it makes you want to come back.',
			es: '¿Lo hiciste? Di “bien” en voz alta. Parece tonto, pero a tu cerebro le encanta la recompensa y querrás repetir.',
			fr: 'Tu l’as fait ? Dis « bien joué » à voix haute. C’est bête, mais ton cerveau adore la récompense — et tu auras envie de recommencer.'
		}
	},
	{
		title: { en: 'Phone out of the bedroom', es: 'El móvil fuera de la habitación', fr: 'Le téléphone hors de la chambre' },
		body: {
			en: 'Charge it in another room for one week. Better sleep, calmer mornings — and you’ll still see your GoodPush.',
			es: 'Cárgalo en otra habitación durante una semana. Mejor sueño, mañanas más tranquilas — y seguirás viendo tu GoodPush.',
			fr: 'Charge-le dans une autre pièce pendant une semaine. Meilleur sommeil, matins plus calmes — et tu verras quand même ton GoodPush.'
		}
	},
	{
		title: { en: 'Tell one person', es: 'Cuéntaselo a una persona', fr: 'Dis-le à une personne' },
		body: {
			en: 'Share your goal with one friend and ask them to check in on Friday. A little accountability goes a long way.',
			es: 'Comparte tu objetivo con un amigo y pídele que te pregunte el viernes. Un poco de compromiso lo cambia todo.',
			fr: 'Partage ton objectif avec un ami et demande-lui de te relancer vendredi. Un peu de responsabilité change tout.'
		}
	},
	{
		title: { en: 'Done beats perfect', es: 'Hecho es mejor que perfecto', fr: 'Fait vaut mieux que parfait' },
		body: {
			en: 'Lower the bar to “good enough” and ship it. You can always improve something that exists.',
			es: 'Baja el listón a “suficientemente bueno” y entrégalo. Siempre puedes mejorar algo que ya existe.',
			fr: 'Baisse la barre à « assez bien » et livre-le. On peut toujours améliorer ce qui existe.'
		}
	},
	{
		title: { en: 'Move for 10 minutes', es: 'Muévete 10 minutos', fr: 'Bouge 10 minutes' },
		body: {
			en: 'A short walk, some stretches, a dance in the kitchen. Ten minutes of movement can change the mood of a whole day.',
			es: 'Un paseo corto, estiramientos, bailar en la cocina. Diez minutos de movimiento cambian el ánimo de todo el día.',
			fr: 'Une petite marche, quelques étirements, une danse dans la cuisine. Dix minutes de mouvement changent l’humeur de toute une journée.'
		}
	},
	{
		title: { en: 'Be kind to yourself', es: 'Sé amable contigo', fr: 'Sois gentil avec toi' },
		body: {
			en: 'Talk to yourself like you’d talk to your best friend. You wouldn’t call them lazy — you’d say “you’ve got this”.',
			es: 'Háblate como le hablarías a tu mejor amigo. No le dirías vago: le dirías “tú puedes”.',
			fr: 'Parle-toi comme tu parlerais à ton meilleur ami. Tu ne le traiterais pas de flemmard — tu lui dirais « tu vas y arriver ».'
		}
	}
];

const T = {
	subject: { en: 'Your push of the week 💛', es: 'Tu push de la semana 💛', fr: 'Ton push de la semaine 💛' },
	hey: { en: 'Hey', es: 'Hola', fr: 'Salut' },
	you: { en: 'you', es: 'tú', fr: 'toi' },
	potw: { en: 'your push of the week', es: 'tu push de la semana', fr: 'ton push de la semaine' },
	intro: {
		en: 'Read it once now. Read it again tonight. Little words, said often, become the way you think.',
		es: 'Léela una vez ahora. Y otra esta noche. Las palabras pequeñas, repetidas, se convierten en tu forma de pensar.',
		fr: 'Lis-la une fois maintenant. Et une autre ce soir. Les petits mots, répétés, deviennent ta façon de penser.'
	},
	habit: { en: '🔥 The 30-second habit', es: '🔥 El hábito de 30 segundos', fr: '🔥 L’habitude de 30 secondes' },
	movie: { en: '🎬 Movie line', es: '🎬 Frase de película', fr: '🎬 Réplique de film' },
	news: { en: '🗞 In the news', es: '🗞 De actualidad', fr: '🗞 Dans l’actu' },
	streak: { en: '🔥 Keep your streak alive', es: '🔥 Mantén tu racha', fr: '🔥 Garde ta série' },
	streakSub: {
		en: 'Open GoodPush once a day. That’s it. Miss a day and it starts again.',
		es: 'Abre GoodPush una vez al día. Nada más. Si fallas un día, empieza de nuevo.',
		fr: 'Ouvre GoodPush une fois par jour. C’est tout. Rate un jour et ça repart à zéro.'
	},
	cta: { en: 'Open today’s push →', es: 'Abrir el push de hoy →', fr: 'Ouvrir le push du jour →' },
	pick: { en: '📚 Pick of the week', es: '📚 Recomendación de la semana', fr: '📚 Le conseil de la semaine' },
	see: { en: 'See it →', es: 'Verlo →', fr: 'Voir →' },
	aff: {
		en: 'Affiliate link: we may earn a small commission, at no extra cost to you.',
		es: 'Enlace de afiliado: podemos ganar una pequeña comisión, sin coste extra para ti.',
		fr: 'Lien affilié : nous pouvons toucher une petite commission, sans surcoût pour toi.'
	},
	share: {
		en: 'Share GoodPush with someone who needs a push 💛',
		es: 'Comparte GoodPush con alguien que necesite un empujón 💛',
		fr: 'Partage GoodPush avec quelqu’un qui a besoin d’un coup de pouce 💛'
	},
	why: {
		en: 'You get this because you said yes to GoodPush emails.',
		es: 'Recibes esto porque aceptaste los emails de GoodPush.',
		fr: 'Tu reçois ceci car tu as accepté les emails GoodPush.'
	},
	unsub: { en: 'Unsubscribe', es: 'Darse de baja', fr: 'Se désabonner' },
	browser: { en: 'View in browser', es: 'Ver en el navegador', fr: 'Voir dans le navigateur' }
} satisfies Record<string, L3>;

export type Issue = {
	week: string;
	number: number;
	phrase: Phrase;
	intro: L3;
	tip: Tip;
	movie: Phrase | null;
	news: Phrase | null;
	pick: Pick;
};

/** Monday of the current week, e.g. 2026-11-02. */
export function weekKey(d = new Date()): string {
	const n = dayNumber(d.toISOString().slice(0, 10));
	const monday = n - ((new Date(n * 86_400_000).getUTCDay() + 6) % 7);
	return new Date(monday * 86_400_000).toISOString().slice(0, 10);
}

/** Claude writes the intro + tip (3 languages, no quotes of real people). */
async function aiCopy(phrase: Phrase, theme: string): Promise<{ intro: L3; tip: Tip } | null> {
	if (!ANTHROPIC_API_KEY) return null;
	try {
		const res = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
			body: JSON.stringify({
				model: QUOTES_MODEL,
				max_tokens: 1200,
				messages: [
					{
						role: 'user',
						content: `You write "The Good Weekly", the warm, short weekly email of GoodPush (one motivating phrase a day). Tone: a kind friend texting you, simple words, no clichés, no emojis except one at most.
This week's phrase: "${phrase.en.replace(/\*/g, '')}" (theme: ${theme}).
Write:
1) intro: 1–2 sentences on why this phrase matters this week.
2) tip: a "30-second habit" anyone can try today: a short title (max 8 words) and a body of 2–3 short sentences. Practical and safe (no medical advice). Do not quote or name real people.
Give each in English, Spanish (Spain) and French (natural, not literal).
Reply with ONLY JSON: {"intro":{"en":"","es":"","fr":""},"tip":{"title":{"en":"","es":"","fr":""},"body":{"en":"","es":"","fr":""}}}`
					}
				]
			}),
			signal: AbortSignal.timeout(60_000)
		});
		if (!res.ok) return null;
		const data = (await res.json()) as { content: { type: string; text?: string }[] };
		const text = data.content.map((b) => b.text ?? '').join('');
		const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
		const ok = (o: unknown): o is L3 => !!o && ['en', 'es', 'fr'].every((l) => typeof (o as L3)[l as Lang] === 'string' && (o as L3)[l as Lang].length > 3);
		if (ok(json.intro) && ok(json.tip?.title) && ok(json.tip?.body)) return json;
	} catch (err) {
		console.error('[newsletter] ai', err);
	}
	return null;
}

export async function buildIssue(supabase: SupabaseClient | null, week = weekKey()): Promise<Issue> {
	const number = Math.floor(dayNumber(week) / 7) - Math.floor(dayNumber('2026-10-26') / 7) + 1;
	const cat = CATEGORY_IDS[((number % CATEGORY_IDS.length) + CATEGORY_IDS.length) % CATEGORY_IDS.length];
	const pool = PHRASES.filter((p) => p.cat === cat && !p.premium);
	const phrase = pool[Math.abs(Math.floor(number / CATEGORY_IDS.length)) % pool.length];
	const picks = Object.values(PICKS).flat();
	const pick = picks[((number % picks.length) + picks.length) % picks.length];
	const fallbackTip = TIPS[((number % TIPS.length) + TIPS.length) % TIPS.length];

	let movie: Phrase | null = null;
	let news: Phrase | null = null;
	if (supabase) {
		const since = new Date(dayNumber(week) * 86_400_000 - 7 * 86_400_000).toISOString().slice(0, 10);
		const { data } = await supabase
			.from('quotes')
			.select('id,topic,author,quote_en,quote_es,quote_fr,source_url,publish_on')
			.eq('approved', true)
			.gte('publish_on', since)
			.order('publish_on', { ascending: false })
			.limit(50);
		const rows = (data ?? []) as QuoteRow[];
		movie = quoteToPhrase(rows.find((r) => isMovieTopic(r.topic)) ?? ({} as QuoteRow));
		news = quoteToPhrase(rows.find((r) => !isMovieTopic(r.topic)) ?? ({} as QuoteRow));
	}
	const ai = await aiCopy(phrase, cat);
	return { week, number, phrase, intro: ai?.intro ?? T.intro, tip: ai?.tip ?? fallbackTip, movie, news, pick };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Phrase with its *highlighted* word, as email-safe HTML. */
function phraseHtml(text: string) {
	return segments(text)
		.map((s) => (s.hl ? `<span style="background:#F6E36B;color:#141414;padding:0 6px;border-radius:6px;">${esc(s.text)}</span>` : esc(s.text)))
		.join('');
}

export function subject(lang: Lang) {
	return T.subject[lang];
}

/** Brevo merge tags: {{ contact.FIRSTNAME }}, {{ unsubscribe }}, {{ mirror }} */
export function renderIssue(issue: Issue, lang: Lang, site = PUBLIC_SITE_URL): string {
	const t = (k: keyof typeof T) => T[k][lang];
	const utm = `utm_source=newsletter&utm_campaign=week-${issue.number}`;
	const card = (bg: string, label: string, p: Phrase) => `
        <div style="background:${bg};border-radius:24px;padding:22px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">${label}</p>
          <p style="margin:0;font-size:17px;line-height:1.25;font-weight:900;">“${esc(p[lang])}”</p>
          <p style="margin:8px 0 0;font-size:12px;font-weight:600;opacity:.75;">${esc(p.author ?? '')}${p.source ? ` · <a href="${esc(p.source)}" style="color:#141414;">source</a>` : ''}</p>
        </div>`;
	const cards = [issue.movie && card('#F7A6C9', t('movie'), issue.movie), issue.news && card('#9FDBBE', t('news'), issue.news)].filter(Boolean) as string[];
	const cardsRow = !cards.length
		? ''
		: cards.length === 1
			? `<tr><td>${cards[0]}</td></tr><tr><td style="height:14px;line-height:14px;">&nbsp;</td></tr>`
			: `<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="50%" valign="top" style="padding-right:7px;">${cards[0]}</td>
      <td width="50%" valign="top" style="padding-left:7px;">${cards[1]}</td>
    </tr></table></td></tr><tr><td style="height:14px;line-height:14px;">&nbsp;</td></tr>`;

	return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light only"><title>The Good Weekly</title></head>
<body style="margin:0;padding:0;background:#F6E36B;">
<div style="display:none;max-height:0;overflow:hidden;color:#F6E36B;">${esc(issue.tip.title[lang])}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F6E36B;">
<tr><td align="center" style="padding:28px 12px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#141414;">
  <tr><td style="padding:0 6px 18px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="vertical-align:middle;"><img src="${site}/icons/icon-192.png" width="34" height="34" alt="" style="display:inline-block;vertical-align:middle;border-radius:50%;border:0;"><span style="display:inline-block;vertical-align:middle;margin-left:8px;font-weight:900;font-size:18px;letter-spacing:.04em;">GOODPUSH</span></td>
      <td align="right" style="vertical-align:middle;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.6;">The Good Weekly · #${issue.number}</td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#141414;border-radius:32px;padding:34px 28px 30px;color:#FBF8F1;">
    <p style="margin:0 0 18px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#F6E36B;">${t('hey')} {{ contact.FIRSTNAME | default:'${t('you')}' }} — ${t('potw')}</p>
    <p style="margin:0;font-size:38px;line-height:1.04;font-weight:900;text-transform:uppercase;letter-spacing:-.01em;">${phraseHtml(issue.phrase[lang])}</p>
    <p style="margin:22px 0 0;font-size:14px;line-height:1.55;color:#FBF8F1;opacity:.78;">${esc(issue.intro[lang])}</p>
  </td></tr>
  <tr><td style="height:14px;line-height:14px;">&nbsp;</td></tr>
  <tr><td style="background:#FBF8F1;border-radius:28px;padding:28px;">
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#FF5B1F;">${t('habit')}</p>
    <p style="margin:0 0 10px;font-size:22px;line-height:1.15;font-weight:900;">${esc(issue.tip.title[lang])}</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#3a3a3a;">${esc(issue.tip.body[lang])}</p>
  </td></tr>
  <tr><td style="height:14px;line-height:14px;">&nbsp;</td></tr>
  ${cardsRow}
  <tr><td align="center" style="background:#FF5B1F;border-radius:28px;padding:30px 24px;color:#141414;">
    <p style="margin:0 0 6px;font-size:26px;line-height:1.05;font-weight:900;">${t('streak')}</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.5;">${t('streakSub')}</p>
    <a href="${site}/today?${utm}" style="display:inline-block;background:#141414;color:#FBF8F1;text-decoration:none;font-weight:700;font-size:15px;padding:15px 28px;border-radius:999px;">${t('cta')}</a>
  </td></tr>
  <tr><td style="height:14px;line-height:14px;">&nbsp;</td></tr>
  <tr><td style="background:#FBF8F1;border-radius:24px;padding:20px 22px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="font-size:14px;line-height:1.45;"><span style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.6;">${t('pick')}</span><br><strong>${esc(issue.pick.title)} — ${esc(issue.pick.by)}</strong></td>
      <td align="right" style="padding-left:10px;"><a href="${esc(pickUrl(issue.pick))}" style="font-size:13px;font-weight:700;color:#141414;white-space:nowrap;">${t('see')}</a></td>
    </tr></table>
    <p style="margin:10px 0 0;font-size:11px;color:#888;">${t('aff')}</p>
  </td></tr>
  <tr><td align="center" style="padding:28px 10px 0;font-size:12px;line-height:1.6;color:#141414;">
    <p style="margin:0 0 6px;font-weight:700;">${t('share')}</p>
    <p style="margin:0 0 14px;"><a href="${PUBLIC_INSTAGRAM_URL}" style="color:#141414;">Instagram</a> · <a href="${PUBLIC_TIKTOK_URL}" style="color:#141414;">TikTok</a> · <a href="${site}/?${utm}" style="color:#141414;">GoodPush</a></p>
    <p style="margin:0;opacity:.6;">${t('why')}<br><a href="{{ unsubscribe }}" style="color:#141414;">${t('unsub')}</a> · <a href="{{ mirror }}" style="color:#141414;">${t('browser')}</a><br>Made with love by Unix Creative Studio · Brussels</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;
}
