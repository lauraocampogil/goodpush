<script lang="ts">
	import { ArrowRight } from '#lib/icons.ts';
	import { track } from '#lib/analytics.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { app } from '#lib/store.svelte.ts';

	let { source = 'footer' }: { source?: string } = $props();
	const i = getI18n();
	let email = $state('');
	let consent = $state(false);
	let busy = $state(false);
	let sent = $state(false);
	let err = $state('');

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		err = '';
		try {
			const res = await fetch('/api/newsletter', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, consent, lang: i.lang, source, deviceId: app.profile.deviceId })
			});
			if (!res.ok) throw new Error();
			sent = true;
			track('newsletter_form_sent', { source });
		} catch {
			err = i.t('acc.error');
		} finally {
			busy = false;
		}
	}
</script>

{#if sent}
	<p class="rounded-2xl bg-white/70 p-4 text-sm font-semibold">{i.t('nl.sent')}</p>
{:else}
	<form class="space-y-3" onsubmit={submit}>
		<div class="flex gap-2 rounded-full bg-white p-1.5 ring-1 ring-ink/10 focus-within:ring-2 focus-within:ring-ink">
			<input class="min-w-0 flex-1 bg-transparent px-4 text-[15px] outline-none" type="email" required autocomplete="email" placeholder={i.t('nl.ph')} bind:value={email} />
			<button class="btn px-5 py-2.5 text-sm" disabled={busy || !consent}>{i.t('nl.cta')} <ArrowRight /></button>
		</div>
		<label class="flex items-start gap-2.5 text-xs text-ink/60">
			<input type="checkbox" class="mt-0.5 h-4 w-4 shrink-0 accent-[#141414]" bind:checked={consent} required />
			<span>{i.t('nl.consent')} <a href="/privacy" class="underline">{i.t('footer.privacy')}</a></span>
		</label>
		{#if err}<p class="text-xs font-semibold text-orange">{err}</p>{/if}
	</form>
{/if}
