<script lang="ts">
	import CatIcon from '#lib/components/CatIcon.svelte';
	import { ArrowLeft, ArrowRight, Crown, Sparkle } from '#lib/icons.ts';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import { track } from '#lib/analytics.ts';
	import NotifCard from '#lib/components/NotifCard.svelte';
	import PhraseText from '#lib/components/PhraseText.svelte';
	import Smiley from '#lib/components/Smiley.svelte';
	import Stepper from '#lib/components/Stepper.svelte';
	import { CATEGORY_IDS, SEND_HOURS, type CategoryId } from '#lib/data/categories.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { confetti } from '#lib/motion.ts';
	import { dayKey, phraseForDay } from '#lib/phrase.ts';
	import { isStandalone } from '#lib/platform.ts';
	import { enablePush, type PushResult } from '#lib/push.ts';
	import { app } from '#lib/store.svelte.ts';
	import { auth } from '#lib/auth.svelte.ts';
	import SignIn from '#lib/components/SignIn.svelte';
	import TopicPicker from '#lib/components/TopicPicker.svelte';
	import { TOPIC_CAT, type TopicId } from '#lib/data/topics.ts';

	const i = getI18n();
	// Step 1 (Install) happens on the landing page → onboarding starts at step 2
	let step = $state(1);
	let dir = $state(1);
	let busy = $state(false);
	let result = $state<PushResult | null>(null);

	const p = app.profile;
	const canNext = $derived(step !== 2 || p.categories.length > 0);
	const preview = $derived(phraseForDay(p.categories, dayKey(), { topics: p.topics }));
	const names = { 1: 'name', 2: 'vibe', 3: 'time', 4: 'push', 5: 'account' } as Record<number, string>;

	onMount(() => track('onboarding_step', { step: 1, name: 'name', standalone: isStandalone() }));

	function go(to: number) {
		dir = to > step ? 1 : -1;
		app.save();
		step = to;
		track('onboarding_step', { step: to, name: names[to] });
	}

	function toggle(c: CategoryId) {
		const on = !p.categories.includes(c);
		p.categories = on ? [...p.categories, c] : p.categories.filter((x) => x !== c);
		// Drop sub-topics of a category that was removed; a new theme comes with its movie mode on
		p.topics = p.topics.filter((t) => p.categories.includes(TOPIC_CAT[t]));
		if (on) p.topics = [...p.topics, `${c}_movies` as TopicId];
		track('category_toggled', { category: c, on });
	}

	function toggleTopic(t: TopicId) {
		const on = !p.topics.includes(t);
		p.topics = on ? [...p.topics, t] : p.topics.filter((x) => x !== t);
		track('topic_toggled', { topic: t, on });
	}

	function setHour(h: number) {
		p.hour = h;
		track('hour_selected', { hour: h });
	}

	async function enable() {
		busy = true;
		result = await enablePush(app.profile, i.lang, app.source);
		busy = false;
		track(result === 'granted' ? 'push_enabled' : 'push_failed', { result, categories: p.categories, hour: p.hour, lang: i.lang });
		if (result === 'granted') {
			app.profile.pushEnabled = true;
			confetti(50);
			setTimeout(afterPush, 700);
		}
	}

	/** Step 6 (optional): create an account with Google or email — skipped if unavailable or already signed in. */
	function afterPush() {
		if (auth.enabled && !auth.user) go(5);
		else finish();
	}

	// Signed in during onboarding → done
	$effect(() => {
		if (step === 5 && auth.user) setTimeout(finish, 600);
	});

	/** Before leaving for Google: mark onboarding done so the user lands in the app. */
	function beforeGoogle() {
		app.profile.onboarded = true;
		app.save();
	}

	function finish() {
		app.profile.onboarded = true;
		app.save();
		track('onboarding_done', { push: app.profile.pushEnabled, source: app.source, categories: p.categories.length, has_name: !!p.name });
		goto('/today', { replaceState: true });
	}
</script>

