<script lang="ts">
	import { page } from '$app/state';
	import { auth } from '#lib/auth.svelte.ts';
	import { app } from '#lib/store.svelte.ts';
	import SignIn from '#lib/components/SignIn.svelte';

	type Acc = { platform: string; lang: string; username: string | null; expires_at: string | null; refresh_expires_at: string | null };
	type Post = { id: string; platform: string; lang: string; post_date: string; slot: string; format: string; kind: string; media: string[]; caption: string; publish_at: string; status: string; error: string | null };
	type Data = { ready: Record<string, boolean>; tiktokDirect: boolean; langs: string[]; accounts: Acc[]; posts: Post[] };

	const PLATFORMS = [
		{ id: 'instagram', label: 'Instagram' },
		{ id: 'tiktok', label: 'TikTok' }
	];
	const FLAG: Record<string, string> = { en: '🇬🇧', es: '🇪🇸', fr: '🇫🇷' };
	const STATUS: Record<string, [string, string]> = {
		queued: ['En cola', 'bg-ink/5'],
		processing: ['Subiendo…', 'bg-yellow/40'],
		published: ['Publicado ✅', 'bg-mint/60'],
		draft: ['Borrador en TikTok 📥', 'bg-pink/50'],
		failed: ['Error ❌', 'bg-orange/30'],
		skipped: ['Saltado', 'bg-ink/10']
	};

	let data = $state<Data | null>(null);
	let err = $state<string | null>(page.url.searchParams.get('error'));
	const ok = page.url.searchParams.get('ok');
	let filter = $state<'next' | 'drafts' | 'problems'>('next');
	let copied = $state<string | null>(null);

	async function call(method: 'GET' | 'POST', body?: unknown) {
		const res = await fetch('/api/admin/social', {
			method,
			headers: { 'content-type': 'application/json', ...(app.authHeader ? { authorization: app.authHeader } : {}) },
			body: body ? JSON.stringify(body) : undefined
		});
		const out = await res.json().catch(() => ({}));
		if (!res.ok) throw new Error(out.message ?? res.statusText);
		return out;
	}
	async function load() {
		try {
			data = await call('GET');
		} catch (e) {
			err = (e as Error).message;
		}
	}
	$effect(() => {
		if (auth.ready && auth.user && app.authHeader && !data) load();
	});

	const account = (p: string, l: string) => data?.accounts.find((a) => a.platform === p && a.lang === l);
	async function connect(platform: string, lang: string) {
		try {
			const { url } = await call('POST', { action: 'connect', platform, lang });
			location.href = url;
		} catch (e) {
			err = (e as Error).message;
		}
	}
	async function act(action: string, extra: Record<string, string>) {
		await call('POST', { action, ...extra }).catch((e) => (err = e.message));
		await load();
	}
	async function copy(p: Post) {
		await navigator.clipboard.writeText(p.caption);
		copied = p.id;
		setTimeout(() => (copied = null), 1500);
	}
	const when = (iso: string) => new Date(iso).toLocaleString('es-BE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
	const shown = $derived(
		(data?.posts ?? []).filter((p) =>
			filter === 'drafts' ? p.status === 'draft' : filter === 'problems' ? ['failed', 'skipped'].includes(p.status) : Date.parse(p.publish_at) > Date.now() - 6 * 3600_000 && p.status !== 'skipped'
		).slice(0, 60)
	);
	const count = (s: string) => data?.posts.filter((p) => p.status === s).length ?? 0;
</script>

<svelte:head><title>Redes · GoodPush</title></svelte:head>

<section class="py-6">
	<h1 class="display text-4xl">Redes sociales</h1>
	<p class="mt-2 text-ink/60">Cada sábado se generan los posts de la semana siguiente: 3 al día en cada cuenta. Se publican solos a su hora.</p>

	{#if ok}<p class="mt-4 rounded-2xl bg-mint/60 p-4 font-semibold">Cuenta conectada ✅ ({ok})</p>{/if}
	{#if err}<p class="mt-4 rounded-2xl bg-orange/20 p-4 font-semibold">{err}</p>{/if}

	{#if !auth.ready}
		<p class="mt-8 text-ink/50">Cargando…</p>
	{:else if !auth.user}
		<div class="mt-8 max-w-md"><SignIn next="/admin/social" /></div>
	{:else if data}
		<h2 class="mt-10 text-xl font-bold">Cuentas</h2>
		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			{#each PLATFORMS as pl (pl.id)}
				<div class="rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)]">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-bold">{pl.label}</h3>
						{#if !data.ready[pl.id]}<span class="pill bg-orange/20 text-xs">Faltan las claves en Vercel</span>{/if}
						{#if pl.id === 'tiktok' && data.ready.tiktok}<span class="pill bg-ink/5 text-xs">{data.tiktokDirect ? 'Publica directo' : 'Modo borrador'}</span>{/if}
					</div>
					<ul class="mt-3 space-y-2">
						{#each data.langs as l (l)}
							{@const a = account(pl.id, l)}
							<li class="flex items-center gap-3 rounded-2xl bg-ink/5 px-4 py-3">
								<span class="text-xl">{FLAG[l]}</span>
								<span class="flex-1 truncate font-semibold">{a ? '@' + (a.username ?? '?') : 'Sin conectar'}</span>
								{#if a}
									<button class="text-sm text-ink/50 underline" onclick={() => act('disconnect', { platform: pl.id, lang: l })}>Quitar</button>
								{/if}
								<button class="btn btn-sm rounded-full bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-40" disabled={!data.ready[pl.id]} onclick={() => connect(pl.id, l)}>{a ? 'Reconectar' : 'Conectar'}</button>
							</li>
						{/each}
					</ul>
					{#if pl.id === 'tiktok' && !data.tiktokDirect}
						<p class="mt-3 text-sm text-ink/60">Hasta que TikTok apruebe la app, cada vídeo llega como borrador a tu app de TikTok: ábrelo, pega el texto (botón «Copiar») y toca Publicar.</p>
					{/if}
				</div>
			{/each}
		</div>

		<h2 class="mt-10 text-xl font-bold">Publicaciones</h2>
		<div class="mt-3 flex flex-wrap gap-2">
			<button class="pill {filter === 'next' ? 'bg-ink text-white' : 'bg-white'}" onclick={() => (filter = 'next')}>Próximas</button>
			<button class="pill {filter === 'drafts' ? 'bg-ink text-white' : 'bg-white'}" onclick={() => (filter = 'drafts')}>Borradores TikTok ({count('draft')})</button>
			<button class="pill {filter === 'problems' ? 'bg-ink text-white' : 'bg-white'}" onclick={() => (filter = 'problems')}>Errores ({count('failed')})</button>
		</div>
		{#if !shown.length}
			<p class="mt-6 text-ink/50">Nada por aquí. {filter === 'next' ? 'La cola se llena cada sábado (GitHub Actions).' : ''}</p>
		{/if}
		<ul class="mt-4 space-y-3">
			{#each shown as p (p.id)}
				<li class="flex gap-4 rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
					{#if p.kind === 'video'}
						<video src={p.media[0]} class="h-32 w-[72px] shrink-0 rounded-xl bg-ink object-cover" muted playsinline preload="metadata"></video>
					{:else}
						<img src={p.media[0]} alt="" class="h-32 w-[102px] shrink-0 rounded-xl object-cover" loading="lazy" />
					{/if}
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-2 text-sm">
							<span class="font-bold">{p.platform === 'instagram' ? 'Instagram' : 'TikTok'} {FLAG[p.lang]}</span>
							<span class="text-ink/50">{when(p.publish_at)} · {p.format}</span>
							<span class="pill py-0.5 text-xs {STATUS[p.status]?.[1] ?? ''}">{STATUS[p.status]?.[0] ?? p.status}</span>
						</div>
						<p class="mt-1 line-clamp-2 text-sm whitespace-pre-line text-ink/70">{p.caption}</p>
						{#if p.error}<p class="mt-1 text-xs text-orange">{p.error}</p>{/if}
						<div class="mt-2 flex gap-3 text-sm font-semibold">
							<button class="underline" onclick={() => copy(p)}>{copied === p.id ? '¡Copiado!' : 'Copiar texto'}</button>
							{#if ['failed', 'skipped'].includes(p.status)}<button class="underline" onclick={() => act('retry', { id: p.id })}>Reintentar ahora</button>{/if}
							{#if p.status === 'queued'}<button class="text-ink/50 underline" onclick={() => act('skip', { id: p.id })}>No publicar</button>{/if}
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>
