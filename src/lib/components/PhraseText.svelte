<script lang="ts">
	import { segments } from '#lib/phrase.ts';
	let { text }: { text: string } = $props();
</script>

{#each segments(text) as s, i (i)}{#if s.hl}<span class="tape">{s.text}</span>{:else}{s.text}{/if}{/each}
