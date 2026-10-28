<script lang="ts">
	import { goto } from '$app/navigation';
	import { PUBLIC_INSTAGRAM_URL } from '$app/env/public';
	import { CATEGORY_EMOJI, CATEGORY_IDS, LANGS, SEND_HOURS, type CategoryId, type Lang } from '#lib/data/categories.ts';
	import { LANG_LABEL } from '#lib/i18n/dict.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { dayKey, phraseForDay, pushBody } from '#lib/phrase.ts';
	import { disablePush, enablePush, syncProfile, testNotification } from '#lib/push.ts';
	import { app } from '#lib/store.svelte.ts';

	const i = getI18n();
	const p = app.profile;
	let saved = $state(false);
	let confirmDelete = $state(false);
	let busy = $state(false);
	let timer: ReturnType<typeof setTimeout>;

	/** Debounced: save locally + update the server so the push follows the new settings. */
	function persist() {
		app.save();
		clearTimeout(timer);
		timer = setTimeout(async () => {
			if (p.pushEnabled) await syncProfile(app.profile, i.lang, app.source);
			saved = true;
			setTimeout(() => (saved = false), 1500);
		}, 500);
	}

	function toggleCat(c: CategoryId) {
		const next = p.categories.includes(c) ? p.categories.filter((x) => x !== c) : [...p.categories, c];
		if (next.length === 0) return; // keep at least one
		p.categories = next;
		persist();
	}

	function setLang(l: Lang) {
		i.set(l);
		persist();
	}

	async function togglePush() {
		busy = true;
		if (p.pushEnabled) {
			await disablePush(p.deviceId);
			p.pushEnabled = false;
		} else {
			p.pushEnabled = (await enablePush(app.profile, i.lang, app.source)) === 'granted';
		}
		busy = false;
		app.save();
	}

	async function test() {
		const ph = phraseForDay(p.categories, dayKey());
		await testNotification('GoodPush', pushBody(ph, i.lang, p.name));
	}

	async function deleteAll() {
		if (!confirmDelete) return void (confirmDelete = true);
		await disablePush(p.deviceId);
		app.reset();
		location.href = '/';
	}
</script>

<div class="flex items-center justify-between">
	<h1 class="display my-4 text-5xl">{i.t('settings.title')}</h1>
	{#if saved}<span class="chip bg-sun" role="status">{i.t('settings.saved')}</span>{/if}
</div>

<div class="space-y-6">
	<section class="card p-5">
		<label for="name" class="mb-2 block text-sm font-extrabold uppercase tracking-wider">{i.t('settings.name')}</label>
		<input id="name" class="w-full rounded-xl border-2 border-ink px-4 py-3 text-lg font-semibold outline-none focus:shadow-[3px_3px_0_#FF2E88]" bind:value={p.name} maxlength="30" oninput={persist} />
	</section>

	<section class="card p-5">
		<h2 class="mb-3 text-sm font-extrabold uppercase tracking-wider">{i.t('settings.cats')}</h2>
		<div class="flex flex-wrap gap-2">
			{#each CATEGORY_IDS as c (c)}
				<button class="chip" aria-pressed={p.categories.includes(c)} onclick={() => toggleCat(c)}>{CATEGORY_EMOJI[c]} {i.cat(c)}</button>
			{/each}
		</div>
	</section>

	<section class="card p-5">
		<h2 class="mb-3 text-sm font-extrabold uppercase tracking-wider">{i.t('settings.time')}</h2>
		<div class="flex flex-wrap gap-2">
			{#each SEND_HOURS as h (h)}
				<button class="chip tabular-nums" aria-pressed={p.hour === h} onclick={() => { p.hour = h; persist(); }}>{String(h).padStart(2, '0')}:00</button>
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

	<div class="grid gap-3 sm:grid-cols-2">
		<button class="btn-ghost bg-sun" onclick={() => goto('/premium')}>✦ {i.t('settings.premium')}</button>
		<a class="btn-ghost" href={PUBLIC_INSTAGRAM_URL} target="_blank" rel="noopener">💬 {i.t('settings.feedback')}</a>
	</div>

	<div class="flex flex-col items-center gap-3 pt-4 text-sm">
		<button class="font-bold text-ink/60 underline {confirmDelete ? 'text-pink' : ''}" onclick={deleteAll}>
			{confirmDelete ? i.t('settings.delete.confirm') : i.t('settings.delete')}
		</button>
		<div class="flex gap-4 text-ink/50">
			<a href="/privacy" class="underline">{i.t('footer.privacy')}</a>
			<a href="/terms" class="underline">{i.t('footer.terms')}</a>
		</div>
	</div>
</div>
