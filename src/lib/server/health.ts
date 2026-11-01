import {
	ANTHROPIC_API_KEY,
	BREVO_API_KEY,
	BREVO_LIST_ID,
	POSTHOG_SERVER_KEY,
	STRIPE_PRICE_ID,
	STRIPE_SECRET_KEY,
	STRIPE_WEBHOOK_SECRET
} from '$app/env/private';
import { PUBLIC_POSTHOG_KEY, PUBLIC_SENTRY_DSN, PUBLIC_SITE_URL, PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$app/env/public';
import { db } from './supabase.ts';
import { stripe } from './stripe.ts';
import { pushReady } from './webpush.ts';

/**
 * Live checks of every piece GoodPush needs. Nothing secret is returned — only ok / missing / error.
 * Shown on /status so you can see at a glance what really works.
 */
export type Check = { id: string; group: string; label: string; status: 'ok' | 'missing' | 'error' | 'optional'; detail?: string; fix?: string };

const timeout = (ms: number) => AbortSignal.timeout(ms);

async function run(c: Omit<Check, 'status' | 'detail'>, fn: () => Promise<{ status: Check['status']; detail?: string }>): Promise<Check> {
	try {
		return { ...c, ...(await fn()) };
	} catch (err) {
		return { ...c, status: 'error', detail: (err as Error).message.slice(0, 160) };
	}
}

type CronRow = { jobname: string; schedule: string; active: boolean; last_status: string | null; last_run: string | null; last_http: number | null };

export async function healthChecks(): Promise<Check[]> {
	const supabase = db();
	let crons: CronRow[] = [];
	if (supabase) {
		const { data } = await supabase.rpc('goodpush_cron_status');
		crons = (data ?? []) as CronRow[];
	}
	const cron = (name: string, label: string, needs: string, fix: string) =>
		run({ id: `cron:${name}`, group: 'Automatización', label, fix }, async () => {
			const job = crons.find((j) => j.jobname === name);
			if (!job) return { status: 'missing', detail: `No programado (${needs})` };
			if (!job.active) return { status: 'error', detail: 'Programado pero desactivado' };
			if (name === 'goodpush-hourly-send' && job.last_http && job.last_http >= 400) return { status: 'error', detail: `Última llamada: HTTP ${job.last_http}` };
			return { status: 'ok', detail: job.last_run ? `Última ejecución: ${new Date(job.last_run).toLocaleString('es-BE', { timeZone: 'Europe/Brussels' })} · ${job.schedule}` : `Programado · ${job.schedule}` };
		});

	return Promise.all([
		run({ id: 'site', group: 'Base', label: 'Dirección del sitio', fix: 'Vercel → PUBLIC_SITE_URL' }, async () => ({ status: 'ok', detail: PUBLIC_SITE_URL })),
		run({ id: 'db', group: 'Base', label: 'Base de datos (Supabase)', fix: 'Vercel → SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY' }, async () => {
			if (!supabase) return { status: 'missing' };
			const { count, error } = await supabase.from('subscribers').select('id', { count: 'exact', head: true });
			if (error) return { status: 'error', detail: error.message };
			return { status: 'ok', detail: `${count ?? 0} dispositivos registrados` };
		}),
		run({ id: 'push', group: 'Base', label: 'Notificaciones (VAPID)', fix: 'Vercel → PUBLIC_VAPID_KEY + VAPID_PRIVATE_KEY' }, async () => ({ status: pushReady() ? 'ok' : 'missing' })),
		run({ id: 'auth', group: 'Cuentas', label: 'Login con email (código)', fix: 'Supabase → Authentication → SMTP (Brevo)' }, async () => {
			if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) return { status: 'missing' };
			const r = await fetch(`${PUBLIC_SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: PUBLIC_SUPABASE_ANON_KEY }, signal: timeout(5000) });
			const s = (await r.json()) as { external?: { email?: boolean; google?: boolean } };
			return { status: s.external?.email ? 'ok' : 'error', detail: s.external?.email ? undefined : 'Email desactivado en Supabase' };
		}),
		run({ id: 'google', group: 'Cuentas', label: 'Login con Google', fix: 'Supabase → Providers → Google' }, async () => {
			if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) return { status: 'missing' };
			const r = await fetch(`${PUBLIC_SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: PUBLIC_SUPABASE_ANON_KEY }, signal: timeout(5000) });
			const s = (await r.json()) as { external?: { google?: boolean } };
			return { status: s.external?.google ? 'ok' : 'missing' };
		}),
		run({ id: 'stripe', group: 'Pagos', label: 'Stripe (cobro 4,99 €/año)', fix: 'Vercel → STRIPE_SECRET_KEY + STRIPE_PRICE_ID' }, async () => {
			const s = stripe();
			if (!s || !STRIPE_PRICE_ID) return { status: 'missing' };
			const price = await s.prices.retrieve(STRIPE_PRICE_ID);
			const mode = STRIPE_SECRET_KEY!.startsWith('sk_live') ? 'REAL' : 'prueba';
			return { status: 'ok', detail: `${(price.unit_amount ?? 0) / 100} ${price.currency.toUpperCase()}/${price.recurring?.interval ?? '?'} · modo ${mode}` };
		}),
		run({ id: 'stripe-webhook', group: 'Pagos', label: 'Stripe avisa a la app (webhook)', fix: 'Vercel → STRIPE_WEBHOOK_SECRET' }, async () => ({ status: STRIPE_WEBHOOK_SECRET ? 'ok' : 'missing' })),
		cron('goodpush-hourly-send', 'Envío de frases cada hora', 'SQL en Supabase', 'Supabase → SQL (bloque 1 de cron.sql)'),
		cron('goodpush-daily-quotes', 'Citas de la actualidad y películas (IA, diario)', 'necesita ANTHROPIC_API_KEY', 'Supabase → SQL (bloque 2 de cron.sql)'),
		cron('goodpush-weekly-newsletter', 'Newsletter semanal (domingo)', 'necesita Brevo', 'Supabase → SQL (bloque 3 de cron.sql)'),
		run({ id: 'ai', group: 'Contenido', label: 'IA para citas y newsletter (Claude)', fix: 'Vercel → ANTHROPIC_API_KEY' }, async () => ({ status: ANTHROPIC_API_KEY ? 'ok' : 'optional', detail: ANTHROPIC_API_KEY ? undefined : 'Sin clave: se usan tus frases y los consejos fijos' })),
		run({ id: 'brevo', group: 'Email', label: 'Brevo (newsletter + emails de marketing)', fix: 'Vercel → BREVO_API_KEY + BREVO_LIST_ID' }, async () => {
			if (!BREVO_API_KEY || !BREVO_LIST_ID) return { status: 'missing' };
			const r = await fetch('https://api.brevo.com/v3/account', { headers: { 'api-key': BREVO_API_KEY, accept: 'application/json' }, signal: timeout(5000) });
			return r.ok ? { status: 'ok' } : { status: 'error', detail: `Brevo HTTP ${r.status}` };
		}),
		run({ id: 'posthog', group: 'Estadísticas', label: 'PostHog (visitas, embudo, TikTok → registro)', fix: 'Vercel → PUBLIC_POSTHOG_KEY' }, async () => ({ status: PUBLIC_POSTHOG_KEY || POSTHOG_SERVER_KEY ? 'ok' : 'missing' })),
		run({ id: 'sentry', group: 'Estadísticas', label: 'Sentry (errores + feedback)', fix: 'Vercel → PUBLIC_SENTRY_DSN' }, async () => ({ status: PUBLIC_SENTRY_DSN ? 'ok' : 'missing' }))
	]);
}
