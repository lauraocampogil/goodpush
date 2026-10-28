<script lang="ts">
	import { PUBLIC_STRIPE_PREMIUM_LINK } from '$app/env/public';
	import { track } from '#lib/analytics.ts';
	import Logo from '#lib/components/Logo.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import Smiley from '#lib/components/Smiley.svelte';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { app } from '#lib/store.svelte.ts';
	import Footer from '../Footer.svelte';

	const i = getI18n();
	// Pass the device id so the Stripe webhook can mark this subscriber as premium.
	const link = $derived(
		PUBLIC_STRIPE_PREMIUM_LINK
			? `${PUBLIC_STRIPE_PREMIUM_LINK}?client_reference_id=${encodeURIComponent(app.profile.deviceId)}`
			: null
	);
</script>

<Seo title="GoodPush Premium" description={i.t('premium.sub')} />

<header class="container-site flex items-center justify-between py-5">
	<a href="/" aria-label="GoodPush"><Logo /></a>
	<a href="/today" class="btn-ghost px-4 py-2 text-sm">{i.t('nav.open')}</a>
</header>

<main class="container-site max-w-4xl py-10">
	<h1 class="display text-6xl sm:text-7xl">{i.t('premium.title')}</h1>
	<p class="soft mt-3 max-w-xl text-3xl">{i.t('premium.sub')}</p>

	<div class="mt-10 grid gap-6 md:grid-cols-2">
		<div class="card p-7">
			<h2 class="display text-4xl">{i.t('premium.free')}</h2>
			<p class="mt-1"><span class="display text-5xl">0€</span></p>
			<ul class="mt-6 space-y-2 font-semibold">
				{#each ['f1', 'f2', 'f3'] as k (k)}<li>✓ {i.t(`premium.${k}` as 'premium.f1')}</li>{/each}
			</ul>
		</div>
		<div class="card relative bg-sun p-7">
			<Smiley size={56} wink class="absolute -right-4 -top-5 rotate-12" />
			<h2 class="display text-4xl">{i.t('premium.pro')}</h2>
			<p class="mt-1"><span class="display text-5xl">2,99€</span><span class="font-bold">{i.t('premium.month')}</span></p>
			<ul class="mt-6 space-y-2 font-semibold">
				{#each ['f1', 'p1', 'p2', 'p3', 'p4'] as k (k)}<li>✦ {i.t(`premium.${k}` as 'premium.p1')}</li>{/each}
			</ul>
			{#if link}
				<a href={link} class="btn mt-8 w-full" rel="noopener" onclick={() => track('premium_click', app.profile.deviceId)}>{i.t('premium.cta')} →</a>
			{:else}
				<button class="btn mt-8 w-full" disabled>{i.t('premium.soon')}</button>
			{/if}
		</div>
	</div>
</main>

<Footer />
