/**
 * Serialization boundary for IndexedDB writes.
 *
 * Svelte 5's $state wraps objects in Proxy objects with internal symbols
 * that IndexedDB's structured clone algorithm cannot handle. This module
 * provides a single point of serialization that strips reactive proxies
 * before any data touches IndexedDB.
 *
 * Call serialize() on any data going INTO the database.
 * Data coming OUT of the database is already plain objects.
 */

/**
 * Strip reactive proxies and non-cloneable values from an object.
 * Uses JSON round-trip which handles: Proxy symbols, undefined, functions,
 * circular references (throws), Date → string, etc.
 */
export function serialize<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Serialize an array, also filtering out items without an `id` field.
 * Use for bulk server data that may contain empty rows.
 */
export function serializeArray<T extends { id?: string | null }>(items: T[]): T[] {
	return JSON.parse(JSON.stringify(items.filter((item) => item && item.id)));
}
