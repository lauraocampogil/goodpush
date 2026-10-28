import { PUBLIC_VAPID_KEY } from '$app/env/public';
import type { Lang } from './data/categories';
import { pushSupported } from './platform';
import type { Profile } from './store.svelte';

export type PushResult = 'granted' | 'denied' | 'unsupported' | 'error';

function urlBase64ToUint8Array(base64: string) {
	const padding = '='.repeat((4 - (base64.length % 4)) % 4);
	const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
	const raw = atob(b64);
	return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registration() {
	return navigator.serviceWorker.ready;
}

/** Must be called from a user gesture (button tap) — browsers block it otherwise. */
export async function enablePush(profile: Profile, lang: Lang, source: string | null): Promise<PushResult> {
	if (!pushSupported()) return 'unsupported';
	const permission = await Notification.requestPermission();
	if (permission !== 'granted') return 'denied';

	if (!PUBLIC_VAPID_KEY) return 'granted'; // demo mode: local test notifications only
	try {
		const reg = await registration();
		const sub =
			(await reg.pushManager.getSubscription()) ??
			(await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
			}));
		await syncProfile(profile, lang, source, sub);
		return 'granted';
	} catch (e) {
		console.error('[push] subscribe failed', e);
		return 'error';
	}
}

/** Sends the profile (+ subscription) to the server so the daily cron can reach this device. */
export async function syncProfile(
	profile: Profile,
	lang: Lang,
	source: string | null,
	sub?: PushSubscription | null
) {
	if (!PUBLIC_VAPID_KEY || !pushSupported()) return;
	try {
		sub ??= await (await registration()).pushManager.getSubscription();
		if (!sub) return;
		await fetch('/api/subscribe', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				deviceId: profile.deviceId,
				name: profile.name,
				categories: profile.categories,
				hour: profile.hour,
				extraHours: profile.extraHours,
				timeZone: profile.timeZone,
				lang,
				source,
				subscription: sub.toJSON()
			})
		});
	} catch (e) {
		console.error('[push] sync failed', e);
	}
}

export async function disablePush(deviceId: string) {
	try {
		const sub = await (await registration()).pushManager.getSubscription();
		await sub?.unsubscribe();
	} catch {
		/* ignore */
	}
	await fetch('/api/subscribe', {
		method: 'DELETE',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ deviceId })
	}).catch(() => {});
}

/** Local notification — lets people (and you) see what the push looks like. */
export async function testNotification(title: string, body: string) {
	if (!pushSupported() || Notification.permission !== 'granted') return false;
	const reg = await registration();
	await reg.showNotification(title, {
		body,
		icon: '/icons/icon-192.png',
		badge: '/icons/badge-96.png',
		tag: 'goodpush-test',
		data: { url: '/today' }
	});
	return true;
}
