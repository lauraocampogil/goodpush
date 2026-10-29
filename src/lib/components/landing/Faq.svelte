<script lang="ts">
	import { Plus } from '#lib/icons.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { reveal, splitReveal } from '#lib/motion.ts';

	const i = getI18n();
	let open = $state<number | null>(1);
</script>

<section id="faq" class="container-site grid gap-10 pb-28 sm:pb-36 lg:grid-cols-[0.8fr_1.2fr]">
	<h2 use:splitReveal={{ scroll: true }} class="display text-5xl sm:text-7xl">{i.t('faq.title')}</h2>
	<div class="divide-y divide-ink/10 border-y border-ink/10" use:reveal={{ children: true }}>
		{#each [1, 2, 3, 4] as n (n)}
			<div>
				<button class="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-semibold" aria-expanded={open === n} onclick={() => (open = open === n ? null : n)}>
					{i.t(`faq.${n}.q` as 'faq.1.q')}
					<span class="grid h-9 w-9 shrink-0 place-items-center rounded-full transition duration-500 {open === n ? 'rotate-45 bg-ink text-white' : 'bg-white ring-1 ring-ink/10'}"><Plus size={16} /></span>
				</button>
				<div class="collapse-grid" data-open={open === n}>
					<div><p class="max-w-xl pb-6 text-ink/65">{i.t(`faq.${n}.a` as 'faq.1.a')}</p></div>
				</div>
			</div>
		{/each}
	</div>
</section>
