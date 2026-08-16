import { db } from './database';
import { serialize } from './serialize';
import { getOrCreateDeviceId } from '$lib/utils/id';
import { generateUUID, now } from './utils';
import type { ChangeRecord } from '$lib/types';

export async function recordChange(
	entityType: ChangeRecord['entity_type'],
	entityId: string,
	operation: ChangeRecord['operation'],
	payload: Record<string, unknown>
): Promise<ChangeRecord> {
	const deviceId = getOrCreateDeviceId();

	const change: ChangeRecord = {
		id: generateUUID(),
		revision: null,
		timestamp: now(),
		device_id: deviceId,
		entity_type: entityType,
		entity_id: entityId,
		operation,
		payload: serialize(payload),
		synced: false
	};

	await db.changes.add(change);
	return change;
}

export async function markChangesSynced(changeIds: string[], revision: number): Promise<void> {
	await db.changes.bulkUpdate(
		changeIds.map((id) => ({
			key: id,
			changes: {
				synced: true,
				revision
			}
		}))
	);
}

export async function removeSyncedChanges(): Promise<number> {
	const syncedChanges = await db.changes.where('synced').equals(1).toArray();
	const ids = syncedChanges.map((c) => c.id);
	await db.changes.bulkDelete(ids);
	return ids.length;
}
