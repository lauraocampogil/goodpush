import type { CategoryId, Lang } from './data/categories';
import { PHRASE_BY_ID, type Phrase } from './data/phrases';
import type { TopicId } from './data/topics';
import { dayKey, dayNumber, shiftDay } from './phrase';

export type Profile = {
	deviceId: string;
	name: string;
	categories: CategoryId[];
	/** Optional sub-topics (football, exams…) inside the chosen categories. */
	topics: TopicId[];
	hour: number;
	timeZone: string;
	onboarded: boolean;
	pushEnabled: boolean;
	/** Premium only: up to 2 extra local hours for extra pushes. */
	extraHours: number[];
	/** Share-card theme (cream is free, the rest are Premium). */
	theme: ShareTheme;
	/** Pause notifications until this ISO date (null = not paused). */
	pausedUntil: string | null;
	/** Local weekdays to receive the push (0 = Sunday … 6 = Saturday). */
	days: number[];
	/** Day the 14-day free trial started (YYYY-MM-DD), set when onboarding ends. */
	trialStart: string | null;
};

export const TRIAL_DAYS = 14;

export type ShareTheme = 'cream' | 'sky' | 'ink' | 'pink';

type Streak = { count: number; best: number; last: string | null };
type HistoryItem = { id: string; day: string };

const STORAGE_KEY = 'goodpush:v1';

function uuid() {
	return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function read<T>(fallback: T): T {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
	} catch {
		return fallback;
	}
}

/**
 * Local-first app state. Lives on the device (works offline, no account).
 * Only what's needed to send the push is mirrored to Supabase.
 */
class AppStore {
	profile = $state<Profile>({
		deviceId: '',
		name: '',
		categories: [],
		topics: [],
		hour: 8,
		timeZone: 'UTC',
		onboarded: false,
		pushEnabled: false,
		extraHours: [],
		theme: 'cream',
		pausedUntil: null,
		days: [0, 1, 2, 3, 4, 5, 6],
		trialStart: null
	});

	/** Is the push currently paused? */
	get paused(): boolean {
		return !!this.profile.pausedUntil && new Date(this.profile.pausedUntil) > new Date();
	}
	/** Free days left in the trial (0 when over or not started). */
	get trialDaysLeft(): number {
		const start = this.profile.trialStart;
		if (!start) return TRIAL_DAYS;
		const used = dayNumber(dayKey()) - dayNumber(start);
		return Math.max(0, TRIAL_DAYS - used);
	}
	get inTrial(): boolean {
		return this.trialDaysLeft > 0;
	}
	/** Everything unlocked: paid Pass, or still in the free trial. */
	get access(): boolean {
		return this.premium || this.inTrial;
	}
	/** Premium status — source of truth is the server (Stripe webhook), cached here. */
	premium = $state(false);
	favorites = $state<string[]>([]);
	/** "In the news" quotes seen on this phone (so history/favorites can show them later). */
	quotes = $state<Record<string, Phrase>>({});
	history = $state<HistoryItem[]>([]);
	streak = $state<Streak>({ count: 0, best: 0, last: null });
	source = $state<string | null>(null);
	loaded = $state(false);
	/** Called after every save (used to sync to the account when signed in). */
	onSave: (() => void) | null = null;
	/** Set by the auth module while signed in. */
	authHeader: string | null = null;

	/** Streak as it stands today: it's lost once a full day was missed. */
	get currentStreak(): number {
		const last = this.streak.last;
		if (!last) return 0;
		const today = dayKey();
		return last === today || last === shiftDay(today, -1) ? this.streak.count : 0;
	}

	/** Is today's visit still needed to keep the streak? */
	get streakAtRisk(): boolean {
		return this.currentStreak > 0 && this.streak.last !== dayKey();
	}

	/** Snapshot that is synced to the account. */
	exportData() {
		const { name, categories, topics, hour, extraHours, theme, trialStart } = this.profile;
		return {
			profile: { name, categories, topics, hour, extraHours, theme, trialStart },
			quotes: this.quotes,
			favorites: this.favorites,
			history: this.history,
			streak: this.streak
		};
	}

