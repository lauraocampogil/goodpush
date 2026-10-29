<script lang="ts">
	import Smiley from './Smiley.svelte';
	let { size = 'md', tone = 'ink' }: { size?: 'sm' | 'md' | 'xl'; tone?: 'ink' | 'light' } = $props();
	const dims = $derived({ sm: [22, 'text-lg'], md: [28, 'text-[22px]'], xl: [0, 'text-[clamp(4rem,16vw,13rem)]'] }[size] as [number, string]);
</script>

<span class="inline-flex items-center gap-2 {tone === 'light' ? 'text-paper' : 'text-ink'}" aria-label="GoodPush">
	<Smiley size={dims[0]} color={tone === 'light' ? 'sun' : 'ink'} class={size === 'xl' ? 'h-[0.8em] w-[0.8em]' : ''} />
	<span class="font-display uppercase leading-none tracking-[0.02em] {dims[1]}">GoodPush</span>
</span>
