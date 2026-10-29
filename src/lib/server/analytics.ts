import { PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_KEY } from '$app/env/public';
import { POSTHOG_SERVER_KEY } from '$app/env/private';

type Ev = { event: string; distinct_id: string; properties?: Record<string, unknown>; timestamp?: string };

/**
 * Server-side PostHog events (things the browser can't see):
 * push_sent, premium_started / premium_canceled, account_deleted, newsletter_signup.
 * Uses the batch HTTP API — no extra dependency. Never throws.
 */
export async function captureServer(events: Ev | Ev[]) {
	const key = POSTHOG_SERVER_KEY ?? PUBLIC_POSTHOG_KEY;
	const list = Array.isArray(events) ? events : [events];
	if (!key || !list.length) return;
	try {
		for (let i = 0; i < list.length; i += 500) {
			await fetch(`${PUBLIC_POSTHOG_HOST}/batch/`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					api_key: key,
					batch: list.slice(i, i + 500).map((e) => ({
						...e,
						timestamp: e.timestamp ?? new Date().toISOString(),
						properties: { ...e.properties, $lib: 'goodpush-server', $process_person_profile: false }
					}))
				})
			});
		}
	} catch (err) {
		console.error('[analytics] server capture failed', err);
	}
}
