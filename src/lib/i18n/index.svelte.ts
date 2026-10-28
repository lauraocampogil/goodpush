import { getContext, setContext } from 'svelte';
import { LANGS, type CategoryId, type Lang } from '../data/categories';
import { CATEGORY_LABEL, DICTS, type DictKey } from './dict';

const KEY = Symbol('i18n');

export class I18n {
	lang = $state<Lang>('en');

	constructor(lang: Lang) {
		this.lang = lang;
	}

	t = (key: DictKey): string => DICTS[this.lang][key] ?? DICTS.en[key] ?? key;
	cat = (id: CategoryId): string => CATEGORY_LABEL[this.lang][id];

	set(lang: Lang) {
		this.lang = lang;
		if (typeof document !== 'undefined') {
			document.documentElement.lang = lang;
			document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`;
		}
	}
}

export function setI18n(lang: Lang) {
	return setContext(KEY, new I18n(lang));
}

export function getI18n(): I18n {
	return getContext(KEY);
}

/** English is the default; we only switch if the browser clearly prefers es/fr. */
export function pickLang(cookie: string | undefined, acceptLanguage: string | null): Lang {
	if (cookie && (LANGS as string[]).includes(cookie)) return cookie as Lang;
	const first = (acceptLanguage ?? '').split(',')[0]?.trim().slice(0, 2).toLowerCase();
	return first === 'es' || first === 'fr' ? first : 'en';
}
