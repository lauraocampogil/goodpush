<script lang="ts">
	import { ArrowLeft } from '#lib/icons.ts';
	import { page } from '$app/state';
	import Smiley from '#lib/components/Smiley.svelte';
	import { getI18n } from '#lib/i18n/index.svelte.ts';

	const i = getI18n();
	const httpErrors: Record<number, string> = {
		400: 'That request looks off.',
		401: 'You need to be signed in for that.',
		403: 'This page isn’t for you.',
		404: 'This page took a day off.',
		500: 'Something broke on our side.',
		503: 'We’ll be right back.'
	};
	const message = $derived(httpErrors[page.status] ?? page.error?.message ?? 'Something went wrong.');
</script>

<svelte:head><title>{page.status} · GoodPush</title></svelte:head>

<main class="dots grid min-h-dvh place-items-center px-4 text-center">
	<div>
		<div class="flex items-center justify-center gap-2">
			<span class="display text-[clamp(6rem,25vw,14rem)] leading-none">{String(page.status).charAt(0)}</span>
			<Smiley size={0} wink class="h-[clamp(5rem,20vw,11rem)] w-[clamp(5rem,20vw,11rem)] animate-wobble" />
			<span class="display text-[clamp(6rem,25vw,14rem)] leading-none">{String(page.status).slice(2)}</span>
		</div>
		<p class="soft mt-4 text-4xl">{message}</p>
		<a href="/" class="btn mt-10"><ArrowLeft /> {i.t('error.back')}</a>
	</div>
</main>
