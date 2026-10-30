<script lang="ts">
	import { onMount } from 'svelte';
	import Smiley from '../Smiley.svelte';
	import { PHRASES } from '#lib/data/phrases.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { motion, reduced, reveal, splitReveal } from '#lib/motion.ts';
	import { plain } from '#lib/phrase.ts';
	import { CATEGORY_COLOR, STICKER } from '#lib/smiley.ts';

	const i = getI18n();
	let row: HTMLElement;
	const DARK = ['green', 'purple', 'orange'];
	const cards = ['s2', 'c2', 'l3', 'd2', 't6', 'b1', 'f2'].map((id) => PHRASES.find((p) => p.id === id)!);

	onMount(() => {
		if (reduced()) return;
		const { gsap } = motion();
		const tw = gsap.fromTo(row, { xPercent: 6 }, { xPercent: -14, ease: 'none', scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true } });
		return () => { tw.scrollTrigger?.kill(); tw.kill(); };
	});
</script>

<section class="overflow-hidden" style="background: linear-gradient(to bottom, var(--color-sun) 0 58%, var(--color-ink) 58% 100%)">
	<div class="container-site pt-8 text-center sm:pt-16">
		<p class="kicker">{i.t('real.kicker')}</p>
		<h2 use:splitReveal={{ scroll: true, text: i.t('real.title') }} class="display mx-auto mt-4 max-w-3xl text-4xl sm:text-5xl">{i.t('real.title')}</h2>
		<p use:reveal class="mx-auto mt-5 max-w-md text-[15px] text-ink/70">{i.t('real.sub')}</p>
	</div>

	<div bind:this={row} class="mt-14 flex w-max gap-4 px-4 pb-20 sm:gap-6 sm:pb-28">
		{#each cards as p, n (p.id)}
			{@const color = CATEGORY_COLOR[p.cat]}
			<article
				class="flex aspect-[9/14] w-[56vw] max-w-[260px] shrink-0 flex-col justify-between rounded-[28px] p-5 shadow-[var(--shadow-float)] sm:w-[240px] {n % 2 ? 'mt-16' : ''}"
				style="background:{STICKER[color]}; color:{DARK.includes(color) ? '#fff' : '#141414'}"
			>
				<div class="flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase opacity-70">
					<span>{i.cat(p.cat)}</span><span>08:00</span>
				</div>
				<p class="display text-[1.37rem] leading-[0.95]">{plain(p[i.lang])}</p>
				<Smiley size={52} color={DARK.includes(color) ? 'cream' : 'ink'} wink={n % 3 === 1} mood={n % 3 === 2 ? 'calm' : undefined} />
			</article>
		{/each}
	</div>
</section>
