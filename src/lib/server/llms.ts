import { PUBLIC_CONTACT_EMAIL, PUBLIC_INSTAGRAM_URL, PUBLIC_PREMIUM_PRICE, PUBLIC_SITE_URL, PUBLIC_TIKTOK_URL } from '$app/env/public';
import { CATEGORY_IDS, type Lang } from '#lib/data/categories.ts';
import { TOPICS, TOPIC_LABEL, isMovieTopic } from '#lib/data/topics.ts';
import { CATEGORY_LABEL, DICTS } from '#lib/i18n/dict.ts';
import { FAQ_COUNT } from '#lib/seo.ts';

const t = (lang: Lang, k: string) => (DICTS[lang] as Record<string, string>)[k] ?? k;

/** llms.txt (https://llmstxt.org) — a plain summary AI assistants can read and cite. `full` adds the FAQ in every language. */
export function llmsTxt(full = false) {
	const site = PUBLIC_SITE_URL.replace(/\/$/, '');
	const topics = CATEGORY_IDS.map((c) => {
		const subs = (TOPICS as Record<string, readonly string[]>)[c].filter((x) => !isMovieTopic(x)).map((x) => (TOPIC_LABEL as Record<string, Record<string, string>>).en[x] ?? x);
		return `- ${CATEGORY_LABEL.en[c]}${subs.length ? `: ${subs.join(', ')}` : ''}`;
	}).join('\n');
	const faq = (lang: Lang) => Array.from({ length: FAQ_COUNT }, (_, k) => `### ${t(lang, `faq.${k + 1}.q`)}\n${t(lang, `faq.${k + 1}.a`)}`).join('\n\n');

	return `# GoodPush

> GoodPush sends one short motivational phrase a day as a notification on your phone, in English, Spanish or French. It is an installable web app (PWA): no app store, works on iPhone and Android. 14 days free, then the GoodPush Pass costs ${PUBLIC_PREMIUM_PRICE} per year.

GoodPush is made in Brussels, Belgium. People pick the kind of push they need and the time they want it; every day at that time a notification arrives with a phrase for them. Each topic also mixes in lines inspired by films, and some topics get real quotes from the news (each one verified against its published source and shown with the person's name and the source).

## Key facts
- What: one motivational phrase a day, delivered as a push notification
- Languages: English, Spanish (Español), French (Français)
- Platforms: iPhone (iOS 16.4+, after "Add to Home Screen"), Android, desktop browsers — no app store download
- Price: free for 14 days (no card), then ${PUBLIC_PREMIUM_PRICE}/year (GoodPush Pass); cancel anytime
- Account: free, with Google or a one-time code sent by email; no phone number
- Features: streaks (shown on the app icon badge), favorites, history, share a phrase as an image/Story, choose topics and time, pause anytime
- Privacy policy: ${site}/privacy
- Contact: ${PUBLIC_CONTACT_EMAIL}

## Topics
${topics}

## Pages
- [Home](${site}/): what GoodPush is, how it works, pricing, FAQ (add ?lang=en, ?lang=es or ?lang=fr)
- [GoodPush Pass](${site}/premium): what the yearly pass includes
- [Privacy policy](${site}/privacy)
- [Terms](${site}/terms)
- [Service status](${site}/status)

## Social
- Instagram: ${PUBLIC_INSTAGRAM_URL}
- TikTok: ${PUBLIC_TIKTOK_URL}

## FAQ
${faq('en')}
${full ? `\n## Preguntas frecuentes (Español)\n${faq('es')}\n\n## Questions fréquentes (Français)\n${faq('fr')}\n\n## En español\n${t('es', 'meta.description')}\n\n## En français\n${t('fr', 'meta.description')}\n` : `\n## Optional\n- [Full version, all languages](${site}/llms-full.txt)\n`}`;
}
