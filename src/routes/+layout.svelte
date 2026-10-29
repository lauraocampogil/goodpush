<script lang="ts">
	// Self-hosted fonts (no Google Fonts requests → better for GDPR + offline)
	import '@fontsource-variable/unbounded';
	import '@fontsource/instrument-serif/400.css';
	import '@fontsource/instrument-serif/400-italic.css';
	import '@fontsource-variable/inter';
	import './layout.css';
	import { onMount } from 'svelte';
	import IconContext from 'phosphor-svelte/lib/IconContext';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { initAnalytics, track } from '#lib/analytics.ts';
	import { setI18n } from '#lib/i18n/index.svelte.ts';
	import { install } from '#lib/install.svelte.ts';
	import { isAndroid, isIOS, isStandalone } from '#lib/platform.ts';
	import { app } from '#lib/store.svelte.ts';
	import { auth } from '#lib/auth.svelte.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	// svelte-ignore state_referenced_locally
	const i = setI18n(data.lang);

	onMount(() => {
		app.load();
		app.captureSource(new URL(page.url.href));
		install.listen();
		auth.init();

		const standalone = isStandalone();
		initAnalytics(app.profile.deviceId, {
			lang: i.lang,
			standalone,
			platform: isIOS() ? 'ios' : isAndroid() ? 'android' : 'desktop',
			source: app.source,
			premium: app.premium
		});

		// "Downloads": a PWA install = the app's first open from the home screen
		try {
			if (standalone && !localStorage.getItem('goodpush:installed')) {
				localStorage.setItem('goodpush:installed', '1');
				track('app_installed', { via: 'home_screen', platform: isIOS() ? 'ios' : isAndroid() ? 'android' : 'desktop' });
			}
		} catch {
			/* ignore */
		}
		addEventListener('appinstalled', () => track('app_installed', { via: 'browser_prompt' }));
	});

	// Smooth page-to-page transitions (View Transitions API, where supported)
	onNavigate((navigation) => {
		if (!document.startViewTransition || navigation.from?.url.pathname === navigation.to?.url.pathname) return;
		return new Promise((resolve) => {
			const vt = document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
			// An interrupted transition is harmless — don't report it as an error
			vt.ready.catch(() => {});
			vt.finished.catch(() => {});
		});
	});
</script>

<IconContext values={{ weight: 'bold' }}>
	{@render children()}
</IconContext>
