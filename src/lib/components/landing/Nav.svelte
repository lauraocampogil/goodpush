<script lang="ts">
	import { onMount } from 'svelte';
	import Logo from '../Logo.svelte';
	import { LANGS } from '#lib/data/categories.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { track } from '#lib/analytics.ts';
	import { magnetic } from '#lib/motion.ts';

	let { onstart, cta }: { onstart: () => void; cta: string } = $props();
	const i = getI18n();
	let scrolled = $state(false);
	let hidden = $state(false);

	onMount(() => {
		let last = 0;
		const on = () => {
			const y = scrollY;
			scrolled = y > 20;
			hidden = y > 500 && y > last;
			last = y;
		};
		on();
		addEventListener('scroll', on, { passive: true });
		return () => removeEventListener('scroll', on);
	});

	const links = [
		['/#how', 'nav.how'],
		['/#pricing', 'nav.pricing'],
		['/#faq', 'nav.faq']
	] as const;
</script>

<!-- Floating pill nav: transparent on top, becomes a glass pill on scroll -->
<header class="fixed inset-x-0 top-0 z-40 px-3 pt-3 transition-transform duration-500 sm:px-6 {hidden ? '-translate-y-[130%]' : ''}">
	<nav
		class="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-3 py-2 ring-ink transition-all duration-500 sm:px-4 {scrolled
			? 'glass shadow-[4px_4px_0_#141414] ring-2'
			: 'ring-0'}"
	>
		<a href="/" aria-label="GoodPush"><Logo /></a>
		<ul class="hidden items-center gap-1 md:flex">
			{#each links as [href, key] (href)}
				<li><a {href} class="rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-ink hover:text-white">{i.t(key)}</a></li>
			{/each}
		</ul>
		<div class="flex items-center gap-2">
			<select
				class="hidden cursor-pointer appearance-none rounded-full bg-white px-3 py-2 text-xs font-bold uppercase ring-1 ring-ink/15 sm:block"
				value={i.lang}
				aria-label="Language"
				onchange={(e) => {
					const l = (e.currentTarget as HTMLSelectElement).value as (typeof LANGS)[number];
					i.set(l);
					track('lang_changed', { lang: l, from: 'nav' });
				}}
			>
				{#each LANGS as l (l)}<option value={l}>{l.toUpperCase()}</option>{/each}
			</select>
			<span use:magnetic={0.25} class="inline-block">
				<button class="btn px-5 py-2.5 text-sm" onclick={onstart}>{cta}</button>
			</span>
		</div>
	</nav>
</header>
