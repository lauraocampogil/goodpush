<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { PUBLIC_CONTACT_EMAIL } from '$app/env/public';
	import { track } from '#lib/analytics.ts';
	import Footer from '#lib/components/Footer.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import Smiley from '#lib/components/Smiley.svelte';
	import Nav from '#lib/components/landing/Nav.svelte';
	import Pricing from '#lib/components/landing/Pricing.svelte';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { splitReveal } from '#lib/motion.ts';
	import { openPortal, startCheckout } from '#lib/premium.ts';
	import { app } from '#lib/store.svelte.ts';

	const i = getI18n();
	let busy = $state(false);
	let err = $state('');

	onMount(async () => {
		app.load();
		track('premium_view', { canceled: page.url.searchParams.has('canceled') });
		await app.refreshPremium();
	});

	async function buy() {
		busy = true;
		err = '';
		try {
			if (app.premium) await openPortal(app.profile.deviceId);
			else await startCheckout(app.profile.deviceId, i.lang, 'premium_page');
		} catch (e) {
			err = (e as Error).message;
			track('checkout_error', { message: err });
			busy = false;
		}
	}
</script>

<Seo title="GoodPush Premium" description={i.t('premium.sub')} />

<div>
	<Nav onstart={() => goto(app.profile.onboarded ? '/today' : '/')} cta={i.t('nav.open')} />
	<main>
		<section class="bg-sun pt-36 pb-24 text-center"><div class="container-site">
			<Smiley size={96} color="orange" wink class="mx-auto animate-float" />
			<h1 use:splitReveal={{ text: i.t('premium.title') }} class="display mx-auto mt-6 max-w-4xl text-[clamp(2.24rem,7.0vw,4.9rem)]">{i.t('premium.title')}</h1>
			<p class="soft mx-auto mt-4 max-w-2xl text-3xl">{i.t('premium.sub')}</p>
			{#if app.premium}
				<p class="pill mt-8 bg-ink px-4 py-2 text-sun">{i.t('premium.active')}</p>
			{/if}
			{#if page.url.searchParams.has('canceled')}
				<p class="mx-auto mt-6 max-w-md rounded-2xl ring-1 ring-ink/10 bg-white p-3 font-semibold">{i.t('premium.canceled')}</p>
			{/if}
		</div></section>

		<Pricing heading={false} {busy} onfree={() => goto(app.profile.onboarded ? '/today' : '/')} onpremium={buy} />

		{#if err}<p class="container-site -mt-16 mb-10 text-center font-bold text-orange" role="alert">{err}</p>{/if}
		<p class="container-site -mt-14 pb-20 text-center text-sm text-ink/60">
			{i.t('premium.restore')} <a class="underline" href="mailto:{PUBLIC_CONTACT_EMAIL}">{PUBLIC_CONTACT_EMAIL}</a>
		</p>
	</main>
	<Footer />
</div>
