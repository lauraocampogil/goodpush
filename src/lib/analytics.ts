import { PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_KEY } from '$app/env/public';

/**
 * Tiny, cookie-less event tracking via PostHog's capture API.
 * No-op when PUBLIC_POSTHOG_KEY is not set.
 * Events to watch: landing_view, install_open, onboarding_done, push_enabled, share, favorite.
 */
export function track(event: string, distinctId: string, properties: Record<string, unknown> = {}) {
	if (!PUBLIC_POSTHOG_KEY || typeof window === 'undefined') return;
	const body = JSON.stringify({
		api_key: PUBLIC_POSTHOG_KEY,
		event,
		distinct_id: distinctId || 'anonymous',
		properties: {
			...properties,
			$current_url: location.href,
			$referrer: document.referrer,
			$process_person_profile: false
		}
	});
	const url = `${PUBLIC_POSTHOG_HOST}/i/v0/e/`;
	try {
		if (!navigator.sendBeacon?.(url, body)) {
			fetch(url, { method: 'POST', body, keepalive: true }).catch(() => {});
		}
	} catch {
		/* never break the app for analytics */
	}
}
