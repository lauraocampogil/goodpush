import * as Sentry from '@sentry/sveltekit';
import { PUBLIC_SENTRY_DSN } from '$app/env/public';
import type { HandleClientError } from '@sveltejs/kit/hooks';

if (PUBLIC_SENTRY_DSN) {
	Sentry.init({
		dsn: PUBLIC_SENTRY_DSN,
		// No session replay: keeps the bundle light and privacy simple
		tracesSampleRate: 0.1
	});
}

const fallback: HandleClientError = ({ error, kind }) => {
	if (kind === 'unknown') console.error(error);
};

export const handleError = PUBLIC_SENTRY_DSN ? Sentry.handleErrorWithSentry(fallback) : fallback;
