<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import PhraseText from '../PhraseText.svelte';
	import Smiley from '../Smiley.svelte';
	import { CATEGORY_EMOJI, CATEGORY_IDS, type CategoryId } from '#lib/data/categories.ts';
	import { PHRASES } from '#lib/data/phrases.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { track } from '#lib/analytics.ts';
	import { reveal, splitReveal } from '#lib/motion.ts';

	const i = getI18n();
	let cat = $state<CategoryId>('discipline');
	let k = $state(0);
	const pool = $derived(PHRASES.filter((p) => p.cat === cat && !p.premium));
	const phrase = $derived(pool[k % pool.length]);

	onMount(() => {
		const t = setInterval(() => k++, 3200);
		return () => clearInterval(t);
	});

	function pick(c: CategoryId) {
		cat = c;
		k = 0;
		track('vibe_demo', { category: c });
	}
</script>

<section id="vibes" class="container-site py-24 lg:py-32">
	<div class="grid items-end gap-6 lg:grid-cols-2">
		<div>
			<p class="kicker">{i.t('vibe.kicker')}</p>
			<h2 use:splitReveal={{ scroll: true }} class="display mt-5 text-6xl sm:text-7xl">{i.t('vibe.title')}</h2>
		</div>
		<p class="soft text-3xl lg:text-right">{i.t('vibe.tap')}</p>
	</div>

	<div class="mt-10 flex flex-wrap gap-3" use:reveal={{ children: true, stagger: 0.05, y: 20 }}>
		{#each CATEGORY_IDS as c (c)}
			<button class="chip px-5 py-3 text-base hover:-translate-y-0.5" aria-pressed={cat === c} onclick={() => pick(c)}>
				{CATEGORY_EMOJI[c]} {i.cat(c)}
			</button>
		{/each}
	</div>

	<div class="relative mt-10">
		<div class="card relative min-h-[22rem] overflow-hidden p-8 sm:p-12" style="box-shadow: 10px 10px 0 #111">
			<div class="mb-6 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-ink/60">
				<span class="grid h-9 w-9 place-items-center rounded-xl bg-ink"><Smiley size={24} /></span>
				GoodPush · {i.cat(cat)}
				<span class="ml-auto hidden sm:inline">{CATEGORY_EMOJI[cat]}</span>
			</div>
			{#key phrase.id + i.lang}
				<p class="display text-[clamp(2.8rem,8vw,6.5rem)]" in:fly={{ y: 60, duration: 700, easing: backOut }}>
					<PhraseText text={phrase[i.lang]} />
				</p>
			{/key}
			<div class="absolute bottom-6 left-8 flex gap-1.5 sm:left-12">
				{#each pool as _, n (n)}
					<span class="h-2 rounded-full bg-ink transition-all duration-500 {n === k % pool.length ? 'w-8' : 'w-2 opacity-30'}"></span>
				{/each}
			</div>
		</div>
		<Smiley size={88} wink class="absolute -right-4 -top-8 animate-wobble sm:-right-8" />
	</div>
</section>
