import type { ViewMode } from '$lib/types';
import { APP_CONFIG } from '$lib/config';
import { getLocalPreferences, saveLocalPreferences } from '$lib/db/queries';

class PreferencesStore {
	viewMode = $state<ViewMode>(APP_CONFIG.DEFAULT_VIEW_MODE);
	collapsedGroups = $state<Record<string, boolean>>({});
	syncMode = $state<'auto' | 'manual'>(APP_CONFIG.DEFAULT_SYNC_MODE);
	syncInterval = $state(APP_CONFIG.DEFAULT_SYNC_INTERVAL);
	deviceId = $state('');
	theme = $state<'light' | 'dark' | 'auto'>('auto');
	loaded = $state(false);

	constructor() {
		this.loadFromDB();
	}

	async loadFromDB() {
		if (typeof window === 'undefined') {
			this.loaded = true;
			return;
		}

		try {
			const prefs = await getLocalPreferences();
			this.viewMode = prefs.viewMode;
			this.collapsedGroups = prefs.collapsedGroups;
			this.syncMode = prefs.syncMode;
			this.syncInterval = prefs.syncInterval;
			this.deviceId = prefs.deviceId;
			this.theme = prefs.theme ?? 'auto';
		} catch {
		} finally {
			this.loaded = true;
		}
	}

	private async save() {
		if (typeof window === 'undefined') return;
		try {
			await saveLocalPreferences({
				viewMode: this.viewMode,
				collapsedGroups: this.collapsedGroups,
				syncMode: this.syncMode,
				syncInterval: this.syncInterval,
				deviceId: this.deviceId,
				theme: this.theme
			});
		} catch {
		}
	}

	setViewMode(mode: ViewMode) {
		this.viewMode = mode;
		this.save();
	}

	toggleGroup(groupId: string) {
		this.collapsedGroups = {
			...this.collapsedGroups,
			[groupId]: !this.collapsedGroups[groupId]
		};
		this.save();
	}

	setSyncMode(mode: 'auto' | 'manual') {
		this.syncMode = mode;
		this.save();
	}

	setSyncInterval(seconds: number) {
		this.syncInterval = seconds;
		this.save();
	}

	setTheme(theme: 'light' | 'dark' | 'auto') {
		this.theme = theme;
		this.save();
	}
}

export const preferencesStore = new PreferencesStore();
