import { track } from './analytics.ts';
import { app } from './store.svelte.ts';

async function post(path: string, body: Record<string, unknown>) {
	const res = await fetch(path, {
		method: 'POST',
		headers: { 'content-type': 'application/json', ...(app.authHeader ? { authorization: app.authHeader } : {}) },
		body: JSON.stringify(body)
	});
	if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? res.statusText);
	return (await res.json()) as { url: string };
}

/** Sends the person to Stripe Checkout. */
export async function startCheckout(deviceId: string, lang: string, from: string) {
	track('checkout_started', { from });
	const { url } = await post('/api/checkout', { deviceId, lang });
	location.href = url;
}

/** Stripe Billing Portal (cancel / card / invoices). */
export async function openPortal(deviceId: string) {
	track('portal_opened');
	const { url } = await post('/api/portal', { deviceId });
	location.href = url;
}
