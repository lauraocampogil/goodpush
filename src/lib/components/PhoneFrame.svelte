<script lang="ts">
	import type { Snippet } from 'svelte';
	let { class: cls = '', screen = 'bg-paper', children }: { class?: string; screen?: string; children: Snippet } = $props();
</script>

<div class="relative aspect-[9/19.5] rounded-[2.6rem] bg-ink p-[7px] shadow-[var(--shadow-float)] {cls}">
	<div class="relative h-full overflow-hidden rounded-[2.2rem] {screen}">
		<div class="absolute top-2 left-1/2 z-20 h-[22px] w-[34%] -translate-x-1/2 rounded-full bg-ink"></div>
		{@render children()}
	</div>
</div>
