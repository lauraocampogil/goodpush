<script lang="ts">
	import { ArrowRight } from '#lib/icons.ts';
	import Smiley from '../Smiley.svelte';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { magnetic } from '#lib/motion.ts';

	let { onstart, cta }: { onstart: () => void; cta: string } = $props();
	const i = getI18n();
</script>

<section class="relative overflow-hidden border-y-[3px] border-ink bg-pink py-24 lg:py-32">
	<div class="marquee" style="--speed: 30s" aria-hidden="true">
		{#each [0, 1, 2, 3] as k (k)}
			<span class="display flex items-center gap-8 px-8 text-[clamp(5rem,14vw,12rem)] whitespace-nowrap {k % 2 ? 'text-outline' : 'text-ink'}">
				{i.t('final.marquee')} <Smiley size={120} wink={k % 2 === 1} />
			</span>
		{/each}
	</div>
	<div class="container-site mt-10 text-center">
		<h2 class="display text-4xl text-white sm:text-6xl">{i.t('final.title')}</h2>
		<span use:magnetic class="mt-10 inline-block">
			<button class="btn bg-white px-10 py-5 text-xl !text-ink" style="box-shadow: 6px 6px 0 #111" onclick={onstart}>{cta} <ArrowRight /></button>
		</span>
	</div>
</section>
