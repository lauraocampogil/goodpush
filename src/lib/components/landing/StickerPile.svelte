<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import NotifCard from '../NotifCard.svelte';
	import PhraseText from '../PhraseText.svelte';
	import Smiley from '../Smiley.svelte';
	import CatIcon from '../CatIcon.svelte';
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

	// Floating label (rendered on top of the whole pile, so it's never hidden)
	let label = $state<{ c: CategoryId; x: number; y: number } | null>(null);
	let hovered: HTMLElement | null = null;

	function placeLabel(el: HTMLElement | null) {
		if (!el || !pile) return;
		const p = pile.getBoundingClientRect();
		const r = el.getBoundingClientRect();
		label = { c: el.dataset.cat as CategoryId, x: r.left - p.left + r.width / 2, y: r.top - p.top };
	}
	const selectedEl = () => pile?.querySelector<HTMLElement>(`[data-cat="${cat}"]`) ?? null;

	onMount(() => {
		const t = setInterval(() => k++, 3200);
		const { gsap, Draggable } = motion();
		const els = gsap.utils.toArray<HTMLElement>('[data-sticker]', pile);
		const faces = els.map((el) => el.querySelector<HTMLElement>('[data-face]')!);
		els.forEach((el, n) => gsap.set(el, { rotation: spots[n][3] }));

		if (!reduced()) {
			// 1. Drop onto the table, bounce, settle
			gsap.from(els, {
				y: () => gsap.utils.random(-700, -450),
				x: () => gsap.utils.random(-80, 80),
				rotation: () => gsap.utils.random(-200, 200),
				duration: 1.2,
				ease: 'bounce.out',
				stagger: { each: 0.09, from: 'random' },
				scrollTrigger: { trigger: pile, start: 'top 75%', once: true },
				onComplete: () => placeLabel(selectedEl())
			});
			// 2. Idle: each sticker breathes at its own pace
			faces.forEach((f) =>
				gsap.to(f, {
					y: gsap.utils.random(-10, -5),
					rotation: gsap.utils.random(-5, 5),
					duration: gsap.utils.random(1.6, 2.6),
					ease: 'sine.inOut',
					yoyo: true,
					repeat: -1,
					delay: gsap.utils.random(0, 1.5)
				})
			);
		}

		const drags = Draggable.create(els, {
			bounds: pile,
			zIndexBoost: true,
			onPress() {
				const f = (this.target as HTMLElement).querySelector('[data-face]');
				gsap.to(f, { scale: 1.12, duration: 0.25, ease: 'back.out(3)', overwrite: 'auto' });
			},
			onDrag() {
				// tilt in the direction of the drag
				const f = (this.target as HTMLElement).querySelector('[data-face]');
				gsap.to(f, { rotation: gsap.utils.clamp(-28, 28, this.deltaX * 2.2), duration: 0.25, overwrite: 'auto' });
				placeLabel(this.target as HTMLElement);
			},
			onRelease() {
				const f = (this.target as HTMLElement).querySelector('[data-face]');
				gsap.to(f, { scale: 1, rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)', overwrite: 'auto' });
				placeLabel(hovered ?? selectedEl());
			},
			onClick() {
				pick((this.target as HTMLElement).dataset.cat as CategoryId, this.target as HTMLElement);
			}
		});

		const onResize = () => placeLabel(hovered ?? selectedEl());
		addEventListener('resize', onResize);
		placeLabel(selectedEl());
		return () => {
			clearInterval(t);
			removeEventListener('resize', onResize);
			drags.forEach((d) => d.kill());
		};
	});

	function enter(el: HTMLElement) {
		hovered = el;
		placeLabel(el);
		if (reduced()) return;
		const { gsap } = motion();
		const f = el.querySelector('[data-face]');
		gsap.timeline({ overwrite: 'auto' })
			.to(f, { scale: 1.1, duration: 0.3, ease: 'back.out(3)' })
			.to(f, { rotation: -10, duration: 0.08 }, 0)
			.to(f, { rotation: 8, duration: 0.1 })
			.to(f, { rotation: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
	}

	function leave(el: HTMLElement) {
		hovered = null;
		placeLabel(selectedEl());
		if (reduced()) return;
		motion().gsap.to(el.querySelector('[data-face]'), { scale: 1, duration: 0.4, ease: 'power3.out' });
	}

	function pick(c: CategoryId, el?: HTMLElement) {
		cat = c;
		k = 0;
		track('vibe_demo', { category: c });
		if (el) {
			placeLabel(el);
			if (!reduced()) {
				const { gsap } = motion();
				gsap.fromTo(el.querySelector('[data-face]'), { scale: 0.82 }, { scale: 1.1, duration: 0.7, ease: 'elastic.out(1.2, 0.35)' });
			}
		}
	}
</script>

<section id="vibes" class="overflow-hidden bg-ink pb-28 text-paper sm:pb-36">
	<div class="container-site grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
		<div>
			<h2 use:splitReveal={{ scroll: true }} class="display text-[2.6rem] sm:text-5xl">{i.t('vibe.pile.title')}</h2>
			<p class="mt-3 text-paper/60">{i.t('vibe.pile.sub')}</p>

			<div bind:this={pile} class="relative mt-6 aspect-square w-full max-w-[560px] touch-none sm:aspect-[5/4]">
				{#each CATEGORY_IDS as c, n (c)}
					{@const [x, y, s, r] = spots[n]}
					<button
						data-sticker
						data-cat={c}
						class="absolute cursor-grab rounded-full outline-none active:cursor-grabbing"
						style="left:{x}%; top:{y}%; width:{s}%"
						aria-label={i.cat(c)}
						aria-pressed={cat === c}
						onpointerenter={(e) => enter(e.currentTarget)}
						onpointerleave={(e) => leave(e.currentTarget)}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(c, e.currentTarget))}
					>
						<span data-face class="block rounded-full transition-shadow duration-300 {cat === c ? 'shadow-[0_0_0_5px_#fbf8f1,0_22px_30px_rgb(0_0_0/0.5)]' : 'shadow-[0_18px_26px_rgb(0_0_0/0.45)]'}">
							<Smiley size={0} color={CATEGORY_COLOR[c]} mood={moods[n]} class="block h-auto w-full" />
						</span>
					</button>
				{/each}
				{#if label}
					<span
						class="pill pointer-events-none absolute z-[5000] -translate-x-1/2 -translate-y-[130%] bg-paper px-3 py-1.5 text-sm whitespace-nowrap text-ink shadow-[var(--shadow-soft)] transition-[left,top] duration-200"
						style="left:{label.x}px; top:{label.y}px"
					><CatIcon cat={label.c} /> {i.cat(label.c)}</span>
				{/if}
			</div>
		</div>

		<div class="relative">
			{#key phrase.id + i.lang}
				<div in:fly={{ y: 40, duration: 600, easing: backOut }}>
					<NotifCard label={i.cat(cat)} time="08:00" class="p-7 sm:p-9">
						<p class="display text-[clamp(1.68rem,4.2vw,2.8rem)] leading-[0.92]"><PhraseText text={phrase[i.lang]} /></p>
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
