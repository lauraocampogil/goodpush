import * as Sentry from '@sentry/sveltekit';
import { PUBLIC_SENTRY_DSN } from '$app/env/public';
import { dev, version } from '$app/env';
import type { HandleClientError } from '@sveltejs/kit/hooks';

if (PUBLIC_SENTRY_DSN) {
	Sentry.init({
		dsn: PUBLIC_SENTRY_DSN,
		release: `goodpush@${version}`,
		environment: dev ? 'development' : 'production',
		// No session replay, no tracing: Sentry's SvelteKit tracing still reads the removed `$app/stores`
		// (SvelteKit 3) and crashed the whole page on start — errors + feedback only.
		integrations: (defaults) => defaults.filter((i) => !/BrowserTracing/i.test(i.name)),
		// Ignore noise that isn't ours
		ignoreErrors: ['ResizeObserver loop', 'AbortError', 'Transition was aborted', 'NotAllowedError']
	});
}

const fallback: HandleClientError = ({ error, kind }) => {
	if (kind === 'unknown') console.error(error);
};

export const handleError = PUBLIC_SENTRY_DSN ? Sentry.handleErrorWithSentry(fallback) : fallback;
