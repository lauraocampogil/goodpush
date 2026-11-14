<script lang="ts">
	import Smiley from '../Smiley.svelte';
	import { CATEGORY_IDS } from '#lib/data/categories.ts';
	import { CATEGORY_LABEL } from '#lib/i18n/dict.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { reveal } from '#lib/motion.ts';

	let { onstart }: { onstart: () => void } = $props();
	const i = getI18n();
	const topics = $derived([...CATEGORY_IDS, ...CATEGORY_IDS].map((c) => CATEGORY_LABEL[i.lang][c]));
	const steps = [1, 2, 3] as const;
	const feats = [
		{ t: 'feat.streak.t', d: 'feat.streak.d', cls: 'bg-fire text-paper rounded-t-[220px] rounded-b-[32px] justify-end pt-24' },
		{ t: 'feat.fav.t', d: 'feat.fav.d', cls: 'bg-paper text-ink rounded-[32px] justify-end' },
		{ t: 'feat.share.t', d: 'feat.share.d', cls: 'bg-acid text-ink rounded-t-[32px] rounded-b-[220px] justify-start pb-24' },
		{ t: 'feat.news.t', d: 'feat.news.d', cls: 'bg-ink-2 text-paper rounded-[32px] justify-end' }
	] as const;
</script>

<!-- Topics band -->
<section aria-label="Topics" class="overflow-hidden bg-ink py-6">
<div class="-mx-10 -rotate-[1.5deg] overflow-hidden bg-acid py-5 text-ink">
	<div class="marquee items-center gap-8" style="--speed: 38s">
		{#each [0, 1] as k (k)}
			<div class="flex shrink-0 items-center gap-8 pr-8">
				{#each topics as t, n (n)}
					<span class="display text-[clamp(2.2rem,4vw,3rem)] leading-none">{t}</span>
					<span class="text-3xl text-fire">✶</span>
				{/each}
			</div>
		{/each}
	</div>
</div>
</section>

<!-- One phrase -->
<section class="relative bg-ink px-5 py-32 text-center text-paper sm:py-40">
	<div aria-hidden="true" class="pointer-events-none">
		<Smiley size={0} color="orange" wink class="animate-float absolute top-20 left-[8%] h-20 w-20 [--r:-12deg] sm:h-28 sm:w-28" />
		<Smiley size={0} color="cream" mood="calm" class="animate-float absolute top-36 right-[9%] h-16 w-16 [animation-delay:-2s] sm:h-24 sm:w-24" />
		<Smiley size={0} color="sun" class="animate-float absolute bottom-24 left-[15%] h-14 w-14 [animation-delay:-1s] sm:h-20 sm:w-20" />
		<span class="absolute right-[17%] bottom-20 h-28 w-28 rounded-full ring-2 ring-paper/15"></span>
	</div>
	<p class="text-sm font-bold tracking-[0.14em] text-fire">{i.t('phrase.kicker')}</p>
	<h2 class="display mx-auto mt-5 max-w-4xl text-[clamp(3.4rem,8vw,7rem)]">{i.t('phrase.t1')}<br />{i.t('phrase.t2')}<br /><span class="text-acid">{i.t('phrase.t3')}</span></h2>
	<p class="mx-auto mt-7 max-w-lg text-lg leading-relaxed text-paper/70">{i.t('phrase.sub')}</p>
	<button class="mt-9 rounded-full bg-paper px-7 py-4 font-bold text-ink transition hover:bg-acid" onclick={onstart}>{i.t('phrase.cta')}</button>
</section>

<!-- How -->
<section id="how" class="bg-ink pb-28 text-paper">
	<div class="container-site">
		<h2 class="display text-[clamp(2.8rem,5.5vw,4.6rem)]">{i.t('how.big')}</h2>
		<div class="mt-10 grid gap-4 md:grid-cols-3" use:reveal={{ children: true, stagger: 0.1 }}>
			{#each steps as n (n)}
				<article class="flex min-h-[260px] flex-col gap-4 rounded-[28px] bg-ink-2 p-8">
					<span class="display text-[5.5rem] leading-[0.8] text-acid">0{n}</span>
					<h3 class="text-2xl font-bold">{i.t(`how.${n}.t` as 'how.1.t')}</h3>
					<p class="leading-relaxed text-paper/65">{i.t(`how.${n}.d` as 'how.1.d')}</p>
				</article>
			{/each}
		</div>
	</div>
</section>

<!-- Features -->
<section class="bg-ink pb-28 text-paper">
	<div class="container-site grid gap-4 sm:grid-cols-2 lg:grid-cols-4" use:reveal={{ children: true, stagger: 0.1 }}>
		{#each feats as f (f.t)}
			<article class="flex min-h-[340px] flex-col gap-3 p-8 {f.cls}">
				<h3 class="display text-5xl">{i.t(f.t)}</h3>
				<p class="leading-relaxed opacity-80">{i.t(f.d)}</p>
			</article>
		{/each}
	</div>
</section>
