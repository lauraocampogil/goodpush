<script lang="ts">
	import { ArrowLeft } from '#lib/icons.ts';
	import { page } from '$app/state';
	import Smiley from '#lib/components/Smiley.svelte';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import type { DictKey } from '#lib/i18n/dict.ts';

	const i = getI18n();
	const httpErrors: Record<number, DictKey> = {
		400: 'err.400',
		401: 'err.401',
		403: 'err.403',
		404: 'err.404',
		500: 'err.500',
		503: 'err.503'
	};
	const message = $derived(httpErrors[page.status] ? i.t(httpErrors[page.status]) : i.t('err.500'));
</script>

<svelte:head><title>{page.status} · GoodPush</title></svelte:head>

<main class="grid min-h-dvh place-items-center px-4 text-center">
	<div>
		<div class="flex items-center justify-center gap-2">
			<span class="display text-[clamp(4.2rem,17.5vw,9.8rem)] leading-none">{String(page.status).charAt(0)}</span>
			<Smiley size={0} wink class="h-[clamp(5rem,20vw,11rem)] w-[clamp(5rem,20vw,11rem)] animate-float" />
			<span class="display text-[clamp(4.2rem,17.5vw,9.8rem)] leading-none">{String(page.status).slice(2)}</span>
		</div>
		<p class="soft mt-4 text-4xl">{message}</p>
		<a href="/" class="btn mt-10"><ArrowLeft /> {i.t('error.back')}</a>
	</div>
</main>
