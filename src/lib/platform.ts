export function isStandalone(): boolean {
	if (typeof window === 'undefined') return false;
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		// iOS Safari
		(navigator as Navigator & { standalone?: boolean }).standalone === true
	);
}

export function isIOS(): boolean {
	if (typeof navigator === 'undefined') return false;
	return (
		/iPad|iPhone|iPod/.test(navigator.userAgent) ||
		(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
	);
}

export function isAndroid(): boolean {
	return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
}

/** In-app browsers (TikTok, Instagram…) can't install PWAs. */
export function isInAppBrowser(): boolean {
	if (typeof navigator === 'undefined') return false;
	return /Instagram|FBAN|FBAV|TikTok|musical_ly|Bytedance|Line\//i.test(navigator.userAgent);
}

export function pushSupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window
	);
}
