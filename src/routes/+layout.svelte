<script lang="ts">
	// Self-hosted fonts (no Google Fonts requests → better for GDPR + offline)
	import '@fontsource/anton';
	import '@fontsource/instrument-serif/400.css';
	import '@fontsource/instrument-serif/400-italic.css';
	import '@fontsource-variable/bricolage-grotesque';
	import './layout.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { setI18n } from '#lib/i18n/index.svelte.ts';
	import { install } from '#lib/install.svelte.ts';
	import { app } from '#lib/store.svelte.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	// svelte-ignore state_referenced_locally
	setI18n(data.lang);

	onMount(() => {
		app.load();
		app.captureSource(new URL(page.url.href));
		install.listen();
	});
</script>

{@render children()}
