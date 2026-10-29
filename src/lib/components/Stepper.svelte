<script lang="ts">
	import { Check } from '#lib/icons.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';

	/** The whole "Get my daily push" flow, numbered from the very first screen. */
	let { current }: { current: number } = $props();
	const i = getI18n();
	const steps = ['ob.s.install', 'ob.s.name', 'ob.s.vibe', 'ob.s.time', 'ob.s.push', 'ob.s.account'] as const;
</script>

<ol class="flex w-full items-start" aria-label="{i.t('ob.step')} {current + 1}/{steps.length}">
	{#each steps as key, n (key)}
		{@const done = n < current}
		{@const active = n === current}
		<li class="relative flex flex-1 flex-col items-center gap-2" aria-current={active ? 'step' : undefined}>
			{#if n > 0}
				<span class="absolute top-4 right-1/2 h-px w-full bg-ink/10">
					<span class="block h-full bg-ink transition-[width] duration-700 ease-out" style="width:{n <= current ? 100 : 0}%"></span>
				</span>
			{/if}
			<span
				class="relative z-10 grid h-8 w-8 place-items-center rounded-full text-sm font-semibold transition-all duration-500 {active
					? 'bg-ink text-white ring-4 ring-sun'
					: done
						? 'bg-ink text-white'
						: 'bg-white text-ink/40 ring-1 ring-ink/10'}"
			>
				{#if done}<Check size={14} />{:else}{n + 1}{/if}
			</span>
			<span class="text-[10px] font-semibold tracking-wider uppercase {active ? 'text-ink' : 'text-ink/40'}">{i.t(key)}</span>
		</li>
	{/each}
</ol>
