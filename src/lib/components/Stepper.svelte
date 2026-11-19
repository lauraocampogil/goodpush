<script lang="ts">
	import { Check } from '#lib/icons.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';

	/** The whole "Get my daily push" flow: compact dots + one clear label (no crammed captions). */
	let { current }: { current: number } = $props();
	const i = getI18n();
	const steps = ['ob.s.install', 'ob.s.name', 'ob.s.vibe', 'ob.s.time', 'ob.s.push', 'ob.s.account'] as const;
</script>

<div class="w-full" aria-label="{i.t('ob.step')} {current + 1}/{steps.length}">
	<ol class="flex items-center gap-2">
		{#each steps as key, n (key)}
			{@const done = n < current}
			{@const active = n === current}
			<li class="flex items-center gap-2 {n < steps.length - 1 ? 'flex-1' : ''}" aria-current={active ? 'step' : undefined}>
				<span
					class="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-all duration-500 {active
						? 'bg-ink text-white ring-4 ring-sun'
						: done
							? 'bg-ink text-white'
							: 'bg-white text-ink/40 ring-1 ring-ink/10'}"
				>
					{#if done}<Check size={12} />{:else}{n + 1}{/if}
				</span>
				{#if n < steps.length - 1}
					<span class="h-0.5 flex-1 overflow-hidden rounded-full bg-ink/10">
						<span class="block h-full bg-ink transition-[width] duration-700 ease-out" style="width:{done ? 100 : 0}%"></span>
					</span>
				{/if}
			</li>
		{/each}
	</ol>
	<p class="mt-4 text-xs font-semibold tracking-[0.18em] text-ink/45 uppercase">
		{i.t('ob.step')} {current + 1}/{steps.length} · <span class="text-ink">{i.t(steps[current])}</span>
	</p>
</div>
