/**
 * The GoodPush smiley — one SVG source used everywhere:
 * the <Smiley> component, the share-card canvas, app icons and the OG image.
 * 3D "glossy emoji" style: radial body, rim shading, specular highlight,
 * glossy eyes with glints, open smile with tongue, soft blush.
 */
export type SmileyMood = 'smile' | 'wink' | 'grin' | 'love';

export function smileySvg(mood: SmileyMood = 'smile', uid = 'gp'): string {
	const id = (n: string) => `${uid}-${n}`;

	const eyeL = `<ellipse cx="36.5" cy="41" rx="5.2" ry="7.6" fill="url(#${id('eye')})"/>
		<ellipse cx="34.8" cy="37.6" rx="1.9" ry="2.4" fill="#fff" opacity=".95"/>`;
	const eyeR =
		mood === 'wink'
			? `<path d="M57.5 42.5c3.4-4.6 9.6-4.6 13 0" fill="none" stroke="#3a1d06" stroke-width="3.6" stroke-linecap="round"/>`
			: `<ellipse cx="63.5" cy="41" rx="5.2" ry="7.6" fill="url(#${id('eye')})"/>
		<ellipse cx="61.8" cy="37.6" rx="1.9" ry="2.4" fill="#fff" opacity=".95"/>`;
	const eyes =
		mood === 'love'
			? `<path d="M36.5 49.5 28 41.6a5.3 5.3 0 0 1 8.5-6.3 5.3 5.3 0 0 1 8.5 6.3Z" fill="url(#${id('heart')})"/>
		<path d="M63.5 49.5 55 41.6a5.3 5.3 0 0 1 8.5-6.3 5.3 5.3 0 0 1 8.5 6.3Z" fill="url(#${id('heart')})"/>
		<circle cx="31.6" cy="38.8" r="1.5" fill="#fff" opacity=".9"/><circle cx="58.6" cy="38.8" r="1.5" fill="#fff" opacity=".9"/>`
			: eyeL + eyeR;
	const mouth =
		mood === 'grin'
			? `<path d="M27 55.5c2.6 15 12 21 23 21s20.4-6 23-21c-7.4 3.4-15.2 4.6-23 4.6s-15.6-1.2-23-4.6Z" fill="url(#${id('mouth')})"/>
		<path d="M30.5 57.6c6 2.3 12.6 3.2 19.5 3.2s13.5-.9 19.5-3.2l-.8 3.9c-5.8 1.9-12.2 2.7-18.7 2.7s-12.9-.8-18.7-2.7Z" fill="#fff"/>
		<clipPath id="${id('mclip')}"><path d="M27 55.5c2.6 15 12 21 23 21s20.4-6 23-21c-7.4 3.4-15.2 4.6-23 4.6s-15.6-1.2-23-4.6Z"/></clipPath>
		<ellipse cx="50" cy="75" rx="12" ry="6.5" fill="#ff5f9b" clip-path="url(#${id('mclip')})"/>`
			: `<path d="M30 57.5c3 11.5 10.6 16.5 20 16.5s17-5 20-16.5c-6.4 2.6-13 3.8-20 3.8s-13.6-1.2-20-3.8Z" fill="url(#${id('mouth')})"/>
		<clipPath id="${id('mclip')}"><path d="M30 57.5c3 11.5 10.6 16.5 20 16.5s17-5 20-16.5c-6.4 2.6-13 3.8-20 3.8s-13.6-1.2-20-3.8Z"/></clipPath>
		<ellipse cx="50" cy="73" rx="10" ry="5.6" fill="#ff5f9b" clip-path="url(#${id('mclip')})"/>`;

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
	<defs>
		<radialGradient id="${id('body')}" cx="38%" cy="30%" r="78%">
			<stop offset="0" stop-color="#fff6b0"/>
			<stop offset=".32" stop-color="#ffdf3d"/>
			<stop offset=".72" stop-color="#ffbb0f"/>
			<stop offset="1" stop-color="#f08c00"/>
		</radialGradient>
		<radialGradient id="${id('rim')}" cx="50%" cy="45%" r="55%">
			<stop offset=".78" stop-color="#d06a00" stop-opacity="0"/>
			<stop offset="1" stop-color="#b85400" stop-opacity=".45"/>
		</radialGradient>
		<radialGradient id="${id('shine')}" cx="50%" cy="50%" r="50%">
			<stop offset="0" stop-color="#fff" stop-opacity=".95"/>
			<stop offset="1" stop-color="#fff" stop-opacity="0"/>
		</radialGradient>
		<linearGradient id="${id('eye')}" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#5b2f0d"/>
			<stop offset="1" stop-color="#241002"/>
		</linearGradient>
		<linearGradient id="${id('mouth')}" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#4b2208"/>
			<stop offset="1" stop-color="#2a1103"/>
		</linearGradient>
		<linearGradient id="${id('heart')}" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#ff7ab3"/>
			<stop offset="1" stop-color="#e3125f"/>
		</linearGradient>
		<filter id="${id('soft')}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>
	</defs>
	<ellipse cx="50" cy="95" rx="30" ry="3.6" fill="#7a3d00" opacity=".18" filter="url(#${id('soft')})"/>
	<circle cx="50" cy="50" r="44" fill="url(#${id('body')})"/>
	<circle cx="50" cy="50" r="44" fill="url(#${id('rim')})"/>
	<ellipse cx="22" cy="59" rx="7.5" ry="4.4" fill="#ff6fa5" opacity=".38" filter="url(#${id('soft')})"/>
	<ellipse cx="78" cy="59" rx="7.5" ry="4.4" fill="#ff6fa5" opacity=".38" filter="url(#${id('soft')})"/>
	${eyes}
	${mouth}
	<ellipse cx="36" cy="20.5" rx="18" ry="9" transform="rotate(-22 36 20.5)" fill="url(#${id('shine')})" opacity=".85"/>
	<ellipse cx="74" cy="72" rx="6" ry="3" transform="rotate(-40 74 72)" fill="#fff" opacity=".25"/>
</svg>`;
}

/** Data URL for <img>/canvas use. */
export const smileyDataUrl = (mood: SmileyMood = 'smile', uid = 'gpimg') =>
	`data:image/svg+xml;charset=utf-8,${encodeURIComponent(smileySvg(mood, uid))}`;
