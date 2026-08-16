import { db } from '$lib/db/database';
import { updateListItem } from '$lib/db/operations';
import { recordChange } from '$lib/db/changes';
import type { ListItem } from '$lib/types';

const SORT_ORDER_SPACING = 100;

export async function moveItemToGroup(
	itemId: string,
	targetSectionId: string | null,
	targetStoreId: string | null
): Promise<void> {
	const item = await db.listItems.get(itemId);
	if (!item || item.deleted_at !== null) return;

	const updates: Partial<ListItem> = {};
	if (targetSectionId !== undefined && item.section_id !== targetSectionId) {
		updates.section_id = targetSectionId;
	}
	if (targetStoreId !== undefined && item.store_id !== targetStoreId) {
		updates.store_id = targetStoreId;
	}

	if (Object.keys(updates).length === 0) return;

	const targetSection = updates.section_id ?? item.section_id;
	const targetStore = updates.store_id ?? item.store_id;

	const groupItems = await db.listItems
		.where({ list_id: item.list_id })
		.and(
			(i) =>
				i.deleted_at === null &&
				i.id !== itemId &&
				i.section_id === targetSection &&
				i.store_id === targetStore
		)
		.sortBy('sort_order');

	const maxOrder = groupItems.length > 0 ? Math.max(...groupItems.map((i) => i.sort_order)) : 0;
	updates.sort_order = maxOrder + SORT_ORDER_SPACING;

	await updateListItem(itemId, updates);
	await recordChange('ListItem', itemId, 'update', { ...updates });
}
