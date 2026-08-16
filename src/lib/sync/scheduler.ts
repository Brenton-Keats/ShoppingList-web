import { performSync } from './engine';
import { syncStateStore } from './state';

let autoSyncIntervalId: ReturnType<typeof setInterval> | null = null;
let isManualSyncInProgress = false;

export function startAutoSync(intervalSeconds: number): void {
	stopAutoSync();

	autoSyncIntervalId = setInterval(() => {
		if (navigator.onLine && syncStateStore.state.status !== 'syncing') {
			performSync().catch((error) => {
				console.error('Auto-sync failed:', error);
			});
		}
	}, intervalSeconds * 1000);
}

export function stopAutoSync(): void {
	if (autoSyncIntervalId !== null) {
		clearInterval(autoSyncIntervalId);
		autoSyncIntervalId = null;
	}
}

export async function triggerManualSync(): Promise<boolean> {
	if (isManualSyncInProgress) {
		return false;
	}

	isManualSyncInProgress = true;

	try {
		const result = await performSync();
		return result;
	} finally {
		isManualSyncInProgress = false;
	}
}

export function setupConnectivityListeners(): void {
	if (typeof window === 'undefined') {
		return;
	}

	window.addEventListener('online', () => {
		syncStateStore.setIdle();
		triggerManualSync().catch((error) => {
			console.error('Sync on reconnect failed:', error);
		});
	});

	window.addEventListener('offline', () => {
		syncStateStore.setOffline();
	});
}

export function checkSyncNeededOnStartup(): void {
	if (typeof window === 'undefined') {
		return;
	}

	if (navigator.onLine) {
		triggerManualSync().catch((error) => {
			console.error('Startup sync failed:', error);
		});
	} else {
		syncStateStore.setOffline();
	}
}
