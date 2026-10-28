<script lang="ts">
	let { size = 40, wink = false, class: cls = '' }: { size?: number; wink?: boolean; class?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 50 50" class={cls} aria-hidden="true">
	<circle cx="25" cy="25" r="22.5" fill="#FFE14D" stroke="#111" stroke-width="3" />
	<circle cx="18" cy="20" r="2.8" fill="#111" />
	{#if wink}
		<path d="M28 20h8" stroke="#111" stroke-width="3" stroke-linecap="round" />
	{:else}
		<circle cx="32" cy="20" r="2.8" fill="#111" />
	{/if}
	<path d="M14 28 Q25 40 36 28" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round" />
</svg>
