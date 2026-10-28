<script lang="ts">
	import { PUBLIC_INSTAGRAM_URL, PUBLIC_TIKTOK_URL } from '$app/env/public';
	import Logo from '#lib/components/Logo.svelte';
	import { LANGS } from '#lib/data/categories.ts';
	import { LANG_LABEL } from '#lib/i18n/dict.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';

	const i = getI18n();
</script>

<footer class="border-t-[3px] border-ink bg-white">
	<div class="container-site flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
		<div>
			<Logo size="sm" />
			<p class="soft mt-1 text-xl">{i.t('footer.made')}</p>
		</div>
		<nav class="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
			<a href="/privacy" class="hover:text-pink">{i.t('footer.privacy')}</a>
			<a href="/terms" class="hover:text-pink">{i.t('footer.terms')}</a>
			<a href={PUBLIC_INSTAGRAM_URL} target="_blank" rel="noopener" class="hover:text-pink">Instagram</a>
			<a href={PUBLIC_TIKTOK_URL} target="_blank" rel="noopener" class="hover:text-pink">TikTok</a>
			<a href={PUBLIC_INSTAGRAM_URL} target="_blank" rel="noopener" class="hover:text-pink">{i.t('footer.feedback')}</a>
		</nav>
		<div class="flex gap-2">
			{#each LANGS as l (l)}
				<button class="chip px-3 py-1 text-xs" aria-pressed={i.lang === l} onclick={() => i.set(l)}>
					{LANG_LABEL[l]}
				</button>
			{/each}
		</div>
	</div>
	<p class="container-site pb-8 text-xs text-ink/50">© {new Date().getFullYear()} GoodPush · Unix Creative Studio</p>
</footer>
