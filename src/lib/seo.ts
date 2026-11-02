import { PUBLIC_CONTACT_EMAIL, PUBLIC_INSTAGRAM_URL, PUBLIC_PREMIUM_PRICE, PUBLIC_SITE_URL, PUBLIC_TIKTOK_URL } from '$app/env/public';
import { CATEGORY_IDS, type Lang } from '#lib/data/categories.ts';
import { CATEGORY_LABEL, DICTS } from '#lib/i18n/dict.ts';

/** "4,99 €" → "4.99" for schema.org */
export const priceNumber = () => (PUBLIC_PREMIUM_PRICE.match(/[\d.,]+/)?.[0] ?? '4.99').replace(',', '.');
export const FAQ_COUNT = 4;

/**
 * schema.org JSON-LD for the home page: who we are, what the app is, what it costs, the FAQ.
 * Search engines and AI assistants (ChatGPT, Perplexity, Gemini, Claude) read this to describe GoodPush.
 */
export function structuredData(lang: Lang, t: (k: string) => string = (k) => (DICTS[lang] as Record<string, string>)[k]) {
	const site = PUBLIC_SITE_URL.replace(/\/$/, '');
	const org = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		'@id': `${site}/#org`,
		name: 'GoodPush',
		url: site,
		logo: `${site}/brand/goodpush-app-icon.png`,
		email: PUBLIC_CONTACT_EMAIL,
		foundingLocation: { '@type': 'Place', name: 'Brussels, Belgium' },
		sameAs: [PUBLIC_INSTAGRAM_URL, PUBLIC_TIKTOK_URL]
	};
	const website = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': `${site}/#website`,
		name: 'GoodPush',
		url: site,
		inLanguage: ['en', 'es', 'fr'],
		publisher: { '@id': `${site}/#org` }
	};
	const app = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		'@id': `${site}/#app`,
		name: 'GoodPush',
		url: `${site}/?lang=${lang}`,
		description: t('meta.description'),
		inLanguage: lang,
		applicationCategory: 'LifestyleApplication',
		operatingSystem: 'iOS, Android, Web (installable PWA)',
		image: `${site}/og.png`,
		featureList: [t('feat.streak.t'), t('feat.fav.t'), t('feat.share.t'), ...CATEGORY_IDS.map((c) => CATEGORY_LABEL[lang][c])].join(', '),
		publisher: { '@id': `${site}/#org` },
		offers: [
			{ '@type': 'Offer', name: 'Free trial (14 days)', price: '0', priceCurrency: 'EUR' },
			{
				'@type': 'Offer',
				name: 'GoodPush Pass',
				price: priceNumber(),
				priceCurrency: 'EUR',
				priceSpecification: { '@type': 'UnitPriceSpecification', price: priceNumber(), priceCurrency: 'EUR', unitCode: 'ANN', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'ANN' } }
			}
		]
	};
	const faq = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		inLanguage: lang,
		mainEntity: Array.from({ length: FAQ_COUNT }, (_, k) => ({
			'@type': 'Question',
			name: t(`faq.${k + 1}.q`),
			acceptedAnswer: { '@type': 'Answer', text: t(`faq.${k + 1}.a`) }
		}))
	};
	return [org, website, app, faq];
}
