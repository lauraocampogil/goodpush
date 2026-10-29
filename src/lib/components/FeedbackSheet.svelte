<script lang="ts">
	import { fly, scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import Smiley from './Smiley.svelte';
	import { X } from '#lib/icons.ts';
	import { auth } from '#lib/auth.svelte.ts';
	import { feedback, type FeedbackKind } from '#lib/feedback.svelte.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import type { SmileyMood, StickerColor } from '#lib/smiley.ts';
	import type { DictKey } from '#lib/i18n/dict.ts';

	const i = getI18n();
	let dialog: HTMLDialogElement | undefined = $state();
	let rating = $state<number | null>(null);
	let kind = $state<FeedbackKind>('idea');
	let message = $state('');
	let email = $state('');
	let busy = $state(false);
	let done = $state(false);
	let err = $state('');

	const faces: { r: number; mood: SmileyMood; color: StickerColor }[] = [
		{ r: 1, mood: 'sad', color: 'purple' },
		{ r: 2, mood: 'meh', color: 'mint' },
		{ r: 3, mood: 'calm', color: 'cream' },
		{ r: 4, mood: 'smile', color: 'yellow' },
		{ r: 5, mood: 'wink', color: 'orange' }
	];
	const kinds: FeedbackKind[] = ['idea', 'problem', 'love', 'other'];

	$effect(() => {
		if (!dialog) return;
		if (feedback.open && !dialog.open) {
			done = false;
			err = '';
			rating = feedback.preset;
			email = auth.user?.email ?? '';
			dialog.showModal();
		}
		if (!feedback.open && dialog.open) dialog.close();
	});

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!message.trim()) return;
		busy = true;
		err = '';
		try {
			await feedback.send({ rating, kind, message: message.trim(), email: email.trim() || undefined, lang: i.lang });
			done = true;
			message = '';
			rating = null;
			setTimeout(() => (feedback.open = false), 1800);
		} catch {
			err = i.t('acc.error');
		} finally {
			busy = false;
		}
	}
</script>

<dialog
	bind:this={dialog}
	onclose={() => (feedback.open = false)}
	class="m-auto mb-0 max-h-[92dvh] w-full max-w-[min(32rem,100vw)] overflow-y-auto overscroll-contain rounded-t-[32px] border-0 bg-paper p-0 text-ink shadow-[var(--shadow-float)] backdrop:bg-ink/40 backdrop:backdrop-blur-sm sm:mb-auto sm:rounded-[32px]"
>
	<div class="p-6 sm:p-8">
		<div class="mx-auto mb-5 h-1 w-10 rounded-full bg-ink/15 sm:hidden"></div>
		<div class="flex items-start justify-between gap-4">
			<div>
				<h2 class="display text-3xl">{i.t('fb.title')}</h2>
				<p class="mt-1 text-sm text-ink/60">{i.t('fb.sub')}</p>
			</div>
			<button class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white ring-1 ring-ink/10" onclick={() => (feedback.open = false)} aria-label="Close"><X size={16} /></button>
		</div>

		{#if done}
			<div class="flex flex-col items-center py-12 text-center" in:scale={{ start: 0.8, easing: backOut }}>
				<Smiley size={96} color="orange" wink class="animate-float" />
				<p class="mt-5 text-lg font-semibold">{i.t('fb.thanks')}</p>
			</div>
		{:else}
			<form class="mt-6 space-y-5" onsubmit={submit} in:fly={{ y: 16 }}>
				<fieldset>
					<legend class="mb-3 text-sm font-semibold">{i.t('fb.rate')}</legend>
					<div class="flex justify-between gap-2">
						{#each faces as f (f.r)}
							<button
								type="button"
								class="rounded-full transition duration-300 {rating === f.r ? 'scale-110 ring-4 ring-ink' : rating ? 'opacity-40 hover:opacity-100' : 'hover:scale-110'}"
								aria-label="{f.r}/5"
								aria-pressed={rating === f.r}
								onclick={() => (rating = f.r)}
							>
								<Smiley size={52} color={f.color} mood={f.mood} />
							</button>
						{/each}
					</div>
				</fieldset>

				<div class="flex flex-wrap gap-2">
					{#each kinds as k (k)}
						<button type="button" class="chip px-4 py-2" aria-pressed={kind === k} onclick={() => (kind = k)}>{i.t(`fb.kind.${k}` as DictKey)}</button>
					{/each}
				</div>

				<textarea class="field min-h-32 resize-y text-base" maxlength="2000" required placeholder={i.t('fb.msg.ph')} bind:value={message}></textarea>
				<input class="field text-base" type="email" autocomplete="email" placeholder={i.t('fb.email.ph')} bind:value={email} />

				<button class="btn w-full py-4" disabled={busy || !message.trim()}>{i.t('fb.send')}</button>
				{#if err}<p class="text-center text-sm font-semibold text-orange">{err}</p>{/if}
			</form>
		{/if}
	</div>
</dialog>
