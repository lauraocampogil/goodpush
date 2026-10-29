import { error, json } from '@sveltejs/kit';
import { BREVO_WEBHOOK_SECRET } from '$app/env/private';
import { db } from '#lib/server/supabase.ts';
import type { RequestHandler } from './$types';

/**
 * Brevo → GoodPush (Brevo → Settings → Webhooks → Marketing):
 *   URL: https://goodpush.app/api/email/webhook?token=YOUR_BREVO_WEBHOOK_SECRET
 *   Events: Unsubscribed, Hard bounce, Marked as spam
 * Keeps the opt-in in your database in sync when someone unsubscribes from an email.
 */
export const POST: RequestHandler = async ({ request, url }) => {
	if (!BREVO_WEBHOOK_SECRET || url.searchParams.get('token') !== BREVO_WEBHOOK_SECRET) error(401, 'Unauthorized');
	const body = await request.json().catch(() => null);
	const events = Array.isArray(body) ? body : [body];
	const supabase = db();
	for (const ev of events) {
		const kind = String(ev?.event ?? '').toLowerCase();
		const email = typeof ev?.email === 'string' ? ev.email.toLowerCase() : null;
		if (!email || !/(unsubscribe|spam|hard_bounce|hardbounce|blocked)/.test(kind)) continue;
		await supabase?.from('profiles').update({ marketing_opt_in: false, marketing_consent_at: null }).ilike('email', email);
	}
	return json({ ok: true });
};
