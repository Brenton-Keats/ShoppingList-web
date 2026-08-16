import { preferencesStore } from '$lib/stores/preferences.svelte';

type ThemeMode = 'light' | 'dark' | 'auto';

class UIStore {
	resolvedTheme = $state<'light' | 'dark'>('light');
	online = $state(true);
	headerTitle = $state('');
	showBackButton = $state(false);
	dialogOpen = $state(false);

	constructor() {
		if (typeof window !== 'undefined') {
			this.updateResolvedTheme();

			window.addEventListener('online', () => {
				this.online = true;
			});
			window.addEventListener('offline', () => {
				this.online = false;
			});

			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			mediaQuery.addEventListener('change', () => {
				this.updateResolvedTheme();
			});
		}
	}

	get theme(): ThemeMode {
		return preferencesStore.theme;
	}

	updateResolvedTheme() {
		const currentTheme = preferencesStore.theme;
		if (currentTheme === 'auto') {
			const prefersDark =
				typeof window !== 'undefined' &&
				window.matchMedia('(prefers-color-scheme: dark)').matches;
			this.resolvedTheme = prefersDark ? 'dark' : 'light';
		} else {
			this.resolvedTheme = currentTheme;
		}

		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('dark', this.resolvedTheme === 'dark');
		}
	}

	setTheme(mode: ThemeMode) {
		preferencesStore.setTheme(mode);
		this.updateResolvedTheme();
	}

	cycleTheme() {
		const modes: ThemeMode[] = ['light', 'dark', 'auto'];
		const currentIndex = modes.indexOf(preferencesStore.theme);
		this.setTheme(modes[(currentIndex + 1) % modes.length]);
	}

	setHeaderTitle(title: string) {
		this.headerTitle = title;
	}

	setShowBackButton(show: boolean) {
		this.showBackButton = show;
	}
}

export const uiStore = new UIStore();
