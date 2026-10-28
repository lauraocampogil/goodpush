<script lang="ts">
	import { page } from '$app/state';
	import { PUBLIC_SITE_URL } from '$app/env/public';

	let {
		title,
		description,
		noindex = false
	}: { title: string; description: string; noindex?: boolean } = $props();

	const canonical = $derived(PUBLIC_SITE_URL + page.url.pathname);
	const image = `${PUBLIC_SITE_URL}/og.png`;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#if noindex}<meta name="robots" content="noindex" />{/if}
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="GoodPush" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
</svelte:head>
