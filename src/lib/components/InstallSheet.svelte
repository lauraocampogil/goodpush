<script lang="ts">
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { install } from '#lib/install.svelte.ts';
	import { isAndroid, isInAppBrowser, isIOS } from '#lib/platform.ts';

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
		if (ok) oncontinue();
	}
</script>

<dialog
	bind:this={dialog}
	onclose={() => (open = false)}
	class="m-auto mb-0 w-full max-w-lg rounded-t-[2rem] border-[3px] border-b-0 border-ink bg-cream p-0 backdrop:bg-ink/50 sm:mb-auto sm:rounded-[2rem] sm:border-b-[3px]"
>
	<div class="p-6 sm:p-8">
		<div class="mb-1 flex items-start justify-between gap-4">
			<h2 class="display text-3xl sm:text-4xl">{i.t('install.title')}</h2>
			<button class="chip shrink-0" onclick={() => (open = false)} aria-label={i.t('install.close')}>✕</button>
		</div>

		{#if ios}
			<p class="mb-5 text-ink/70">{i.t('install.ios.sub')}</p>
			{#if inApp}
				<p class="mb-4 rounded-2xl border-2 border-ink bg-sun p-3 text-sm font-semibold">
					{i.t('install.ios.safari')}
				</p>
			{/if}
			<ol class="space-y-3">
				<li class="card flex items-center gap-4 p-4">
					<span class="display grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink text-xl text-white">1</span>
					<span class="font-semibold">
						{i.t('install.ios.1')}
						<svg class="mx-1 inline h-6 w-6 -translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Share"><path d="M12 3v12M8 7l4-4 4 4" /><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" /></svg>
						<span class="font-normal text-ink/60">{i.t('install.ios.1b')}</span>
					</span>
				</li>
				<li class="card flex items-center gap-4 p-4">
					<span class="display grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink text-xl text-white">2</span>
					<span class="font-semibold">{i.t('install.ios.2')}</span>
				</li>
				<li class="card flex items-center gap-4 p-4">
					<span class="display grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink text-xl text-white">3</span>
					<span class="font-semibold">{i.t('install.ios.3')}</span>
				</li>
			</ol>
		{:else}
			<p class="mb-6 text-ink/70">{i.t('install.android.sub')}</p>
			<div class="flex flex-col gap-3">
				{#if android && install.event}
					<button class="btn" onclick={installAndroid}>{i.t('install.android.cta')}</button>
				{/if}
				<button class={android && install.event ? 'btn-ghost' : 'btn'} onclick={oncontinue}>
					{i.t('install.continue')} →
				</button>
			</div>
		{/if}
	</div>
</dialog>

<style>
	dialog[open] {
		animation: up 0.35s cubic-bezier(0.2, 0.9, 0.3, 1);
	}
	@keyframes up {
		from {
			transform: translateY(40px);
			opacity: 0;
		}
	}
</style>
