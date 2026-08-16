import { db } from '$lib/db/database';
import { getEntityById, softDeleteEntity } from '$lib/db/operations';
import { markChangesSynced } from '$lib/db/changes';
import { getPendingChanges } from '$lib/db/queries';
import { getOrCreateDeviceId } from '$lib/utils/id';
import { fetchServerData, submitChanges } from './api';
import { syncStateStore } from './state.svelte';
import { resolveConflict, type ServerChange } from './conflict';
import type { BaseEntity } from '$lib/types';

const ENTITY_TABLE_MAP: Record<string, string> = {
	List: 'lists',
	Section: 'sections',
	Store: 'stores',
	Product: 'products',
	ListItem: 'listItems'
};

async function getSyncMeta(): Promise<{ lastRevision: number | null; deviceId: string }> {
	const meta = await db.syncMeta.get('main');
	return {
		lastRevision: meta?.lastRevision ?? null,
		deviceId: getOrCreateDeviceId()
	};
}

async function updateSyncMeta(lastRevision: number, lastSyncTime: string): Promise<void> {
	await db.syncMeta.put({
		id: 'main',
		lastRevision,
		lastSyncTime
	});
}

function mapEntityTypeToTable(entityType: string): string | undefined {
	return ENTITY_TABLE_MAP[entityType];
}

export async function applyServerChanges(serverChanges: ServerChange[]): Promise<void> {
	const sorted = [...serverChanges].sort((a, b) => a.revision - b.revision);

	for (const change of sorted) {
		const table = mapEntityTypeToTable(change.entityType);
		if (!table) {
			console.warn(`Unknown entity type: ${change.entityType}`);
			continue;
		}

		const localEntity = await getEntityById<BaseEntity>(table, change.entityId);

		if (change.operation === 'delete') {
			if (localEntity) {
				await softDeleteEntity(table, change.entityId);
			}
			continue;
		}

		if (change.operation === 'create') {
			if (localEntity) {
				const winner = resolveConflict(localEntity, {
					timestamp: change.timestamp,
					data: change.data
				});
				if (winner === 'server') {
					await db.table(table).put({ ...change.data, id: change.entityId } as BaseEntity);
				}
			} else {
				await db.table(table).add({ ...change.data, id: change.entityId } as BaseEntity);
			}
			continue;
		}

		if (change.operation === 'update') {
			if (localEntity) {
				const winner = resolveConflict(localEntity, {
					timestamp: change.timestamp,
					data: change.data
				});
				if (winner === 'server') {
					await db.table(table).update(change.entityId, change.data as Record<string, unknown>);
				}
			} else {
				await db.table(table).add({ ...change.data, id: change.entityId } as BaseEntity);
			}
			continue;
		}

		console.warn(`Unknown operation: ${change.operation}`);
	}
}

export async function performSync(): Promise<boolean> {
	syncStateStore.setSyncing();

	try {
		const { lastRevision, deviceId } = await getSyncMeta();
		const pendingChanges = await getPendingChanges();

		if (!navigator.onLine) {
			syncStateStore.setOffline();
			return false;
		}

		const changesPayload = pendingChanges.map((change) => ({
			id: change.id,
			entityType: change.entity_type,
			entityId: change.entity_id,
			operation: change.operation,
			data: change.payload
		}));

		const baseRevision = lastRevision ?? 0;

		const response = await submitChanges({
			deviceId,
			baseRevision,
			changes: changesPayload
		});

		if (!response.success) {
			syncStateStore.setError('Server rejected sync request');
			return false;
		}

		if (response.changes.length > 0) {
			await applyServerChanges(response.changes);
		}

		if (response.acceptedChanges.length > 0) {
			await markChangesSynced(response.acceptedChanges, response.serverRevision);
		}

		const now = new Date().toISOString();
		await updateSyncMeta(response.serverRevision, now);

		syncStateStore.setLastSyncTime(new Date(now));
		syncStateStore.setServerRevision(response.serverRevision);
		await syncStateStore.refreshPendingCount();
		syncStateStore.setIdle();

		return true;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		syncStateStore.setError(message);
		return false;
	}
}

export async function fetchInitialData(): Promise<boolean> {
	syncStateStore.setSyncing();

	try {
		if (!navigator.onLine) {
			syncStateStore.setOffline();
			return false;
		}

		const data = await fetchServerData();

		await db.transaction(
			'rw',
			[db.lists, db.sections, db.stores, db.products, db.listItems, db.syncMeta],
			async () => {
				await db.lists.clear();
				await db.sections.clear();
				await db.stores.clear();
				await db.products.clear();
				await db.listItems.clear();

				if (data.lists.length > 0) await db.lists.bulkAdd(data.lists);
				if (data.sections.length > 0) await db.sections.bulkAdd(data.sections);
				if (data.stores.length > 0) await db.stores.bulkAdd(data.stores);
				if (data.products.length > 0) await db.products.bulkAdd(data.products);
				if (data.listItems.length > 0) await db.listItems.bulkAdd(data.listItems);

				const now = new Date().toISOString();
				await db.syncMeta.put({
					id: 'main',
					lastRevision: data.serverRevision,
					lastSyncTime: now
				});
			}
		);

		const now = new Date().toISOString();
		syncStateStore.setLastSyncTime(new Date(now));
		syncStateStore.setServerRevision(data.serverRevision);
		await syncStateStore.refreshPendingCount();
		syncStateStore.setIdle();

		return true;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		syncStateStore.setError(message);
		return false;
	}
}
