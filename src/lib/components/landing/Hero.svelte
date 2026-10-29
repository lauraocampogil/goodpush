<script lang="ts">
	import { onMount } from 'svelte';
	import Smiley from '../Smiley.svelte';
	import { ArrowRight } from '#lib/icons.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { motion, reduced, splitReveal } from '#lib/motion.ts';

	let { onstart, cta }: { onstart: () => void; cta: string } = $props();
	const i = getI18n();
	let root: HTMLElement;

	onMount(() => {
		if (reduced()) return;
		const { gsap } = motion();
		const ctx = gsap.context(() => {
			gsap.from('[data-pop]', { scale: 0, rotate: -90, duration: 0.9, delay: 0.45, stagger: 0.08, ease: 'back.out(2.2)' });
			gsap.from('[data-fade]', { y: 20, autoAlpha: 0, duration: 0.9, delay: 0.7, stagger: 0.08, ease: 'expo.out' });
			// Inline stickers gently spin as you scroll
			gsap.to('[data-pop]', { rotate: 40, ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true } });
		}, root);
		return () => ctx.revert();
	});
</script>

<section bind:this={root} class="flex min-h-[100svh] items-center bg-sun pt-24 pb-12">
	<div class="container-site w-full">
		<h1 class="display mx-auto max-w-5xl text-center text-[clamp(2.3rem,6.6vw,5.2rem)] leading-[0.98] uppercase">
			<span class="flex flex-wrap items-center justify-center gap-x-[0.18em]">
				<span use:splitReveal={{ delay: 0.05 }}>{i.t('hero.title.1')}</span>
				<span data-pop class="inline-block w-[0.8em]"><Smiley size={0} color="orange" class="h-[0.8em] w-[0.8em]" /></span>
			</span>
			<span class="flex flex-wrap items-center justify-center gap-x-[0.18em]">
				<span class="inline-flex -space-x-[0.22em]">
					<span data-pop class="inline-block"><Smiley size={0} color="pink" wink class="h-[0.72em] w-[0.72em] ring-[0.05em] ring-sun rounded-full" /></span>
					<span data-pop class="inline-block"><Smiley size={0} color="purple" mood="calm" class="h-[0.72em] w-[0.72em] ring-[0.05em] ring-sun rounded-full" /></span>
					<span data-pop class="inline-block"><Smiley size={0} color="green" class="h-[0.72em] w-[0.72em] ring-[0.05em] ring-sun rounded-full" /></span>
				</span>
				<span use:splitReveal={{ delay: 0.2 }}>{i.t('hero.title.hl')}</span>
			</span>
			<span class="block" use:splitReveal={{ delay: 0.3 }}>{i.t('hero.title.2')}</span>
		</h1>

		<div class="mx-auto mt-10 flex max-w-md flex-col items-center gap-6 text-center">
			<p data-fade class="text-[15px] leading-relaxed text-ink/70">{i.t('hero.sub')}</p>
			<div data-fade><button class="btn group px-7 py-4" onclick={onstart}>
				{cta}
				<ArrowRight class="transition-transform group-hover:translate-x-1" />
			</button></div>
		</div>
	</div>
</section>
