<script lang="ts">
	import { ArrowRight, ArrowUpRight, Bell, BookOpen, Clock, Crown, Fire, Heart, Info, UserCircle } from '#lib/icons.ts';
	import { auth } from '#lib/auth.svelte.ts';
	import { feedback } from '#lib/feedback.svelte.ts';
	import { fly } from 'svelte/transition';
	import { onMount, tick } from 'svelte';
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { track } from '#lib/analytics.ts';
	import CatIcon from '#lib/components/CatIcon.svelte';
	import { CATEGORY_COLOR, STICKER } from '#lib/smiley.ts';
	import PhraseText from '#lib/components/PhraseText.svelte';
	import Smiley from '#lib/components/Smiley.svelte';
	import { PICKS, pickUrl } from '#lib/data/picks.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { burst, confetti, motion, reduced } from '#lib/motion.ts';
	import { dayKey, phraseForDay } from '#lib/phrase.ts';
	import { enablePush, syncProfile } from '#lib/push.ts';
	import { app } from '#lib/store.svelte.ts';
	import ShareButton from '../ShareButton.svelte';
	import { todaysQuote } from '#lib/quotes.ts';
	import type { Phrase } from '#lib/data/phrases.ts';
	import { TOPIC_EMOJI, isMovieTopic } from '#lib/data/topics.ts';

	const i = getI18n();
	const today = dayKey();
	// A real quote from the news for one of your sub-topics beats the usual phrase
	let quote = $state<Phrase | null>(null);
	let ready = $state(false);
	const phrase = $derived(quote ?? phraseForDay(app.profile.categories, today, { topics: app.profile.topics }));
	// Premium: today's extra drops (same phrases the extra pushes send)
	const extras = $derived(
		app.premium
			? app.profile.extraHours.map((h, k) => ({ h, p: phraseForDay(app.profile.categories, today, { slot: k + 1, premium: true }) }))
			: []
	);
	const fav = $derived(app.favorites.includes(phrase.id));
	const color = $derived(CATEGORY_COLOR[phrase.cat]);
	const dark = $derived(['green', 'purple', 'orange'].includes(color));
	const pick = $derived(PICKS[phrase.cat]?.[0]);
	const hourLabel = $derived(`${String(app.profile.hour).padStart(2, '0')}:00`);
	let highlightShare = $state(false);
	let showRules = $state(false);
	let askRating = $state(false);
	const RATE = [
		{ r: 1, mood: 'sad', color: 'purple' },
		{ r: 2, mood: 'meh', color: 'mint' },
		{ r: 3, mood: 'calm', color: 'cream' },
		{ r: 4, mood: 'smile', color: 'yellow' },
		{ r: 5, mood: 'wink', color: 'orange' }
	] as const;
	let busy = $state(false);
	let toast = $state('');
	let card: HTMLElement;
	let text: HTMLElement;

	const MILESTONES = [3, 7, 14, 30, 50, 100, 365];

	onMount(() => {
		if (!app.profile.onboarded) {
			goto('/start', { replaceState: true });
			return;
		}
		todaysQuote(today, app.profile.topics, app.profile.categories).then((q) => {
			if (q) {
				quote = q;
				app.rememberQuote(q);
			}
			start();
		});
	});

	function start() {
		ready = true;
		const before = app.streak.count;
		app.visit(phrase.id);
		// App icon badge = your current streak (like a mini widget)
		const s = app.currentStreak;
		(s > 0 ? navigator.setAppBadge?.(s) : navigator.clearAppBadge?.())?.catch(() => {});
		// Tell the server, so tomorrow's notification shows 🔥 + your streak
		if (app.profile.pushEnabled) syncProfile(app.profile, i.lang, app.source);

		const url = new URL(page.url.href);
		const favId = url.searchParams.get('fav');
		if (favId && !app.favorites.includes(favId)) app.toggleFavorite(favId);
		if (url.searchParams.get('share')) highlightShare = true;
		if (url.searchParams.get('premium') === 'success') {
			app.refreshPremium().then((ok) => {
				if (ok) {
					toast = i.t('premium.success');
					confetti(90);
					track('premium_activated');
				}
			});
		}
		if (url.search) replaceState('/today', {});
		track('phrase_viewed', { phrase: phrase.id, category: phrase.cat, from: url.searchParams.get('utm_source') ?? 'app' });

		if (app.streak.count !== before && MILESTONES.includes(app.streak.count)) {
			setTimeout(() => confetti(70), 900);
			track('streak_milestone', { days: app.streak.count });
		}
		askRating = feedback.shouldAsk(app.currentStreak);
		animateIn();
	}

	async function animateIn() {
		await tick();
		if (reduced() || !card) return;
		const { gsap, SplitText } = motion();
		await document.fonts.ready;
		const split = SplitText.create(text.querySelectorAll('[data-words]'), { type: 'words', mask: 'words' });
		const tl = gsap.timeline();
		tl.from(card, { y: -140, rotate: -4, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.6)' })
			.from(split.words, { yPercent: 110, duration: 0.7, stagger: 0.05, ease: 'expo.out' }, '-=0.4')
			.from(text.querySelectorAll('.tape'), { scaleX: 0, transformOrigin: 'left', duration: 0.6, ease: 'expo.out' }, '-=0.5')
			.from('[data-today-rest] > *', { y: 30, autoAlpha: 0, stagger: 0.08, duration: 0.6, ease: 'expo.out' }, '-=0.4');
	}

	function toggleFav(e: MouseEvent) {
		const adding = !fav;
		app.toggleFavorite(phrase.id);
		if (adding) burst(e.currentTarget as HTMLElement);
		track(adding ? 'favorite' : 'unfavorite', { phrase: phrase.id, category: phrase.cat });
	}

	async function turnOn() {
		busy = true;
		const r = await enablePush(app.profile, i.lang, app.source);
		busy = false;
		track(r === 'granted' ? 'push_enabled' : 'push_failed', { from: 'today', result: r });
		if (r === 'granted') {
			app.profile.pushEnabled = true;
			app.save();
		}
	}
</script>

<section class="flex flex-1 flex-col justify-center gap-6 py-4">
	<p class="kicker text-center">{i.t('today.kicker')}</p>

	<div bind:this={card} style:visibility={ready ? 'visible' : 'hidden'}>
		<article
			class="relative flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-[32px] p-7 shadow-[var(--shadow-float)] sm:p-9"
			style="background:{STICKER[color]}; color:{dark ? '#fff' : '#141414'}; --hl:{dark ? '#F6E36B' : '#fff'}"
		>
			<div class="flex items-center justify-between text-xs font-semibold tracking-wider uppercase opacity-70">
				{#if phrase.author && phrase.topic}
					<span class="flex items-center gap-2">{TOPIC_EMOJI[phrase.topic]} {isMovieTopic(phrase.topic) ? i.t('quote.movie') : i.t('quote.news')} · {isMovieTopic(phrase.topic) ? i.cat(phrase.cat) : i.topic(phrase.topic)}</span>
				{:else}
					<span class="flex items-center gap-2"><CatIcon cat={phrase.cat} /> {i.cat(phrase.cat)}</span>
				{/if}
				<span>{hourLabel}</span>
			</div>
			<p bind:this={text} class="display my-8 text-[clamp(1.96rem,8.4vw,3.36rem)] leading-[0.92]">
				{#if phrase.author}
					<span data-words>“{phrase[i.lang]}”</span>
				{:else}
					{#if app.profile.name}<span data-words class="soft block text-[0.62em] leading-none">{app.profile.name},</span>{/if}
					<span data-words><PhraseText text={phrase[i.lang]} /></span>
				{/if}
			</p>
			{#if phrase.author}
				<p class="-mt-4 mb-6 text-sm font-semibold">
					— {phrase.author}
					{#if phrase.source}<a href={phrase.source} target="_blank" rel="noopener" class="ml-2 underline opacity-60">{i.t('quote.source')}</a>{/if}
				</p>
			{/if}
			<div class="flex items-end justify-between">
				<span class="text-xs font-semibold opacity-60">{new Intl.DateTimeFormat(i.lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</span>
				<Smiley size={72} color={dark ? 'cream' : 'ink'} wink class="animate-float" />
			</div>
		</article>
	</div>

	<div data-today-rest class="flex flex-col gap-6">
		<div class="flex justify-center gap-3">
			<button class="btn-ghost transition-transform active:scale-90 {fav ? '!bg-ink text-white' : ''}" onclick={toggleFav} aria-pressed={fav}>
				<Heart weight={fav ? 'fill' : 'duotone'} /> {fav ? i.t('today.saved') : i.t('today.save')}
			</button>
			<ShareButton {phrase} highlight={highlightShare} />
		</div>

		<div class="card p-5">
			<div class="flex items-center gap-4">
				<Smiley size={44} color="orange" />
				<div class="flex-1">
					<p class="display text-2xl">{app.currentStreak} <span class="font-sans text-sm font-semibold tracking-normal text-ink/60">{i.t('today.streak')}</span></p>
					<div class="mt-2 flex gap-1">
						{#each Array.from({ length: 7 }) as _, n (n)}
							<span class="h-1.5 flex-1 rounded-full transition-colors duration-500 {n < Math.min(app.currentStreak, 7) ? 'bg-orange' : 'bg-ink/10'}" style="transition-delay:{n * 80}ms"></span>
						{/each}
					</div>
				</div>
				<div class="text-right">
					<p class="text-xs font-semibold text-ink/50">{i.t('today.streak.best')}</p>
					<p class="display text-lg">{app.streak.best}</p>
				</div>
				<button class="grid h-8 w-8 place-items-center rounded-full text-ink/50 hover:bg-ink/5" aria-label={i.t('streak.how')} aria-expanded={showRules} onclick={() => (showRules = !showRules)}><Info size={18} /></button>
			</div>
			<div class="collapse-grid" data-open={showRules}>
				<div>
					<p class="mt-4 text-sm font-semibold">{i.t('streak.how')}</p>
					<ul class="mt-2 space-y-1.5 text-sm text-ink/60">
						<li class="flex gap-2"><Fire weight="duotone" class="mt-0.5 shrink-0 text-orange" />{i.t('streak.rule1')}</li>
						<li class="flex gap-2"><Clock weight="duotone" class="mt-0.5 shrink-0" />{i.t('streak.rule2')}</li>
						<li class="flex gap-2"><UserCircle weight="duotone" class="mt-0.5 shrink-0" />{i.t('streak.rule3')}</li>
					</ul>
				</div>
			</div>
			{#if auth.enabled && !auth.user}
				<a href="/account" class="btn-ghost mt-4 w-full py-2.5 text-sm"><UserCircle weight="duotone" /> {i.t('acc.cta')}</a>
			{/if}
		</div>

		{#if askRating}
			<div class="card p-5" out:fly={{ y: 10, duration: 250 }}>
				<p class="text-sm font-semibold">{i.t('fb.ask')}</p>
				<div class="mt-4 flex justify-between gap-2">
					{#each RATE as f (f.r)}
						<button class="rounded-full transition hover:scale-110" aria-label="{f.r}/5" onclick={() => { askRating = false; feedback.show('streak_prompt', f.r); }}>
							<Smiley size={46} color={f.color} mood={f.mood} />
						</button>
					{/each}
				</div>
				<button class="mt-3 w-full text-center text-xs font-semibold text-ink/40 underline" onclick={() => { askRating = false; feedback.dismissAsk(); }}>{i.t('fb.later')}</button>
			</div>
		{/if}

		{#each extras as x (x.h)}
			<div class="rounded-[28px] bg-ink p-5 text-white shadow-[var(--shadow-soft)]" style="--hl:#F6E36B">
				<div class="mb-2 flex items-center gap-2 text-xs font-semibold text-white/60">
					<Crown weight="fill" class="text-sun" /><span class="uppercase tracking-wide">Premium · {i.cat(x.p.cat)}</span>
					<span class="ml-auto">{String(x.h).padStart(2, '0')}:00</span>
				</div>
				<p class="display text-xl text-sun"><PhraseText text={x.p[i.lang]} /></p>
			</div>
		{/each}

		{#if app.profile.pushEnabled}
			<p class="flex items-center justify-center gap-2 text-sm font-semibold text-ink/60"><Bell weight="duotone" /> {i.t('today.next')} {hourLabel}</p>
		{:else}
			<button class="btn w-full" onclick={turnOn} disabled={busy}><Bell weight="duotone" /> {i.t('today.enable')}</button>
		{/if}

		{#if !app.premium}
			<a href="/premium" class="card group flex items-center gap-4 bg-ink p-4 text-white" onclick={() => track('premium_click', { from: 'today' })}>
				<span class="display grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sun text-xl text-ink transition-transform group-hover:rotate-12"><Crown weight="fill" /></span>
				<span class="flex-1">
					<span class="block font-semibold">{i.t('premium.title')}</span>
					<span class="block text-sm text-white/70">{i.t('premium.p1')} · {i.t('premium.p2')}</span>
				</span>
				<span class="text-xl transition-transform group-hover:translate-x-1"><ArrowRight /></span>
			</a>
		{/if}

		{#if pick}
			<a href={pickUrl(pick)} target="_blank" rel="sponsored noopener" class="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5" onclick={() => track('affiliate_click', { category: phrase.cat, item: pick.title })}>
				<span class="grid h-14 w-11 shrink-0 place-items-center rounded-xl bg-cream text-xl"><BookOpen weight="duotone" /></span>
				<span class="flex-1">
					<span class="block text-[11px] font-extrabold uppercase tracking-widest text-orange">{i.t('today.reco')}</span>
					<span class="block font-semibold">{pick.title}</span>
					<span class="block text-sm text-ink/60">{pick.by}</span>
				</span>
				<span class="text-xl"><ArrowUpRight /></span>
			</a>
			<p class="-mt-4 text-center text-[11px] text-ink/50">{i.t('today.reco.disclosure')}</p>
		{/if}
	</div>
</section>

{#if toast}
	<button class="fixed inset-x-4 top-4 z-50 mx-auto max-w-sm rounded-2xl bg-sun p-4 text-center text-lg font-extrabold shadow-[var(--shadow-soft)]" onclick={() => (toast = '')}>
		{toast}
	</button>
{/if}
