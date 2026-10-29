import { error, json } from '@sveltejs/kit';
import { STRIPE_PRICE_ID } from '$app/env/private';
import { isDeviceId, stripe } from '#lib/server/stripe.ts';
import { getUser } from '#lib/server/auth.ts';
import type { RequestHandler } from './$types';

const LOCALES = { en: 'en', es: 'es', fr: 'fr' } as const;

/** Creates a Stripe Checkout session for Premium and returns its URL. */
export const POST: RequestHandler = async ({ request, url }) => {
	const s = stripe();
	if (!s || !STRIPE_PRICE_ID) error(503, 'Payments are not configured yet');

	const body = await request.json().catch(() => null);
	if (!isDeviceId(body?.deviceId)) error(400, 'Invalid device');
	const lang = (body.lang in LOCALES ? body.lang : 'en') as keyof typeof LOCALES;

	// Signed in? Premium is attached to the account → works on every phone.
	const user = await getUser(request);
	const metadata: Record<string, string> = { deviceId: body.deviceId, ...(user ? { userId: user.id } : {}) };

	const session = await s.checkout.sessions.create({
		mode: 'subscription',
		line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
		client_reference_id: body.deviceId,
		metadata,
		subscription_data: { metadata },
		...(user?.email ? { customer_email: user.email } : {}),
		allow_promotion_codes: true,
		billing_address_collection: 'auto',
		locale: LOCALES[lang],
		success_url: `${url.origin}/today?premium=success`,
		cancel_url: `${url.origin}/premium?canceled=1`
	});

	return json({ url: session.url });
};
