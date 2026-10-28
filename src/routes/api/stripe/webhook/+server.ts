import { error, json } from '@sveltejs/kit';
import type Stripe from 'stripe';
import { STRIPE_WEBHOOK_SECRET } from '$app/env/private';
import { db } from '#lib/server/supabase.ts';
import { ACTIVE, stripe } from '#lib/server/stripe.ts';
import type { RequestHandler } from './$types';

/**
 * Stripe → GoodPush. Configure in Stripe Dashboard → Developers → Webhooks:
 *   URL:    https://goodpush.app/api/stripe/webhook
 *   Events: checkout.session.completed, customer.subscription.created,
 *           customer.subscription.updated, customer.subscription.deleted
 */
export const POST: RequestHandler = async ({ request }) => {
	const s = stripe();
	const supabase = db();
	if (!s || !supabase || !STRIPE_WEBHOOK_SECRET) error(503, 'Not configured');

	const signature = request.headers.get('stripe-signature');
	if (!signature) error(400, 'Missing signature');

	let event: Stripe.Event;
	try {
		event = await s.webhooks.constructEventAsync(await request.text(), signature, STRIPE_WEBHOOK_SECRET);
	} catch (e) {
		console.error('[stripe] bad signature', e);
		error(400, 'Invalid signature');
	}

	const save = async (sub: Stripe.Subscription, deviceId?: string | null) => {
		const id = deviceId ?? sub.metadata?.deviceId;
		if (!id) return console.warn('[stripe] subscription without deviceId', sub.id);
		const periodEnd = sub.items.data[0]?.current_period_end;
		await supabase.from('premium').upsert(
			{
				device_id: id,
				stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
				stripe_subscription_id: sub.id,
				status: sub.status,
				current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'device_id' }
		);
		// Lost Premium → drop the extra pushes
		if (!ACTIVE.includes(sub.status)) {
			await supabase.from('subscribers').update({ extra_hours: [] }).eq('id', id);
		}
	};

	switch (event.type) {
		case 'checkout.session.completed': {
			const session = event.data.object;
			if (session.mode === 'subscription' && session.subscription) {
				const sub = await s.subscriptions.retrieve(
					typeof session.subscription === 'string' ? session.subscription : session.subscription.id
				);
				await save(sub, session.client_reference_id);
			}
			break;
		}
		case 'customer.subscription.created':
		case 'customer.subscription.updated':
		case 'customer.subscription.deleted':
			await save(event.data.object);
			break;
	}

	return json({ received: true });
};
