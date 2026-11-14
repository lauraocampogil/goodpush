<script lang="ts">
	import { onMount } from 'svelte';
	import Smiley from '../Smiley.svelte';
	import PhraseText from '../PhraseText.svelte';
	import { ArrowRight, Fire } from '#lib/icons.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { PHRASE_BY_ID } from '#lib/data/phrases.ts';
	import { motion, reduced } from '#lib/motion.ts';

	let { onstart, cta }: { onstart: () => void; cta: string } = $props();
	const i = getI18n();
	let root: HTMLElement;
	const quote = PHRASE_BY_ID.get('d2')!;
	/** The TikTok wall: real posts rendered by the video factory (static/hero/<lang>-<n>.mp4). */
	const vid = (n: number) => `/hero/${i.lang}-${n}`;

	onMount(() => {
		if (reduced()) return;
		const { gsap } = motion();
		const ctx = gsap.context(() => {
			gsap.from('[data-rise]', { y: 40, autoAlpha: 0, duration: 1, stagger: 0.08, ease: 'expo.out', delay: 0.1 });
			gsap.from('[data-tile]', { y: 80, autoAlpha: 0, scale: 0.94, duration: 1.1, stagger: 0.07, ease: 'expo.out', delay: 0.25 });
			// columns drift at different speeds while scrolling
			gsap.to('[data-col="1"]', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true } });
			gsap.to('[data-col="2"]', { yPercent: 6, ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true } });
		}, root);
		return () => ctx.revert();
	});
</script>

<section bind:this={root} class="relative overflow-hidden bg-ink pt-28 pb-20 text-paper sm:pt-32 lg:min-h-[100svh]">
	<div class="container-site grid items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
		<div class="flex flex-col gap-7">
			<p data-rise class="inline-flex items-center gap-2.5 self-start rounded-full py-2 pr-4 pl-2.5 text-sm font-semibold ring-1 ring-paper/20">
				<span class="h-2.5 w-2.5 rounded-full bg-fire"></span>{i.t('h2.kicker')}
			</p>
			<h1 data-rise class="display text-[clamp(3.6rem,8.4vw,7.2rem)] leading-[0.88]">
				{i.t('h2.title.1')}<br /><span class="text-acid">{i.t('h2.title.2')}</span>
			</h1>
			<p data-rise class="max-w-md text-lg leading-relaxed text-paper/70">{i.t('h2.lead')}</p>
			<div data-rise class="flex flex-wrap gap-3">
				<button class="group inline-flex items-center gap-2.5 rounded-full bg-acid px-7 py-4 text-[17px] font-bold text-ink transition hover:-translate-y-0.5" onclick={onstart}>
					{cta}<ArrowRight weight="bold" class="transition-transform group-hover:translate-x-1" />
				</button>
				<a href="/#how" class="inline-flex items-center rounded-full bg-ink-2 px-7 py-4 text-[17px] font-semibold ring-1 ring-paper/10 transition hover:ring-paper/40">{i.t('h2.secondary')}</a>
			</div>
			<p data-rise class="text-sm text-paper/50">{i.t('h2.meta')}</p>
		</div>

		<!-- the wall -->
		<div class="grid grid-cols-3 gap-3 sm:gap-4" aria-hidden="true">
			{#key i.lang}
				<div data-col="1" class="flex flex-col gap-3 sm:gap-4">
					<video data-tile class="aspect-[9/16] w-full rounded-[22px] bg-ink-2 object-cover" src="{vid(1)}.mp4" poster="{vid(1)}.jpg" autoplay muted loop playsinline preload="metadata"></video>
					<div data-tile class="flex aspect-square flex-col justify-between rounded-[22px] bg-fire p-4">
						<Fire weight="fill" size={28} />
						<div><p class="display text-5xl leading-none">12</p><p class="text-xs font-semibold sm:text-sm">{i.t('tile.streak')}</p></div>
					</div>
				</div>
				<div data-col="2" class="mt-10 flex flex-col gap-3 sm:gap-4">
					<div data-tile class="grid aspect-square place-items-center rounded-full bg-acid"><Smiley size={0} color="ink" class="h-[72%] w-[72%]" /></div>
					<video data-tile class="aspect-[9/16] w-full rounded-[22px] bg-ink-2 object-cover" src="{vid(2)}.mp4" poster="{vid(2)}.jpg" autoplay muted loop playsinline preload="metadata"></video>
					<div data-tile class="flex aspect-square flex-col justify-between rounded-[22px] p-4 ring-2 ring-paper/15">
						<span class="text-xs font-semibold text-paper/60">{i.t('tile.time')}</span>
						<span class="display text-4xl leading-none sm:text-5xl">08:00</span>
					</div>
				</div>
				<div data-col="1" class="flex flex-col gap-3 sm:gap-4">
					<div data-tile class="flex aspect-square items-end rounded-[22px] bg-paper p-4 text-ink">
						<p class="display text-[clamp(1rem,1.9vw,1.6rem)] leading-[0.95]"><PhraseText text={quote[i.lang]} /></p>
					</div>
					<video data-tile class="aspect-[9/16] w-full rounded-[22px] bg-ink-2 object-cover" src="{vid(3)}.mp4" poster="{vid(3)}.jpg" autoplay muted loop playsinline preload="metadata"></video>
				</div>
			{/key}
		</div>
	</div>
</section>
