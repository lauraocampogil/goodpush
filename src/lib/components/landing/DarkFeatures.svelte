<script lang="ts">
	import CurvedMarquee from './CurvedMarquee.svelte';
	import NotifCard from '../NotifCard.svelte';
	import IPhone from '../IPhone.svelte';
	import PhraseText from '../PhraseText.svelte';
	import Smiley from '../Smiley.svelte';
	import CatIcon from '../CatIcon.svelte';
	import { CATEGORY_IDS } from '#lib/data/categories.ts';
	import { PHRASES } from '#lib/data/phrases.ts';
	import { ArrowRight, Bell, DeviceMobile, Fire, Heart, Palette, ShareFat, Translate } from '#lib/icons.ts';
	import { getI18n } from '#lib/i18n/index.svelte.ts';
	import { reveal, splitReveal } from '#lib/motion.ts';
	import { CATEGORY_COLOR } from '#lib/smiley.ts';

	let { onstart, cta }: { onstart: () => void; cta: string } = $props();
	const i = getI18n();
	const today = PHRASES.find((p) => p.id === 'd2')!;
	const story = PHRASES.find((p) => p.id === 'l2')!;
</script>

<section class="overflow-hidden bg-ink text-paper">
	<!-- CTA -->
	<div class="container-site pt-10 pb-6 text-center">
		<h2 use:splitReveal={{ scroll: true }} class="display mx-auto max-w-2xl text-4xl sm:text-[2.6rem]">{i.t('dark.title')}</h2>
		<div use:reveal><button class="btn mt-8 bg-sun text-ink hover:shadow-[0_12px_30px_-10px_rgb(246_227_107/0.5)]" onclick={onstart}>{cta} <ArrowRight /></button></div>
	</div>

	<div class="-mx-[6%] w-[112%] py-10 sm:py-16">
		<CurvedMarquee text={i.t('marquee.curved')} />
	</div>

	<!-- Feature rows -->
	<div id="how" class="container-site space-y-28 pb-28 sm:space-y-36 sm:pb-36">
		<!-- 1: how it works -->
		<div class="grid items-center gap-12 md:grid-cols-2 md:gap-20">
			<div use:reveal={{ y: 60 }} class="mx-auto w-full max-w-[300px]">
				<IPhone>
					<div class="flex h-full flex-col justify-center gap-5 p-6 pt-12">
						<p class="display text-2xl text-ink">{i.t('ob.cats.t')}</p>
						<div class="flex flex-wrap gap-2">
							{#each CATEGORY_IDS as c, k (c)}
								<span class="chip px-3 py-2 text-xs" aria-pressed={k % 3 === 0}><CatIcon cat={c} /> {i.cat(c)}</span>
							{/each}
						</div>
						<span class="btn mt-2 py-3 text-sm">{i.t('ob.next')} <ArrowRight /></span>
					</div>
				</IPhone>
			</div>
			<div>
				<h3 use:splitReveal={{ scroll: true }} class="display text-4xl text-sun sm:text-[2.6rem]">{i.t('f1.title')}</h3>
				<ul class="mt-8 space-y-6" use:reveal={{ children: true }}>
					{#each [{ Icon: DeviceMobile, n: 1 }, { Icon: Palette, n: 2 }, { Icon: Bell, n: 3 }] as { Icon, n } (n)}
						<li class="flex gap-4">
							<span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper/10 text-sun"><Icon size={20} weight="duotone" /></span>
							<div>
								<p class="font-semibold">{i.t(`how.${n}.t` as 'how.1.t')}</p>
								<p class="mt-1 text-sm text-paper/60">{i.t(`how.${n}.d` as 'how.1.d')}</p>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- 2: streaks + favorites -->
		<div class="grid items-center gap-12 md:grid-cols-2 md:gap-20">
			<div class="md:order-2" use:reveal={{ y: 60 }}>
				<div class="mx-auto w-full max-w-[300px]">
					<IPhone screen="bg-cream">
						<div class="flex h-full flex-col justify-center gap-4 p-4 pt-12">
							<NotifCard label={i.cat(today.cat)} time="08:00">
								<p class="display text-[1.15rem] leading-[0.95]"><span class="soft block text-xl">Laura,</span><PhraseText text={today[i.lang]} /></p>
							</NotifCard>
							<div class="flex items-center gap-3 rounded-[22px] bg-white p-4 shadow-[var(--shadow-soft)]">
								<Smiley size={40} color="orange" wink />
								<div class="flex-1">
									<p class="text-sm font-semibold text-ink">12 {i.t('today.streak')}</p>
									<div class="mt-2 flex gap-1">
										{#each Array.from({ length: 7 }) as _, n (n)}<span class="h-1.5 flex-1 rounded-full {n < 5 ? 'bg-orange' : 'bg-ink/10'}"></span>{/each}
									</div>
								</div>
							</div>
						</div>
					</IPhone>
				</div>
			</div>
			<div>
				<h3 use:splitReveal={{ scroll: true }} class="display text-4xl text-sun sm:text-[2.6rem]">{i.t('f2.title')}</h3>
				<ul class="mt-8 space-y-6" use:reveal={{ children: true }}>
					{#each [{ Icon: Fire, k: 'streak' }, { Icon: Heart, k: 'fav' }] as { Icon, k } (k)}
						<li class="flex gap-4">
							<span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper/10 text-sun"><Icon size={20} weight="duotone" /></span>
							<div>
								<p class="font-semibold">{i.t(`feat.${k}.t` as 'feat.fav.t')}</p>
								<p class="mt-1 text-sm text-paper/60">{i.t(`feat.${k}.d` as 'feat.fav.d')}</p>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- 3: share -->
		<div class="grid items-center gap-12 md:grid-cols-2 md:gap-20">
			<div use:reveal={{ y: 60 }} class="mx-auto w-full max-w-[300px]">
				<IPhone screen="bg-pink">
					<div class="flex h-full flex-col items-center justify-between p-6 pt-14 pb-8 text-ink">
						<span class="font-display text-sm font-extrabold tracking-tight uppercase">GoodPush</span>
						<p class="display text-center text-3xl leading-[0.92]"><span class="soft block text-3xl">Laura,</span><PhraseText text={story[i.lang]} /></p>
						<Smiley size={64} color="ink" wink />
					</div>
				</IPhone>
			</div>
			<div>
				<h3 use:splitReveal={{ scroll: true }} class="display text-4xl text-sun sm:text-[2.6rem]">{i.t('f3.title')}</h3>
				<ul class="mt-8 space-y-6" use:reveal={{ children: true }}>
					{#each [{ Icon: ShareFat, k: 'share' }, { Icon: Translate, k: 'name' }] as { Icon, k } (k)}
						<li class="flex gap-4">
							<span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper/10 text-sun"><Icon size={20} weight="duotone" /></span>
							<div>
								<p class="font-semibold">{i.t(`feat.${k}.t` as 'feat.fav.t')}</p>
								<p class="mt-1 text-sm text-paper/60">{i.t(`feat.${k}.d` as 'feat.fav.d')}</p>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</section>
