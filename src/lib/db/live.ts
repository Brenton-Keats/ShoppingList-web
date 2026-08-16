/**
 * Dexie liveQuery integration for Svelte 5.
 *
 * liveQuery() returns an Observable that automatically re-emits
 * whenever the IndexedDB data involved in the query changes.
 * This module wraps it into a pattern usable with Svelte's $effect.
 *
 * Usage in a component or .svelte.ts file:
 *   const stores = useLiveQuery(() => db.stores.toArray(), []);
 *   // stores.current is reactive and auto-updates
 */

import { liveQuery, type Observable } from 'dexie';

/**
 * Subscribe to a Dexie liveQuery and return a reactive value.
 * Call this inside a component script or .svelte.ts module.
 *
 * @param querier - Function that performs the Dexie query
 * @param initialValue - Value to use before the first query result
 * @returns Object with a reactive `current` property
 */
export function useLiveQuery<T>(querier: () => T | Promise<T>, initialValue: T) {
	let value = $state<T>(initialValue);

	if (typeof window === 'undefined') {
		return { get current() { return value; } };
	}

	const observable: Observable<T> = liveQuery(querier);
	const subscription = observable.subscribe({
		next: (result) => { value = result; },
		error: (err) => { console.error('liveQuery error:', err); }
	});

	// Return a reactive getter
	return {
		get current() { return value; },
		unsubscribe: () => subscription.unsubscribe()
	};
}
