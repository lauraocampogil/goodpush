<script lang="ts">
	import { Clock, Crown, Fire, Gear, Heart, Sun } from '#lib/icons.ts';
	import { page } from '$app/state';
	import Seo from '#lib/components/Seo.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { onMount } from 'svelte';
	import { setPerson } from '#lib/analytics.ts';
	import { app } from '#lib/store.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const i = getI18n();
	app.load();
	onMount(() => {
		app.refreshPremium().then((premium) =>
			setPerson({ premium, lang: i.lang, categories: app.profile.categories, hour: app.profile.hour, push: app.profile.pushEnabled })
		);
	});

	const tabs = [
		{ href: '/today', key: 'nav.today', icon: Sun },
		{ href: '/saved', key: 'nav.saved', icon: Heart },
		{ href: '/history', key: 'nav.history', icon: Clock },
		{ href: '/settings', key: 'nav.settings', icon: Gear }
	] as const;
	const showNav = $derived(page.url.pathname !== '/start');
</script>

<Seo title="GoodPush" description={i.t('meta.description')} noindex />

<div class="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 {showNav ? 'pb-32' : 'pb-8'}">
	{#if showNav}
		<header class="flex items-center justify-between py-3">
			<a href="/today" aria-label="GoodPush"><Logo size="sm" /></a>
			<div class="flex items-center gap-2">
				{#if app.premium}<span class="pill bg-ink text-sun"><Crown weight="fill" /> PRO</span>{/if}
				{#if app.streak.count > 0}
					<span class="pill bg-white py-1.5 shadow-[var(--shadow-soft)]"><Fire weight="fill" class="text-orange" /> {app.streak.count}</span>
				{/if}
			</div>
		</header>
	{/if}
	{@render children()}
</div>

{#if showNav}
	<nav class="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
		<ul class="glass mx-auto grid max-w-sm grid-cols-4 rounded-full p-1.5 shadow-[var(--shadow-float)] ring-1 ring-ink/5">
			{#each tabs as tab (tab.href)}
				{@const active = page.url.pathname === tab.href}
				<li>
					<a href={tab.href} class="flex flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-semibold transition-colors duration-300 {active ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink'}" aria-current={active ? 'page' : undefined}>
						<tab.icon size={22} weight={active ? 'fill' : 'duotone'} />
						{i.t(tab.key)}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
