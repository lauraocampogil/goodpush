<script lang="ts">
	import Smiley from '../Smiley.svelte';
	import { PUBLIC_PREMIUM_PRICE } from '$app/env/public';
	import { Check, Crown } from '#lib/icons.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { reveal, splitReveal } from '#lib/motion.ts';

	let {
		onfree,
		onpremium,
		busy = false,
		heading = true
	}: { onfree: () => void; onpremium: () => void; busy?: boolean; heading?: boolean } = $props();
	const i = getI18n();
</script>

<section id="pricing" class="container-site py-24 sm:py-32">
	{#if heading}
		<div class="text-center">
			<p class="kicker">{i.t('pricing.kicker')}</p>
			<h2 use:splitReveal={{ scroll: true }} class="display mx-auto mt-4 max-w-3xl text-4xl sm:text-5xl">{i.t('pricing.title')}</h2>
		</div>
	{/if}

	<div class="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-2" use:reveal={{ children: true, stagger: 0.12 }}>
		<article class="card flex flex-col p-8 sm:p-10">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold">{i.t('premium.free')}</h3>
				<Smiley size={40} color="cream" />
			</div>
			<p class="mt-6"><span class="display text-5xl">0 €</span><span class="ml-1 text-ink/50">· 14 d</span></p>
			<ul class="mt-8 flex-1 space-y-3.5 text-[15px]">
				{#each ['f1', 'f2', 'f3'] as k (k)}
					<li class="flex items-center gap-3"><Check size={18} class="text-ink/40" />{i.t(`premium.${k}` as 'premium.f1')}</li>
				{/each}
			</ul>
			<button class="btn-ghost mt-10 w-full py-4" onclick={onfree}>{i.t('pricing.free.cta')}</button>
		</article>

		<article class="relative flex flex-col rounded-[28px] bg-ink p-8 text-paper shadow-[var(--shadow-float)] sm:p-10">
			<div class="flex items-center justify-between">
				<h3 class="flex items-center gap-2 text-lg font-semibold"><Crown weight="fill" class="text-sun" /> {i.t('premium.pro')}</h3>
				<span class="pill bg-sun text-ink">{i.t('pricing.popular')}</span>
			</div>
			<p class="mt-6"><span class="display text-5xl">{PUBLIC_PREMIUM_PRICE}</span><span class="ml-1 text-paper/60">{i.t('premium.month')}</span></p>
			<ul class="mt-8 flex-1 space-y-3.5 text-[15px]">
				{#each ['p1', 'p2', 'p3', 'f3', 'p4'] as k (k)}
					<li class="flex items-center gap-3"><Check size={18} class="text-sun" />{i.t(`premium.${k}` as 'premium.p1')}</li>
				{/each}
			</ul>
			<button class="btn mt-10 w-full bg-sun py-4 text-ink" disabled={busy} onclick={onpremium}>{i.t('pricing.pro.cta')}</button>
			<p class="mt-3 text-center text-xs text-paper/50">{i.t('pricing.cancel')}</p>
		</article>
	</div>
</section>
