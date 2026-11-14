import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Draggable } from 'gsap/Draggable';

let registered = false;
export function motion() {
	if (!registered && typeof window !== 'undefined') {
		gsap.registerPlugin(ScrollTrigger, SplitText, Draggable);
		registered = true;
	}
	return { gsap, ScrollTrigger, SplitText, Draggable };
}

export const reduced = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** use:reveal — fades + slides children in when scrolled into view. */
export function reveal(node: HTMLElement, opts: { y?: number; stagger?: number; delay?: number; children?: boolean } = {}) {
	if (reduced()) return;
	const { gsap } = motion();
	const targets = opts.children ? Array.from(node.children) : [node];
	const tween = gsap.from(targets, {
		y: opts.y ?? 40,
		autoAlpha: 0,
		duration: 0.9,
		ease: 'expo.out',
		delay: opts.delay ?? 0,
		stagger: opts.stagger ?? 0.08,
		scrollTrigger: { trigger: node, start: 'top 85%', once: true }
	});
	return { destroy: () => { tween.scrollTrigger?.kill(); tween.kill(); } };
}

/** use:splitReveal — big headlines: characters rise from a mask. */
export function splitReveal(node: HTMLElement, opts: { delay?: number; scroll?: boolean; text?: string } = {}) {
	if (reduced()) return;
	const { gsap, SplitText } = motion();
	let split: SplitText | undefined;
	let tween: gsap.core.Tween | undefined;
	let text = opts.text;
	document.fonts.ready.then(() => {
		split = SplitText.create(node, { type: 'words,chars', mask: 'words' });
		tween = gsap.from(split.chars, {
			yPercent: 110,
			rotate: 6,
			duration: 0.9,
			ease: 'expo.out',
			stagger: 0.018,
			delay: opts.delay ?? 0,
			scrollTrigger: opts.scroll ? { trigger: node, start: 'top 85%', once: true } : undefined
		});
	});
	return {
		/** Language switch: put the new text back in and animate it in again. */
		update(next: { delay?: number; scroll?: boolean; text?: string }) {
			if (next.text === undefined || next.text === text) return;
			text = next.text;
			tween?.kill();
			split?.revert();
			node.textContent = next.text;
			split = SplitText.create(node, { type: 'words,chars', mask: 'words' });
			tween = gsap.from(split.chars, { yPercent: 110, duration: 0.6, ease: 'expo.out', stagger: 0.012 });
		},
		destroy: () => {
			tween?.kill();
			split?.revert();
		}
	};
}

/** use:magnetic — element follows the cursor a little (desktop only). */
export function magnetic(node: HTMLElement, strength = 0.35) {
	if (reduced() || !matchMedia('(hover: hover)').matches) return;
	const { gsap } = motion();
	const xTo = gsap.quickTo(node, 'x', { duration: 0.5, ease: 'elastic.out(1,0.4)' });
	const yTo = gsap.quickTo(node, 'y', { duration: 0.5, ease: 'elastic.out(1,0.4)' });
	const move = (e: PointerEvent) => {
		const r = node.getBoundingClientRect();
		xTo((e.clientX - r.left - r.width / 2) * strength);
		yTo((e.clientY - r.top - r.height / 2) * strength);
	};
	const leave = () => { xTo(0); yTo(0); };
	node.addEventListener('pointermove', move);
	node.addEventListener('pointerleave', leave);
	return { destroy: () => { node.removeEventListener('pointermove', move); node.removeEventListener('pointerleave', leave); } };
}

/** use:tilt — 3D tilt toward the cursor. */
export function tilt(node: HTMLElement, max = 10) {
	if (reduced() || !matchMedia('(hover: hover)').matches) return;
	const { gsap } = motion();
	gsap.set(node, { transformPerspective: 1000 });
	const rx = gsap.quickTo(node, 'rotationX', { duration: 0.8, ease: 'power3.out' });
	const ry = gsap.quickTo(node, 'rotationY', { duration: 0.8, ease: 'power3.out' });
	const move = (e: PointerEvent) => {
		ry(((e.clientX / innerWidth) - 0.5) * max * 2);
		rx(-((e.clientY / innerHeight) - 0.5) * max * 2);
	};
	window.addEventListener('pointermove', move);
	return { destroy: () => window.removeEventListener('pointermove', move) };
}

