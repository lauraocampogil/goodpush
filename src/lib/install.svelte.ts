type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Holds Chrome/Android's install prompt so we can trigger it from our own button. */
class InstallState {
	event = $state<BIPEvent | null>(null);

	listen() {
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			this.event = e as BIPEvent;
		});
		window.addEventListener('appinstalled', () => (this.event = null));
	}

	async prompt(): Promise<boolean> {
		if (!this.event) return false;
		await this.event.prompt();
		const { outcome } = await this.event.userChoice;
		this.event = null;
		return outcome === 'accepted';
	}
}

export const install = new InstallState();
