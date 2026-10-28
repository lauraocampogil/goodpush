import { browser } from '$app/env';
import { PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_KEY } from '$app/env/public';
import type { PostHog } from 'posthog-js';

/**
 * PostHog — same setup as Undercut, but privacy-first:
 * persistence 'memory' = no cookies, no localStorage → no cookie banner needed.
 * The person is identified by the app's random device id (no email, no phone).
 *
 * Funnel to build in PostHog:
 *   $pageview(/) → cta_click → install_sheet_open → app_installed / standalone_first_open
 *   → onboarding_step → push_enabled → phrase_viewed → share / favorite → checkout_started → premium_activated
 */
let ph: PostHog | null = null;
let queue: [string, Record<string, unknown>][] = [];

export async function initAnalytics(deviceId: string, props: Record<string, unknown>) {
	if (!browser || !PUBLIC_POSTHOG_KEY || ph) return;
	const { default: posthog } = await import('posthog-js');
	posthog.init(PUBLIC_POSTHOG_KEY, {
		api_host: PUBLIC_POSTHOG_HOST,
		persistence: 'memory',
		capture_pageview: 'history_change',
		capture_pageleave: true,
		autocapture: false,
		person_profiles: 'identified_only',
		disable_session_recording: true
	});
	posthog.identify(deviceId);
	posthog.register(props);
	ph = posthog;
	for (const [e, p] of queue) ph.capture(e, p);
	queue = [];
}

export function track(event: string, properties: Record<string, unknown> = {}) {
	if (!browser || !PUBLIC_POSTHOG_KEY) return;
	if (ph) ph.capture(event, properties);
	else queue.push([event, properties]);
}

/** Person properties (shown on the user in PostHog): language, categories, premium… */
export function setPerson(props: Record<string, unknown>) {
	if (ph) ph.setPersonProperties(props);
}
