<script lang="ts">
	import { fly } from 'svelte/transition';
	import { auth } from '#lib/auth.svelte.ts';
	import { Envelope, GoogleLogo } from '#lib/icons.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';

	/** Google or 6-digit email code. `next` = where Google sends people back. */
	let { next = '/account', onbefore }: { next?: string; onbefore?: () => void } = $props();
	const i = getI18n();
	let email = $state('');
	let code = $state('');
	let step = $state<'start' | 'code'>('start');
	let busy = $state(false);
	let err = $state('');
	let marketing = $state(false);

	function rememberMarketing() {
		try {
			sessionStorage.setItem('goodpush:marketing', marketing ? '1' : '0');
		} catch {
			/* ignore */
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

	const google = () => run(async () => (rememberMarketing(), onbefore?.(), await auth.oauth('google', next)));
	const sendCode = () =>
		run(async () => {
			rememberMarketing();
			await auth.sendCode(email.trim());
			step = 'code';
		});
	const verify = () => run(() => auth.verifyCode(email.trim(), code.trim()));
</script>

<div class="space-y-3" in:fly={{ y: 20 }}>
	{#if step === 'start'}
		<form class="space-y-3" onsubmit={(e) => (e.preventDefault(), sendCode())}>
			<input class="field" type="email" required autocomplete="email" placeholder={i.t('acc.email.ph')} bind:value={email} />
			<button class="btn w-full py-4" disabled={busy || !email.includes('@')}><Envelope /> {i.t('acc.send')}</button>
		</form>
		<div class="flex items-center gap-3 py-3 text-xs font-semibold tracking-wider text-ink/40 uppercase">
			<span class="h-px flex-1 bg-ink/10"></span>{i.t('acc.or')}<span class="h-px flex-1 bg-ink/10"></span>
		</div>
		<button class="btn-ghost w-full py-4" disabled={busy} onclick={google}><GoogleLogo weight="bold" size={20} /> {i.t('acc.google')}</button>
	{:else}
		<p class="text-sm text-ink/60">{i.t('acc.code')} <strong class="text-ink">{email}</strong></p>
		<form class="space-y-3" onsubmit={(e) => (e.preventDefault(), verify())}>
			<input
				class="field text-center text-3xl tracking-[0.5em] tabular-nums"
				inputmode="numeric"
				autocomplete="one-time-code"
				maxlength="6"
				placeholder={i.t('acc.code.ph')}
				bind:value={code}
			/>
			<button class="btn w-full py-4" disabled={busy || code.trim().length < 6}>{i.t('acc.verify')}</button>
		</form>
		<button class="w-full py-2 text-sm font-semibold text-ink/60 underline" onclick={() => ((step = 'start'), (code = ''))}>{i.t('acc.resend')}</button>
	{/if}

	<label class="flex items-start gap-3 pt-3 text-sm text-ink/70">
		<input type="checkbox" class="mt-0.5 h-5 w-5 shrink-0 accent-[#141414]" bind:checked={marketing} onchange={rememberMarketing} />
		<span>{i.t('acc.marketing')}</span>
	</label>
	{#if err}<p class="text-center text-sm font-semibold text-orange" role="alert">{err}</p>{/if}
</div>