/** use:parallax — moves with scroll (speed: -1…1). */
export function parallax(node: HTMLElement, speed = 0.2) {
	if (reduced()) return;
	const { gsap } = motion();
	const tween = gsap.to(node, {
		yPercent: -100 * speed,
		ease: 'none',
		scrollTrigger: { trigger: node, start: 'top bottom', end: 'bottom top', scrub: true }
	});
	return { destroy: () => { tween.scrollTrigger?.kill(); tween.kill(); } };
}

/** Heart / sparkle burst from an element (favorites). */
export function burst(from: HTMLElement, glyphs = ['♥', '✦', '♥', '★', '♥', '✦', '♥', '★']) {
	if (reduced()) return;
	const { gsap } = motion();
	const r = from.getBoundingClientRect();
	glyphs.forEach((g, i) => {
		const el = document.createElement('span');
		el.textContent = g;
		el.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;pointer-events:none;z-index:60;font-size:${18 + Math.random() * 14}px;color:${['#FF5B1F', '#F7A6C9', '#FFB81C', '#6C4DA6'][i % 4]};font-weight:900`;
		document.body.appendChild(el);
		const a = (Math.PI * 2 * i) / glyphs.length + Math.random() * 0.4;
		gsap.fromTo(el, { x: 0, y: 0, scale: 0.3 }, {
			x: Math.cos(a) * (60 + Math.random() * 50),
			y: Math.sin(a) * (60 + Math.random() * 50) - 20,
			scale: 1,
			rotate: Math.random() * 90 - 45,
			opacity: 0,
			duration: 0.9 + Math.random() * 0.3,
			ease: 'power3.out',
			onComplete: () => el.remove()
		});
	});
}

/** Confetti of smileys + tape bits (streak milestones, premium). */
export function confetti(count = 60) {
	if (reduced()) return;
	const { gsap } = motion();
	const colors = ['#FF5B1F', '#FFB81C', '#2F7D4A', '#F7A6C9', '#6C4DA6', '#9FDBBE'];
	for (let i = 0; i < count; i++) {
		const el = document.createElement('span');
		const smile = i % 6 === 0;
		el.textContent = smile ? '☺' : '';
		el.style.cssText = `position:fixed;top:-20px;left:${Math.random() * 100}vw;width:${smile ? 'auto' : '10px'};height:${smile ? 'auto' : '18px'};background:${smile ? 'none' : colors[i % colors.length]};font-size:28px;z-index:60;pointer-events:none;border-radius:${i % 3 ? 2 : 99}px`;
		document.body.appendChild(el);
		gsap.to(el, {
			y: innerHeight + 60,
			x: `+=${Math.random() * 200 - 100}`,
			rotate: Math.random() * 720 - 360,
			duration: 1.6 + Math.random() * 1.4,
			ease: 'power1.in',
			delay: Math.random() * 0.4,
			onComplete: () => el.remove()
		});
	}
}

/** use:wordsUp — headline words rise and settle one by one when scrolled into view (no mask: accents never clip).
 *  Wrap the element in {#key i.lang} so a language switch rebuilds it. */
export function wordsUp(node: HTMLElement, opts: { delay?: number; scroll?: boolean } = {}) {
	if (reduced()) return;
	const { gsap, SplitText } = motion();
	let split: SplitText | undefined;
	let tween: gsap.core.Tween | undefined;
	document.fonts.ready.then(() => {
		split = SplitText.create(node, { type: 'words' });
		tween = gsap.from(split.words, {
			yPercent: 70,
			rotate: 4,
			autoAlpha: 0,
			duration: 1.1,
			ease: 'expo.out',
			stagger: 0.07,
			delay: opts.delay ?? 0,
			scrollTrigger: opts.scroll !== false ? { trigger: node, start: 'top 88%', once: true } : undefined
		});
	});
	return { destroy: () => { tween?.kill(); split?.revert(); } };
}

/** use:popIn — children pop in with a little rotation, like stickers being placed. */
export function popIn(node: HTMLElement, opts: { stagger?: number; rotate?: number } = {}) {
	if (reduced()) return;
	const { gsap } = motion();
	// fromTo with explicit end values: a plain from() run twice on the same node would animate hidden → hidden
	const t = gsap.fromTo(
		Array.from(node.children),
		{ y: 120, scale: 0.88, rotate: (i: number) => (i % 2 ? 1 : -1) * (opts.rotate ?? 6), autoAlpha: 0 },
		{ y: 0, scale: 1, rotate: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out', stagger: opts.stagger ?? 0.12, clearProps: 'transform', scrollTrigger: { trigger: node, start: 'top 85%', once: true } }
	);
	return { destroy: () => { t.scrollTrigger?.kill(); t.kill(); } };
}
