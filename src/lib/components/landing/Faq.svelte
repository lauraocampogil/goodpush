<script lang="ts">
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { reveal, splitReveal } from '#lib/motion.ts';

	const i = getI18n();
	let open = $state<number | null>(1);
</script>

<section id="faq" class="container-site grid gap-10 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:py-32">
	<h2 use:splitReveal={{ scroll: true }} class="display text-6xl sm:text-7xl">{i.t('faq.title')}</h2>
	<div class="space-y-3" use:reveal={{ children: true }}>
		{#each [1, 2, 3, 4] as n (n)}
			<div class="card overflow-hidden {open === n ? 'bg-sun' : ''} transition-colors">
				<button class="flex w-full items-center justify-between gap-4 p-5 text-left text-lg font-extrabold" aria-expanded={open === n} onclick={() => (open = open === n ? null : n)}>
					{i.t(`faq.${n}.q` as 'faq.1.q')}
					<span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-white text-xl transition-transform duration-500 {open === n ? 'rotate-[135deg]' : ''}">+</span>
				</button>
				<div class="collapse-grid" data-open={open === n}>
					<div><p class="px-5 pb-5 text-ink/80">{i.t(`faq.${n}.a` as 'faq.1.a')}</p></div>
				</div>
			</div>
		{/each}
	</div>
</section>
