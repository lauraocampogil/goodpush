import { error, json } from '@sveltejs/kit';
import { getUser } from '#lib/server/auth.ts';
import { isDeviceId } from '#lib/server/stripe.ts';
import { db } from '#lib/server/supabase.ts';
import type { RequestHandler } from './$types';

const KINDS = ['idea', 'problem', 'love', 'other'];
const recent = new Map<string, number>(); // naive per-instance rate limit

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const body = await request.json().catch(() => null);
	const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 2000) : '';
	if (!message) error(400, 'Message required');

	const ip = getClientAddress();
	const last = recent.get(ip) ?? 0;
	if (Date.now() - last < 10_000) error(429, 'Slow down');
	recent.set(ip, Date.now());

	const supabase = db();
	if (!supabase) return json({ ok: true, demo: true });
	const user = await getUser(request);
	const rating = Number.isInteger(body.rating) && body.rating >= 1 && body.rating <= 5 ? body.rating : null;
	const email = typeof body.email === 'string' && /^\S+@\S+\.\S+$/.test(body.email) ? body.email.slice(0, 200) : user?.email ?? null;

	const { error: e } = await supabase.from('feedback').insert({
		device_id: isDeviceId(body.deviceId) ? body.deviceId : null,
		user_id: user?.id ?? null,
		rating,
		kind: KINDS.includes(body.kind) ? body.kind : 'other',
		message,
		email,
		lang: typeof body.lang === 'string' ? body.lang.slice(0, 5) : null,
		page: typeof body.page === 'string' ? body.page.slice(0, 120) : null,
		premium: body.premium === true
	});
	if (e) {
		console.error('[feedback]', e);
		error(500, 'Could not save');
	}
	return json({ ok: true });
};
