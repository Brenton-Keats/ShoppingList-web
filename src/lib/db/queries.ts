import { db } from './database';
import type { List, Section, ListItem, ChangeRecord, Product, LocalPreferences } from '$lib/types';
import { APP_CONFIG } from '$lib/config';

export async function getActiveList(): Promise<List | undefined> {
	return db.lists.where('status').equals('ACTIVE').and((l) => !l.deleted_at).first();
}

export async function getSectionsByList(listId: string): Promise<Section[]> {
	return db.sections.where('list_id').equals(listId).and((s) => !s.deleted_at).sortBy('sort_order');
}

export async function getItemsByList(listId: string): Promise<ListItem[]> {
	return db.listItems.where('list_id').equals(listId).and((i) => !i.deleted_at).sortBy('sort_order');
}

export async function getItemsBySection(listId: string, sectionId: string): Promise<ListItem[]> {
	return db.listItems
		.where({ list_id: listId, section_id: sectionId })
		.and((i) => !i.deleted_at)
		.sortBy('sort_order');
}

export async function getItemsByStore(listId: string, storeId: string): Promise<ListItem[]> {
	return db.listItems
		.where({ list_id: listId, store_id: storeId })
		.and((i) => !i.deleted_at)
		.sortBy('sort_order');
}

export async function getPendingChanges(): Promise<ChangeRecord[]> {
	return db.changes.filter((c) => c.synced === false).toArray();
}

export async function getProductsForSearch(query: string): Promise<Product[]> {
	const lowerQuery = query.toLowerCase().trim();
	if (!lowerQuery) return [];

	return db.products
		.filter((p) => !p.deleted_at && p.name.toLowerCase().includes(lowerQuery))
		.sortBy('name');
}

export async function getHistoricalLists(limit?: number): Promise<List[]> {
	const lists = await db.lists
		.where('status')
		.anyOf(['ARCHIVED', 'DRAFT'])
		.and((l) => !l.deleted_at)
		.reverse()
		.sortBy('updated_at');

	return limit ? lists.slice(0, limit) : lists;
}

export async function getLocalPreferences(): Promise<LocalPreferences> {
	const prefs = await db.localPrefs.toArray();
	if (prefs.length > 0) {
		return prefs[0];
	}

	return {
		viewMode: APP_CONFIG.DEFAULT_VIEW_MODE,
		collapsedGroups: {},
		syncMode: APP_CONFIG.DEFAULT_SYNC_MODE,
		syncInterval: APP_CONFIG.DEFAULT_SYNC_INTERVAL,
		deviceId: '',
		theme: 'auto' as const
	};
}

export async function saveLocalPreferences(prefs: Partial<LocalPreferences>): Promise<void> {
	const { serialize } = await import('./serialize');
	const cleanPrefs = serialize(prefs);
	const existing = await db.localPrefs.toArray();
	if (existing.length > 0) {
		await db.localPrefs.update(existing[0].deviceId, cleanPrefs);
	} else {
		await db.localPrefs.add({
			viewMode: APP_CONFIG.DEFAULT_VIEW_MODE,
			collapsedGroups: {},
			syncMode: APP_CONFIG.DEFAULT_SYNC_MODE,
			syncInterval: APP_CONFIG.DEFAULT_SYNC_INTERVAL,
			deviceId: crypto.randomUUID(),
			theme: 'auto',
			...cleanPrefs
		});
	}
}
