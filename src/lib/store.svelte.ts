import type { CategoryId, Lang } from './data/categories';
import { dayKey, shiftDay } from './phrase';

export type Profile = {
	deviceId: string;
	name: string;
	categories: CategoryId[];
	hour: number;
	timeZone: string;
	onboarded: boolean;
	pushEnabled: boolean;
};

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
		hour: 8,
		timeZone: 'UTC',
		onboarded: false,
		pushEnabled: false
	});
	favorites = $state<string[]>([]);
	history = $state<HistoryItem[]>([]);
	streak = $state<Streak>({ count: 0, best: 0, last: null });
	source = $state<string | null>(null);
	loaded = $state(false);

	load() {
		if (this.loaded || typeof window === 'undefined') return;
		const data = read({
			profile: this.profile,
			favorites: [] as string[],
			history: [] as HistoryItem[],
			streak: this.streak,
			source: null as string | null
		});
		this.profile = {
			...data.profile,
			deviceId: data.profile.deviceId || uuid(),
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
		};
		this.favorites = data.favorites;
		this.history = data.history;
		this.streak = data.streak;
		this.source = data.source;
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
					source: this.source
				})
			);
		} catch {
			/* private mode: app still works for this session */
		}
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
		if (this.streak.last !== today) {
			const count = this.streak.last === shiftDay(today, -1) ? this.streak.count + 1 : 1;
			this.streak = { count, best: Math.max(count, this.streak.best), last: today };
		}
		this.save();
	}

	toggleFavorite(id: string) {
		this.favorites = this.favorites.includes(id)
			? this.favorites.filter((f) => f !== id)
			: [id, ...this.favorites];
		this.save();
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
