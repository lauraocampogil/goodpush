<script lang="ts">
	import { onMount } from 'svelte';
	import Logo from '../Logo.svelte';
	import { getI18n } from '#lib/i18n/index.svelte.ts';

	let { onstart, cta }: { onstart: () => void; cta: string } = $props();
	const i = getI18n();
	let scrolled = $state(false);
	let hidden = $state(false);

	onMount(() => {
		let last = 0;
		const on = () => {
			const y = scrollY;
			scrolled = y > 24;
			hidden = y > 500 && y > last;
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

<header class="fixed inset-x-0 top-0 z-40 transition-transform duration-500 {hidden ? '-translate-y-full' : ''}">
	<nav class="transition-colors duration-500 {scrolled ? 'glass shadow-[0_1px_0_rgb(0_0_0/0.06)]' : ''}">
		<div class="container-site flex h-16 items-center justify-between gap-4 sm:h-20">
			<a href="/" aria-label="GoodPush"><Logo /></a>
			<ul class="hidden items-center gap-8 text-sm font-medium lg:flex">
				{#each links as [href, key] (href)}
					<li><a {href} class="text-ink/70 transition hover:text-ink">{i.t(key)}</a></li>
				{/each}
			</ul>
			<button class="btn px-5 py-2.5 text-sm" onclick={onstart}>{cta}</button>
		</div>
	</nav>
</header>
