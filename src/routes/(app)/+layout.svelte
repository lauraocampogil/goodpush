<script lang="ts">
	import { page } from '$app/state';
	import Seo from '#lib/components/Seo.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { app } from '#lib/store.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const i = getI18n();
	app.load();

	const tabs = [
		{ href: '/today', key: 'nav.today', icon: 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
		{ href: '/saved', key: 'nav.saved', icon: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z' },
		{ href: '/history', key: 'nav.history', icon: 'M4 6h16M4 12h16M4 18h10' },
		{ href: '/settings', key: 'nav.settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.2-1.3L14.3 3h-4.6l-.4 2.4A7.6 7.6 0 0 0 7.1 6.7l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2.2 1.3l.4 2.4h4.6l.4-2.4a7.6 7.6 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3z' }
	] as const;
	const showNav = $derived(page.url.pathname !== '/start');
</script>

<Seo title="GoodPush" description={i.t('meta.description')} noindex />

<div class="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 {showNav ? 'pb-28' : 'pb-8'}">
	{#if showNav}
		<header class="flex items-center justify-between py-3">
			<a href="/today" aria-label="GoodPush"><Logo size="sm" /></a>
			{#if app.streak.count > 0}
				<span class="chip bg-sun">🔥 {app.streak.count}</span>
			{/if}
		</header>
	{/if}
	{@render children()}
</div>

{#if showNav}
	<nav class="fixed inset-x-0 bottom-0 z-20 border-t-[3px] border-ink bg-white pb-[env(safe-area-inset-bottom)]">
		<ul class="mx-auto grid max-w-2xl grid-cols-4">
			{#each tabs as tab (tab.href)}
				{@const active = page.url.pathname === tab.href}
				<li>
					<a href={tab.href} class="flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold {active ? 'text-pink' : 'text-ink/60'}" aria-current={active ? 'page' : undefined}>
						<svg viewBox="0 0 24 24" class="h-6 w-6" fill={active && tab.href === '/saved' ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d={tab.icon} /></svg>
						{i.t(tab.key)}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
