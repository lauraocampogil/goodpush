<script lang="ts">
	import CatIcon from '#lib/components/CatIcon.svelte';
	import { ArrowRight, ChatDots, Crown, Lock, UserCircle } from '#lib/icons.ts';
	import { auth } from '#lib/auth.svelte.ts';
	import { feedback } from '#lib/feedback.svelte.ts';
	import { goto } from '$app/navigation';
	import { PUBLIC_INSTAGRAM_URL } from '$app/env/public';
	import { setPerson, track } from '#lib/analytics.ts';
	import TopicPicker from '#lib/components/TopicPicker.svelte';
	import { TOPIC_CAT, type TopicId } from '#lib/data/topics.ts';
	import { CATEGORY_IDS, LANGS, SEND_HOURS, type CategoryId, type Lang } from '#lib/data/categories.ts';
	import { LANG_LABEL } from '#lib/i18n/dict.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { dayKey, phraseForDay, pushBody } from '#lib/phrase.ts';
	import { openPortal } from '#lib/premium.ts';
	import { disablePush, enablePush, syncProfile, testNotification } from '#lib/push.ts';
	import { app, type ShareTheme } from '#lib/store.svelte.ts';

	const i = getI18n();
	const p = app.profile;
	let saved = $state(false);
	let confirmDelete = $state(false);
	let busy = $state(false);
	let timer: ReturnType<typeof setTimeout>;

	const THEMES: { id: ShareTheme; bg: string; fg: string }[] = [
		{ id: 'cream', bg: '#F6E36B', fg: '#141414' },
		{ id: 'sky', bg: '#C7B5F2', fg: '#141414' },
		{ id: 'ink', bg: '#141414', fg: '#F6E36B' },
		{ id: 'pink', bg: '#F7A6C9', fg: '#141414' }
	];

	/** Debounced: save locally + update the server so the push follows the new settings. */
	function persist(event?: string, props: Record<string, unknown> = {}) {
		app.save();
		if (event) track(event, props);
		clearTimeout(timer);
		timer = setTimeout(async () => {
			if (p.pushEnabled) await syncProfile(app.profile, i.lang, app.source);
			setPerson({ lang: i.lang, categories: p.categories, topics: p.topics, hour: p.hour, extra_hours: p.extraHours.length, theme: p.theme });
			saved = true;
			setTimeout(() => (saved = false), 1500);
		}, 500);
	}

	function toggleCat(c: CategoryId) {
		const on = !p.categories.includes(c);
		const next = on ? [...p.categories, c] : p.categories.filter((x) => x !== c);
		if (next.length === 0) return; // keep at least one
		p.categories = next;
		p.topics = p.topics.filter((t) => next.includes(TOPIC_CAT[t]));
		if (on) p.topics = [...p.topics, `${c}_movies` as TopicId];
		persist('category_toggled', { category: c, on, from: 'settings' });
	}

	function toggleTopic(t: TopicId) {
		const on = !p.topics.includes(t);
		p.topics = on ? [...p.topics, t] : p.topics.filter((x) => x !== t);
		persist('topic_toggled', { topic: t, on, from: 'settings' });
	}

	function setHour(h: number) {
		p.hour = h;
		p.extraHours = p.extraHours.filter((x) => x !== h);
		persist('hour_selected', { hour: h, from: 'settings' });
	}

	function toggleExtra(h: number) {
		if (!app.premium) return goto('/premium');
		if (h === p.hour) return;
		const on = !p.extraHours.includes(h);
		p.extraHours = on ? [...p.extraHours, h].slice(-2).sort((a, b) => a - b) : p.extraHours.filter((x) => x !== h);
		persist('extra_hour_toggled', { hour: h, on });
	}

	function setTheme(t: ShareTheme) {
		if (t !== 'cream' && !app.premium) return goto('/premium');
		p.theme = t;
		persist('theme_changed', { theme: t });
	}

	function setLang(l: Lang) {
		i.set(l);
		persist('lang_changed', { lang: l, from: 'settings' });
	}

	async function togglePush() {
		busy = true;
		if (p.pushEnabled) {
			await disablePush(p.deviceId);
			p.pushEnabled = false;
			track('push_disabled');
		} else {
			const r = await enablePush(app.profile, i.lang, app.source);
			p.pushEnabled = r === 'granted';
			track(r === 'granted' ? 'push_enabled' : 'push_failed', { from: 'settings', result: r });
		}
		busy = false;
		app.save();
	}

	const WEEK = [1, 2, 3, 4, 5, 6, 0];
	const dayLabel = (d: number) =>
		new Intl.DateTimeFormat(i.lang, { weekday: 'narrow' }).format(new Date(Date.UTC(2024, 0, 7 + d, 12)));
	const fmtDate = (iso: string) => new Intl.DateTimeFormat(i.lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso));

	function toggleDay(d: number) {
		const on = !p.days.includes(d);
		const next = on ? [...p.days, d] : p.days.filter((x) => x !== d);
		if (!next.length) return; // at least one day
		p.days = next.sort();
		persist('days_changed', { days: next.length });
	}

	function pause(daysCount: number) {
		p.pausedUntil = daysCount ? new Date(Date.now() + daysCount * 86_400_000).toISOString() : null;
		persist(daysCount ? 'push_paused' : 'push_resumed', { days: daysCount });
	}

	async function test() {
		const ph = phraseForDay(p.categories, dayKey(), { topics: p.topics });
		await testNotification('GoodPush', pushBody(ph, i.lang, p.name));
		track('push_test');
	}

	async function manage() {
		busy = true;
		try {
			await openPortal(p.deviceId);
		} finally {
			busy = false;
		}
	}

	async function deleteAll() {
		if (!confirmDelete) return void (confirmDelete = true);
		track('data_deleted');
		await disablePush(p.deviceId);
		app.reset();
		location.href = '/';
	}
