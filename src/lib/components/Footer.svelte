<script lang="ts">
	import { PUBLIC_INSTAGRAM_URL, PUBLIC_TIKTOK_URL } from '$app/env/public';
	import Logo from './Logo.svelte';
	import { LANGS } from '#lib/data/categories.ts';
	import { LANG_LABEL } from '#lib/i18n/dict.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { track } from '#lib/analytics.ts';
	import { ChatDots, Instagram, TikTok } from '#lib/icons.ts';

	const i = getI18n();
</script>

<footer class="bg-sun">
	<div class="container-site flex flex-col gap-8 py-12 md:flex-row md:items-center md:justify-between">
		<div class="flex flex-col gap-4">
			<Logo />
			<div class="flex gap-1">
				{#each LANGS as l (l)}
					<button
						class="rounded-full px-3 py-1 text-xs font-semibold transition {i.lang === l ? 'bg-ink text-white' : 'hover:bg-ink/10'}"
						onclick={() => { i.set(l); track('lang_changed', { lang: l, from: 'footer' }); }}
					>{LANG_LABEL[l]}</button>
				{/each}
			</div>
		</div>
		<nav class="flex flex-wrap items-center gap-6 text-sm font-semibold">
			<a href={PUBLIC_TIKTOK_URL} target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 hover:opacity-60"><TikTok size={16} /> TikTok</a>
			<a href={PUBLIC_INSTAGRAM_URL} target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 hover:opacity-60"><Instagram size={16} /> Instagram</a>
			<a href={PUBLIC_INSTAGRAM_URL} target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 hover:opacity-60"><ChatDots size={16} /> {i.t('footer.feedback')}</a>
		</nav>
	</div>
	<div class="container-site flex flex-col gap-3 border-t border-ink/10 py-6 text-xs text-ink/60 sm:flex-row sm:justify-between">
		<p>© {new Date().getFullYear()} GoodPush · Unix Creative Studio · Brussels</p>
		<div class="flex gap-6">
			<a href="/premium" class="hover:text-ink">Premium</a>
			<a href="/privacy" class="hover:text-ink">{i.t('footer.privacy')}</a>
			<a href="/terms" class="hover:text-ink">{i.t('footer.terms')}</a>
		</div>
	</div>
</footer>
