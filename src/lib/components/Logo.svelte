<script lang="ts">
	import Smiley from './Smiley.svelte';
	let { size = 'md' }: { size?: 'sm' | 'md' | 'xl' } = $props();
	const cls = $derived({ sm: 'text-2xl', md: 'text-3xl', xl: 'text-[clamp(4rem,14vw,10rem)]' }[size]);
</script>

<span class="display inline-flex items-center {cls}" aria-label="GoodPush">
	G<span class="inline-flex"
		><Smiley size={0} class="h-[0.72em] w-[0.72em]" /><Smiley
			size={0}
			wink
			class="h-[0.72em] w-[0.72em]"
		/></span
	>D<span class="text-pink">PUSH</span>
</span>
