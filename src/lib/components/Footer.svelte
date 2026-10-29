<script lang="ts">
	import { PUBLIC_INSTAGRAM_URL, PUBLIC_TIKTOK_URL } from '$app/env/public';
	import Logo from './Logo.svelte';
	import Smiley from './Smiley.svelte';
	import { LANGS } from '#lib/data/categories.ts';
	import { LANG_LABEL } from '#lib/i18n/dict.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { track } from '#lib/analytics.ts';
	import { feedback } from '#lib/feedback.svelte.ts';
	import { ArrowRight, ChatDots, Instagram, TikTok } from '#lib/icons.ts';

	let { onstart }: { onstart?: () => void } = $props();
	const i = getI18n();
</script>

<footer class="bg-sun">
	<!-- CTA band -->
	<div class="container-site pt-20 pb-14">
		<div class="relative overflow-hidden rounded-[36px] bg-ink px-7 py-12 text-paper sm:px-14 sm:py-16">
			<div class="relative z-10 max-w-xl">
				<p class="display text-3xl sm:text-5xl">{i.t('footer.cta')}</p>
				{#if onstart}
					<button class="btn mt-8 bg-sun text-ink" onclick={onstart}>{i.t('hero.cta')} <ArrowRight /></button>
				{:else}
					<a href="/" class="btn mt-8 bg-sun text-ink">{i.t('hero.cta')} <ArrowRight /></a>
				{/if}
			</div>
			<div class="pointer-events-none absolute -right-6 -bottom-10 flex rotate-[-8deg] sm:right-6 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2" aria-hidden="true">
				<Smiley size={120} color="orange" class="-mr-8 animate-float" />
				<Smiley size={120} color="pink" wink class="-mr-8 animate-float [animation-delay:-1.2s]" />
				<Smiley size={120} color="mint" mood="calm" class="animate-float [animation-delay:-2.4s]" />
			</div>
		</div>
	</div>

	<!-- Columns -->
	<div class="container-site grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
		<div>
			<Logo />
			<p class="soft mt-3 text-2xl">{i.t('meta.title').split('—')[1]?.trim() ?? ''}</p>
			<div class="mt-5 flex gap-1">
				{#each LANGS as l (l)}
					<button
						class="rounded-full px-3 py-1.5 text-xs font-semibold transition {i.lang === l ? 'bg-ink text-white' : 'hover:bg-ink/10'}"
						onclick={() => { i.set(l); track('lang_changed', { lang: l, from: 'footer' }); }}
					>{LANG_LABEL[l]}</button>
				{/each}
			</div>
		</div>
		<nav>
			<p class="kicker !text-ink/60">{i.t('footer.product')}</p>
			<ul class="mt-4 space-y-2.5 text-sm font-semibold">
				<li><a href="/#how" class="hover:opacity-60">{i.t('nav.how')}</a></li>
				<li><a href="/#pricing" class="hover:opacity-60">{i.t('nav.pricing')}</a></li>
				<li><a href="/#faq" class="hover:opacity-60">{i.t('nav.faq')}</a></li>
				<li><a href="/premium" class="hover:opacity-60">Premium</a></li>
			</ul>
		</nav>
		<nav>
			<p class="kicker !text-ink/60">{i.t('footer.social')}</p>
			<ul class="mt-4 space-y-2.5 text-sm font-semibold">
				<li><a href={PUBLIC_TIKTOK_URL} target="_blank" rel="noopener" class="inline-flex items-center gap-2 hover:opacity-60"><TikTok size={16} /> TikTok</a></li>
				<li><a href={PUBLIC_INSTAGRAM_URL} target="_blank" rel="noopener" class="inline-flex items-center gap-2 hover:opacity-60"><Instagram size={16} /> Instagram</a></li>
				<li><button class="inline-flex items-center gap-2 hover:opacity-60" onclick={() => feedback.show('footer')}><ChatDots size={16} /> {i.t('footer.feedback')}</button></li>
			</ul>
		</nav>
		<nav>
			<p class="kicker !text-ink/60">{i.t('footer.legal')}</p>
			<ul class="mt-4 space-y-2.5 text-sm font-semibold">
				<li><a href="/privacy" class="hover:opacity-60">{i.t('footer.privacy')}</a></li>
				<li><a href="/terms" class="hover:opacity-60">{i.t('footer.terms')}</a></li>
			</ul>
		</nav>
	</div>

	<!-- Bottom bar -->
	<div class="container-site flex flex-col items-start gap-4 border-t border-ink/10 py-6 text-xs text-ink/60 sm:flex-row sm:items-center sm:justify-between">
		<p>© {new Date().getFullYear()} GoodPush</p>
		<a href="https://unixcreativestudio.com" target="_blank" rel="noopener" class="group inline-flex items-center gap-2.5 text-sm font-medium text-ink/70 transition hover:text-ink">
			<span>{i.t('footer.by')}</span>
			<img src="/assets/unix-logo-ink.svg" alt="Unix Creative Studio" width="71" height="28" class="h-7 w-auto transition-transform duration-500 ease-[cubic-bezier(0.3,1.6,0.5,1)] group-hover:-rotate-4 group-hover:scale-110" />
		</a>
	</div>
</footer>
