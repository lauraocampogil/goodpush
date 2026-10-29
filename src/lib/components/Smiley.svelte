<script lang="ts">
	import { smileySvg, type SmileyMood } from '#lib/smiley.ts';

	let {
		size = 40,
		wink = false,
		mood,
		class: cls = ''
	}: { size?: number; wink?: boolean; mood?: SmileyMood; class?: string } = $props();

	const uid = $props.id();
	const svg = $derived(smileySvg(mood ?? (wink ? 'wink' : 'smile'), uid));
</script>

<span
	class="inline-block shrink-0 align-middle {cls}"
	style={size ? `width:${size}px;height:${size}px` : undefined}
	aria-hidden="true"
>
	{@html svg}
</span>
