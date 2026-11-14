<script lang="ts">
	import { onMount } from 'svelte';
	import Smiley from '../Smiley.svelte';
	import { CATEGORY_IDS } from '#lib/data/categories.ts';
	import { CATEGORY_LABEL } from '#lib/i18n/dict.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { motion, parallax, popIn, reduced, reveal, wordsUp } from '#lib/motion.ts';

	let { onstart }: { onstart: () => void } = $props();
	const i = getI18n();
	const topics = $derived([...CATEGORY_IDS, ...CATEGORY_IDS].map((c) => CATEGORY_LABEL[i.lang][c]));
	const steps = [1, 2, 3] as const;
	const feats = [
		{ t: 'feat.streak.t', d: 'feat.streak.d', cls: 'bg-fire text-paper rounded-t-[220px] rounded-b-[32px] justify-end pt-28' },
		{ t: 'feat.fav.t', d: 'feat.fav.d', cls: 'bg-paper text-ink rounded-[32px] justify-end' },
		{ t: 'feat.share.t', d: 'feat.share.d', cls: 'bg-acid text-ink rounded-t-[32px] rounded-b-[220px] justify-start pb-28' },
		{ t: 'feat.news.t', d: 'feat.news.d', cls: 'bg-ink-2 text-paper rounded-[32px] justify-end' }
	] as const;

	let band: HTMLElement;
	onMount(() => {
		if (reduced()) return;
		const { gsap } = motion();
		// The topics band tilts and slides a bit with the scroll, on top of its own loop
		const t = gsap.fromTo(band, { rotate: -4, xPercent: -3 }, { rotate: 1, xPercent: 3, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: true } });
		return () => { t.scrollTrigger?.kill(); t.kill(); };
	});
</script>

<!-- Topics band -->
<section aria-label="Topics" class="overflow-hidden bg-ink py-16 sm:py-24">
	<div bind:this={band} class="-mx-16 overflow-hidden bg-acid py-6 text-ink">
		<div class="marquee items-center" style="--speed: 36s">
			{#each [0, 1] as k (k)}
				<div class="flex shrink-0 items-center gap-10 pr-10">
					{#each topics as t, n (n)}
						<span class="display text-[clamp(2.4rem,4.6vw,3.6rem)] leading-none">{t}</span>
						<Smiley size={0} color={n % 2 ? 'ink' : 'orange'} class="h-10 w-10 animate-spin-slow sm:h-12 sm:w-12" />
					{/each}
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- One phrase -->
<section class="relative overflow-hidden bg-ink px-5 py-40 text-center text-paper sm:py-56">
	<div aria-hidden="true" class="pointer-events-none">
		<div use:parallax={0.5} class="absolute top-24 left-[8%]"><Smiley size={0} color="orange" wink class="animate-float h-20 w-20 [--r:-12deg] sm:h-32 sm:w-32" /></div>
		<div use:parallax={-0.4} class="absolute top-44 right-[9%]"><Smiley size={0} color="cream" mood="calm" class="animate-float h-16 w-16 [animation-delay:-2s] sm:h-24 sm:w-24" /></div>
		<div use:parallax={0.35} class="absolute bottom-28 left-[15%]"><Smiley size={0} color="sun" class="animate-float h-14 w-14 [animation-delay:-1s] sm:h-20 sm:w-20" /></div>
		<span use:parallax={-0.5} class="absolute right-[17%] bottom-24 h-32 w-32 rounded-full ring-2 ring-paper/15"></span>
	</div>
	{#key i.lang}
		<p use:reveal class="text-sm font-bold tracking-[0.16em] text-fire">{i.t('phrase.kicker')}</p>
		<h2 use:wordsUp class="display mx-auto mt-6 max-w-5xl text-[clamp(3.4rem,8.5vw,7.8rem)]">{i.t('phrase.t1')}<br />{i.t('phrase.t2')}<br /><span class="text-acid">{i.t('phrase.t3')}</span></h2>
		<p use:reveal={{ delay: 0.2 }} class="mx-auto mt-10 max-w-lg text-lg leading-relaxed text-paper/70">{i.t('phrase.sub')}</p>
	{/key}
	<button use:reveal={{ delay: 0.3 }} class="mt-12 rounded-full bg-paper px-8 py-4 font-bold text-ink transition hover:-translate-y-1 hover:bg-acid" onclick={onstart}>{i.t('phrase.cta')}</button>
</section>

<!-- How -->
<section id="how" class="bg-ink pt-16 pb-40 text-paper sm:pb-52">
	<div class="container-site">
		{#key i.lang}<h2 use:wordsUp class="display max-w-3xl text-[clamp(3rem,6vw,5.4rem)]">{i.t('how.big')}</h2>{/key}
		<div class="mt-16 grid gap-5 md:grid-cols-3" use:popIn={{ rotate: 3 }}>
			{#each steps as n (n)}
				<article class="group flex min-h-[300px] flex-col gap-5 rounded-[32px] bg-ink-2 p-9 transition-[translate,rotate,scale,background-color] duration-500 hover:-translate-y-2 hover:bg-ink-3">
					<span class="display text-[6.5rem] leading-[0.8] text-acid transition-transform duration-500 group-hover:-rotate-6">0{n}</span>
					<h3 class="font-display text-[1.7rem] leading-tight font-bold tracking-[-0.02em]">{i.t(`how.${n}.t` as 'how.1.t')}</h3>
					<p class="leading-relaxed text-paper/65">{i.t(`how.${n}.d` as 'how.1.d')}</p>
				</article>
			{/each}
		</div>
	</div>
</section>

<!-- Features -->
<section class="bg-ink pb-40 text-paper sm:pb-52">
	<div class="container-site">
		{#key i.lang}<h2 use:wordsUp class="display mb-16 max-w-3xl text-[clamp(3rem,6vw,5.4rem)]">{i.t('feat.title')}</h2>{/key}
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" use:popIn>
			{#each feats as f (f.t)}
				<article class="flex min-h-[380px] flex-col gap-3 p-9 transition-[translate,rotate,scale,background-color] duration-500 hover:-translate-y-2 hover:rotate-[-1deg] {f.cls}">
					<h3 class="display text-[clamp(2.4rem,2.9vw,3.2rem)] [overflow-wrap:anywhere]">{i.t(f.t)}</h3>
					<p class="leading-relaxed opacity-80">{i.t(f.d)}</p>
				</article>
			{/each}
		</div>
	</div>
</section>
