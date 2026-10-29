<script lang="ts">
	import type { CategoryId } from '#lib/data/categories.ts';
	import { CATEGORY_ICON } from '#lib/icons.ts';

	let { cat, size = '1.15em', weight = 'duotone' }: { cat: CategoryId; size?: string | number; weight?: 'duotone' | 'fill' | 'bold' } = $props();
	const Icon = $derived(CATEGORY_ICON[cat]);
</script>

<Icon {size} {weight} />
