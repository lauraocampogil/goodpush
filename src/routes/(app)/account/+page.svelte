<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { auth } from '#lib/auth.svelte.ts';
	import Smiley from '#lib/components/Smiley.svelte';
	import CatIcon from '#lib/components/CatIcon.svelte';
	import type { CategoryId } from '#lib/data/categories.ts';
	import { Bell, Crown, SignOut, Trash } from '#lib/icons.ts';
	import SignIn from '#lib/components/SignIn.svelte';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { app } from '#lib/store.svelte.ts';
	import { track } from '#lib/analytics.ts';

	type Device = { id: string; hour: number; extra_hours: number[]; categories: CategoryId[]; active: boolean; paused_until: string | null; updated_at: string };
	type Account = { email: string; provider: string; marketing: boolean; devices: Device[]; premium: boolean };

	const i = getI18n();
	let busy = $state(false);
	let err = $state('');
	let marketing = $state(false);
	let account = $state<Account | null>(null);
	let confirmDelete = $state(false);

	onMount(() => {
		auth.init();
	});

	// Load the account once signed in
	$effect(() => {
		if (auth.user && !account) load();
	});

	async function load() {
		try {
			account = await auth.api<Account>('GET', undefined, `?deviceId=${app.profile.deviceId}`);
			marketing = account.marketing;
		} catch {
			err = i.t('acc.error');
		}
	}

	async function run(fn: () => Promise<unknown>) {
		busy = true;
		err = '';
		try {
			await fn();
		} catch (e) {
			err = (e as Error).message || i.t('acc.error');
		} finally {
			busy = false;
		}
	}

	async function setMarketing(v: boolean) {
		marketing = v;
		await auth.api('POST', { action: 'marketing', optIn: v }).catch(() => {});
		track('marketing_consent', { optIn: v });
	}

	const isPaused = (d: Device) => !!d.paused_until && new Date(d.paused_until) > new Date();
	const fmtDate = (iso: string) => new Intl.DateTimeFormat(i.lang, { day: 'numeric', month: 'short' }).format(new Date(iso));

	async function pauseDevice(d: Device, days: number) {
		const until = days ? new Date(Date.now() + days * 86_400_000).toISOString() : null;
		await run(() => auth.api('POST', { action: 'device', deviceId: d.id, pausedUntil: until }));
		if (d.id === app.profile.deviceId) {
			app.profile.pausedUntil = until;
			app.save();
		}
		track(days ? 'push_paused' : 'push_resumed', { days, from: 'account' });
		await load();
	}

	async function toggleDevice(d: Device) {
		await run(() => auth.api('POST', { action: 'device', deviceId: d.id, active: !d.active }));
		if (d.id === app.profile.deviceId) {
			app.profile.pushEnabled = !d.active;
			app.save();
		}
		track(d.active ? 'device_push_off' : 'device_push_on', { this_device: d.id === app.profile.deviceId });
		await load();
	}

	async function del() {
		if (!confirmDelete) return void (confirmDelete = true);
		await run(async () => {
			await auth.deleteAccount();
			account = null;
		});
	}
</script>

<div class="py-4">
	<h1 class="display text-3xl">{i.t('acc.title')}</h1>

	{#if !auth.enabled}
		<p class="card mt-6 p-6 text-ink/70">{i.t('acc.disabled')}</p>
	{:else if !auth.ready}
		<div class="mt-16 flex justify-center"><Smiley size={48} color="yellow" class="animate-spin-slow" /></div>
	{:else if !auth.user}
		<p class="mt-3 text-ink/60">{i.t('acc.sub')}</p>

		<div class="mt-8"><SignIn /></div>
	{:else}
		<div class="mt-6 space-y-5" in:fly={{ y: 20 }}>
			<section class="card flex items-center gap-4 p-5">
				<Smiley size={44} color="orange" wink />
				<div class="min-w-0 flex-1">
					<p class="text-xs text-ink/50">{i.t('acc.signed')}</p>
					<p class="truncate font-semibold">{auth.user.email}</p>
				</div>
				{#if account?.premium}<span class="pill bg-ink text-sun"><Crown weight="fill" /> PRO</span>{/if}
			</section>
			<p class="text-center text-sm text-ink/50">{i.t('acc.saved')}</p>

			<section class="card p-5">
				<h2 class="mb-4 flex items-center gap-2 text-sm font-semibold"><Bell weight="duotone" /> {i.t('acc.devices')}</h2>
				{#if account && account.devices.length === 0}
					<p class="text-sm text-ink/50">{i.t('acc.device.none')}</p>
				{/if}
				<ul class="divide-y divide-ink/5">
					{#each account?.devices ?? [] as d (d.id)}
						<li class="flex items-center gap-3 py-3">
							<div class="flex -space-x-1.5">
								{#each d.categories.slice(0, 3) as c (c)}<span class="grid h-7 w-7 place-items-center rounded-full bg-cream ring-2 ring-white"><CatIcon cat={c} size={14} /></span>{/each}
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-semibold">
									{d.id === app.profile.deviceId ? i.t('acc.device.this') : `📱 ${d.id.slice(0, 6)}`} · {String(d.hour).padStart(2, '0')}:00
								</p>
								{#if d.active && isPaused(d)}
									<p class="text-xs text-orange">{i.t('acc.device.paused')} {fmtDate(d.paused_until!)}</p>
								{:else}
									<p class="text-xs {d.active ? 'text-green' : 'text-ink/40'}">{d.active ? i.t('acc.device.on') : i.t('acc.device.off')}</p>
								{/if}
							</div>
							{#if d.active}
								<button class="chip px-3 py-1.5 text-xs" disabled={busy} onclick={() => pauseDevice(d, isPaused(d) ? 0 : 7)}>
									{isPaused(d) ? i.t('pause.resume') : i.t('pause.1w')}
								</button>
							{/if}
							<button class="chip px-3 py-1.5 text-xs" disabled={busy} onclick={() => toggleDevice(d)}>
								{d.active ? i.t('acc.device.turnoff') : i.t('acc.device.turnon')}
							</button>
						</li>
					{/each}
				</ul>
			</section>

			<label class="card flex items-start gap-3 p-5 text-sm text-ink/70">
				<input type="checkbox" class="mt-0.5 h-5 w-5 accent-[#141414]" checked={marketing} onchange={(e) => setMarketing((e.currentTarget as HTMLInputElement).checked)} />
				<span>{i.t('acc.marketing')}</span>
			</label>

			<div class="flex flex-col items-center gap-3 pt-2">
				<button class="btn-ghost w-full" onclick={() => run(() => auth.signOut().then(() => (account = null)))}><SignOut /> {i.t('acc.signout')}</button>
				<button class="inline-flex items-center gap-2 py-2 text-sm font-semibold {confirmDelete ? 'text-orange' : 'text-ink/50'} underline" onclick={del}>
					<Trash size={14} /> {confirmDelete ? i.t('acc.delete.confirm') : i.t('acc.delete')}
				</button>
			</div>
		</div>
	{/if}

	{#if err}<p class="mt-4 text-center text-sm font-semibold text-orange" role="alert">{err}</p>{/if}
</div>
