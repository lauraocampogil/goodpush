<script lang="ts">
	import type { Snippet } from 'svelte';
	import Smiley from './Smiley.svelte';

	/** iOS-style notification — the signature element of GoodPush. */
	let {
		label = 'GoodPush',
		time = 'now',
		class: cls = '',
		children
	}: { label?: string; time?: string; class?: string; children: Snippet } = $props();
</script>

<div class="rounded-[22px] bg-white/95 p-4 text-left text-ink shadow-[var(--shadow-soft)] backdrop-blur sm:p-5 {cls}">
	<div class="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-wide text-ink/50 uppercase">
		<Smiley size={20} color="ink" />
		<span>GoodPush · {label}</span>
		<span class="ml-auto normal-case">{time}</span>
	</div>
	{@render children()}
</div>
