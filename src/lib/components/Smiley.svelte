<script lang="ts">
	import { smileySvg, type SmileyMood, type StickerColor } from '#lib/smiley.ts';

	let {
		size = 40,
		wink = false,
		mood,
		color = 'yellow',
		class: cls = ''
	}: { size?: number; wink?: boolean; mood?: SmileyMood; color?: StickerColor | string; class?: string } = $props();

	const svg = $derived(smileySvg(mood ?? (wink ? 'wink' : 'smile'), color));
</script>

<span
	class="inline-block shrink-0 align-middle {cls}"
	style={size ? `width:${size}px;height:${size}px` : undefined}
	aria-hidden="true"
>
	{@html svg}
</span>
