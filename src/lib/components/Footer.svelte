<script lang="ts">
	import { PUBLIC_INSTAGRAM_URL, PUBLIC_TIKTOK_URL } from '$app/env/public';
	import Smiley from './Smiley.svelte';
	import { LANGS } from '#lib/data/categories.ts';
	import { LANG_LABEL } from '#lib/i18n/dict.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { track } from '#lib/analytics.ts';

	const i = getI18n();
</script>

<footer class="overflow-hidden bg-cream">
	<div class="container-site grid gap-10 py-16 md:grid-cols-3">
		<div>
			<p class="soft text-3xl">{i.t('footer.made')}</p>
			<div class="mt-4 flex gap-2">
				{#each LANGS as l (l)}
					<button class="chip px-3 py-1 text-xs" aria-pressed={i.lang === l} onclick={() => { i.set(l); track('lang_changed', { lang: l, from: 'footer' }); }}>{LANG_LABEL[l]}</button>
				{/each}
			</div>
		</div>
		<nav class="flex flex-col gap-2 font-bold">
			<a href="/#how" class="hover:text-pink">{i.t('nav.how')}</a>
			<a href="/#pricing" class="hover:text-pink">{i.t('nav.pricing')}</a>
			<a href="/privacy" class="hover:text-pink">{i.t('footer.privacy')}</a>
			<a href="/terms" class="hover:text-pink">{i.t('footer.terms')}</a>
		</nav>
		<nav class="flex flex-col gap-2 font-bold">
			<a href={PUBLIC_TIKTOK_URL} target="_blank" rel="noopener" class="hover:text-pink">TikTok ↗</a>
			<a href={PUBLIC_INSTAGRAM_URL} target="_blank" rel="noopener" class="hover:text-pink">Instagram ↗</a>
			<a href={PUBLIC_INSTAGRAM_URL} target="_blank" rel="noopener" class="hover:text-pink">{i.t('footer.feedback')} ↗</a>
		</nav>
	</div>
	<div class="container-site" aria-hidden="true">
		<p class="display flex items-center justify-center text-[18vw] leading-[0.8] select-none">
			G<span class="inline-flex"><Smiley size={0} class="h-[0.72em] w-[0.72em]" /><Smiley size={0} wink class="h-[0.72em] w-[0.72em]" /></span>D<span class="text-pink">PUSH</span>
		</p>
	</div>
	<p class="container-site py-6 text-xs text-ink/50">© {new Date().getFullYear()} GoodPush · Unix Creative Studio · Brussels</p>
</footer>
