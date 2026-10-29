<script lang="ts">
	import { PUBLIC_CONTACT_EMAIL } from '$app/env/public';
	import Footer from '#lib/components/Footer.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { ArrowLeft } from '#lib/icons.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import type { LegalDoc } from '#lib/i18n/legal.ts';
	import type { Lang } from '#lib/data/categories.ts';

	let { docs }: { docs: Record<Lang, LegalDoc> } = $props();
	const i = getI18n();
	const doc = $derived(docs[i.lang]);
	const html = (s: string) => s.replaceAll('{email}', PUBLIC_CONTACT_EMAIL);
</script>

<Seo title="{doc.title} — GoodPush" description="{doc.title} — GoodPush" />
<header class="container-site flex items-center justify-between py-6">
	<a href="/" class="group inline-flex items-center gap-2 text-sm font-semibold">
		<span class="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-ink/10 transition-transform group-hover:-translate-x-1"><ArrowLeft /></span>
		{i.t('common.back')}
	</a>
	<a href="/" aria-label="GoodPush"><Logo size="sm" /></a>
</header>
<main class="container-site max-w-3xl pt-6 pb-24">
	<h1 class="display text-4xl sm:text-5xl">{doc.title}</h1>
	<p class="mt-3 text-sm font-medium text-ink/50">{i.t('legal.updated')}: {doc.updated}</p>
	<article class="legal mt-10">
		{#each doc.sections as s (s.h)}
			<section>
				<h2>{s.h}</h2>
				{@html html(s.html)}
			</section>
		{/each}
	</article>
</main>
<Footer />

<style>
	.legal {
		counter-reset: section;
	}
	.legal section {
		padding: 1.75rem 0;
	}
	.legal section + section {
		border-top: 2px dashed rgb(20 20 20 / 0.18);
	}
	.legal h2 {
		counter-increment: section;
		font-family: var(--font-display);
		font-weight: 800;
		letter-spacing: -0.03em;
		font-size: 1.25rem;
		line-height: 1.1;
		margin-bottom: 0.85rem;
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
	}
	.legal h2::before {
		content: counter(section, decimal-leading-zero);
		color: var(--color-orange);
	}
	.legal :global(p),
	.legal :global(li) {
		color: rgb(20 20 20 / 0.75);
		line-height: 1.7;
	}
	.legal :global(ul) {
		list-style: disc;
		padding-left: 1.25rem;
		display: grid;
		gap: 0.45rem;
	}
	.legal :global(a) {
		text-decoration: underline;
		font-weight: 600;
	}
</style>
