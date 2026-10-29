<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Realistic iPhone (15 Pro style) mockup in pure CSS/SVG:
	 * titanium frame, side buttons, Dynamic Island, status bar, glass glare, home indicator.
	 */
	let {
		class: cls = '',
		screen = 'bg-paper',
		tone = 'dark',
		time = '9:41',
		children
	}: { class?: string; screen?: string; tone?: 'dark' | 'light'; time?: string; children: Snippet } = $props();
	const ink = $derived(tone === 'dark' ? '#141414' : '#ffffff');
</script>

<div class="iphone relative aspect-[9/19.4] {cls}">
	<!-- side buttons -->
	<span class="btnside left-[-3px] top-[17%] h-[4.5%]"></span>
	<span class="btnside left-[-3px] top-[25%] h-[8%]"></span>
	<span class="btnside left-[-3px] top-[35%] h-[8%]"></span>
	<span class="btnside right-[-3px] top-[28%] h-[12%]"></span>

	<div class="frame absolute inset-0 rounded-[17%/8%] p-[3.2%]">
		<div class="relative h-full w-full overflow-hidden rounded-[14%/6.6%] {screen}">
			<!-- status bar -->
			<div class="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-[9%] pt-[4.2%] text-[11px] font-semibold" style="color:{ink}">
				<span class="tabular-nums">{time}</span>
				<span class="flex items-center gap-[5px]">
					<svg width="16" height="10" viewBox="0 0 16 10" fill={ink} aria-hidden="true"><rect x="0" y="7" width="3" height="3" rx=".7" /><rect x="4.3" y="5" width="3" height="5" rx=".7" /><rect x="8.6" y="2.6" width="3" height="7.4" rx=".7" /><rect x="12.9" y="0" width="3" height="10" rx=".7" /></svg>
					<svg width="14" height="10" viewBox="0 0 14 10" fill={ink} aria-hidden="true"><path d="M7 2.2c2 0 3.8.8 5.1 2l1-1A8.6 8.6 0 0 0 7 .8 8.6 8.6 0 0 0 .9 3.2l1 1A7.2 7.2 0 0 1 7 2.2Zm0 2.9c1.2 0 2.3.5 3.1 1.2l1-1A5.8 5.8 0 0 0 7 3.7c-1.6 0-3 .6-4.1 1.6l1 1A4.4 4.4 0 0 1 7 5.1Zm0 2.8c.5 0 .9.2 1.2.5L7 9.6 5.8 8.4c.3-.3.7-.5 1.2-.5Z" /></svg>
					<svg width="24" height="11" viewBox="0 0 24 11" aria-hidden="true"><rect x=".5" y=".5" width="20" height="10" rx="3" fill="none" stroke={ink} stroke-opacity=".4" /><rect x="2" y="2" width="15" height="7" rx="1.8" fill={ink} /><path d="M22 4v3c.7-.2 1.1-.8 1.1-1.5S22.7 4.2 22 4Z" fill={ink} fill-opacity=".45" /></svg>
				</span>
			</div>
			<!-- Dynamic Island -->
			<div class="absolute top-[1.8%] left-1/2 z-40 flex h-[3.6%] w-[31%] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-[3%]">
				<span class="h-[38%] w-auto aspect-square rounded-full bg-[#1b1b2a] ring-1 ring-[#2a2a40]"></span>
			</div>

			<div class="relative h-full">{@render children()}</div>

			<!-- home indicator + glass glare -->
			<span class="absolute bottom-[1.4%] left-1/2 z-30 h-[4px] w-[36%] -translate-x-1/2 rounded-full" style="background:{ink}; opacity:.85"></span>
			<span class="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(115deg,rgb(255_255_255/0.14)_0%,transparent_32%,transparent_70%,rgb(255_255_255/0.05)_100%)]"></span>
		</div>
	</div>
</div>

<style>
	.iphone {
		filter: drop-shadow(0 40px 50px rgb(0 0 0 / 0.35)) drop-shadow(0 8px 12px rgb(0 0 0 / 0.2));
	}
	.frame {
		background:
			linear-gradient(#0b0b0c, #0b0b0c) padding-box,
			linear-gradient(145deg, #8a8a90 0%, #3b3b40 18%, #2a2a2e 45%, #6d6d73 70%, #26262a 100%) border-box;
		border: 2.5px solid transparent;
		box-shadow:
			inset 0 0 0 1px rgb(255 255 255 / 0.06),
			inset 0 0 0 3px #050505;
	}
	.btnside {
		position: absolute;
		width: 4px;
		border-radius: 2px;
		background: linear-gradient(90deg, #2a2a2e, #75757b 50%, #2a2a2e);
	}
</style>
