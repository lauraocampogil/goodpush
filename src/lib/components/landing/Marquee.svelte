<script lang="ts">
	import { Sparkle } from '#lib/icons.ts';
	import Smiley from '../Smiley.svelte';
	import { PHRASES } from '#lib/data/phrases.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { plain } from '#lib/phrase.ts';

	const i = getI18n();
	const a = PHRASES.filter((p) => !p.premium && plain(p.en).length < 32).slice(0, 10);
	const b = PHRASES.filter((p) => !p.premium && plain(p.en).length < 32).slice(10, 20);
</script>

<section class="relative -my-6 overflow-hidden py-16" aria-hidden="true">
	<div class="-rotate-3 border-y-[3px] border-ink bg-ink py-4 text-white">
		<div class="marquee" style="--speed: 55s">
			{#each [0, 1] as dup (dup)}
				{#each a as p (p.id + dup)}
					<span class="display flex items-center gap-6 px-6 text-4xl whitespace-nowrap sm:text-5xl">
						{plain(p[i.lang])}
						<Smiley size={40} wink={p.id.endsWith('2')} />
					</span>
				{/each}
			{/each}
		</div>
	</div>
	<div class="-mt-4 rotate-2 border-y-[3px] border-ink bg-pink py-4 text-white">
		<div class="marquee reverse" style="--speed: 65s">
			{#each [0, 1] as dup (dup)}
				{#each b as p (p.id + dup)}
					<span class="display flex items-center gap-6 px-6 text-4xl whitespace-nowrap sm:text-5xl">
						{plain(p[i.lang])}
						<Sparkle weight="fill" class="text-sun" />
					</span>
				{/each}
			{/each}
		</div>
	</div>
</section>
