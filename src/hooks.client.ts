import * as Sentry from '@sentry/sveltekit';
import { PUBLIC_SENTRY_DSN } from '$app/env/public';
import { dev, version } from '$app/env';
import type { HandleClientError } from '@sveltejs/kit/hooks';

if (PUBLIC_SENTRY_DSN) {
	Sentry.init({
		dsn: PUBLIC_SENTRY_DSN,
		release: `goodpush@${version}`,
		environment: dev ? 'development' : 'production',
		// No session replay: keeps the bundle light and privacy simple
		tracesSampleRate: 0.1,
		// Ignore noise that isn't ours
		ignoreErrors: ['ResizeObserver loop', 'AbortError', 'Transition was aborted', 'NotAllowedError']
	});
}

const fallback: HandleClientError = ({ error, kind }) => {
	if (kind === 'unknown') console.error(error);
};

export const handleError = PUBLIC_SENTRY_DSN ? Sentry.handleErrorWithSentry(fallback) : fallback;
