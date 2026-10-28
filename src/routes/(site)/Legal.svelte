<script lang="ts">
	import type { Snippet } from 'svelte';
	import Logo from '#lib/components/Logo.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import Footer from './Footer.svelte';

	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<Seo {title} description="{title} — GoodPush" />
<header class="container-site py-5"><a href="/" aria-label="GoodPush"><Logo /></a></header>
<main class="container-site max-w-3xl py-10">
	<h1 class="display mb-8 text-5xl sm:text-6xl">{title}</h1>
	<article class="legal space-y-4 text-ink/80">{@render children()}</article>
</main>
<Footer />

<style>
	.legal :global(h2) {
		font-weight: 800;
		font-size: 1.25rem;
		color: #111;
		margin-top: 2rem;
	}
	.legal :global(ul) {
		list-style: disc;
		padding-left: 1.25rem;
	}
	.legal :global(a) {
		text-decoration: underline;
	}
</style>