</script>

<div class="flex items-center justify-between">
	<h1 class="display my-4 text-4xl">{i.t('settings.title')}</h1>
	{#if saved}<span class="chip bg-sun" role="status">{i.t('settings.saved')}</span>{/if}
</div>

<div class="space-y-5">
	<a href="/account" class="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
		<UserCircle size={28} weight="duotone" />
		<span class="flex-1">
			<span class="block font-semibold">{i.t('nav.account')}</span>
			<span class="block truncate text-sm text-ink/50">{auth.user?.email ?? i.t('acc.cta')}</span>
		</span>
		<ArrowRight />
	</a>

	<section class="card p-5">
		<label for="name" class="mb-2 block text-sm font-extrabold uppercase tracking-wider">{i.t('settings.name')}</label>
		<input id="name" class="field" bind:value={p.name} maxlength="30" oninput={() => persist()} />
	</section>

	<section class="card p-5">
		<h2 class="mb-3 text-sm font-extrabold uppercase tracking-wider">{i.t('settings.cats')}</h2>
		<div class="flex flex-wrap gap-2">
			{#each CATEGORY_IDS as c (c)}
				<button class="chip" aria-pressed={p.categories.includes(c)} onclick={() => toggleCat(c)}><CatIcon cat={c} /> {i.cat(c)}</button>
			{/each}
		</div>
		<h2 class="mt-6 mb-1 text-sm font-extrabold uppercase tracking-wider">{i.t('settings.topics')}</h2>
		<p class="mb-4 text-sm text-ink/60">{i.t('ob.topics.d')}</p>
		<TopicPicker categories={p.categories} topics={p.topics} ontoggle={toggleTopic} />
	</section>

	<section class="card p-5">
		<h2 class="mb-3 text-sm font-extrabold uppercase tracking-wider">{i.t('settings.time')}</h2>
		<div class="flex flex-wrap gap-2">
			{#each SEND_HOURS as h (h)}
				<button class="chip tabular-nums" aria-pressed={p.hour === h} onclick={() => setHour(h)}>{String(h).padStart(2, '0')}:00</button>
			{/each}
		</div>
		<h2 class="mb-3 mt-6 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider">
			{i.t('settings.extra')} <span class="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[10px] text-sun"><Crown weight="fill" /> {i.t('premium.locked')}</span>
		</h2>
		<div class="flex flex-wrap gap-2 {app.premium ? '' : 'opacity-50'}">
			{#each SEND_HOURS.filter((h) => h !== p.hour) as h (h)}
				<button class="chip tabular-nums" aria-pressed={p.extraHours.includes(h)} onclick={() => toggleExtra(h)}>
					{#if !app.premium}<Lock />{/if}{String(h).padStart(2, '0')}:00
				</button>
			{/each}
		</div>
	</section>

	<section class="card p-5">
		<h2 class="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider">
			{i.t('settings.theme')} <span class="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[10px] text-sun"><Crown weight="fill" /> {i.t('premium.locked')}</span>
		</h2>
		<div class="grid grid-cols-4 gap-3">
			{#each THEMES as t (t.id)}
				<button
					class="relative grid aspect-[9/14] place-items-center rounded-2xl transition hover:-translate-y-1 {p.theme === t.id ? 'ring-2 ring-ink ring-offset-2 ring-offset-white' : 'ring-1 ring-ink/10'}"
					style="background:{t.bg}"
					aria-pressed={p.theme === t.id}
					aria-label={t.id}
					onclick={() => setTheme(t.id)}
				>
					<span class="display text-xl" style="color:{t.fg}">Aa</span>
					{#if t.id !== 'cream' && !app.premium}<span class="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-ink"><Lock size={12} /></span>{/if}
				</button>
			{/each}
		</div>
	</section>

	<section class="card p-5">
		<h2 class="mb-3 text-sm font-extrabold uppercase tracking-wider">{i.t('settings.lang')}</h2>
		<div class="flex flex-wrap gap-2">
			{#each LANGS as l (l)}
				<button class="chip" aria-pressed={i.lang === l} onclick={() => setLang(l)}>{LANG_LABEL[l]}</button>
			{/each}
		</div>
	</section>

	<section class="card p-5">
		<div class="flex items-center justify-between gap-4">
			<div>
				<h2 class="text-sm font-extrabold uppercase tracking-wider">{i.t('settings.notif')}</h2>
				<p class="text-sm text-ink/60">
					{#if p.pushEnabled && app.paused}
						{i.t('pause.until')} {fmtDate(p.pausedUntil!)}
					{:else}
						{p.pushEnabled ? i.t('settings.notif.on') : i.t('settings.notif.off')}
					{/if}
				</p>
			</div>
			<button class={p.pushEnabled ? 'btn-ghost' : 'btn'} onclick={togglePush} disabled={busy}>
				{p.pushEnabled ? i.t('settings.notif.disable') : i.t('settings.notif.enable')}
			</button>
		</div>

		{#if p.pushEnabled}
			<p class="mt-6 mb-3 text-sm font-semibold">{i.t('days.title')}</p>
			<div class="grid grid-cols-7 gap-1.5">
				{#each WEEK as d (d)}
					<button class="chip justify-center px-0 py-2 text-xs" aria-pressed={p.days.includes(d)} onclick={() => toggleDay(d)}>{dayLabel(d)}</button>
				{/each}
			</div>

			<p class="mt-6 mb-3 text-sm font-semibold">{i.t('pause.title')}</p>
			{#if app.paused}
				<button class="btn w-full" onclick={() => pause(0)}>{i.t('pause.resume')}</button>
			{:else}
				<div class="grid grid-cols-3 gap-2">
					<button class="chip justify-center text-xs" onclick={() => pause(1)}>{i.t('pause.1d')}</button>
					<button class="chip justify-center text-xs" onclick={() => pause(7)}>{i.t('pause.1w')}</button>
					<button class="chip justify-center text-xs" onclick={() => pause(30)}>{i.t('pause.1m')}</button>
				</div>
			{/if}
			<button class="mt-5 text-sm font-bold text-orange underline" onclick={test}>{i.t('settings.notif.test')}</button>
		{/if}
		<p class="mt-4 text-xs text-ink/45">{i.t('notif.off.hint')}</p>
	</section>

	{#if app.premium}
		<section class="flex items-center justify-between gap-4 rounded-3xl bg-ink p-5 text-white shadow-[var(--shadow-soft)]">
			<p class="display text-xl text-sun">{i.t('premium.active')}</p>
			<button class="btn-ghost !text-ink" onclick={manage} disabled={busy}>{i.t('premium.manage')}</button>
		</section>
	{:else}
		<a href="/premium" class="btn w-full py-4" onclick={() => track('premium_click', { from: 'settings' })}><Crown weight="fill" class="text-sun" /> {i.t('settings.premium')}</a>
	{/if}

	<button class="btn-ghost w-full" onclick={() => feedback.show('settings')}><ChatDots weight="duotone" /> {i.t('fb.open')}</button>

	<div class="flex flex-col items-center gap-3 pt-4 text-sm">
		<button class="font-bold underline {confirmDelete ? 'text-orange' : 'text-ink/60'}" onclick={deleteAll}>
			{confirmDelete ? i.t('settings.delete.confirm') : i.t('settings.delete')}
		</button>
		<div class="flex gap-4 text-ink/50">
			<a href="/privacy" class="underline">{i.t('footer.privacy')}</a>
			<a href="/terms" class="underline">{i.t('footer.terms')}</a>
		</div>
	</div>
</div>
