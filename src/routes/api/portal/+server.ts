import { error, json } from '@sveltejs/kit';
import { db } from '#lib/server/supabase.ts';
import { isDeviceId, stripe } from '#lib/server/stripe.ts';
import { getUser } from '#lib/server/auth.ts';
import type { RequestHandler } from './$types';

/** Stripe Billing Portal: cancel, change card, invoices. */
export const POST: RequestHandler = async ({ request, url }) => {
	const s = stripe();
	const supabase = db();
	if (!s || !supabase) error(503, 'Payments are not configured yet');

	const body = await request.json().catch(() => null);
	if (!isDeviceId(body?.deviceId)) error(400, 'Invalid device');

	const user = await getUser(request);
	const filter = user ? `device_id.eq.${body.deviceId},user_id.eq.${user.id}` : `device_id.eq.${body.deviceId}`;
	const { data } = await supabase.from('premium').select('stripe_customer_id').or(filter).limit(1).maybeSingle();
	if (!data?.stripe_customer_id) error(404, 'No subscription');

	const session = await s.billingPortal.sessions.create({
		customer: data.stripe_customer_id,
		return_url: `${url.origin}/settings`
	});
	return json({ url: session.url });
};
