import * as Sentry from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { PUBLIC_SENTRY_DSN } from '$app/env/public';
import { dev, version } from '$app/env';
import { pickLang } from '#lib/i18n/index.svelte.ts';
import { LANGS, type Lang } from '#lib/data/categories.ts';

if (PUBLIC_SENTRY_DSN) {
	Sentry.init({ dsn: PUBLIC_SENTRY_DSN, tracesSampleRate: 0.1, release: `goodpush@${version}`, environment: dev ? 'development' : 'production' });
}

const app: Handle = async ({ event, resolve }) => {
	// ?lang=es (from hreflang links / shared URLs) wins, then the cookie, then the browser
	let q: string | null = null;
	try {
		q = event.url.searchParams.get('lang');
	} catch {
		/* prerendering (sitemap, robots, llms.txt) has no query string */
	}
	const lang = q && (LANGS as string[]).includes(q) ? (q as Lang) : pickLang(event.cookies.get('lang'), event.request.headers.get('accept-language'));
	if (q === lang) event.cookies.set('lang', lang, { path: '/', maxAge: 31536000, sameSite: 'lax', httpOnly: false });
	event.locals.lang = lang;
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	return response;
};

export const handle = PUBLIC_SENTRY_DSN ? sequence(Sentry.sentryHandle(), app) : app;

const fallback: HandleServerError = ({ error, kind }) => {
	if (kind === 'unknown') console.error(error);
};

export const handleError = PUBLIC_SENTRY_DSN ? Sentry.handleErrorWithSentry(fallback) : fallback;
