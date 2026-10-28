<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { PUBLIC_SITE_URL } from '$app/env/public';
	import { track } from '#lib/analytics.ts';
	import InstallSheet from '#lib/components/InstallSheet.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import NotifCard from '#lib/components/NotifCard.svelte';
	import PhraseText from '#lib/components/PhraseText.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import Smiley from '#lib/components/Smiley.svelte';
	import { CATEGORY_EMOJI, CATEGORY_IDS } from '#lib/data/categories.ts';
	import { PHRASES } from '#lib/data/phrases.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { isIOS, isStandalone } from '#lib/platform.ts';
	import { app } from '#lib/store.svelte.ts';
	import Footer from './Footer.svelte';

	const i = getI18n();
	let sheet = $state(false);
	let onboarded = $state(false);

	const samples = ['d3', 'c1', 's1', 'l1', 'b1', 't1'].map((id) => PHRASES.find((p) => p.id === id)!);

	onMount(() => {
		onboarded = app.profile.onboarded;
		// Opened from the home-screen icon → straight into the app
		if (isStandalone()) goto(onboarded ? '/today' : '/start', { replaceState: true });
		track('landing_view', app.profile.deviceId, { source: app.source });
	});

	function start() {
		track('cta_click', app.profile.deviceId);
		if (onboarded) return goto('/today');
		// iPhone needs the home-screen install before notifications work
		if (isIOS() && !isStandalone()) {
			sheet = true;
			track('install_open', app.profile.deviceId, { platform: 'ios' });
		} else sheet = true;
	}

	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'GoodPush',
		url: PUBLIC_SITE_URL,
		applicationCategory: 'LifestyleApplication',
		operatingSystem: 'iOS, Android, Web',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }
	});
</script>

<Seo title={i.t('meta.title')} description={i.t('meta.description')} />
<svelte:head>
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<header class="container-site flex items-center justify-between py-5">
	<a href="/" aria-label="GoodPush home"><Logo /></a>
	<button class="btn-ghost px-4 py-2 text-sm" onclick={start}>
		{onboarded ? i.t('nav.open') : i.t('hero.cta')}
	</button>
</header>

<main>
	<!-- HERO -->
	<section class="container-site grid items-center gap-10 pb-16 pt-6 md:grid-cols-[1.1fr_0.9fr] md:pt-12 lg:pb-24">
		<div class="text-center md:text-left">
			<p class="mb-5 inline-block rounded-full border-2 border-ink bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider sm:text-sm">
				{i.t('hero.kicker')}
			</p>
			<h1 class="display text-[clamp(3.2rem,11vw,7.5rem)]">
				{i.t('hero.title.1')} <span class="tape">{i.t('hero.title.hl')}</span><br />{i.t('hero.title.2')}
			</h1>
			<p class="soft mt-5 text-3xl sm:text-4xl">{i.t('hero.sub')}</p>
			<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row md:items-start">
				<button class="btn px-8 py-4 text-lg" onclick={start}>{i.t('hero.cta')} →</button>
			</div>
		</div>

		<div class="relative mx-auto w-full max-w-sm">
			<div class="relative aspect-[9/16] overflow-hidden rounded-[2.5rem] border-[3px] border-ink bg-sky p-5" style="box-shadow: 10px 10px 0 #111">
				<p class="mt-10 text-center text-6xl font-semibold text-ink/80 tabular-nums">08:00</p>
				<p class="text-center text-sm font-semibold text-ink/70">
					{new Intl.DateTimeFormat(i.lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
				</p>
				<NotifCard class="animate-drop mt-10" time="now">
					<p class="display text-[1.7rem]">
						<span class="soft text-3xl">Laura,</span>
						<PhraseText text={PHRASES.find((p) => p.id === 'd3')![i.lang]} />
					</p>
				</NotifCard>
				<Smiley size={64} class="animate-wobble absolute bottom-10 right-8" />
				<Smiley size={44} wink class="animate-wobble absolute bottom-28 left-8 [animation-delay:-1.5s]" />
			</div>
		</div>
	</section>

	<!-- HOW -->
	<section class="border-y-[3px] border-ink bg-white py-16 lg:py-24">
		<div class="container-site">
			<h2 class="display mb-10 text-5xl sm:text-6xl">{i.t('how.title')}</h2>
			<div class="grid gap-5 md:grid-cols-3">
				{#each [1, 2, 3] as n (n)}
					<div class="card bg-cream p-6">
						<span class="display grid h-12 w-12 place-items-center rounded-full bg-pink text-2xl text-white">{n}</span>
						<h3 class="mt-4 text-xl font-extrabold">{i.t(`how.${n}.t` as 'how.1.t')}</h3>
						<p class="mt-1 text-ink/70">{i.t(`how.${n}.d` as 'how.1.d')}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- CATEGORIES -->
	<section class="container-site py-16 lg:py-24">
		<h2 class="display text-5xl sm:text-6xl">{i.t('cats.title')}</h2>
		<p class="soft mb-8 mt-2 text-3xl">{i.t('cats.sub')}</p>
		<div class="flex flex-wrap gap-3">
			{#each CATEGORY_IDS as c (c)}
				<span class="chip px-5 py-3 text-base">{CATEGORY_EMOJI[c]} {i.cat(c)}</span>
			{/each}
		</div>
		<div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each samples as p, n (p.id)}
				<NotifCard label={i.cat(p.cat)} time="0{7 + (n % 3)}:00" class={n % 2 ? 'rotate-1' : '-rotate-1'}>
					<p class="display text-3xl"><PhraseText text={p[i.lang]} /></p>
				</NotifCard>
			{/each}
		</div>
	</section>

	<!-- FEATURES -->
	<section class="bg-ink py-16 text-white lg:py-24">
		<div class="container-site">
			<h2 class="display mb-10 text-5xl text-sun sm:text-6xl">{i.t('feat.title')}</h2>
			<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
				{#each [['streak', '🔥'], ['fav', '♥'], ['share', '↗'], ['name', '✦']] as [k, icon] (k)}
					<div class="rounded-3xl border-2 border-white/20 p-6">
						<span class="text-3xl">{icon}</span>
						<h3 class="mt-3 text-xl font-extrabold">{i.t(`feat.${k}.t` as 'feat.fav.t')}</h3>
						<p class="mt-1 text-white/70">{i.t(`feat.${k}.d` as 'feat.fav.d')}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- FAQ -->
	<section class="container-site max-w-3xl py-16 lg:py-24">
		<h2 class="display mb-8 text-5xl sm:text-6xl">{i.t('faq.title')}</h2>
		<div class="space-y-3">
			{#each [1, 2, 3, 4] as n (n)}
				<details class="card group p-5">
					<summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-extrabold">
						{i.t(`faq.${n}.q` as 'faq.1.q')}
						<span class="text-2xl transition group-open:rotate-45">+</span>
					</summary>
					<p class="mt-3 text-ink/75">{i.t(`faq.${n}.a` as 'faq.1.a')}</p>
				</details>
			{/each}
		</div>
	</section>

	<!-- FINAL CTA -->
	<section class="container-site pb-20 text-center">
		<div class="card bg-sun px-6 py-14">
			<Smiley size={72} wink class="mx-auto mb-4" />
			<h2 class="display text-5xl sm:text-7xl">{i.t('final.title')}</h2>
			<button class="btn mt-8 px-8 py-4 text-lg" onclick={start}>{i.t('hero.cta')} →</button>
		</div>
	</section>
</main>

<Footer />

<InstallSheet bind:open={sheet} oncontinue={() => goto('/start')} />