	/** Merge account data with this phone (union favorites/history, best streak). */
	mergeData(remote: ReturnType<AppStore['exportData']> | null) {
		if (!remote) return;
		this.quotes = { ...(remote.quotes ?? {}), ...this.quotes };
		// One trial per person: keep the earliest start across devices
		const rs = remote.profile?.trialStart;
		if (rs && (!this.profile.trialStart || rs < this.profile.trialStart)) this.profile.trialStart = rs;
		this.favorites = [...new Set([...this.favorites, ...(remote.favorites ?? [])])];
		const byDay = new Map<string, HistoryItem>();
		for (const h of [...(remote.history ?? []), ...this.history]) byDay.set(h.day, h);
		this.history = [...byDay.values()].sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, 366);
		const r = remote.streak;
		if (r?.last) {
			const l = this.streak;
			const newer = !l.last || r.last > l.last || (r.last === l.last && r.count > l.count);
			this.streak = { ...(newer ? r : l), best: Math.max(r.best ?? 0, l.best ?? 0) };
		}
		if (!this.profile.onboarded && remote.profile) {
			Object.assign(this.profile, remote.profile, { onboarded: true });
		}
		this.save();
	}

	load() {
		if (this.loaded || typeof window === 'undefined') return;
		const data = read({
			profile: this.profile,
			favorites: [] as string[],
			history: [] as HistoryItem[],
			streak: this.streak,
			source: null as string | null,
			premium: false,
			quotes: {} as Record<string, Phrase>
		});
		this.profile = {
			...this.profile,
			...data.profile,
			deviceId: data.profile.deviceId || uuid(),
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
		};
		this.favorites = data.favorites;
		this.history = data.history;
		this.streak = data.streak;
		this.source = data.source;
		this.premium = data.premium;
		this.quotes = data.quotes ?? {};
		if (!Array.isArray(this.profile.topics)) this.profile.topics = [];
		// People who joined before the trial existed start their 14 days now
		if (this.profile.onboarded && !this.profile.trialStart) this.profile.trialStart = dayKey();
		this.loaded = true;
		this.save();
	}

	save() {
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					profile: this.profile,
					favorites: this.favorites,
					history: this.history,
					streak: this.streak,
					source: this.source,
					premium: this.premium,
					quotes: this.quotes
				})
			);
		} catch {
			/* private mode: app still works for this session */
		}
		this.onSave?.();
	}

	/** First-touch attribution: which TikTok / IG video brought this person. */
	captureSource(url: URL) {
		if (this.source) return;
		const s = url.searchParams.get('utm_source') || url.searchParams.get('ref');
		const c = url.searchParams.get('utm_campaign') || url.searchParams.get('v');
		if (s) {
			this.source = c ? `${s}:${c}` : s;
			this.save();
		}
	}

	/** Called when today's phrase is seen. Updates history + streak. */
	visit(phraseId: string) {
		const today = dayKey();
		if (!this.history.some((h) => h.day === today)) {
			this.history = [{ id: phraseId, day: today }, ...this.history].slice(0, 366);
		}
		// Streak rule: open GoodPush (or tap the push) once a day. Miss a full day → back to 1.
		if (this.streak.last !== today) {
			const count = this.streak.last === shiftDay(today, -1) ? this.streak.count + 1 : 1;
			this.streak = { count, best: Math.max(count, this.streak.best), last: today };
		}
		this.save();
	}

	/** The 14 free days start the first time someone finishes onboarding / turns on the push. */
	startTrial() {
		if (!this.profile.trialStart) this.profile.trialStart = dayKey();
	}

	/** Any phrase or saved quote by id. */
	phrase(id: string): Phrase | undefined {
		return PHRASE_BY_ID.get(id) ?? this.quotes[id];
	}

	rememberQuote(q: Phrase) {
		if (this.quotes[q.id]) return;
		this.quotes = { ...this.quotes, [q.id]: q };
		this.save();
	}

	toggleFavorite(id: string) {
		this.favorites = this.favorites.includes(id)
			? this.favorites.filter((f) => f !== id)
			: [id, ...this.favorites];
		this.save();
	}

	/** Asks the server whether this device has an active Premium subscription. */
	async refreshPremium() {
		try {
			const res = await fetch(`/api/premium?deviceId=${encodeURIComponent(this.profile.deviceId)}`, {
				headers: this.authHeader ? { authorization: this.authHeader } : {}
			});
			if (!res.ok) return this.premium;
			const { premium } = (await res.json()) as { premium: boolean };
			this.premium = premium;
			if (!this.access) {
				this.profile.extraHours = [];
				this.profile.theme = 'cream';
			}
			this.save();
		} catch {
			/* offline: keep cached value */
		}
		return this.premium;
	}

	reset() {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			/* ignore */
		}
	}
}

export const app = new AppStore();

export type { Lang };
