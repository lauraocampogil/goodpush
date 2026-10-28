import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$app/env/private';

let client: Stripe | null = null;

/** Server-only Stripe client. Returns null until STRIPE_SECRET_KEY is set. */
export function stripe(): Stripe | null {
	if (!STRIPE_SECRET_KEY) return null;
	client ??= new Stripe(STRIPE_SECRET_KEY);
	return client;
}

export const ACTIVE = ['active', 'trialing'];
export const isDeviceId = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{8,64}$/.test(v);
