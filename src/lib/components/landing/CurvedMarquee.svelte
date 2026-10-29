<script lang="ts">
	import { onMount } from 'svelte';
	import { reduced } from '#lib/motion.ts';

	/** Text that scrolls along an arc (premium touch, à la app landing pages). */
	let { text, class: cls = 'fill-sun', speed = 0.6 }: { text: string; class?: string; speed?: number } = $props();
	const uid = $props.id();
	let tp: SVGTextPathElement;
	let txt: SVGTextElement;
	const unit = $derived(`${text.toUpperCase()}   ✺   `);

	onMount(() => {
		if (reduced()) return;
		let raf = 0;
		let offset = 0;
		const half = () => txt.getComputedTextLength() / 2;
		const loop = () => {
			offset -= speed;
			if (-offset >= half()) offset += half();
			tp.setAttribute('startOffset', String(offset));
			raf = requestAnimationFrame(loop);
		};
		document.fonts.ready.then(() => (raf = requestAnimationFrame(loop)));
		return () => cancelAnimationFrame(raf);
	});
</script>

<svg viewBox="0 0 1440 240" class="block w-full overflow-visible" aria-hidden="true">
	<path id="arc-{uid}" d="M -300 225 Q 720 -15 1740 225" fill="none" />
	<text bind:this={txt} class="font-display uppercase {cls}" font-size="78" letter-spacing="2">
		<textPath bind:this={tp} href="#arc-{uid}">{unit.repeat(8)}</textPath>
	</text>
</svg>
