<script lang="ts">
	import { goto } from '$app/navigation';
	import { track } from '#lib/analytics.ts';
	import NotifCard from '#lib/components/NotifCard.svelte';
	import PhraseText from '#lib/components/PhraseText.svelte';
	import Smiley from '#lib/components/Smiley.svelte';
	import { CATEGORY_EMOJI, CATEGORY_IDS, SEND_HOURS, type CategoryId } from '#lib/data/categories.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { dayKey, phraseForDay } from '#lib/phrase.ts';
	import { enablePush, type PushResult } from '#lib/push.ts';
	import { app } from '#lib/store.svelte.ts';

	const i = getI18n();
	let step = $state(1);
	let busy = $state(false);
	let result = $state<PushResult | null>(null);

	const p = app.profile;
	const canNext = $derived(step !== 2 || p.categories.length > 0);
	const preview = $derived(phraseForDay(p.categories, dayKey()));

	function toggle(c: CategoryId) {
		p.categories = p.categories.includes(c) ? p.categories.filter((x) => x !== c) : [...p.categories, c];
	}

	function next() {
		app.save();
		step++;
	}

	async function enable() {
		busy = true;
		result = await enablePush(app.profile, i.lang, app.source);
		busy = false;
		if (result === 'granted') {
			app.profile.pushEnabled = true;
			track('push_enabled', p.deviceId, { categories: p.categories, hour: p.hour, lang: i.lang });
			finish();
		}
	}

	function finish() {
		app.profile.onboarded = true;
		app.save();
		track('onboarding_done', p.deviceId, { push: app.profile.pushEnabled, source: app.source });
		goto('/today', { replaceState: true });
	}
</script>

<div class="flex flex-1 flex-col">
	<div class="flex items-center gap-3 py-4">
		{#if step > 1}
			<button class="chip px-3" onclick={() => step--} aria-label={i.t('ob.back')}>←</button>
		{/if}
		<div class="flex flex-1 gap-1.5" aria-label="{i.t('ob.step')} {step}/4">
			{#each [1, 2, 3, 4] as n (n)}
				<span class="h-2 flex-1 rounded-full border-2 border-ink {n <= step ? 'bg-pink' : 'bg-white'}"></span>
			{/each}
		</div>
	</div>

	<section class="flex flex-1 flex-col justify-center py-6">
		{#if step === 1}
			<h1 class="display text-5xl sm:text-6xl">{i.t('ob.name.t')}</h1>
			<p class="soft mt-2 text-2xl">{i.t('ob.name.d')}</p>
			<input
				class="mt-8 w-full rounded-2xl border-[3px] border-ink bg-white px-5 py-4 text-2xl font-semibold outline-none focus:shadow-[4px_4px_0_#FF2E88]"
				bind:value={p.name}
				maxlength="30"
				autocomplete="given-name"
				placeholder={i.t('ob.name.ph')}
				onkeydown={(e) => e.key === 'Enter' && next()}
			/>
		{:else if step === 2}
			<h1 class="display text-5xl sm:text-6xl">{i.t('ob.cats.t')}</h1>
			<p class="soft mt-2 text-2xl">{i.t('ob.cats.d')}</p>
			<div class="mt-8 flex flex-wrap gap-3">
				{#each CATEGORY_IDS as c (c)}
					<button class="chip px-5 py-3 text-base" aria-pressed={p.categories.includes(c)} onclick={() => toggle(c)}>
						{CATEGORY_EMOJI[c]} {i.cat(c)}
					</button>
				{/each}
			</div>
		{:else if step === 3}
			<h1 class="display text-5xl sm:text-6xl">{i.t('ob.time.t')}</h1>
			<p class="soft mt-2 text-2xl">{i.t('ob.time.d')}</p>
			<div class="mt-8 grid grid-cols-4 gap-3 sm:grid-cols-7">
				{#each SEND_HOURS as h (h)}
					<button class="chip justify-center py-3 text-base tabular-nums" aria-pressed={p.hour === h} onclick={() => (p.hour = h)}>
						{String(h).padStart(2, '0')}:00
					</button>
				{/each}
			</div>
		{:else}
			<h1 class="display text-5xl sm:text-6xl">{i.t('ob.notif.t')}</h1>
			<p class="soft mt-2 text-2xl">{i.t('ob.notif.d')}</p>
			<NotifCard class="animate-drop mt-8" label={i.cat(preview.cat)} time="{String(p.hour).padStart(2, '0')}:00">
				<p class="display text-3xl">
					{#if p.name}<span class="soft text-3xl">{p.name},</span>{/if}
					<PhraseText text={preview[i.lang]} />
				</p>
			</NotifCard>
			{#if result === 'denied'}
				<p class="mt-6 rounded-2xl border-2 border-ink bg-sun p-4 font-semibold">{i.t('ob.notif.denied')}</p>
			{:else if result === 'unsupported' || result === 'error'}
				<p class="mt-6 rounded-2xl border-2 border-ink bg-sun p-4 font-semibold">{i.t('ob.notif.unsupported')}</p>
			{/if}
		{/if}
	</section>

	<div class="sticky bottom-0 flex flex-col gap-3 bg-cream pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
		{#if step < 4}
			<button class="btn w-full py-4 text-lg" disabled={!canNext} onclick={next}>{i.t('ob.next')} →</button>
		{:else}
			<button class="btn w-full py-4 text-lg" disabled={busy} onclick={enable}>
				<Smiley size={24} /> {i.t('ob.notif.cta')}
			</button>
			<button class="py-2 font-semibold text-ink/60 underline" onclick={finish}>{i.t('ob.notif.skip')}</button>
		{/if}
	</div>
</div>
