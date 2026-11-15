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
		{ t: 'feat.streak.t', d: 'feat.streak.d', cls: 'bg-fire text-paper rounded-t-[140px] rounded-b-[28px] justify-end pt-24 sm:rounded-t-[220px] sm:rounded-b-[32px] sm:pt-28' },
		{ t: 'feat.fav.t', d: 'feat.fav.d', cls: 'bg-paper text-ink rounded-[28px] justify-end sm:rounded-[32px]' },
		{ t: 'feat.share.t', d: 'feat.share.d', cls: 'bg-acid text-ink rounded-t-[28px] rounded-b-[140px] justify-start pb-24 sm:rounded-t-[32px] sm:rounded-b-[220px] sm:pb-28' },
		{ t: 'feat.news.t', d: 'feat.news.d', cls: 'bg-ink-2 text-paper rounded-[28px] justify-end sm:rounded-[32px]' }
	] as const;

	let band: HTMLElement;
	let mark: HTMLElement;
	onMount(() => {
		if (reduced()) return;
		const { gsap } = motion();
		// The topics band tilts and slides a bit with the scroll, on top of its own loop
		const t = gsap.fromTo(band, { rotate: -4, xPercent: -3 }, { rotate: 1, xPercent: 3, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: true } });
		const m = gsap.fromTo(mark, { scale: 0.6, rotate: -90 }, { scale: 1, rotate: 0, ease: 'none', scrollTrigger: { trigger: mark, start: 'top bottom', end: 'center 45%', scrub: true } });
		const s = gsap.to(mark.querySelector('[data-mark]'), { rotate: 360, ease: 'none', scrollTrigger: { trigger: mark, start: 'top bottom', end: 'bottom top', scrub: 1 } });
		return () => { for (const x of [t, m, s]) { x.scrollTrigger?.kill(); x.kill(); } };
	});
</script>

<!-- Topics band -->
<section aria-label="Topics" class="overflow-hidden bg-ink py-10 sm:py-24">
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
<section class="relative overflow-hidden bg-ink px-5 py-24 text-center text-paper sm:py-56">
	<div aria-hidden="true" class="pointer-events-none hidden sm:block">
		<div use:parallax={0.5} class="absolute top-24 left-[8%]"><Smiley size={0} color="orange" wink class="animate-float h-20 w-20 [--r:-12deg] sm:h-32 sm:w-32" /></div>
		<div use:parallax={-0.4} class="absolute top-44 right-[9%]"><Smiley size={0} color="cream" mood="calm" class="animate-float h-16 w-16 [animation-delay:-2s] sm:h-24 sm:w-24" /></div>
		<div use:parallax={0.35} class="absolute bottom-28 left-[15%]"><Smiley size={0} color="sun" class="animate-float h-14 w-14 [animation-delay:-1s] sm:h-20 sm:w-20" /></div>
		<span use:parallax={-0.5} class="absolute right-[17%] bottom-24 h-32 w-32 rounded-full ring-2 ring-paper/15"></span>
	</div>
	<!-- the brand mark, spinning with the scroll -->
	<div bind:this={mark} class="relative mx-auto mb-10 grid h-28 w-28 place-items-center sm:mb-12 sm:h-40 sm:w-40" aria-hidden="true">
		<span class="absolute inset-0 rounded-full bg-acid"></span>
		<span data-mark class="relative grid h-[74%] w-[74%] place-items-center"><Smiley size={0} color="ink" class="h-full w-full" /></span>
		<span class="absolute -right-3 -bottom-1 rotate-[-10deg] rounded-full bg-fire px-3 py-1 text-xs font-bold text-paper sm:text-sm">goodpush</span>
	</div>
	{#key i.lang}
		<p use:reveal class="text-sm font-bold tracking-[0.16em] text-fire">{i.t('phrase.kicker')}</p>
		<h2 use:wordsUp class="display mx-auto mt-6 max-w-5xl text-[clamp(3rem,8.5vw,7.8rem)]">{i.t('phrase.t1')}<br />{i.t('phrase.t2')}<br /><span class="text-acid">{i.t('phrase.t3')}</span></h2>
		<p use:reveal={{ delay: 0.2 }} class="mx-auto mt-8 max-w-lg text-lg sm:mt-10 leading-relaxed text-paper/70">{i.t('phrase.sub')}</p>
	{/key}
	<button use:reveal={{ delay: 0.3 }} class="mt-12 rounded-full bg-paper px-8 py-4 font-bold text-ink transition hover:-translate-y-1 hover:bg-acid" onclick={onstart}>{i.t('phrase.cta')}</button>
</section>

<!-- How -->
<section id="how" class="bg-ink pt-8 pb-24 text-paper sm:pt-16 sm:pb-52">
	<div class="container-site">
		{#key i.lang}<h2 use:wordsUp class="display max-w-3xl text-[clamp(3rem,6vw,5.4rem)]">{i.t('how.big')}</h2>{/key}
		<div class="mt-10 grid gap-4 sm:mt-16 sm:gap-5 md:grid-cols-3" use:popIn={{ rotate: 3 }}>
			{#each steps as n (n)}
				<article class="group grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-2 rounded-[28px] bg-ink-2 p-6 sm:flex sm:min-h-[300px] sm:flex-col sm:gap-5 sm:rounded-[32px] sm:p-9 transition-[translate,rotate,scale,background-color] duration-500 hover:-translate-y-2 hover:bg-ink-3">
					<span class="display row-span-2 text-[3.6rem] leading-[0.8] text-acid sm:text-[6.5rem] transition-transform duration-500 group-hover:-rotate-6">0{n}</span>
					<h3 class="font-display text-[1.4rem] leading-tight sm:text-[1.7rem] font-bold tracking-[-0.02em]">{i.t(`how.${n}.t` as 'how.1.t')}</h3>
					<p class="leading-relaxed text-paper/65">{i.t(`how.${n}.d` as 'how.1.d')}</p>
				</article>
			{/each}
		</div>
	</div>
</section>

<!-- Features -->
<section class="bg-ink pb-24 text-paper sm:pb-52">
	<div class="container-site">
		{#key i.lang}<h2 use:wordsUp class="display mb-10 max-w-3xl sm:mb-16 text-[clamp(3rem,6vw,5.4rem)]">{i.t('feat.title')}</h2>{/key}
		<div class="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4" use:popIn>
			{#each feats as f (f.t)}
				<article class="flex min-h-[230px] flex-col gap-3 p-7 sm:min-h-[380px] sm:p-9 transition-[translate,rotate,scale,background-color] duration-500 hover:-translate-y-2 hover:rotate-[-1deg] {f.cls}">
					<h3 class="display text-[clamp(2.4rem,2.9vw,3.2rem)] [overflow-wrap:anywhere]">{i.t(f.t)}</h3>
					<p class="leading-relaxed opacity-80">{i.t(f.d)}</p>
				</article>
			{/each}
		</div>
	</div>
</section>
