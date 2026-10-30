import { self } from '$app/service-worker';
import { assets, immutable } from '$app/manifest';
import { version } from '$app/env';

const CACHE = `goodpush-${version}`;
const SHELL = ['/today', ...immutable.map((f) => f.path), ...assets.map((f) => f.path)].filter(
	(p) => !p.endsWith('.map')
);

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(SHELL).catch(() => cache.addAll(SHELL.slice(1))))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const req = event.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);

	if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

	// Build files never change → cache-first. Pages → network-first, offline fallback.
	const isImmutable = immutable.some((f) => url.pathname === f.path);
	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			if (isImmutable) {
				const hit = await cache.match(req);
				if (hit) return hit;
			}
			try {
				const res = await fetch(req);
				if (res.ok && res.type === 'basic') cache.put(req, res.clone());
				return res;
			} catch {
				return (
					(await cache.match(req)) ??
					(req.mode === 'navigate' ? await cache.match('/today') : undefined) ??
					new Response('Offline', { status: 503 })
				);
			}
		})()
	);
});

type PushData = { title?: string; body?: string; id?: string; url?: string; streak?: number; actions?: [string, string] };

self.addEventListener('push', (event) => {
	let data: PushData = {};
	try {
		data = event.data?.json() ?? {};
	} catch {
		data = { body: event.data?.text() };
	}
	const url = data.url ?? '/today';
	event.waitUntil(
		Promise.all([
			self.registration.showNotification(data.title ?? '🔥', {
				body: data.body ?? '',
				icon: '/icons/icon-192.png',
				badge: '/icons/badge-96.png',
				tag: 'goodpush-daily',
				data: { url, id: data.id },
				// Shown on Android / desktop; iOS ignores actions.
				actions: [
					{ action: 'save', title: data.actions?.[0] ?? '♥ Save' },
					{ action: 'share', title: data.actions?.[1] ?? '↗ Share' }
				]
			} as NotificationOptions),
			// The icon shows your streak number (or a dot when there's none yet)
			self.navigator.setAppBadge?.(data.streak && data.streak > 0 ? data.streak : undefined)
		])
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const data = (event.notification.data ?? {}) as { url?: string; id?: string };
	const target = new URL(data.url ?? '/today', self.location.origin);
	if (event.action === 'save' && data.id) target.searchParams.set('fav', data.id);
	if (event.action === 'share') target.searchParams.set('share', '1');

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
			for (const c of clients) {
				if ('focus' in c) {
					c.navigate(target.href);
					return c.focus();
				}
			}
			return self.clients.openWindow(target.href);
		})
	);
});
