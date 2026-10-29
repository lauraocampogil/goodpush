import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import * as Sentry from '@sentry/sveltekit';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$app/env/public';
import { setPerson, track } from './analytics.ts';
import { app } from './store.svelte.ts';

/**
 * Optional accounts (Supabase Auth): Google or a 6-digit email code.
 * The email *code* (not a magic link) is used on purpose: on iPhone, a link would
 * open Safari instead of the installed app.
 */
class Auth {
	user = $state<User | null>(null);
	ready = $state(false);
	enabled = !!(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_ANON_KEY);
	private client: SupabaseClient | null = null;
	private timer: ReturnType<typeof setTimeout> | undefined;
	private started = false;

	init() {
		if (this.started || typeof window === 'undefined') return;
		this.started = true;
		if (!this.enabled) return void (this.ready = true);
		this.client = createClient(PUBLIC_SUPABASE_URL!, PUBLIC_SUPABASE_ANON_KEY!, {
			auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
		});
		this.client.auth.onAuthStateChange((event, session) => {
			this.user = session?.user ?? null;
			app.authHeader = session ? `Bearer ${session.access_token}` : null;
			this.ready = true;
			if (event === 'SIGNED_IN') queueMicrotask(() => this.afterSignIn());
		});
		// Keep the account in sync whenever the app saves (debounced)
		app.onSave = () => {
			if (!this.user) return;
			clearTimeout(this.timer);
			this.timer = setTimeout(() => this.sync(), 1500);
		};
	}

	async api<T = unknown>(method: 'GET' | 'POST' | 'DELETE', body?: unknown, query = ''): Promise<T> {
		const { data } = (await this.client?.auth.getSession()) ?? { data: { session: null } };
		const token = data.session?.access_token;
		const res = await fetch(`/api/account${query}`, {
			method,
			headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
			body: body ? JSON.stringify(body) : undefined
		});
		if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? res.statusText);
		return res.json();
	}

	private signedInOnce = false;
	private async afterSignIn() {
		if (this.signedInOnce) return;
		this.signedInOnce = true;
		try {
			await this.api('POST', { action: 'link', deviceId: app.profile.deviceId });
			const acc = await this.api<{ data: ReturnType<typeof app.exportData> | null }>('GET', undefined, `?deviceId=${app.profile.deviceId}`);
			app.mergeData(acc.data);
			await this.sync();
			await app.refreshPremium();
			setPerson({ signed_in: true, provider: this.user?.app_metadata?.provider, user_id: this.user?.id });
			Sentry.setUser({ id: app.profile.deviceId, user_id: this.user?.id });
			track('signed_in', { provider: this.user?.app_metadata?.provider });
			// Pending marketing choice made before signing in
			const pending = sessionStorage.getItem('goodpush:marketing');
			if (pending) {
				await this.api('POST', { action: 'marketing', optIn: pending === '1' });
				sessionStorage.removeItem('goodpush:marketing');
			}
		} catch (e) {
			console.error('[auth] after sign-in', e);
		}
	}

	async sync() {
		if (!this.user) return;
		const lang = document.documentElement.lang || 'en';
		await this.api('POST', { action: 'sync', data: app.exportData(), lang }).catch(() => {});
	}

	/** Google sign-in. `next` = page to come back to after Google. */
	async oauth(provider: 'google', next = '/account') {
		track('sign_in_started', { provider });
		await this.client?.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}${next}` } });
	}

	async sendCode(email: string) {
		track('sign_in_started', { provider: 'email' });
		const { error } = (await this.client?.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })) ?? {};
		if (error) throw error;
	}

	async verifyCode(email: string, token: string) {
		const { error } = (await this.client?.auth.verifyOtp({ email, token, type: 'email' })) ?? {};
		if (error) throw error;
	}

	async signOut() {
		await this.client?.auth.signOut();
		this.signedInOnce = false;
		track('signed_out');
	}

	async deleteAccount() {
		await this.api('DELETE');
		await this.signOut();
	}
}

export const auth = new Auth();
