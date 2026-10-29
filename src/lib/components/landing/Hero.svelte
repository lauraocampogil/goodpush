<script lang="ts">
	import { ArrowDown, ArrowRight, Sparkle } from '#lib/icons.ts';
	import { onMount } from 'svelte';
	import PhoneDemo from './PhoneDemo.svelte';
	import Smiley from '../Smiley.svelte';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { magnetic, motion, reduced, splitReveal, tilt } from '#lib/motion.ts';

	let { onstart, cta }: { onstart: () => void; cta: string } = $props();
	const i = getI18n();
	let root: HTMLElement;

	onMount(() => {
		if (reduced()) return;
		const { gsap } = motion();
		const ctx = gsap.context(() => {
			gsap.from('[data-hero-tape]', { scaleX: 0, transformOrigin: 'left center', duration: 0.8, delay: 0.55, ease: 'expo.out' });
			gsap.from('[data-hero-fade]', { y: 24, autoAlpha: 0, duration: 0.9, delay: 0.7, stagger: 0.08, ease: 'expo.out' });
			gsap.from('[data-hero-phone]', { y: 120, rotate: 8, autoAlpha: 0, duration: 1.3, delay: 0.3, ease: 'expo.out' });
			gsap.from('[data-sticker]', { scale: 0, rotate: -40, duration: 0.8, delay: 1, stagger: 0.1, ease: 'back.out(2.5)' });
			// Stickers float with the mouse at different depths
			const stickers = gsap.utils.toArray<HTMLElement>('[data-sticker]');
			const movers = stickers.map((el) => ({
				x: gsap.quickTo(el, 'x', { duration: 1, ease: 'power3.out' }),
				y: gsap.quickTo(el, 'y', { duration: 1, ease: 'power3.out' }),
				d: Number(el.dataset.depth ?? 1)
			}));
			const move = (e: PointerEvent) => {
				const dx = e.clientX / innerWidth - 0.5;
				const dy = e.clientY / innerHeight - 0.5;
				movers.forEach((m) => {
					m.x(dx * 40 * m.d);
					m.y(dy * 40 * m.d);
				});
			};
			addEventListener('pointermove', move);
			gsap.to('[data-hero-phone]', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true } });
			return () => removeEventListener('pointermove', move);
		}, root);
		return () => ctx.revert();
	});
</script>

<section bind:this={root} class="dots relative overflow-hidden pb-20 pt-28 sm:pt-32 lg:pb-28">
	<div class="blob -left-24 top-10 h-72 w-72 bg-pink" aria-hidden="true"></div>
	<div class="blob right-0 top-40 h-80 w-80 bg-sky [animation-delay:-6s]" aria-hidden="true"></div>
	<div class="blob bottom-0 left-1/3 h-64 w-64 bg-sun [animation-delay:-12s]" aria-hidden="true"></div>

	<div class="container-site relative grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
		<div class="text-center lg:text-left">
			<p class="kicker" data-hero-fade>{i.t('hero.kicker')}</p>
			<h1 class="display mt-6 text-[clamp(3.4rem,11vw,6.8rem)]">
				<span use:splitReveal={{ delay: 0.1 }} class="block">{i.t('hero.title.1')}</span>
				<span class="relative inline-block">
					<span data-hero-tape class="absolute inset-0 -rotate-2 bg-pink" aria-hidden="true"></span>
					<span use:splitReveal={{ delay: 0.25 }} class="relative block px-[0.12em] text-white">{i.t('hero.title.hl')}</span>
				</span>
				<span use:splitReveal={{ delay: 0.35 }} class="block">{i.t('hero.title.2')}</span>
			</h1>
			<p class="soft mt-6 text-3xl sm:text-4xl" data-hero-fade>{i.t('hero.sub')}</p>
			<div class="mt-9 flex flex-col items-center gap-4 sm:flex-row lg:items-start" data-hero-fade>
				<span use:magnetic>
					<button class="btn group px-8 py-4 text-lg" onclick={onstart}>
						{cta}
						<span class="transition-transform group-hover:translate-x-1"><ArrowRight /></span>
					</button>
				</span>
				<a href="#how" class="btn-ghost px-6 py-4">{i.t('hero.secondary')} <ArrowDown /></a>
			</div>
			<ul class="mt-10 flex flex-wrap justify-center gap-3 lg:justify-start" data-hero-fade>
				{#each [['1', 'hero.stat.1'], ['0', 'hero.stat.2'], ['0 €', 'hero.stat.3']] as [num, key] (key)}
					<li class="flex items-baseline gap-2 rounded-2xl border-2 border-ink bg-white px-4 py-2">
						<span class="display text-3xl">{num}</span>
						<span class="text-sm font-bold text-ink/70">{i.t(key as 'hero.stat.1')}</span>
					</li>
				{/each}
			</ul>
		</div>

		<div class="relative" data-hero-phone>
			<div use:tilt={8}>
				<PhoneDemo />
			</div>
			<span data-sticker data-depth="1.6" class="sticker absolute -left-2 top-16 -rotate-12 bg-pink text-white sm:-left-10">{i.t('sticker.focus')}</span>
			<span data-sticker data-depth="1.2" class="sticker absolute -right-2 top-1/2 rotate-6 bg-sun sm:-right-8">{i.t('sticker.keep')}</span>
			<span data-sticker data-depth="2" class="absolute -right-3 top-6 sm:right-2"><Smiley size={64} wink /></span>
			<span data-sticker data-depth="0.8" class="sticker absolute -bottom-4 left-4 -rotate-3 bg-white">{i.t('sticker.you')} <Sparkle weight="fill" class="inline text-pink" /></span>
		</div>
	</div>
</section>
