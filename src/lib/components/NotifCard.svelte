<script lang="ts">
	import type { Snippet } from 'svelte';
	import Smiley from './Smiley.svelte';

	let {
		label = 'GoodPush',
		time = 'now',
		class: cls = '',
		children
	}: { label?: string; time?: string; class?: string; children: Snippet } = $props();
</script>

<div class="card p-4 text-left sm:p-5 {cls}">
	<div class="mb-2 flex items-center gap-2 text-xs font-semibold text-ink/70">
		<span class="grid h-6 w-6 place-items-center rounded-md bg-ink"><Smiley size={16} /></span>
		<span class="uppercase tracking-wide">{label}</span>
		<span class="ml-auto">{time}</span>
	</div>
	{@render children()}
</div>
