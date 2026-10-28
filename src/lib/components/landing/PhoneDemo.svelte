<script lang="ts">
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fly, fade } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import NotifCard from '../NotifCard.svelte';
	import PhraseText from '../PhraseText.svelte';
	import Smiley from '../Smiley.svelte';
	import { PHRASES } from '#lib/data/phrases.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';

	const i = getI18n();
	const names = ['Laura', 'Yanis', 'Inès', 'Sam', 'Noor', 'Léa', 'Malik'];
	const pool = PHRASES.filter((p) => !p.premium);
	let n = $state(3);
	let items = $state(
		[0, 1, 2].map((k) => ({ key: k, p: pool[(k * 9) % pool.length], name: names[k] }))
	);
	let now = $state(new Date());

	onMount(() => {
		const t1 = setInterval(() => {
			items = [{ key: n, p: pool[(n * 9) % pool.length], name: names[n % names.length] }, ...items].slice(0, 3);
			n++;
		}, 2800);
		const t2 = setInterval(() => (now = new Date()), 10_000);
		return () => {
			clearInterval(t1);
			clearInterval(t2);
		};
	});

	const time = $derived(new Intl.DateTimeFormat(i.lang, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now));
	const date = $derived(new Intl.DateTimeFormat(i.lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(now));
</script>

<div class="relative mx-auto aspect-[9/19] w-full max-w-[330px] rounded-[3.2rem] border-[3px] border-ink bg-ink p-2.5 shadow-[14px_14px_0_#FF2E88]">
	<div class="relative h-full overflow-hidden rounded-[2.6rem] bg-gradient-to-b from-sky via-[#b9a7f5] to-[#ffb3d4]">
		<div class="absolute left-1/2 top-2.5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-ink"></div>
		<div class="pt-14 text-center text-ink">
			<p class="text-sm font-semibold capitalize opacity-80">{date}</p>
			<p class="font-sans text-7xl font-semibold tracking-tight tabular-nums">{time}</p>
		</div>
		<div class="mt-6 space-y-2.5 px-3">
			{#each items as it (it.key)}
				<div animate:flip={{ duration: 600, easing: backOut }} in:fly={{ y: -80, duration: 700, easing: backOut }} out:fade={{ duration: 250 }}>
					<NotifCard label={i.cat(it.p.cat)} time={it.key === n - 1 ? 'now' : `${(n - 1 - it.key) * 5}m`} class="!p-3 !shadow-[3px_3px_0_#111]">
						<p class="display text-[1.15rem] leading-[0.98]">
							<span class="soft text-lg">{it.name},</span>
							<PhraseText text={it.p[i.lang]} />
						</p>
					</NotifCard>
				</div>
			{/each}
		</div>
		<div class="absolute inset-x-0 bottom-3 flex justify-center">
			<span class="h-1.5 w-32 rounded-full bg-ink/80"></span>
		</div>
		<Smiley size={40} class="absolute bottom-10 left-5 animate-wobble" />
	</div>
</div>
