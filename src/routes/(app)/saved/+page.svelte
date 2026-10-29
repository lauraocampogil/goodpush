<script lang="ts">
	import { Trash } from '#lib/icons.ts';
	import NotifCard from '#lib/components/NotifCard.svelte';
	import PhraseText from '#lib/components/PhraseText.svelte';
	import { PHRASE_BY_ID } from '#lib/data/phrases.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { app } from '#lib/store.svelte.ts';
	import ShareButton from '../ShareButton.svelte';

	const i = getI18n();
	const items = $derived(app.favorites.map((id) => PHRASE_BY_ID.get(id)).filter((p) => !!p));
</script>

<h1 class="display my-4 text-5xl">{i.t('saved.title')}</h1>
{#if items.length === 0}
	<p class="soft mt-10 text-center text-3xl">{i.t('saved.empty')}</p>
{:else}
	<div class="space-y-4">
		{#each items as p (p.id)}
			<NotifCard label={i.cat(p.cat)} time="">
				<p class="display text-3xl"><PhraseText text={p[i.lang]} /></p>
				<div class="mt-4 flex gap-2">
					<button class="chip" aria-label="Remove" onclick={() => app.toggleFavorite(p.id)}><Trash /></button>
					<ShareButton phrase={p} class="chip" />
				</div>
			</NotifCard>
		{/each}
	</div>
{/if}
