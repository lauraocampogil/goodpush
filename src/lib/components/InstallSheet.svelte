<script lang="ts">
	import { ArrowRight, X } from '#lib/icons.ts';
	import { track } from '#lib/analytics.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { install } from '#lib/install.svelte.ts';
	import { isAndroid, isInAppBrowser, isIOS } from '#lib/platform.ts';
	import Stepper from './Stepper.svelte';

	let { open = $bindable(false), oncontinue }: { open: boolean; oncontinue: () => void } = $props();
	const i = getI18n();

	let dialog: HTMLDialogElement | undefined = $state();
	const ios = isIOS();
	const android = isAndroid();
	const inApp = isInAppBrowser();

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});

	async function installAndroid() {
		const ok = await install.prompt();
		track(ok ? 'app_installed' : 'install_dismissed', { platform: 'android', via: 'prompt' });
		if (ok) oncontinue();
	}
</script>

<dialog
	bind:this={dialog}
	onclose={() => (open = false)}
	class="m-auto mb-0 max-h-[92dvh] w-full max-w-[min(32rem,100vw)] overflow-y-auto overscroll-contain border-0 rounded-t-[32px] bg-paper p-0 text-ink shadow-[var(--shadow-float)] backdrop:bg-ink/40 backdrop:backdrop-blur-sm sm:mb-auto sm:rounded-[32px]"
>
	<div class="p-6 sm:p-8">
		<div class="mx-auto mb-5 h-1 w-10 rounded-full bg-ink/15 sm:hidden"></div>
		<div class="mb-7"><Stepper current={0} /></div>
		<div class="mb-2 flex items-start justify-between gap-4">
			<h2 class="display text-2xl sm:text-3xl">{i.t('install.title')}</h2>
			<button class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white ring-1 ring-ink/10" onclick={() => (open = false)} aria-label={i.t('install.close')}><X size={16} /></button>
		</div>

		{#if ios}
			<p class="mb-6 text-ink/60">{i.t('install.ios.sub')}</p>
			{#if inApp}
				<p class="mb-4 rounded-2xl bg-sun p-4 text-sm font-medium">{i.t('install.ios.safari')}</p>
			{/if}
			<ol class="space-y-2">
				{#each [1, 2, 3] as n (n)}
					<li class="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink/5">
						<span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">{n}</span>
						<span class="font-medium">
							{i.t(`install.ios.${n}` as 'install.ios.1')}
							{#if n === 1}
								<svg class="mx-1 inline h-5 w-5 -translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Share"><path d="M12 3v12M8 7l4-4 4 4" /><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" /></svg>
								<span class="text-ink/50">{i.t('install.ios.1b')}</span>
							{/if}
						</span>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="mb-7 text-ink/60">{i.t('install.android.sub')}</p>
			<div class="flex flex-col gap-3">
				{#if android && install.event}
					<button class="btn" onclick={installAndroid}>{i.t('install.android.cta')}</button>
				{/if}
				<button class={android && install.event ? 'btn-ghost' : 'btn'} onclick={oncontinue}>
					{i.t('install.continue')} <ArrowRight />
				</button>
			</div>
		{/if}
	</div>
</dialog>

<style>
	dialog[open] {
		animation: up 0.4s cubic-bezier(0.2, 0.9, 0.3, 1);
	}
	@keyframes up {
		from {
			transform: translateY(40px);
			opacity: 0;
		}
	}
</style>
