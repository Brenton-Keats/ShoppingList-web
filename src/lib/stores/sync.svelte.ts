import type { SyncStatus } from '$lib/types';
import { syncStateStore, type SyncState } from '$lib/sync/state';
import {
	startAutoSync as schedulerStartAutoSync,
	stopAutoSync as schedulerStopAutoSync,
	triggerManualSync,
	setupConnectivityListeners,
	checkSyncNeededOnStartup
} from '$lib/sync/scheduler';
import { getPendingChanges } from '$lib/db/queries';
import { db } from '$lib/db/database';

class SyncStore {
	status = $state<SyncStatus>('synced');
	pendingCount = $state(0);
	lastSync = $state<Date | null>(null);
	error = $state<string | null>(null);
	serverRevision = $state<number | null>(null);

	constructor() {
		this.initializeFromIndexedDB();
		this.setupStateSubscription();

		if (typeof window !== 'undefined') {
			setupConnectivityListeners();
			checkSyncNeededOnStartup();
		}
	}

	private async initializeFromIndexedDB(): Promise<void> {
		const meta = await db.syncMeta.get('main');
		if (meta?.lastSyncTime) {
			this.lastSync = new Date(meta.lastSyncTime);
		}
		if (meta?.lastRevision !== undefined && meta.lastRevision !== null) {
			this.serverRevision = meta.lastRevision;
		}

		const pending = await getPendingChanges();
		this.pendingCount = pending.length;
		this.updateStatusFromState();
	}

	private setupStateSubscription(): void {
		$effect(() => {
			const state = syncStateStore.state;
			this.updateStatusFromSyncState(state);
		});

		$effect(() => {
			this.pendingCount = syncStateStore.pendingCount;
		});

		$effect(() => {
			this.lastSync = syncStateStore.lastSyncTime;
		});

		$effect(() => {
			this.serverRevision = syncStateStore.serverRevision;
		});
	}

	private updateStatusFromSyncState(state: SyncState): void {
		switch (state.status) {
			case 'idle':
				this.status = this.pendingCount > 0 ? 'pending' : 'synced';
				this.error = null;
				break;
			case 'syncing':
				this.status = 'syncing';
				this.error = null;
				break;
			case 'pending':
				this.status = 'pending';
				this.error = null;
				break;
			case 'offline':
				this.status = 'offline';
				this.error = null;
				break;
			case 'error':
				this.status = 'error';
				this.error = state.message;
				break;
		}
	}

	private updateStatusFromState(): void {
		this.updateStatusFromSyncState(syncStateStore.state);
	}

	setStatus(status: SyncStatus) {
		this.status = status;
		if (status === 'synced') {
			this.lastSync = new Date();
			this.error = null;
		}
	}

	setPendingCount(count: number) {
		this.pendingCount = count;
		if (count > 0 && this.status === 'synced') {
			this.status = 'pending';
		} else if (count === 0 && this.status === 'pending') {
			this.status = 'synced';
		}
	}

	setError(error: string) {
		this.error = error;
		this.status = 'error';
	}

	clearError() {
		this.error = null;
		this.status = this.pendingCount > 0 ? 'pending' : 'synced';
	}

	async sync(): Promise<boolean> {
		return triggerManualSync();
	}

	triggerSync(): Promise<boolean> {
		return this.sync();
	}

	startAutoSync(intervalSeconds?: number): void {
		const interval = intervalSeconds ?? 30;
		schedulerStartAutoSync(interval);
	}

	stopAutoSync(): void {
		schedulerStopAutoSync();
	}
}

export const syncStore = new SyncStore();
