import { segments } from './phrase';

const C = { ink: '#111111', cream: '#FFF6EC', pink: '#FF2E88', sun: '#FFE14D', white: '#FFFFFF' };

type Opts = { text: string; name?: string; category: string; time: string; site: string };

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, r);
}

function smiley(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
	ctx.save();
	ctx.fillStyle = C.sun;
	ctx.strokeStyle = C.ink;
	ctx.lineWidth = r * 0.13;
	ctx.beginPath();
	ctx.arc(cx, cy, r, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();
	ctx.fillStyle = C.ink;
	for (const dx of [-0.3, 0.3]) {
		ctx.beginPath();
		ctx.arc(cx + dx * r, cy - 0.22 * r, r * 0.11, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.beginPath();
	ctx.lineCap = 'round';
	ctx.arc(cx, cy + 0.02 * r, r * 0.48, 0.18 * Math.PI, 0.82 * Math.PI);
	ctx.stroke();
	ctx.restore();
}

type Word = { text: string; hl: boolean; w: number };

/** Draws a 1080×1920 Story image in the GoodPush style and returns a PNG blob. */
export async function renderShareCard(o: Opts): Promise<Blob> {
	await Promise.all([
		document.fonts.load('120px Anton'),
		document.fonts.load('italic 90px "Instrument Serif"'),
		document.fonts.load('700 40px "Bricolage Grotesque Variable"')
	]).catch(() => {});

	const W = 1080;
	const H = 1920;
	const canvas = document.createElement('canvas');
	canvas.width = W;
	canvas.height = H;
	const ctx = canvas.getContext('2d')!;

	ctx.fillStyle = C.cream;
	ctx.fillRect(0, 0, W, H);

	// Wordmark: G ☺ ☺ D PUSH
	ctx.textBaseline = 'alphabetic';
	ctx.font = '96px Anton';
	ctx.textAlign = 'left';
	const o1 = 64; // smiley diameter
	const parts = [ctx.measureText('G').width, o1 + 6, o1 + 6, ctx.measureText('D').width, ctx.measureText('PUSH').width];
	let x = (W - parts.reduce((a, b) => a + b, 0)) / 2;
	const base = 230;
	ctx.fillStyle = C.ink;
	ctx.fillText('G', x, base);
	x += parts[0];
	smiley(ctx, x + o1 / 2 + 3, base - 36, o1 / 2);
	x += parts[1];
	smiley(ctx, x + o1 / 2 + 3, base - 36, o1 / 2);
	x += parts[2];
	ctx.fillText('D', x, base);
	x += parts[3];
	ctx.fillStyle = C.pink;
	ctx.fillText('PUSH', x, base);

	// Layout phrase words
	const cardX = 90;
	const cardW = W - 180;
	const pad = 64;
	const maxW = cardW - pad * 2;
	let size = 128;
	let lines: Word[][] = [];
	const words: { text: string; hl: boolean }[] = [];
	for (const s of segments(o.text)) {
		for (const w of s.text.split(/\s+/).filter(Boolean)) words.push({ text: w.toUpperCase(), hl: s.hl });
	}
	const layout = () => {
		ctx.font = `${size}px Anton`;
		const space = ctx.measureText(' ').width;
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
		return space;
	};
	let space = layout();
	while (lines.length > 6 && size > 70) {
		size -= 8;
		space = layout();
	}
	const lineH = size * 1.02;
	const nameSize = 88;
	const headerH = 90;
	const textH = lines.length * lineH + (o.name ? nameSize * 1.1 : 0);
	// top padding (56) + header + gap (60) + text + bottom padding
	const cardH = 56 + headerH + 60 + textH + pad * 0.9;
	const cardY = Math.max(340, (H - cardH) / 2 - 40);

	// Card shadow + body
	ctx.fillStyle = C.ink;
	roundRect(ctx, cardX + 14, cardY + 14, cardW, cardH, 56);
	ctx.fill();
	ctx.fillStyle = C.white;
	roundRect(ctx, cardX, cardY, cardW, cardH, 56);
	ctx.fill();
	ctx.lineWidth = 8;
	ctx.strokeStyle = C.ink;
	ctx.stroke();

	// Header: app icon + label + time
	const hx = cardX + pad;
	const hy = cardY + 56;
	ctx.fillStyle = C.ink;
	roundRect(ctx, hx, hy, 60, 60, 16);
	ctx.fill();
	smiley(ctx, hx + 30, hy + 30, 20);
	ctx.font = '700 34px "Bricolage Grotesque Variable", sans-serif';
	ctx.fillStyle = 'rgba(17,17,17,.75)';
	ctx.fillText(`GOODPUSH · ${o.category.toUpperCase()}`, hx + 80, hy + 42);
	ctx.textAlign = 'right';
	ctx.fillText(o.time, cardX + cardW - pad, hy + 42);
	ctx.textAlign = 'left';

	// Name (soft serif)
	let y = hy + headerH + 60;
	if (o.name) {
		ctx.font = `italic ${nameSize}px "Instrument Serif", serif`;
		ctx.fillStyle = C.ink;
		ctx.fillText(`${o.name},`, hx, y + nameSize * 0.6);
		y += nameSize * 1.1;
	}

	// Phrase (loud Anton + pink tape)
	ctx.font = `${size}px Anton`;
	for (const line of lines) {
		y += lineH;
		let lx = hx;
		line.forEach((w, i) => {
			if (w.hl) {
				const extend = line[i + 1]?.hl ? space : 0;
				ctx.save();
				ctx.translate(lx + w.w / 2, y - size * 0.36);
				ctx.rotate(-0.025);
				ctx.fillStyle = C.pink;
				ctx.fillRect(-w.w / 2 - 14, -size * 0.52, w.w + 28 + extend, size * 0.98);
				ctx.restore();
			}
			ctx.fillStyle = w.hl ? C.white : C.ink;
			ctx.fillText(w.text, lx, y);
			lx += w.w + space;
		});
	}

	// Footer
	smiley(ctx, W / 2, H - 330, 56);
	ctx.textAlign = 'center';
	ctx.fillStyle = C.ink;
	ctx.font = '700 44px "Bricolage Grotesque Variable", sans-serif';
	ctx.fillText(o.site, W / 2, H - 210);
	ctx.font = 'italic 52px "Instrument Serif", serif';
	ctx.fillText('A good push. Every day.', W / 2, H - 140);

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
