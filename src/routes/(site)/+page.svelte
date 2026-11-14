<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { structuredData } from '#lib/seo.ts';
	import { track } from '#lib/analytics.ts';
	import Footer from '#lib/components/Footer.svelte';
	import InstallSheet from '#lib/components/InstallSheet.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import Faq from '#lib/components/landing/Faq.svelte';
	import HeroWall from '#lib/components/landing/HeroWall.svelte';
	import Nav from '#lib/components/landing/Nav.svelte';
	import Pricing from '#lib/components/landing/Pricing.svelte';
	import Story from '#lib/components/landing/Story.svelte';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { isIOS, isStandalone } from '#lib/platform.ts';
	import { app } from '#lib/store.svelte.ts';

	const i = getI18n();
	let sheet = $state(false);
	let toast = $state('');
	let onboarded = $state(false);
	const cta = $derived(onboarded ? i.t('nav.open') : i.t('hero.cta'));

	onMount(() => {
		onboarded = app.profile.onboarded;
		// Opened from the home-screen icon → straight into the app
		if (isStandalone()) goto(onboarded ? '/today' : '/start', { replaceState: true });
		if (new URL(location.href).searchParams.get('newsletter') === 'confirmed') {
			toast = i.t('nl.confirmed');
			track('newsletter_confirmed');
			setTimeout(() => (toast = ''), 4000);
		}
	});

	function start(from = 'hero') {
		track('cta_click', { from, onboarded });
		if (onboarded) return goto('/today');
		sheet = true;
		track('install_sheet_open', { platform: isIOS() ? 'ios' : 'other' });
	}

	// Structured data — helps Google and AI assistants describe GoodPush correctly (GEO)
	const jsonLd = $derived(structuredData(i.lang, (k) => i.t(k as never)));
</script>

<Seo title={i.t('meta.title')} description={i.t('meta.description')} jsonld={jsonLd} />

<Nav onstart={() => start('nav')} cta={onboarded ? i.t('nav.open') : i.t('nav.get')} />
<main class="bg-ink text-paper">
	<HeroWall onstart={() => start('hero')} {cta} />
	<Story onstart={() => start('story')} />
	<Pricing onfree={() => start('pricing')} onpremium={() => { track('premium_click', { from: 'landing' }); goto('/premium'); }} />
	<Faq />
</main>
<Footer onstart={() => start('footer')} />

<InstallSheet bind:open={sheet} oncontinue={() => goto('/start')} />

{#if toast}
	<button class="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-sm rounded-2xl bg-ink p-4 text-center font-semibold text-paper shadow-[var(--shadow-float)]" onclick={() => (toast = '')}>{toast}</button>
{/if}
