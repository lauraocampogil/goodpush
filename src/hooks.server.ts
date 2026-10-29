import * as Sentry from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { PUBLIC_SENTRY_DSN } from '$app/env/public';
import { dev, version } from '$app/env';
import { pickLang } from '#lib/i18n/index.svelte.ts';

if (PUBLIC_SENTRY_DSN) {
	Sentry.init({ dsn: PUBLIC_SENTRY_DSN, tracesSampleRate: 0.1, release: `goodpush@${version}`, environment: dev ? 'development' : 'production' });
}

const app: Handle = async ({ event, resolve }) => {
	const lang = pickLang(event.cookies.get('lang'), event.request.headers.get('accept-language'));
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
