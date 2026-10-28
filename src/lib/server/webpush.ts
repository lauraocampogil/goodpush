import webpush from 'web-push';
import { PUBLIC_VAPID_KEY } from '$app/env/public';
import { VAPID_PRIVATE_KEY, VAPID_SUBJECT } from '$app/env/private';

let ready = false;

export function pushReady(): boolean {
	if (ready) return true;
	if (!PUBLIC_VAPID_KEY || !VAPID_PRIVATE_KEY) return false;
	webpush.setVapidDetails(VAPID_SUBJECT, PUBLIC_VAPID_KEY, VAPID_PRIVATE_KEY);
	ready = true;
	return true;
}

export type Sub = { endpoint: string; p256dh: string; auth: string };

export async function sendPush(sub: Sub, payload: Record<string, unknown>) {
	return webpush.sendNotification(
		{ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
		JSON.stringify(payload),
		{ TTL: 60 * 60 * 6, urgency: 'normal' }
	);
}
