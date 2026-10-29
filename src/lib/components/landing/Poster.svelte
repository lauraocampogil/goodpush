<script lang="ts">
	import Smiley from '../Smiley.svelte';
	import { ArrowRight, Sparkle } from '#lib/icons.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { parallax, reveal, splitReveal } from '#lib/motion.ts';

	let { onstart, cta }: { onstart: () => void; cta: string } = $props();
	const i = getI18n();
</script>

<!-- Pastel poster: elegant serif statement + floating stickers -->
<section class="poster relative overflow-hidden py-28 text-center text-paper sm:py-40">
	<div class="container-site relative">
		<h2 class="font-serif text-[clamp(3.4rem,10vw,8.5rem)] leading-[0.92] tracking-[-0.02em] drop-shadow-[0_2px_20px_rgb(160_80_140/0.25)]">
			<span use:splitReveal={{ scroll: true }} class="block">{i.t('poster.1')}</span>
			<span use:splitReveal={{ scroll: true, delay: 0.15 }} class="block italic">{i.t('poster.2')}</span>
		</h2>

		<div class="relative mx-auto my-10 h-56 w-72 sm:my-14 sm:h-72 sm:w-96" aria-hidden="true">
			<span use:parallax={0.25} class="absolute top-6 left-4 animate-float" style="--r:-12deg"><Smiley size={110} color="pink" mood="calm" /></span>
			<span use:parallax={0.45} class="absolute top-0 right-6 animate-float [animation-delay:-1.5s]" style="--r:14deg"><Smiley size={96} color="yellow" wink /></span>
			<span use:parallax={0.15} class="absolute bottom-0 left-1/2 -translate-x-1/2 animate-float [animation-delay:-3s]" style="--r:4deg"><Smiley size={130} color="cream" /></span>
			<Sparkle weight="fill" size={22} class="absolute top-2 left-1/2 text-paper" />
			<Sparkle weight="fill" size={16} class="absolute right-0 bottom-10 text-paper" />
			<Sparkle weight="fill" size={14} class="absolute bottom-20 left-0 text-paper" />
		</div>

		<p use:splitReveal={{ scroll: true }} class="font-serif text-[clamp(3rem,8vw,6.5rem)] leading-none italic">{i.t('poster.3')}</p>
		<p use:reveal class="mt-5 text-xs font-semibold tracking-[0.25em] uppercase">{i.t('poster.small')}</p>
		<div use:reveal><button class="btn mt-10 bg-paper text-ink" onclick={onstart}>{cta} <ArrowRight /></button></div>
	</div>
</section>
