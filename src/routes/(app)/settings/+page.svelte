<script lang="ts">
	import CatIcon from '#lib/components/CatIcon.svelte';
	import { ChatDots, Crown, Lock } from '#lib/icons.ts';
	import { goto } from '$app/navigation';
	import { PUBLIC_INSTAGRAM_URL } from '$app/env/public';
	import { setPerson, track } from '#lib/analytics.ts';
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
		{ id: 'cream', bg: '#FFF6EC', fg: '#111' },
		{ id: 'sky', bg: '#7FB2FF', fg: '#111' },
		{ id: 'ink', bg: '#111111', fg: '#FFE14D' },
		{ id: 'pink', bg: '#FF2E88', fg: '#fff' }
	];

	/** Debounced: save locally + update the server so the push follows the new settings. */
	function persist(event?: string, props: Record<string, unknown> = {}) {
		app.save();
		if (event) track(event, props);
		clearTimeout(timer);
		timer = setTimeout(async () => {
			if (p.pushEnabled) await syncProfile(app.profile, i.lang, app.source);
			setPerson({ lang: i.lang, categories: p.categories, hour: p.hour, extra_hours: p.extraHours.length, theme: p.theme });
			saved = true;
			setTimeout(() => (saved = false), 1500);
		}, 500);
	}

	function toggleCat(c: CategoryId) {
		const on = !p.categories.includes(c);
		const next = on ? [...p.categories, c] : p.categories.filter((x) => x !== c);
		if (next.length === 0) return; // keep at least one
		p.categories = next;
		persist('category_toggled', { category: c, on, from: 'settings' });
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

	async function test() {
		const ph = phraseForDay(p.categories, dayKey());
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
	<h1 class="display my-4 text-5xl">{i.t('settings.title')}</h1>
	{#if saved}<span class="chip bg-sun" role="status">{i.t('settings.saved')}</span>{/if}
</div>

<div class="space-y-5">
	<section class="card p-5">
		<label for="name" class="mb-2 block text-sm font-extrabold uppercase tracking-wider">{i.t('settings.name')}</label>
		<input id="name" class="w-full rounded-xl border-2 border-ink px-4 py-3 text-lg font-semibold outline-none focus:shadow-[3px_3px_0_#FF2E88]" bind:value={p.name} maxlength="30" oninput={() => persist()} />
	</section>

	<section class="card p-5">
		<h2 class="mb-3 text-sm font-extrabold uppercase tracking-wider">{i.t('settings.cats')}</h2>
		<div class="flex flex-wrap gap-2">
			{#each CATEGORY_IDS as c (c)}
				<button class="chip" aria-pressed={p.categories.includes(c)} onclick={() => toggleCat(c)}><CatIcon cat={c} /> {i.cat(c)}</button>
			{/each}
		</div>
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
					class="relative grid aspect-[9/14] place-items-center rounded-2xl border-[3px] transition-transform hover:-translate-y-1 {p.theme === t.id ? 'border-ink shadow-[4px_4px_0_#111]' : 'border-ink/20'}"
					style="background:{t.bg}"
					aria-pressed={p.theme === t.id}
					aria-label={t.id}
					onclick={() => setTheme(t.id)}
				>
					<span class="display text-2xl" style="color:{t.fg}">Aa</span>
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
				<p class="text-ink/60">{p.pushEnabled ? i.t('settings.notif.on') : i.t('settings.notif.off')}</p>
			</div>
			<button class={p.pushEnabled ? 'btn-ghost' : 'btn'} onclick={togglePush} disabled={busy}>
				{p.pushEnabled ? i.t('settings.notif.disable') : i.t('settings.notif.enable')}
			</button>
		</div>
		{#if p.pushEnabled}
			<button class="mt-4 text-sm font-bold text-pink underline" onclick={test}>{i.t('settings.notif.test')}</button>
		{/if}
	</section>

	{#if app.premium}
		<section class="flex items-center justify-between gap-4 rounded-3xl border-[3px] border-ink bg-ink p-5 text-white shadow-[4px_4px_0_#FF2E88]">
			<p class="display text-2xl text-sun">{i.t('premium.active')}</p>
			<button class="btn-ghost !text-ink" onclick={manage} disabled={busy}>{i.t('premium.manage')}</button>
		</section>
	{:else}
		<a href="/premium" class="btn w-full py-4" onclick={() => track('premium_click', { from: 'settings' })}><Crown weight="fill" class="text-sun" /> {i.t('settings.premium')}</a>
	{/if}

	<a class="btn-ghost w-full" href={PUBLIC_INSTAGRAM_URL} target="_blank" rel="noopener" onclick={() => track('feedback_click')}><ChatDots weight="duotone" /> {i.t('settings.feedback')}</a>

	<div class="flex flex-col items-center gap-3 pt-4 text-sm">
		<button class="font-bold underline {confirmDelete ? 'text-pink' : 'text-ink/60'}" onclick={deleteAll}>
			{confirmDelete ? i.t('settings.delete.confirm') : i.t('settings.delete')}
		</button>
		<div class="flex gap-4 text-ink/50">
			<a href="/privacy" class="underline">{i.t('footer.privacy')}</a>
			<a href="/terms" class="underline">{i.t('footer.terms')}</a>
		</div>
	</div>
</div>
