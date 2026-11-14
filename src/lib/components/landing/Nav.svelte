<script lang="ts">
	import { onMount } from 'svelte';
	import Logo from '../Logo.svelte';
	import { LANGS } from '#lib/data/categories.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { track } from '#lib/analytics.ts';

	let { onstart, cta }: { onstart: () => void; cta: string } = $props();
	const i = getI18n();
	let scrolled = $state(false);
	let hidden = $state(false);

	onMount(() => {
		let last = 0;
		const on = () => {
			const y = scrollY;
			scrolled = y > 20;
			hidden = y > 600 && y > last;
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

<!-- Dark top bar: transparent on the hero, blurred ink once you scroll -->
<header class="fixed inset-x-0 top-0 z-40 transition-transform duration-500 {hidden ? '-translate-y-full' : ''}">
	<nav class="transition-colors duration-500 {scrolled ? 'bg-ink/85 backdrop-blur-xl' : 'bg-transparent'}">
		<div class="container-site flex items-center justify-between gap-3 py-4">
			<a href="/" aria-label="GoodPush"><Logo tone="light" /></a>
			<ul class="hidden items-center gap-8 md:flex">
				{#each links as [href, key] (href)}
					<li><a {href} class="text-[15px] font-medium text-paper/80 transition hover:text-acid">{i.t(key)}</a></li>
				{/each}
			</ul>
			<div class="flex items-center gap-2">
				<select
					class="cursor-pointer appearance-none rounded-full bg-transparent px-3.5 py-2.5 text-xs font-bold text-paper uppercase ring-1 ring-paper/25"
					value={i.lang}
					aria-label="Language"
					onchange={(e) => {
						const l = (e.currentTarget as HTMLSelectElement).value as (typeof LANGS)[number];
						i.set(l);
						track('lang_changed', { lang: l, from: 'nav' });
					}}
				>
					{#each LANGS as l (l)}<option value={l} class="text-ink">{l.toUpperCase()}</option>{/each}
				</select>
				<button class="rounded-full bg-paper px-4 py-2.5 text-sm font-bold whitespace-nowrap text-ink transition hover:bg-acid sm:px-5" onclick={onstart}>{cta}</button>
			</div>
		</div>
	</nav>
</header>
