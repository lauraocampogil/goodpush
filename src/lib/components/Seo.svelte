<script lang="ts">
	import { page } from '$app/state';
	import { PUBLIC_SITE_URL } from '$app/env/public';
	import { LANGS } from '#lib/data/categories.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';

	let {
		title,
		description,
		noindex = false,
		jsonld
	}: { title: string; description: string; noindex?: boolean; jsonld?: Record<string, unknown>[] } = $props();

	const i = getI18n();
	const LOCALE = { en: 'en_GB', es: 'es_ES', fr: 'fr_FR' } as const;
	const base = $derived(PUBLIC_SITE_URL + (page.url.pathname === '/' ? '/' : page.url.pathname));
	// Each language has its own URL (?lang=xx) so Google indexes all three
	const canonical = $derived(`${base}?lang=${i.lang}`);
	const image = `${PUBLIC_SITE_URL}/og.png`;
	// JSON-LD must not be able to close the <script> tag
	const ld = $derived(jsonld?.length ? JSON.stringify(jsonld.length === 1 ? jsonld[0] : jsonld).replace(/</g, '\\u003c') : '');
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if noindex}
		<meta name="robots" content="noindex" />
	{:else}
		<link rel="canonical" href={canonical} />
		{#each LANGS as l (l)}<link rel="alternate" hreflang={l} href="{base}?lang={l}" />{/each}
		<link rel="alternate" hreflang="x-default" href={base} />
	{/if}
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="GoodPush" />
	<meta property="og:locale" content={LOCALE[i.lang]} />
	{#each LANGS.filter((l) => l !== i.lang) as l (l)}<meta property="og:locale:alternate" content={LOCALE[l]} />{/each}
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="GoodPush" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	{#if ld}{@html `<script type="application/ld+json">${ld}</script>`}{/if}
</svelte:head>
