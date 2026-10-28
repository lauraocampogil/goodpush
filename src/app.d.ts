import type { Lang } from '#lib/data/categories.ts';

declare global {
	namespace App {
		interface Locals {
			lang: Lang;
		}
	}
}

export {};
