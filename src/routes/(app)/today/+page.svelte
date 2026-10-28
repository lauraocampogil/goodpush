<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { track } from '#lib/analytics.ts';
	import NotifCard from '#lib/components/NotifCard.svelte';
	import PhraseText from '#lib/components/PhraseText.svelte';
	import Smiley from '#lib/components/Smiley.svelte';
	import { PICKS, pickUrl } from '#lib/data/picks.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { dayKey, phraseForDay } from '#lib/phrase.ts';
	import { enablePush } from '#lib/push.ts';
	import { app } from '#lib/store.svelte.ts';
	import ShareButton from '../ShareButton.svelte';

	const i = getI18n();
	const today = dayKey();
	const phrase = $derived(phraseForDay(app.profile.categories, today));
	const fav = $derived(app.favorites.includes(phrase.id));
	const pick = $derived(PICKS[phrase.cat]?.[0]);
	const hourLabel = $derived(`${String(app.profile.hour).padStart(2, '0')}:00`);
	let autoShare = $state(false);
	let busy = $state(false);

	onMount(() => {
		if (!app.profile.onboarded) {
			goto('/start', { replaceState: true });
			return;
		}
		app.visit(phrase.id);
		navigator.clearAppBadge?.().catch(() => {});

		// Actions coming from the notification buttons
		const url = new URL(page.url.href);
		const favId = url.searchParams.get('fav');
		if (favId && !app.favorites.includes(favId)) app.toggleFavorite(favId);
		if (url.searchParams.get('share')) autoShare = true;
		if (url.search) replaceState('/today', {});
		track('today_view', app.profile.deviceId, { phrase: phrase.id });
	});

	function toggleFav() {
		app.toggleFavorite(phrase.id);
		if (!fav) track('favorite', app.profile.deviceId, { phrase: phrase.id });
	}

	async function turnOn() {
		busy = true;
		const r = await enablePush(app.profile, i.lang, app.source);
		busy = false;
		if (r === 'granted') {
			app.profile.pushEnabled = true;
			app.save();
			track('push_enabled', app.profile.deviceId, { from: 'today' });
		}
	}
</script>

<section class="flex flex-1 flex-col justify-center gap-6 py-4">
	<p class="text-center text-xs font-extrabold uppercase tracking-[0.2em] text-ink/60">{i.t('today.kicker')}</p>

	<NotifCard label={i.cat(phrase.cat)} time={hourLabel} class="p-6 sm:p-8">
		<p class="display text-[clamp(2.6rem,11vw,4.5rem)]">
			{#if app.profile.name}<span class="soft block text-[0.7em] leading-none">{app.profile.name},</span>{/if}
			<PhraseText text={phrase[i.lang]} />
		</p>
	</NotifCard>

	<div class="flex justify-center gap-3">
		<button class="btn-ghost {fav ? 'bg-pink text-white hover:bg-pink' : ''}" onclick={toggleFav} aria-pressed={fav}>
			{fav ? '♥' : '♡'} {fav ? i.t('today.saved') : i.t('today.save')}
		</button>
		<ShareButton {phrase} auto={autoShare} />
	</div>

	<div class="card flex items-center gap-4 bg-sun p-4">
		<Smiley size={44} wink />
		<div class="flex-1">
			<p class="display text-3xl">{app.streak.count} <span class="font-sans text-base font-bold normal-case">{i.t('today.streak')}</span></p>
			<div class="mt-1 flex gap-1">
				{#each Array.from({ length: 7 }) as _, n (n)}
					<span class="h-3 flex-1 rounded-full border-2 border-ink {n < Math.min(app.streak.count, 7) ? 'bg-pink' : 'bg-white'}"></span>
				{/each}
			</div>
		</div>
		<p class="text-right text-xs font-bold text-ink/70">{i.t('today.streak.best')}<br /><span class="display text-xl">{app.streak.best}</span></p>
	</div>

	{#if app.profile.pushEnabled}
		<p class="text-center text-sm font-semibold text-ink/60">🔔 {i.t('today.next')} {hourLabel}</p>
	{:else}
		<button class="btn w-full" onclick={turnOn} disabled={busy}>🔔 {i.t('today.enable')}</button>
	{/if}

	{#if pick}
		<a href={pickUrl(pick)} target="_blank" rel="sponsored noopener" class="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5" onclick={() => track('affiliate_click', app.profile.deviceId, { cat: phrase.cat, item: pick.title })}>
			<span class="grid h-14 w-11 shrink-0 place-items-center rounded-md border-2 border-ink bg-sky text-xl">📖</span>
			<span class="flex-1">
				<span class="block text-[11px] font-extrabold uppercase tracking-widest text-pink">{i.t('today.reco')}</span>
				<span class="block font-extrabold">{pick.title}</span>
				<span class="block text-sm text-ink/60">{pick.by}</span>
			</span>
			<span class="text-xl">↗</span>
		</a>
		<p class="-mt-3 text-center text-[11px] text-ink/50">{i.t('today.reco.disclosure')}</p>
	{/if}
</section>
