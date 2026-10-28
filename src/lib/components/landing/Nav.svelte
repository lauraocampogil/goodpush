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
			hidden = y > 400 && y > last;
			last = y;
		};
		addEventListener('scroll', on, { passive: true });
		return () => removeEventListener('scroll', on);
	});

	const links = [
		['#how', 'nav.how'],
		['#vibes', 'nav.vibes'],
		['#pricing', 'nav.pricing'],
		['#faq', 'nav.faq']
	] as const;
</script>

<header
	class="fixed inset-x-0 top-0 z-40 px-3 pt-3 transition-transform duration-500 sm:px-6 {hidden ? '-translate-y-[120%]' : ''}"
>
	<nav
		class="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border-[3px] border-transparent px-3 py-2 transition-all duration-500 sm:px-4 {scrolled
			? 'glass !border-ink shadow-[4px_4px_0_#111]'
			: ''}"
	>
		<a href="/" aria-label="GoodPush"><Logo /></a>
		<ul class="hidden items-center gap-1 lg:flex">
			{#each links as [href, key] (href)}
				<li>
					<a {href} class="rounded-full px-4 py-2 text-sm font-bold transition hover:bg-ink hover:text-white">{i.t(key)}</a>
				</li>
			{/each}
		</ul>
		<div class="flex items-center gap-2">
			<select
				class="hidden rounded-full border-2 border-ink bg-white px-2 py-1.5 text-xs font-bold uppercase sm:block"
				value={i.lang}
				aria-label="Language"
				onchange={(e) => {
					const l = (e.currentTarget as HTMLSelectElement).value as (typeof LANGS)[number];
					i.set(l);
					track('lang_changed', { lang: l, from: 'nav' });
				}}
			>
				{#each LANGS as l (l)}<option value={l}>{l}</option>{/each}
			</select>
			<span use:magnetic={0.25}>
				<button class="btn px-4 py-2 text-sm sm:px-5" onclick={onstart}>{cta}</button>
			</span>
		</div>
	</nav>
</header>
