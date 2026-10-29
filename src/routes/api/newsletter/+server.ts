import { error, json } from '@sveltejs/kit';
import { LANGS } from '#lib/data/categories.ts';
import { captureServer } from '#lib/server/analytics.ts';
import { brevoReady, doubleOptIn } from '#lib/server/brevo.ts';
import type { RequestHandler } from './$types';

const recent = new Map<string, number>();

/** Footer newsletter form (no account needed) → Brevo double opt-in. */
export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
	const body = await request.json().catch(() => null);
	const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
	if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 200) error(400, 'Invalid email');
	if (body.consent !== true) error(400, 'Consent required');

	const ip = getClientAddress();
	if (Date.now() - (recent.get(ip) ?? 0) < 15_000) error(429, 'Slow down');
	recent.set(ip, Date.now());

	if (!brevoReady()) return json({ ok: true, demo: true });
	const lang = LANGS.includes(body.lang) ? body.lang : 'en';
	await doubleOptIn(email, { lang, source: typeof body.source === 'string' ? body.source.slice(0, 60) : 'footer' }, `${url.origin}/?newsletter=confirmed`);
	await captureServer({ event: 'newsletter_signup', distinct_id: typeof body.deviceId === 'string' ? body.deviceId : email, properties: { lang } });
	return json({ ok: true });
};
