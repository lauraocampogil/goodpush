<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import NotifCard from '../NotifCard.svelte';
	import PhraseText from '../PhraseText.svelte';
	import Smiley from '../Smiley.svelte';
	import { CATEGORY_EMOJI, CATEGORY_IDS } from '#lib/data/categories.ts';
	import { PHRASES } from '#lib/data/phrases.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { motion, reduced, reveal, splitReveal } from '#lib/motion.ts';

	const i = getI18n();
	let root: HTMLElement;
	let active = $state(0);
	const steps = [1, 2, 3] as const;

	onMount(() => {
		const { gsap, ScrollTrigger } = motion();
		const mm = gsap.matchMedia();
		// Desktop: pin the section and walk through the 3 steps while scrolling
		mm.add('(min-width: 1024px)', () => {
			if (reduced()) return;
			const st = ScrollTrigger.create({
				trigger: root,
				start: 'top top',
				end: '+=1600',
				pin: true,
				scrub: true,
				onUpdate: (self) => (active = Math.min(2, Math.floor(self.progress * 3)))
			});
			return () => st.kill();
		});
		// Mobile: the phone plays the 3 steps on a loop
		mm.add('(max-width: 1023px)', () => {
			const t = setInterval(() => (active = (active + 1) % 3), 2600);
			return () => clearInterval(t);
		});
		return () => mm.revert();
	});

	const demo = PHRASES.find((p) => p.id === 'l1')!;
</script>

<section id="how" bind:this={root} class="relative overflow-hidden border-y-[3px] border-ink bg-white lg:min-h-dvh">
	<div class="container-site grid items-center gap-10 py-20 lg:min-h-dvh lg:grid-cols-2">
		<div>
			<p class="kicker">{i.t('how.kicker')}</p>
			<h2 use:splitReveal={{ scroll: true }} class="display mt-5 text-6xl sm:text-7xl lg:text-8xl">{i.t('how.title')}</h2>
			<ol class="mt-10 space-y-4">
				{#each steps as n, k (n)}
					<li data-step={k} class="flex gap-5 rounded-3xl border-[3px] p-5 transition-all duration-500 {active === k ? 'border-ink bg-cream shadow-[6px_6px_0_#111]' : 'border-transparent opacity-40'}">
						<span class="display text-6xl leading-none {active === k ? 'text-pink' : ''}">0{n}</span>
						<div>
							<h3 class="text-2xl font-extrabold">{i.t(`how.${n}.t` as 'how.1.t')}</h3>
							<p class="mt-1 text-ink/70">{i.t(`how.${n}.d` as 'how.1.d')}</p>
						</div>
					</li>
				{/each}
			</ol>
		</div>

		<!-- Phone whose screen follows the active step -->
		<div class="mx-auto w-full max-w-[240px] lg:max-w-[300px]">
			<div class="aspect-[9/18] rounded-[3rem] border-[3px] border-ink bg-ink p-2.5 shadow-[12px_12px_0_#FFE14D]">
				<div class="relative h-full overflow-hidden rounded-[2.4rem] bg-cream">
					{#key active}
						<div class="absolute inset-0 flex flex-col items-center justify-center p-5" in:fly={{ y: 40, duration: 600, easing: backOut }}>
							{#if active === 0}
								<div class="grid grid-cols-4 gap-4">
									{#each Array.from({ length: 11 }) as _, k (k)}
										<span class="h-12 w-12 rounded-2xl border-2 border-ink/15 bg-ink/5"></span>
									{/each}
									<span class="grid h-12 w-12 animate-bounce place-items-center rounded-2xl border-2 border-ink bg-ink" in:scale={{ delay: 300, duration: 500, easing: backOut }}>
										<Smiley size={34} wink />
									</span>
								</div>
								<p class="mt-6 text-sm font-bold">GoodPush ✓</p>
							{:else if active === 1}
								<p class="display mb-4 text-3xl">{i.t('ob.cats.t')}</p>
								<div class="flex flex-wrap justify-center gap-2">
									{#each CATEGORY_IDS as c, k (c)}
										<span class="chip text-xs" aria-pressed={k % 3 === 0} in:scale={{ delay: k * 70, duration: 400, easing: backOut }}>
											{CATEGORY_EMOJI[c]} {i.cat(c)}
										</span>
									{/each}
								</div>
							{:else}
								<p class="mb-4 text-5xl font-semibold tabular-nums">08:00</p>
								<div class="w-full" in:fly={{ y: -60, delay: 250, duration: 700, easing: backOut }}>
									<NotifCard label={i.cat(demo.cat)} time="now" class="!p-3">
										<p class="display text-xl"><span class="soft">Laura,</span> <PhraseText text={demo[i.lang]} /></p>
									</NotifCard>
								</div>
							{/if}
						</div>
					{/key}
				</div>
			</div>
		</div>
	</div>
</section>
