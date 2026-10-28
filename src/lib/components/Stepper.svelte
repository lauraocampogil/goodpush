<script lang="ts">
	import { getI18n } from '#lib/i18n/index.svelte.ts';

	/** The whole "Get my daily push" flow, numbered from the very first screen. */
	let { current }: { current: number } = $props();
	const i = getI18n();
	const steps = ['ob.s.install', 'ob.s.name', 'ob.s.vibe', 'ob.s.time', 'ob.s.push'] as const;
</script>

<ol class="flex w-full items-start" aria-label="{i.t('ob.step')} {current + 1}/{steps.length}">
	{#each steps as key, n (key)}
		{@const done = n < current}
		{@const active = n === current}
		<li class="relative flex flex-1 flex-col items-center gap-1.5" aria-current={active ? 'step' : undefined}>
			{#if n > 0}
				<span class="absolute right-1/2 top-[18px] -z-0 h-[3px] w-full -translate-y-1/2 bg-ink/15">
					<span class="block h-full bg-ink transition-[width] duration-700 ease-out" style="width:{n <= current ? 100 : 0}%"></span>
				</span>
			{/if}
			<span
				class="display relative z-10 grid h-9 w-9 place-items-center rounded-full border-[3px] border-ink text-lg transition-all duration-500 {active
					? 'scale-110 bg-pink text-white shadow-[3px_3px_0_#111]'
					: done
						? 'bg-ink text-sun'
						: 'bg-white text-ink/50'}"
			>
				{done ? '✓' : n + 1}
			</span>
			<span class="text-[11px] font-extrabold uppercase tracking-wide {active ? 'text-ink' : 'text-ink/50'}">{i.t(key)}</span>
		</li>
	{/each}
</ol>
