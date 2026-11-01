<script lang="ts">
	import Logo from '#lib/components/Logo.svelte';
	let { data } = $props();
	const ICON = { ok: '✅', missing: '❌', error: '⚠️', optional: '➖' } as const;
	const groups = $derived([...new Set(data.checks.map((c) => c.group))]);
	const done = $derived(data.checks.filter((c) => c.status === 'ok').length);
</script>

<svelte:head><title>Estado · GoodPush</title><meta name="robots" content="noindex" /></svelte:head>

<main class="mx-auto max-w-2xl px-5 py-10">
	<a href="/"><Logo /></a>
	<h1 class="display mt-8 text-4xl">Estado de GoodPush</h1>
	<p class="mt-2 text-ink/60">{done} de {data.checks.length} funcionando · comprobado en vivo {new Date(data.at).toLocaleTimeString('es-BE', { timeZone: 'Europe/Brussels' })}</p>

	{#each groups as g (g)}
		<h2 class="mt-8 mb-3 text-sm font-extrabold tracking-wider uppercase">{g}</h2>
		<ul class="space-y-2">
			{#each data.checks.filter((c) => c.group === g) as c (c.id)}
				<li class="card flex items-start gap-3 p-4">
					<span class="text-xl leading-none">{ICON[c.status]}</span>
					<div class="min-w-0 flex-1">
						<p class="font-semibold">{c.label}</p>
						{#if c.detail}<p class="text-sm text-ink/60">{c.detail}</p>{/if}
						{#if c.status !== 'ok' && c.fix}<p class="mt-1 text-xs font-semibold text-orange">Cómo arreglarlo: {c.fix}</p>{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/each}
	<p class="mt-10 text-xs text-ink/40">✅ funciona · ❌ falta configurar · ⚠️ configurado pero con error · ➖ opcional</p>
</main>
