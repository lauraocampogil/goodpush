import { segments } from './phrase';
import { smileyDataUrl, type StickerColor } from './smiley';

export type Theme = 'cream' | 'sky' | 'ink' | 'pink';
const THEMES: Record<Theme, { bg: string; fg: string; marker: string; markerText: string; badge: StickerColor }> = {
	cream: { bg: '#F6E36B', fg: '#141414', marker: '#FFFFFF', markerText: '#141414', badge: 'orange' },
	sky: { bg: '#C7B5F2', fg: '#141414', marker: '#F6E36B', markerText: '#141414', badge: 'pink' },
	ink: { bg: '#141414', fg: '#FBF8F1', marker: '#F6E36B', markerText: '#141414', badge: 'yellow' },
	pink: { bg: '#F7A6C9', fg: '#141414', marker: '#FFFFFF', markerText: '#141414', badge: 'purple' }
};

type Opts = { text: string; name?: string; category: string; time: string; site: string; theme?: Theme; badge?: StickerColor };

const loadImg = (src: string) =>
	new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});

type Word = { text: string; hl: boolean; w: number };

/** Draws a clean 1080×1920 Story image (flat color, big type, sticker) and returns a PNG blob. */
export async function renderShareCard(o: Opts): Promise<Blob> {
	const T = THEMES[o.theme ?? 'cream'];
	const [logo, badge] = await Promise.all([
		loadImg(smileyDataUrl('smile', T.fg === '#141414' ? 'ink' : 'sun')),
		loadImg(smileyDataUrl('wink', o.badge ?? T.badge)),
		document.fonts.load('120px Anton'),
		document.fonts.load('italic 90px "Instrument Serif"'),
		document.fonts.load('600 40px "Inter Variable"')
	]).catch(() => [null, null] as const) as [HTMLImageElement | null, HTMLImageElement | null];

	const W = 1080;
	const H = 1920;
	const canvas = document.createElement('canvas');
	canvas.width = W;
	canvas.height = H;
	const ctx = canvas.getContext('2d')!;
	ctx.fillStyle = T.bg;
	ctx.fillRect(0, 0, W, H);

	// Logo: badge + GOODPUSH
	ctx.textBaseline = 'alphabetic';
	ctx.font = '64px Anton';
	const label = 'GOODPUSH';
	const lw = ctx.measureText(label).width;
	const lx = (W - (64 + 18 + lw)) / 2;
	if (logo) ctx.drawImage(logo, lx, 150, 64, 64);
	ctx.fillStyle = T.fg;
	ctx.fillText(label, lx + 82, 206);

	// Category · time
	ctx.font = '600 30px "Inter Variable", sans-serif';
	ctx.textAlign = 'center';
	ctx.globalAlpha = 0.6;
	ctx.fillText(`${o.category.toUpperCase()}  ·  ${o.time}`, W / 2, 300);
	ctx.globalAlpha = 1;
	ctx.textAlign = 'left';

	// Phrase layout (centered lines)
	const maxW = W - 160;
	let size = 150;
	let lines: Word[][] = [];
	const words: { text: string; hl: boolean }[] = [];
	for (const s of segments(o.text)) for (const w of s.text.split(/\s+/).filter(Boolean)) words.push({ text: w.toUpperCase(), hl: s.hl });
	let space = 0;
	const layout = () => {
		ctx.font = `${size}px Anton`;
		space = ctx.measureText(' ').width;
		lines = [[]];
		let lineW = 0;
		for (const w of words) {
			const ww = ctx.measureText(w.text).width;
			const add = lines[lines.length - 1].length ? space + ww : ww;
			if (lineW + add > maxW && lines[lines.length - 1].length) {
				lines.push([]);
				lineW = ww;
			} else lineW += add;
			lines[lines.length - 1].push({ ...w, w: ww });
		}
	};
	layout();
	while (lines.length > 6 && size > 80) {
		size -= 10;
		layout();
	}
	const lineH = size * 0.98;
	const nameSize = 110;
	const blockH = lines.length * lineH + (o.name ? nameSize : 0);
	let y = (H - blockH) / 2 - 60;

	if (o.name) {
		ctx.font = `italic ${nameSize}px "Instrument Serif", serif`;
		ctx.fillStyle = T.fg;
		ctx.textAlign = 'center';
		ctx.fillText(`${o.name},`, W / 2, y + nameSize * 0.75);
		ctx.textAlign = 'left';
		y += nameSize;
	}

	ctx.font = `${size}px Anton`;
	for (const line of lines) {
		y += lineH;
		const total = line.reduce((a, w) => a + w.w, 0) + space * (line.length - 1);
		let x = (W - total) / 2;
		line.forEach((w, i) => {
			if (w.hl) {
				const extend = line[i + 1]?.hl ? space : 0;
				ctx.fillStyle = T.marker;
				ctx.beginPath();
				ctx.roundRect(x - 14, y - size * 0.86, w.w + 28 + extend, size * 0.98, 18);
				ctx.fill();
			}
			ctx.fillStyle = w.hl ? T.markerText : T.fg;
			ctx.fillText(w.text, x, y);
			x += w.w + space;
		});
	}

	// Sticker + footer
	if (badge) {
		ctx.save();
		ctx.translate(W / 2, H - 420);
		ctx.rotate(-0.12);
		ctx.drawImage(badge, -110, -110, 220, 220);
		ctx.restore();
	}
	ctx.textAlign = 'center';
	ctx.fillStyle = T.fg;
	ctx.font = 'italic 56px "Instrument Serif", serif';
	ctx.fillText('A good push. Every day.', W / 2, H - 200);
	ctx.font = '600 32px "Inter Variable", sans-serif';
	ctx.globalAlpha = 0.6;
	ctx.fillText(o.site, W / 2, H - 140);
	ctx.globalAlpha = 1;

	return new Promise((resolve, reject) =>
		canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
	);
}

/** Web Share with the image when possible, otherwise download it. */
export async function shareImage(blob: Blob, text: string, url: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
	const file = new File([blob], 'goodpush.png', { type: 'image/png' });
	if (navigator.canShare?.({ files: [file] })) {
		try {
			await navigator.share({ files: [file], text: `${text} ${url}` });
			return 'shared';
		} catch {
			return 'cancelled';
		}
	}
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = 'goodpush.png';
	a.click();
	setTimeout(() => URL.revokeObjectURL(a.href), 5000);
	return 'downloaded';
}
