import * as Sentry from '@sentry/sveltekit';
import { PUBLIC_SENTRY_DSN } from '$app/env/public';
import { track } from './analytics.ts';
import { app } from './store.svelte.ts';

export type FeedbackKind = 'idea' | 'problem' | 'love' | 'other';
export type FeedbackInput = { rating: number | null; kind: FeedbackKind; message: string; email?: string; lang: string };

/**
 * Feedback goes to 3 places:
 *  1. Sentry User Feedback (inbox, linked to errors / sessions) — if PUBLIC_SENTRY_DSN is set
 *  2. Supabase `feedback` table (your own copy, `feedback_summary` view)
 *  3. PostHog event `feedback_sent` (rating trends, by source/category)
 */
class FeedbackState {
	open = $state(false);
	from = $state('app');
	/** Rating pre-selected from the in-app prompt. */
	preset = $state<number | null>(null);

	show(from = 'app', rating: number | null = null) {
		this.from = from;
		this.preset = rating;
		this.open = true;
		track('feedback_opened', { from });
	}

	async send(f: FeedbackInput) {
		const page = typeof location !== 'undefined' ? location.pathname : '';
		const tags = { rating: f.rating ?? 0, kind: f.kind, lang: f.lang, premium: app.premium, from: this.from };
		if (PUBLIC_SENTRY_DSN) {
			Sentry.captureFeedback({ message: `[${f.kind}${f.rating ? ` · ${f.rating}/5` : ''}] ${f.message}`, email: f.email || undefined, url: location.href, source: this.from, tags });
		}
		track('feedback_sent', { ...tags, length: f.message.length });
		const res = await fetch('/api/feedback', {
			method: 'POST',
			headers: { 'content-type': 'application/json', ...(app.authHeader ? { authorization: app.authHeader } : {}) },
			body: JSON.stringify({ ...f, page, deviceId: app.profile.deviceId, premium: app.premium })
		});
		if (!res.ok && !PUBLIC_SENTRY_DSN) throw new Error('Could not send');
		try {
			localStorage.setItem('goodpush:feedback-at', new Date().toISOString());
		} catch {
			/* ignore */
		}
	}

	/** Ask for a rating once, after a few days of use (never more than once). */
	shouldAsk(streak: number) {
		try {
			return streak >= 5 && !localStorage.getItem('goodpush:feedback-at') && !localStorage.getItem('goodpush:feedback-dismissed');
		} catch {
			return false;
		}
	}

	dismissAsk() {
		try {
			localStorage.setItem('goodpush:feedback-dismissed', '1');
		} catch {
			/* ignore */
		}
	}
}

export const feedback = new FeedbackState();
