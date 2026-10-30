<script lang="ts">
	import { ShareFat } from '#lib/icons.ts';
	import { PUBLIC_SITE_URL } from '$app/env/public';
	import { track } from '#lib/analytics.ts';
	import type { Phrase } from '#lib/data/phrases.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { renderShareCard, shareImage } from '#lib/share.ts';
	import { CATEGORY_COLOR } from '#lib/smiley.ts';
	import { app } from '#lib/store.svelte.ts';

	let {
		phrase,
		highlight = false,
		class: cls = 'btn-ghost'
	}: { phrase: Phrase; highlight?: boolean; class?: string } = $props();
	const i = getI18n();
	let busy = $state(false);
	let toast = $state('');

	async function share() {
		if (busy) return;
		busy = true;
		try {
			const site = PUBLIC_SITE_URL.replace(/^https?:\/\//, '');
			const theme = app.access ? app.profile.theme : 'cream';
			const blob = await renderShareCard({
				text: phrase.author ? `“${phrase[i.lang]}” — ${phrase.author}` : phrase[i.lang],
				name: phrase.author ? undefined : app.profile.name || undefined,
				category: i.cat(phrase.cat),
				time: `${String(app.profile.hour).padStart(2, '0')}:00`,
				site,
				theme,
				badge: CATEGORY_COLOR[phrase.cat],
				tagline: i.t('share.tagline')
			});
			const link = `${PUBLIC_SITE_URL}/?utm_source=share&utm_campaign=${phrase.id}`;
			const res = await shareImage(blob, i.t('share.text'), link);
			if (res === 'downloaded') {
				toast = i.t('share.downloaded');
				setTimeout(() => (toast = ''), 3000);
			}
			track('share', { phrase: phrase.id, category: phrase.cat, result: res, theme });
		} finally {
			busy = false;
		}
	}
</script>

<!-- `highlight` (from the notification "Share" action) only highlights: browsers require a tap to share. -->
<button class="{cls} transition-transform active:scale-90 {highlight ? 'animate-bounce bg-sun' : ''}" onclick={share} disabled={busy}><ShareFat weight="duotone" /> {i.t('today.share')}</button>
{#if toast}
	<p class="fixed inset-x-4 bottom-28 z-30 mx-auto max-w-sm rounded-2xl ring-1 ring-ink/10 bg-sun p-3 text-center font-bold" role="status">{toast}</p>
{/if}
