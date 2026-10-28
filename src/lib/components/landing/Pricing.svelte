<script lang="ts">
	import Smiley from '../Smiley.svelte';
	import { PUBLIC_PREMIUM_PRICE } from '$app/env/public';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { magnetic, reveal, splitReveal } from '#lib/motion.ts';

	let {
		onfree,
		onpremium,
		busy = false,
		heading = true
	}: { onfree: () => void; onpremium: () => void; busy?: boolean; heading?: boolean } = $props();
	const i = getI18n();
</script>

<section id="pricing" class="container-site py-24 lg:py-32">
	{#if heading}
		<p class="kicker">{i.t('pricing.kicker')}</p>
		<h2 use:splitReveal={{ scroll: true }} class="display mt-5 max-w-4xl text-6xl sm:text-7xl">{i.t('pricing.title')}</h2>
	{/if}

	<div class="mt-12 grid gap-6 md:grid-cols-2" use:reveal={{ children: true, stagger: 0.12 }}>
		<article class="card flex flex-col p-8">
			<h3 class="display text-4xl">{i.t('premium.free')}</h3>
			<p class="mt-3"><span class="display text-7xl">0 €</span></p>
			<ul class="mt-8 flex-1 space-y-3 text-lg font-semibold">
				{#each ['f1', 'f2', 'f3'] as k (k)}
					<li class="flex gap-3"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-ink">✓</span>{i.t(`premium.${k}` as 'premium.f1')}</li>
				{/each}
			</ul>
			<button class="btn-ghost mt-8 w-full py-4" onclick={onfree}>{i.t('pricing.free.cta')}</button>
		</article>

		<article class="relative flex flex-col rounded-3xl border-[3px] border-ink bg-ink p-8 text-white" style="box-shadow: 8px 8px 0 #FF2E88">
			<span class="sticker absolute -top-5 right-6 rotate-6 bg-sun text-ink">{i.t('pricing.popular')} ✦</span>
			<h3 class="display text-4xl text-sun">{i.t('premium.pro')}</h3>
			<p class="mt-3"><span class="display text-7xl">{PUBLIC_PREMIUM_PRICE}</span><span class="font-bold text-white/70">{i.t('premium.month')}</span></p>
			<ul class="mt-8 flex-1 space-y-3 text-lg font-semibold">
				{#each ['f2', 'f3', 'p1', 'p2', 'p3', 'p4'] as k (k)}
					<li class="flex gap-3"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pink">✦</span>{i.t(`premium.${k}` as 'premium.p1')}</li>
				{/each}
			</ul>
			<span use:magnetic={0.2} class="mt-8 block">
				<button class="btn w-full !bg-sun py-4 !text-ink" style="box-shadow: 4px 4px 0 #FF2E88" disabled={busy} onclick={onpremium}>
					<Smiley size={24} wink /> {i.t('pricing.pro.cta')}
				</button>
			</span>
			<p class="mt-3 text-center text-xs text-white/60">{i.t('pricing.cancel')}</p>
		</article>
	</div>
</section>
