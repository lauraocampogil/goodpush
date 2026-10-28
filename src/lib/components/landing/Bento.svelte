<script lang="ts">
	import { onMount } from 'svelte';
	import NotifCard from '../NotifCard.svelte';
	import PhraseText from '../PhraseText.svelte';
	import Smiley from '../Smiley.svelte';
	import { PHRASES } from '#lib/data/phrases.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { burst, motion, reduced, reveal, splitReveal } from '#lib/motion.ts';

	const i = getI18n();
	let root: HTMLElement;
	let streak = $state(0);
	let nameIdx = $state(0);
	let typed = $state('');
	const names = ['Laura', 'Yanis', 'Inès', 'Malik', 'Noor'];
	const hello = ['Hello', 'Hola', 'Salut'];
	let helloIdx = $state(0);
	const fav = PHRASES.filter((p) => ['s8', 'c3', 'b6'].includes(p.id));
	const share = PHRASES.filter((p) => ['d7', 'l2', 't3'].includes(p.id));
	const you = PHRASES.find((p) => p.id === 'l8')!;

	onMount(() => {
		const { gsap } = motion();
		const counter = { v: 0 };
		const tw = gsap.to(counter, {
			v: 30,
			duration: reduced() ? 0 : 2.2,
			ease: 'power2.out',
			onUpdate: () => (streak = Math.round(counter.v)),
			scrollTrigger: { trigger: root, start: 'top 70%', once: true }
		});
		// Typewriter on names
		let char = 0;
		let deleting = false;
		const t = setInterval(() => {
			const full = names[nameIdx];
			if (!deleting) {
				typed = full.slice(0, ++char);
				if (char === full.length + 6) deleting = true;
			} else {
				typed = full.slice(0, --char);
				if (char <= 0) {
					deleting = false;
					nameIdx = (nameIdx + 1) % names.length;
				}
			}
		}, 110);
		const h = setInterval(() => (helloIdx = (helloIdx + 1) % hello.length), 1600);
		return () => {
			tw.scrollTrigger?.kill();
			clearInterval(t);
			clearInterval(h);
		};
	});
</script>

<section bind:this={root} class="bg-ink py-24 text-white lg:py-32">
	<div class="container-site">
		<p class="kicker !text-ink">{i.t('bento.kicker')}</p>
		<h2 use:splitReveal={{ scroll: true }} class="display mt-5 text-6xl text-sun sm:text-7xl">{i.t('feat.title')}</h2>

		<div class="mt-12 grid gap-4 md:grid-cols-6" use:reveal={{ children: true, stagger: 0.1 }}>
			<!-- Streak -->
			<article class="relative overflow-hidden rounded-[2rem] border-[3px] border-white/10 bg-sun p-7 text-ink md:col-span-3">
				<p class="text-sm font-extrabold uppercase tracking-widest">🔥 {i.t('feat.streak.t')}</p>
				<p class="display mt-3 text-[7rem] leading-none tabular-nums">{streak}</p>
				<p class="text-lg font-bold">{i.t('today.streak')}</p>
				<div class="mt-6 flex gap-1.5">
					{#each Array.from({ length: 10 }) as _, n (n)}
						<span class="h-4 flex-1 rounded-full border-2 border-ink transition-colors duration-300 {streak > n * 3 ? 'bg-pink' : 'bg-white'}"></span>
					{/each}
				</div>
				<p class="soft mt-4 text-2xl">{i.t('bento.streak')}</p>
				<Smiley size={120} wink class="absolute -right-6 -top-6 rotate-12 opacity-90" />
			</article>

			<!-- Favorites -->
			<article class="group relative overflow-hidden rounded-[2rem] border-[3px] border-white/10 bg-white p-7 text-ink md:col-span-3">
				<div class="flex items-start justify-between">
					<p class="text-sm font-extrabold uppercase tracking-widest">♥ {i.t('feat.fav.t')}</p>
					<button class="grid h-14 w-14 place-items-center rounded-full border-[3px] border-ink bg-pink text-2xl text-white transition hover:scale-110 active:scale-90" aria-label="♥" onclick={(e) => burst(e.currentTarget)}>♥</button>
				</div>
				<div class="relative mt-6 h-72">
					{#each fav as p, n (p.id)}
						<div class="absolute inset-x-0 transition-all duration-500 group-hover:translate-y-0" style="top:{n * 70}px; transform: rotate({(n - 1) * 3}deg); z-index:{n}">
							<NotifCard label={i.cat(p.cat)} time="♥" class="!p-3">
								<p class="display text-xl"><PhraseText text={p[i.lang]} /></p>
							</NotifCard>
						</div>
					{/each}
				</div>
				<p class="soft text-2xl">{i.t('bento.fav')}</p>
			</article>

			<!-- Share -->
			<article class="group relative overflow-hidden rounded-[2rem] border-[3px] border-white/10 bg-[#1d1d1d] p-7 md:col-span-2">
				<p class="text-sm font-extrabold uppercase tracking-widest">↗ {i.t('feat.share.t')}</p>
				<div class="relative mx-auto mt-6 h-64 w-40">
					{#each share as p, n (p.id)}
						<div
							class="absolute inset-0 flex flex-col justify-between rounded-2xl border-[3px] border-ink p-3 text-ink shadow-[4px_4px_0_#FF2E88] transition-[translate] duration-500 ease-out {n === 0 ? 'group-hover:-translate-x-[70px]' : n === 2 ? 'group-hover:translate-x-[70px]' : ''}"
							style="background:{['#FFF6EC', '#7FB2FF', '#FFE14D'][n]}; transform: rotate({(n - 1) * 6}deg)"
						>
							<span class="text-[9px] font-black">GOODPUSH</span>
							<p class="display text-lg leading-[0.95]"><PhraseText text={p[i.lang]} /></p>
							<Smiley size={22} />
						</div>
					{/each}
				</div>
				<p class="soft mt-4 text-2xl">{i.t('bento.share')}</p>
			</article>

			<!-- Personal -->
			<article class="relative overflow-hidden rounded-[2rem] border-[3px] border-white/10 bg-pink p-7 md:col-span-2">
				<p class="text-sm font-extrabold uppercase tracking-widest">✦ {i.t('feat.name.t')}</p>
				<p class="display mt-8 text-5xl">
					<span class="soft block text-5xl text-white">{typed}<span class="animate-pulse">|</span>,</span>
					<span class="text-ink">{you[i.lang].replace(/\*/g, '')}</span>
				</p>
				<p class="soft mt-6 text-2xl">{i.t('bento.you')}</p>
			</article>

			<!-- Languages -->
			<article class="relative overflow-hidden rounded-[2rem] border-[3px] border-white/10 bg-sky p-7 text-ink md:col-span-2">
				<p class="text-sm font-extrabold uppercase tracking-widest">🌍 EN · ES · FR</p>
				<div class="mt-8 h-28 overflow-hidden">
					<div class="transition-transform duration-700 ease-[cubic-bezier(.2,.9,.3,1.2)]" style="transform: translateY(-{helloIdx * 7}rem)">
						{#each hello as w (w)}
							<p class="display h-28 text-[6rem] leading-[7rem]">{w}</p>
						{/each}
					</div>
				</div>
				<p class="soft mt-4 text-2xl">{i.t('bento.lang')}</p>
			</article>
		</div>
	</div>
</section>
