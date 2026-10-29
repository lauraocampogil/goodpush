<script lang="ts">
	import { fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import type { CategoryId } from '#lib/data/categories.ts';
	import { TOPICS, TOPIC_EMOJI, type TopicId } from '#lib/data/topics.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import CatIcon from './CatIcon.svelte';

	/** Sub-topic chips for the chosen categories (e.g. Sport → Football, Tennis…). */
	let { categories, topics, ontoggle }: { categories: CategoryId[]; topics: TopicId[]; ontoggle: (t: TopicId) => void } = $props();
	const i = getI18n();
</script>

<div class="space-y-4">
	{#each categories as c (c)}
		<div in:fly={{ y: 16, duration: 400, easing: backOut }}>
			<p class="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-ink/50 uppercase"><CatIcon cat={c} /> {i.cat(c)}</p>
			<div class="flex flex-wrap gap-2">
				{#each TOPICS[c] as t (t)}
					<button class="chip px-4 py-2 text-sm transition-transform active:scale-95" aria-pressed={topics.includes(t)} onclick={() => ontoggle(t)}>
						<span aria-hidden="true">{TOPIC_EMOJI[t]}</span> {i.topic(t)}
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>
