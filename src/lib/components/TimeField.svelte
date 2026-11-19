<script lang="ts">
	/** A real time picker (iOS / Android show their native wheel): any minute, e.g. 08:15 or 06:40. */
	let { hour, minute = 0, onchange, disabled = false, label, size = 'lg' }: { hour: number; minute?: number; onchange: (h: number, m: number) => void; disabled?: boolean; label: string; size?: 'lg' | 'md' } = $props();
	const value = $derived(`${String(hour).padStart(2, '0')}:${String(minute ?? 0).padStart(2, '0')}`);
	function change(e: Event) {
		const [h, m] = (e.currentTarget as HTMLInputElement).value.split(':').map(Number);
		if (Number.isInteger(h) && Number.isInteger(m)) onchange(h, m);
	}
</script>

<label class="relative block {disabled ? 'opacity-50' : ''}">
	<span class="sr-only">{label}</span>
	<input
		type="time"
		step="300"
		{value}
		{disabled}
		onchange={change}
		class="w-full cursor-pointer appearance-none rounded-3xl bg-white text-center font-display font-extrabold tabular-nums tracking-[-0.02em] text-ink ring-1 ring-ink/10 transition focus:ring-2 focus:ring-ink focus:outline-none {size === 'lg' ? 'py-4 text-4xl' : 'py-3 text-2xl'}"
	/>
</label>
