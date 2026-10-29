/**
 * Icon library: Phosphor (https://phosphoricons.com) — one consistent, premium set.
 * Default weight is set app-wide with <IconContext> in the root layout ('bold');
 * pass weight="duotone" / "fill" for decorative or active states.
 * Import per icon (tree-shaken).
 */
import type { Component } from 'svelte';
import type { CategoryId } from './data/categories';

export { default as ArrowRight } from 'phosphor-svelte/lib/ArrowRightIcon';
export { default as ArrowLeft } from 'phosphor-svelte/lib/ArrowLeftIcon';
export { default as ArrowDown } from 'phosphor-svelte/lib/ArrowDownIcon';
export { default as ArrowUpRight } from 'phosphor-svelte/lib/ArrowUpRightIcon';
export { default as Bell } from 'phosphor-svelte/lib/BellRingingIcon';
export { default as BookOpen } from 'phosphor-svelte/lib/BookOpenTextIcon';
export { default as ChatDots } from 'phosphor-svelte/lib/ChatCircleDotsIcon';
export { default as Check } from 'phosphor-svelte/lib/CheckIcon';
export { default as Clock } from 'phosphor-svelte/lib/ClockCounterClockwiseIcon';
export { default as Crown } from 'phosphor-svelte/lib/CrownSimpleIcon';
export { default as Export } from 'phosphor-svelte/lib/ExportIcon';
export { default as Fire } from 'phosphor-svelte/lib/FireIcon';
export { default as Gear } from 'phosphor-svelte/lib/GearSixIcon';
export { default as Globe } from 'phosphor-svelte/lib/GlobeHemisphereWestIcon';
export { default as Heart } from 'phosphor-svelte/lib/HeartIcon';
export { default as Instagram } from 'phosphor-svelte/lib/InstagramLogoIcon';
export { default as Lock } from 'phosphor-svelte/lib/LockSimpleIcon';
export { default as Palette } from 'phosphor-svelte/lib/PaletteIcon';
export { default as Plus } from 'phosphor-svelte/lib/PlusIcon';
export { default as SealCheck } from 'phosphor-svelte/lib/SealCheckIcon';
export { default as ShareFat } from 'phosphor-svelte/lib/ShareFatIcon';
export { default as Sparkle } from 'phosphor-svelte/lib/SparkleIcon';
export { default as Sun } from 'phosphor-svelte/lib/SunHorizonIcon';
export { default as TikTok } from 'phosphor-svelte/lib/TiktokLogoIcon';
export { default as Trash } from 'phosphor-svelte/lib/TrashSimpleIcon';
export { default as X } from 'phosphor-svelte/lib/XIcon';
export { default as Translate } from 'phosphor-svelte/lib/TranslateIcon';

import FireIcon from 'phosphor-svelte/lib/FireIcon';
import MoonStarsIcon from 'phosphor-svelte/lib/MoonStarsIcon';
import SoccerBallIcon from 'phosphor-svelte/lib/SoccerBallIcon';
import BookOpenTextIcon from 'phosphor-svelte/lib/BookOpenTextIcon';
import RocketLaunchIcon from 'phosphor-svelte/lib/RocketLaunchIcon';
import HandsPrayingIcon from 'phosphor-svelte/lib/HandsPrayingIcon';
import HeartIcon from 'phosphor-svelte/lib/HeartIcon';

export const CATEGORY_ICON: // eslint-disable-next-line @typescript-eslint/no-explicit-any
Record<CategoryId, Component<any>> = {
	discipline: FireIcon,
	calm: MoonStarsIcon,
	sport: SoccerBallIcon,
	study: BookOpenTextIcon,
	build: RocketLaunchIcon,
	faith: HandsPrayingIcon,
	selflove: HeartIcon
};
