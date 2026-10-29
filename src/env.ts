import { defineEnvVars } from '@sveltejs/kit/env';

/** Optional variable: returns undefined when empty so the app runs in demo mode. */
const optional = (value: string | undefined) => (value && value.trim() ? value.trim() : undefined);

export const variables = defineEnvVars({
	// ---- Public (sent to the browser) ----
	PUBLIC_SITE_URL: {
		public: true,
		description: 'Production URL, e.g. https://goodpush.app (used for SEO + share links)',
		schema: (v) => optional(v) ?? 'https://goodpush.app'
	},
	PUBLIC_VAPID_KEY: {
		public: true,
		description: 'Web Push VAPID public key (npx web-push generate-vapid-keys)',
		schema: optional
	},
	PUBLIC_POSTHOG_KEY: { public: true, description: 'PostHog project key (optional)', schema: optional },
	PUBLIC_POSTHOG_HOST: {
		public: true,
		description: 'PostHog host',
		schema: (v) => optional(v) ?? 'https://eu.i.posthog.com'
	},
	PUBLIC_SUPABASE_URL: { public: true, description: 'Supabase project URL (for sign-in)', schema: optional },
	PUBLIC_SUPABASE_ANON_KEY: { public: true, description: 'Supabase anon (public) key — for sign-in only', schema: optional },
	PUBLIC_SENTRY_DSN: { public: true, description: 'Sentry DSN (optional)', schema: optional },
	PUBLIC_PREMIUM_PRICE: {
		public: true,
		description: 'Price shown on the site, e.g. 2,99 €',
		schema: (v) => optional(v) ?? '2,99 €'
	},
	PUBLIC_AMAZON_TAG: { public: true, description: 'Amazon Associates tag (optional)', schema: optional },
	PUBLIC_INSTAGRAM_URL: {
		public: true,
		description: 'Instagram profile URL (feedback via DM)',
		schema: (v) => optional(v) ?? 'https://instagram.com/goodpush.app'
	},
	PUBLIC_TIKTOK_URL: {
		public: true,
		description: 'TikTok profile URL',
		schema: (v) => optional(v) ?? 'https://tiktok.com/@goodpush.app'
	},
	PUBLIC_CONTACT_EMAIL: {
		public: true,
		description: 'Contact email shown in legal pages',
		schema: (v) => optional(v) ?? 'hello@goodpush.app'
	},

	// ---- Private (server only) ----
	SUPABASE_URL: { description: 'Supabase project URL', schema: optional },
	SUPABASE_SERVICE_ROLE_KEY: {
		description: 'Supabase service role key — server only, never expose',
		schema: optional
	},
	VAPID_PRIVATE_KEY: { description: 'Web Push VAPID private key', schema: optional },
	VAPID_SUBJECT: {
		description: 'mailto: contact for push services',
		schema: (v) => optional(v) ?? 'mailto:hello@goodpush.app'
	},
	CRON_SECRET: { description: 'Shared secret for /api/cron/send', schema: optional },
	BREVO_API_KEY: { description: 'Brevo API key (email marketing)', schema: optional },
	BREVO_LIST_ID: { description: 'Brevo list id for GoodPush subscribers', schema: optional },
	BREVO_DOI_TEMPLATE_ID: { description: 'Brevo double opt-in template id (newsletter form)', schema: optional },
	BREVO_WEBHOOK_SECRET: { description: 'Secret token for /api/email/webhook', schema: optional },
	POSTHOG_SERVER_KEY: { description: 'PostHog project key for server events (defaults to the public key)', schema: optional },
	STRIPE_SECRET_KEY: { description: 'Stripe secret key (sk_live_… / sk_test_…)', schema: optional },
	STRIPE_PRICE_ID: { description: 'Stripe recurring Price ID for Premium (price_…)', schema: optional },
	STRIPE_WEBHOOK_SECRET: { description: 'Stripe webhook signing secret (whsec_…)', schema: optional }
});
