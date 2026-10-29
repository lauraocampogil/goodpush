<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { PUBLIC_SITE_URL } from '$app/env/public';
	import { track } from '#lib/analytics.ts';
	import Footer from '#lib/components/Footer.svelte';
	import InstallSheet from '#lib/components/InstallSheet.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import DarkFeatures from '#lib/components/landing/DarkFeatures.svelte';
	import Faq from '#lib/components/landing/Faq.svelte';
	import Hero from '#lib/components/landing/Hero.svelte';
	import Nav from '#lib/components/landing/Nav.svelte';
	import PhoneRow from '#lib/components/landing/PhoneRow.svelte';
	import Pricing from '#lib/components/landing/Pricing.svelte';
	import StickerPile from '#lib/components/landing/StickerPile.svelte';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { isIOS, isStandalone } from '#lib/platform.ts';
	import { app } from '#lib/store.svelte.ts';

	const i = getI18n();
	let sheet = $state(false);
	let onboarded = $state(false);
	const cta = $derived(onboarded ? i.t('nav.open') : i.t('hero.cta'));

	onMount(() => {
		onboarded = app.profile.onboarded;
		// Opened from the home-screen icon → straight into the app
		if (isStandalone()) goto(onboarded ? '/today' : '/start', { replaceState: true });
	});

	function start(from = 'hero') {
		track('cta_click', { from, onboarded });
		if (onboarded) return goto('/today');
		sheet = true;
		track('install_sheet_open', { platform: isIOS() ? 'ios' : 'other' });
	}

	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'GoodPush',
		url: PUBLIC_SITE_URL,
		applicationCategory: 'LifestyleApplication',
		operatingSystem: 'iOS, Android, Web',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }
	});
</script>

<Seo title={i.t('meta.title')} description={i.t('meta.description')} />
<svelte:head>
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<Nav onstart={() => start('nav')} cta={onboarded ? i.t('nav.open') : i.t('nav.get')} />
<main>
	<Hero onstart={() => start('hero')} {cta} />
	<PhoneRow />
	<DarkFeatures onstart={() => start('dark')} {cta} />
	<StickerPile />
	<Pricing onfree={() => start('pricing')} onpremium={() => { track('premium_click', { from: 'landing' }); goto('/premium'); }} />
	<Faq />
</main>
<Footer onstart={() => start('footer')} />

<InstallSheet bind:open={sheet} oncontinue={() => goto('/start')} />
