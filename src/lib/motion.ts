import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

let registered = false;
export function motion() {
	if (!registered && typeof window !== 'undefined') {
		gsap.registerPlugin(ScrollTrigger, SplitText);
		registered = true;
	}
	return { gsap, ScrollTrigger, SplitText };
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
export function splitReveal(node: HTMLElement, opts: { delay?: number; scroll?: boolean } = {}) {
	if (reduced()) return;
	const { gsap, SplitText } = motion();
	let split: SplitText | undefined;
	let tween: gsap.core.Tween | undefined;
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
	return { destroy: () => { tween?.kill(); split?.revert(); } };
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
		el.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;pointer-events:none;z-index:60;font-size:${18 + Math.random() * 14}px;color:${i % 2 ? '#FF2E88' : '#FFE14D'};-webkit-text-stroke:1px #111;font-weight:900`;
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
	const colors = ['#FF2E88', '#FFE14D', '#7FB2FF', '#111111'];
	for (let i = 0; i < count; i++) {
		const el = document.createElement('span');
		const smile = i % 6 === 0;
		el.textContent = smile ? '☺' : '';
		el.style.cssText = `position:fixed;top:-20px;left:${Math.random() * 100}vw;width:${smile ? 'auto' : '10px'};height:${smile ? 'auto' : '18px'};background:${smile ? 'none' : colors[i % 4]};font-size:28px;z-index:60;pointer-events:none;border:${smile ? 0 : 2}px solid #111`;
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