<div class="flex flex-1 flex-col">
	<div class="flex items-center gap-3 py-4">
		<button class="chip shrink-0 px-3 {step > 1 && step < 5 ? '' : 'invisible'}" onclick={() => go(step - 1)} aria-label={i.t('ob.back')}><ArrowLeft /></button>
		<Stepper current={step} />
	</div>

	<section class="relative flex flex-1 flex-col justify-center overflow-hidden py-6">
		{#key step}
			<div in:fly={{ x: 80 * dir, duration: 550, easing: backOut }}>
				<p class="display text-5xl text-orange">0{step + 1}</p>
				{#if step === 1}
					<h1 class="display text-4xl sm:text-[2.6rem]">{i.t('ob.name.t')}</h1>
					<p class="soft mt-2 text-2xl">{i.t('ob.name.d')}</p>
					<input
						class="mt-8 field"
						bind:value={p.name}
						maxlength="30"
						autocomplete="given-name"
						placeholder={i.t('ob.name.ph')}
						onkeydown={(e) => e.key === 'Enter' && go(2)}
					/>
					{#if p.name}
						<p class="soft mt-4 text-3xl" in:fly={{ y: 10 }}>{p.name}, <span class="display not-italic">{i.t('sticker.you').toUpperCase()}</span> <Sparkle weight="fill" class="inline text-orange" /></p>
					{/if}
				{:else if step === 2}
					<h1 class="display text-4xl sm:text-[2.6rem]">{i.t('ob.cats.t')}</h1>
					<p class="soft mt-2 text-2xl">{i.t('ob.cats.d')}</p>
					<div class="mt-8 flex flex-wrap gap-3">
						{#each CATEGORY_IDS as c, k (c)}
							<button
								class="chip px-5 py-3 text-base transition-transform active:scale-95"
								aria-pressed={p.categories.includes(c)}
								onclick={() => toggle(c)}
								in:fly={{ y: 20, delay: 60 * k, duration: 400, easing: backOut }}
							>
								<CatIcon cat={c} /> {i.cat(c)}
							</button>
						{/each}
					</div>
					{#if p.categories.length}
						<div class="mt-8 rounded-[28px] bg-white/60 p-5 ring-1 ring-ink/5">
							<p class="display text-xl">{i.t('ob.topics.t')}</p>
							<p class="mt-1 mb-5 text-sm text-ink/60">{i.t('ob.topics.d')}</p>
							<TopicPicker categories={p.categories} topics={p.topics} ontoggle={toggleTopic} />
						</div>
					{/if}
				{:else if step === 3}
					<h1 class="display text-4xl sm:text-[2.6rem]">{i.t('ob.time.t')}</h1>
					<p class="soft mt-2 text-2xl">{i.t('ob.time.d')}</p>
					<div class="mt-8 grid grid-cols-4 gap-3 sm:grid-cols-7">
						{#each SEND_HOURS as h, k (h)}
							<button class="chip justify-center py-3 text-base tabular-nums" aria-pressed={p.hour === h} onclick={() => setHour(h)} in:fly={{ y: 20, delay: 40 * k }}>
								{String(h).padStart(2, '0')}:00
							</button>
						{/each}
					</div>
					<p class="mt-6 flex items-center gap-2 text-sm font-semibold text-ink/60"><Crown weight="fill" class="text-orange" /> {i.t('ob.time.extra')}</p>
				{:else if step === 5}
					<h1 class="display text-4xl sm:text-[2.6rem]">{i.t('ob.acc.t')}</h1>
					<p class="soft mt-2 text-2xl">{i.t('ob.acc.d')}</p>
					<div class="mt-8 max-w-md"><SignIn next="/today" onbefore={beforeGoogle} /></div>
				{:else}
					<h1 class="display text-4xl sm:text-[2.6rem]">{i.t('ob.notif.t')}</h1>
					<p class="soft mt-2 text-2xl">{i.t('ob.notif.d')}</p>
					<div class="mt-8 -rotate-1" in:fly={{ y: -120, delay: 250, duration: 900, easing: backOut }}>
						<NotifCard label={i.cat(preview.cat)} time="{String(p.hour).padStart(2, '0')}:00">
							<p class="display text-2xl">
								{#if p.name}<span class="soft text-3xl">{p.name},</span>{/if}
								<PhraseText text={preview[i.lang]} />
							</p>
						</NotifCard>
					</div>
					{#if result === 'denied'}
						<p class="mt-6 rounded-2xl ring-1 ring-ink/10 bg-sun p-4 font-semibold">{i.t('ob.notif.denied')}</p>
					{:else if result === 'unsupported' || result === 'error'}
						<p class="mt-6 rounded-2xl ring-1 ring-ink/10 bg-sun p-4 font-semibold">{i.t('ob.notif.unsupported')}</p>
					{/if}
				{/if}
			</div>
		{/key}
	</section>

	<div class="sticky bottom-0 flex flex-col gap-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
		{#if step < 4}
			<button class="btn w-full py-4 text-lg" disabled={!canNext} onclick={() => go(step + 1)}>{i.t('ob.next')} <ArrowRight /></button>
		{:else if step === 5}
			<button class="py-2 font-semibold text-ink/60 underline" onclick={finish}>{i.t('ob.acc.skip')}</button>
		{:else}
			<button class="btn w-full py-4 text-lg" disabled={busy} onclick={enable}>
				<Smiley size={24} /> {i.t('ob.notif.cta')}
			</button>
			<button class="py-2 font-semibold text-ink/60 underline" onclick={afterPush}>{i.t('ob.notif.skip')}</button>
		{/if}
	</div>
</div>
