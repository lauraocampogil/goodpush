<script lang="ts">
	import { Heart } from '#lib/icons.ts';
	import PhraseText from '#lib/components/PhraseText.svelte';
	import { PHRASE_BY_ID } from '#lib/data/phrases.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { app } from '#lib/store.svelte.ts';

	const i = getI18n();
	const fmt = $derived(new Intl.DateTimeFormat(i.lang, { weekday: 'short', day: 'numeric', month: 'short' }));
	const items = $derived(
		app.history.map((h) => ({ ...h, p: PHRASE_BY_ID.get(h.id) })).filter((h) => !!h.p)
	);
</script>

<h1 class="display my-4 text-4xl">{i.t('history.title')}</h1>
{#if items.length === 0}
	<p class="soft mt-10 text-center text-3xl">{i.t('history.empty')}</p>
{:else}
	<ol class="space-y-3">
		{#each items as h (h.day)}
			<li class="card flex gap-4 p-4">
				<span class="w-16 shrink-0 text-xs font-bold uppercase text-ink/60">{fmt.format(new Date(h.day + 'T12:00:00'))}</span>
				<p class="display flex-1 text-xl"><PhraseText text={h.p![i.lang]} /></p>
				<button class="self-start text-xl" aria-label="favorite" onclick={() => app.toggleFavorite(h.id)}>
					<Heart weight={app.favorites.includes(h.id) ? 'fill' : 'regular'} class={app.favorites.includes(h.id) ? 'text-orange' : ''} />
				</button>
			</li>
		{/each}
	</ol>
{/if}
