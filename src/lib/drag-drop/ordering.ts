import { updateEntity, getActiveEntities } from '$lib/db/operations';
import { recordChange } from '$lib/db/changes';
import type { ListItem, Section, Store } from '$lib/types';

const SORT_ORDER_SPACING = 100;

export async function reorderStores(storeId: string, newIndex: number): Promise<void> {
	const stores = (await getActiveEntities<Store>('stores')).sort((a, b) => a.sort_order - b.sort_order);
	const oldIndex = stores.findIndex((s) => s.id === storeId);
	if (oldIndex === -1) return;

	const reordered = [...stores];
	const [moved] = reordered.splice(oldIndex, 1);
	reordered.splice(newIndex, 0, moved);

	await reassignSortOrders('stores', reordered);
}

export async function reorderSections(sectionId: string, newIndex: number, listId: string): Promise<void> {
	const allSections = await getActiveEntities<Section>('sections');
	const sections = allSections
		.filter((s) => s.list_id === listId)
		.sort((a, b) => a.sort_order - b.sort_order);

	const oldIndex = sections.findIndex((s) => s.id === sectionId);
	if (oldIndex === -1) return;

	const reordered = [...sections];
	const [moved] = reordered.splice(oldIndex, 1);
	reordered.splice(newIndex, 0, moved);

	await reassignSortOrders('sections', reordered);
}

export async function reorderItems(itemId: string, newIndex: number, groupKey: string): Promise<void> {
	const [primaryType, primaryId, , secondaryId] = groupKey.split(':');
	if (!primaryType || !primaryId) return;

	const allItems = await getActiveEntities<ListItem>('listItems');
	const listId = allItems.find((i) => i.id === itemId)?.list_id;
	if (!listId) return;

	let groupItems: ListItem[];
	if (secondaryId && secondaryId !== 'null') {
		if (primaryType === 'STORE_SECTION') {
			groupItems = allItems.filter(
				(i) =>
					i.list_id === listId &&
					i.store_id === primaryId &&
					i.section_id === secondaryId &&
					i.deleted_at === null
			);
		} else {
			groupItems = allItems.filter(
				(i) =>
					i.list_id === listId &&
					i.section_id === primaryId &&
					i.store_id === secondaryId &&
					i.deleted_at === null
			);
		}
	} else {
		if (primaryType === 'STORE_SECTION') {
			groupItems = allItems.filter(
				(i) =>
					i.list_id === listId &&
					i.store_id === primaryId &&
					(i.section_id === null || i.section_id === secondaryId) &&
					i.deleted_at === null
			);
		} else {
			groupItems = allItems.filter(
				(i) =>
					i.list_id === listId &&
					i.section_id === primaryId &&
					(i.store_id === null || i.store_id === secondaryId) &&
					i.deleted_at === null
			);
		}
	}

	groupItems.sort((a, b) => a.sort_order - b.sort_order);

	const oldIndex = groupItems.findIndex((i) => i.id === itemId);
	if (oldIndex === -1) return;

	const reordered = [...groupItems];
	const [moved] = reordered.splice(oldIndex, 1);
	reordered.splice(newIndex, 0, moved);

	await reassignSortOrders('listItems', reordered);
}

async function reassignSortOrders<T extends { id: string; sort_order: number }>(
	table: string,
	items: T[]
): Promise<void> {
	for (let i = 0; i < items.length; i++) {
		const newOrder = (i + 1) * SORT_ORDER_SPACING;
		if (items[i].sort_order !== newOrder) {
			await updateEntity(table, items[i].id, { sort_order: newOrder } as Partial<T>);
			await recordChange(
				table === 'listItems' ? 'ListItem' : table === 'sections' ? 'Section' : 'Store',
				items[i].id,
				'update',
				{ sort_order: newOrder }
			);
		}
	}
}
