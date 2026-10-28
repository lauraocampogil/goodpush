<script lang="ts">
	import type { Snippet } from 'svelte';
	import Footer from '#lib/components/Footer.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { getI18n } from '#lib/i18n/index.svelte.ts';

	let { title, updated, children }: { title: string; updated: string; children: Snippet } = $props();
	const i = getI18n();
</script>

<Seo {title} description="{title} — GoodPush" />
<header class="container-site flex items-center justify-between py-5">
	<a href="/" class="group inline-flex items-center gap-2 font-bold">
		<span class="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-white transition-transform group-hover:-translate-x-1">←</span>
		{i.t('common.back')}
	</a>
	<a href="/" aria-label="GoodPush"><Logo size="sm" /></a>
</header>
<main class="container-site max-w-3xl pb-24 pt-6">
	<h1 class="display text-6xl sm:text-7xl">{title}</h1>
	<p class="mt-3 text-sm font-semibold text-ink/60">Last updated: {updated}</p>
	<article class="legal mt-10">{@render children()}</article>
</main>
<Footer />

<style>
	.legal {
		counter-reset: section;
	}
	.legal :global(section) {
		padding: 1.75rem 0;
	}
	.legal :global(section + section) {
		border-top: 2px dashed rgb(17 17 17 / 0.25);
	}
	.legal :global(h2) {
		counter-increment: section;
		font-family: var(--font-display);
		text-transform: uppercase;
		font-size: 1.75rem;
		line-height: 1;
		margin-bottom: 0.75rem;
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
	}
	.legal :global(h2)::before {
		content: counter(section, decimal-leading-zero);
		color: var(--color-pink);
	}
	.legal :global(p),
	.legal :global(li) {
		color: rgb(17 17 17 / 0.8);
		line-height: 1.65;
	}
	.legal :global(p + p),
	.legal :global(p + ul),
	.legal :global(ul + p) {
		margin-top: 0.75rem;
	}
	.legal :global(ul) {
		list-style: disc;
		padding-left: 1.25rem;
		display: grid;
		gap: 0.4rem;
	}
	.legal :global(a) {
		text-decoration: underline;
		font-weight: 600;
	}
</style>
