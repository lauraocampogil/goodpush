<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import NotifCard from '../NotifCard.svelte';
	import PhraseText from '../PhraseText.svelte';
	import Smiley from '../Smiley.svelte';
	import { CATEGORY_IDS, type CategoryId } from '#lib/data/categories.ts';
	import { PHRASES } from '#lib/data/phrases.ts';
	import { track } from '#lib/analytics.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { motion, reduced, splitReveal } from '#lib/motion.ts';
	import { CATEGORY_COLOR } from '#lib/smiley.ts';

	const i = getI18n();
	let pile: HTMLElement;
	let cat = $state<CategoryId>('discipline');
	let k = $state(0);
	const pool = $derived(PHRASES.filter((p) => p.cat === cat && !p.premium));
	const phrase = $derived(pool[k % pool.length]);

	// Hand-placed "pile" (x%, y%, size, rotation) — like stickers dropped on a table
	const spots = [
		[30, 22, 34, -8],
		[58, 14, 30, 12],
		[12, 48, 30, 6],
		[44, 46, 36, -4],
		[72, 40, 30, -14],
		[24, 74, 30, 10],
		[60, 72, 32, 4]
	];
	const moods = ['smile', 'calm', 'smile', 'wink', 'smile', 'calm', 'wink'] as const;

	onMount(() => {
		const t = setInterval(() => k++, 3200);
		const { gsap, Draggable } = motion();
		const els = gsap.utils.toArray<HTMLElement>('[data-sticker]', pile);
		if (!reduced()) {
			gsap.from(els, {
				y: -500,
				rotate: () => gsap.utils.random(-120, 120),
				duration: 1.1,
				ease: 'bounce.out',
				stagger: 0.08,
				scrollTrigger: { trigger: pile, start: 'top 75%', once: true }
			});
		}
		const drags = Draggable.create(els, {
			bounds: pile,
			zIndexBoost: true,
			onPress() {
				gsap.to(this.target, { scale: 1.08, duration: 0.2 });
			},
			onRelease() {
				gsap.to(this.target, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
			},
			onClick() {
				pick((this.target as HTMLElement).dataset.cat as CategoryId);
			}
		});
		return () => {
			clearInterval(t);
			drags.forEach((d) => d.kill());
		};
	});

	function pick(c: CategoryId) {
		cat = c;
		k = 0;
		track('vibe_demo', { category: c });
	}
</script>

<section id="vibes" class="overflow-hidden bg-ink pb-28 text-paper sm:pb-36">
	<div class="container-site grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
		<div>
			<h2 use:splitReveal={{ scroll: true }} class="display text-6xl sm:text-7xl">{i.t('vibe.pile.title')}</h2>
			<p class="mt-3 text-paper/60">{i.t('vibe.pile.sub')}</p>

			<div bind:this={pile} class="relative mt-6 aspect-square w-full max-w-[560px] touch-none sm:aspect-[5/4]">
				{#each CATEGORY_IDS as c, n (c)}
					{@const [x, y, s, r] = spots[n]}
					<button
						data-sticker
						data-cat={c}
						class="group absolute cursor-grab active:cursor-grabbing"
						style="left:{x}%; top:{y}%; width:{s}%; transform: rotate({r}deg)"
						aria-label={i.cat(c)}
						aria-pressed={cat === c}
					>
						<Smiley size={0} color={CATEGORY_COLOR[c]} mood={moods[n]} class="h-auto w-full drop-shadow-[0_18px_24px_rgb(0_0_0/0.45)] transition-[filter] {cat === c ? '' : 'saturate-[.85]'}" />
						<span class="pill pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-paper text-ink transition {cat === c ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}">{i.cat(c)}</span>
					</button>
				{/each}
			</div>
		</div>

		<div class="relative">
			{#key phrase.id + i.lang}
				<div in:fly={{ y: 40, duration: 600, easing: backOut }}>
					<NotifCard label={i.cat(cat)} time="08:00" class="p-7 sm:p-9">
						<p class="display text-[clamp(2.4rem,6vw,4rem)] leading-[0.92]"><PhraseText text={phrase[i.lang]} /></p>
					</NotifCard>
				</div>
			{/key}
			<div class="mt-5 flex justify-center gap-1.5">
				{#each pool as _, n (n)}
					<span class="h-1.5 rounded-full bg-paper transition-all duration-500 {n === k % pool.length ? 'w-6' : 'w-1.5 opacity-30'}"></span>
				{/each}
			</div>
		</div>
	</div>
</section>
