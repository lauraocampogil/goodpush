<script lang="ts">
	import { ArrowRight, ArrowUpRight, Bell, BookOpen, Crown, Heart } from '#lib/icons.ts';
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
	import { enablePush } from '#lib/push.ts';
	import { app } from '#lib/store.svelte.ts';
	import ShareButton from '../ShareButton.svelte';

	const i = getI18n();
	const today = dayKey();
	const phrase = $derived(phraseForDay(app.profile.categories, today));
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
		const before = app.streak.count;
		app.visit(phrase.id);
		navigator.clearAppBadge?.().catch(() => {});

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
		animateIn();
	});

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

	<div bind:this={card}>
		<article
			class="relative flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-[32px] p-7 shadow-[var(--shadow-float)] sm:p-9"
			style="background:{STICKER[color]}; color:{dark ? '#fff' : '#141414'}; --hl:{dark ? '#F6E36B' : '#fff'}"
		>
			<div class="flex items-center justify-between text-xs font-semibold tracking-wider uppercase opacity-70">
				<span class="flex items-center gap-2"><CatIcon cat={phrase.cat} /> {i.cat(phrase.cat)}</span>
				<span>{hourLabel}</span>
			</div>
			<p bind:this={text} class="display my-8 text-[clamp(2.8rem,12vw,4.8rem)] leading-[0.92]">
				{#if app.profile.name}<span data-words class="soft block text-[0.62em] leading-none">{app.profile.name},</span>{/if}
				<span data-words><PhraseText text={phrase[i.lang]} /></span>
			</p>
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

		<div class="card flex items-center gap-4 p-5">
			<Smiley size={44} color="orange" />
			<div class="flex-1">
				<p class="display text-3xl">{app.streak.count} <span class="font-sans text-sm font-semibold normal-case text-ink/60">{i.t('today.streak')}</span></p>
				<div class="mt-2 flex gap-1">
					{#each Array.from({ length: 7 }) as _, n (n)}
						<span class="h-1.5 flex-1 rounded-full transition-colors duration-500 {n < Math.min(app.streak.count, 7) ? 'bg-orange' : 'bg-ink/10'}" style="transition-delay:{n * 80}ms"></span>
					{/each}
				</div>
			</div>
			<p class="text-right text-xs font-semibold text-ink/50">{i.t('today.streak.best')}<br /><span class="display text-xl">{app.streak.best}</span></p>
		</div>

		{#each extras as x (x.h)}
			<div class="rounded-[28px] bg-ink p-5 text-white shadow-[var(--shadow-soft)]" style="--hl:#F6E36B">
				<div class="mb-2 flex items-center gap-2 text-xs font-semibold text-white/60">
					<Crown weight="fill" class="text-sun" /><span class="uppercase tracking-wide">Premium · {i.cat(x.p.cat)}</span>
					<span class="ml-auto">{String(x.h).padStart(2, '0')}:00</span>
				</div>
				<p class="display text-2xl text-sun"><PhraseText text={x.p[i.lang]} /></p>
			</div>
		{/each}

		{#if app.profile.pushEnabled}
			<p class="flex items-center justify-center gap-2 text-sm font-semibold text-ink/60"><Bell weight="duotone" /> {i.t('today.next')} {hourLabel}</p>
		{:else}
			<button class="btn w-full" onclick={turnOn} disabled={busy}><Bell weight="duotone" /> {i.t('today.enable')}</button>
		{/if}

		{#if !app.premium}
			<a href="/premium" class="card group flex items-center gap-4 bg-ink p-4 text-white" onclick={() => track('premium_click', { from: 'today' })}>
				<span class="display grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sun text-2xl text-ink transition-transform group-hover:rotate-12"><Crown weight="fill" /></span>
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
