import { v4 as uuidv4 } from 'uuid';
import type { BaseEntity } from '$lib/types';

export function generateUUID(): string {
	return uuidv4();
}

export function now(): string {
	return new Date().toISOString();
}

export function isSoftDeleted<T extends BaseEntity>(entity: T): boolean {
	return entity.deleted_at !== null;
}
