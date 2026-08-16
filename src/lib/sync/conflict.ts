import type { BaseEntity } from '$lib/types';

export interface ServerChange {
	revision: number;
	entityType: string;
	entityId: string;
	operation: string;
	data: Record<string, unknown>;
	timestamp: string;
}

export function resolveConflict(
	localEntity: BaseEntity,
	serverChange: { timestamp: string; data: Record<string, unknown> }
): 'local' | 'server' {
	// Tombstones (deleted_at) always win over updates
	const serverHasTombstone = serverChange.data.deleted_at !== undefined && serverChange.data.deleted_at !== null;
	const localIsDeleted = localEntity.deleted_at !== null;

	if (serverHasTombstone && !localIsDeleted) {
		return 'server';
	}

	if (localIsDeleted && !serverHasTombstone) {
		return 'local';
	}

	// Compare updated_at timestamps
	const localUpdatedAt = new Date(localEntity.updated_at).getTime();
	const serverUpdatedAt = new Date(serverChange.timestamp).getTime();

	if (serverUpdatedAt > localUpdatedAt) {
		return 'server';
	}

	if (localUpdatedAt > serverUpdatedAt) {
		return 'local';
	}

	// If timestamps are equal, server wins (deterministic)
	return 'server';
}
