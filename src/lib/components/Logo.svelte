<script lang="ts">
	import Smiley from './Smiley.svelte';
	/** The brand lockup — same proportions as static/brand/goodpush-logo*.svg (Bricolage 800, wdth 82, smiley ≈ 1.3× cap height). */
	let { size = 'md', tone = 'ink', class: cls = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; tone?: 'ink' | 'light'; class?: string } = $props();
	const text = $derived({ sm: 'text-[20px]', md: 'text-[22px] sm:text-[26px]', lg: 'text-[34px] sm:text-[40px]', xl: 'text-[clamp(3.2rem,15vw,13rem)]' }[size]);
</script>

<span class="inline-flex items-center gap-[0.3em] leading-none {text} {tone === 'light' ? 'text-paper' : 'text-ink'} {cls}" aria-label="GoodPush">
	<Smiley size={0} color={tone === 'light' ? 'sun' : 'ink'} class="h-[1.12em] w-[1.12em] shrink-0" />
	<span class="font-display font-extrabold tracking-[-0.03em] uppercase [font-stretch:82%] translate-y-[0.02em]">GoodPush</span>
</span>
