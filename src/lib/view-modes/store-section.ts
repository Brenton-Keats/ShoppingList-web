import type { ListItem, Product, Section, Store } from '$lib/types';
import type { PrimaryGroup, SecondaryGroup, GroupedItem } from './types';
import { UNASSIGNED_ID, UNASSIGNED_NAME, UNASSIGNED_SORT_ORDER } from './types';

function createProductMap(products: Product[]): Map<string, Product> {
	const map = new Map<string, Product>();
	for (const product of products) {
		map.set(product.id, product);
	}
	return map;
}

function sortBySortOrder<T extends { sort_order: number }>(items: T[]): T[] {
	return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

function createFallbackProduct(item: ListItem): Product {
	return {
		id: item.product_id,
		name: item.name_snapshot,
		default_section_id: null,
		default_store_id: null,
		active: true,
		created_at: item.created_at,
		updated_at: item.updated_at,
		deleted_at: null
	};
}

function sortSecondaryGroups(groups: SecondaryGroup[]): SecondaryGroup[] {
	return [...groups].sort((a, b) => {
		if (a.id === UNASSIGNED_ID && b.id !== UNASSIGNED_ID) return 1;
		if (b.id === UNASSIGNED_ID && a.id !== UNASSIGNED_ID) return -1;
		return a.sort_order - b.sort_order;
	});
}

function sortPrimaryGroups(groups: PrimaryGroup[]): PrimaryGroup[] {
	return [...groups].sort((a, b) => {
		if (a.id === UNASSIGNED_ID && b.id !== UNASSIGNED_ID) return 1;
		if (b.id === UNASSIGNED_ID && a.id !== UNASSIGNED_ID) return -1;
		return a.sort_order - b.sort_order;
	});
}

function sortGroupedItems(items: GroupedItem[]): GroupedItem[] {
	return [...items].sort((a, b) => a.item.sort_order - b.item.sort_order);
}

export async function groupByStoreSection(
	items: ListItem[],
	products: Product[],
	sections: Section[],
	stores: Store[]
): Promise<PrimaryGroup[]> {
	const productMap = createProductMap(products);

	const activeStores = sortBySortOrder(stores.filter((s) => s.active && s.deleted_at === null));

	const storeGroups = new Map<string, ListItem[]>();
	const unassignedStoreItems: ListItem[] = [];

	for (const item of items) {
		if (item.deleted_at !== null) continue;

		if (item.store_id === null) {
			unassignedStoreItems.push(item);
		} else {
			const storeItems = storeGroups.get(item.store_id) ?? [];
			storeItems.push(item);
			storeGroups.set(item.store_id, storeItems);
		}
	}

	const primaryGroups: PrimaryGroup[] = [];

	for (const store of activeStores) {
		const storeItems = storeGroups.get(store.id) ?? [];
		if (storeItems.length === 0) continue;

		const sectionGroups = new Map<string, ListItem[]>();
		const unassignedSectionItems: ListItem[] = [];

		for (const item of storeItems) {
			if (item.section_id === null) {
				unassignedSectionItems.push(item);
			} else {
				const sectionItems = sectionGroups.get(item.section_id) ?? [];
				sectionItems.push(item);
				sectionGroups.set(item.section_id, sectionItems);
			}
		}

		const secondaryGroups: SecondaryGroup[] = [];

		const activeSections = sortBySortOrder(
			sections.filter((s) => s.active && s.deleted_at === null)
		);

		for (const section of activeSections) {
			const sectionItems = sectionGroups.get(section.id) ?? [];
			if (sectionItems.length === 0) continue;

			secondaryGroups.push({
				id: section.id,
				name: section.name,
				sort_order: section.sort_order,
				items: sortGroupedItems(
					sectionItems.map((item) => ({
						item,
						product: productMap.get(item.product_id) ?? createFallbackProduct(item)
					}))
				)
			});
		}

		if (unassignedSectionItems.length > 0) {
			secondaryGroups.push({
				id: UNASSIGNED_ID,
				name: UNASSIGNED_NAME,
				sort_order: UNASSIGNED_SORT_ORDER,
				items: sortGroupedItems(
					unassignedSectionItems.map((item) => ({
						item,
						product: productMap.get(item.product_id) ?? createFallbackProduct(item)
					}))
				)
			});
		}

		primaryGroups.push({
			id: store.id,
			name: store.name,
			sort_order: store.sort_order,
			secondaryGroups: sortSecondaryGroups(secondaryGroups)
		});
	}

	if (unassignedStoreItems.length > 0) {
		const sectionGroups = new Map<string, ListItem[]>();
		const unassignedSectionItems: ListItem[] = [];

		for (const item of unassignedStoreItems) {
			if (item.section_id === null) {
				unassignedSectionItems.push(item);
			} else {
				const sectionItems = sectionGroups.get(item.section_id) ?? [];
				sectionItems.push(item);
				sectionGroups.set(item.section_id, sectionItems);
			}
		}

		const secondaryGroups: SecondaryGroup[] = [];

		const activeSections = sortBySortOrder(
			sections.filter((s) => s.active && s.deleted_at === null)
		);

		for (const section of activeSections) {
			const sectionItems = sectionGroups.get(section.id) ?? [];
			if (sectionItems.length === 0) continue;

			secondaryGroups.push({
				id: section.id,
				name: section.name,
				sort_order: section.sort_order,
				items: sortGroupedItems(
					sectionItems.map((item) => ({
						item,
						product: productMap.get(item.product_id) ?? createFallbackProduct(item)
					}))
				)
			});
		}

		if (unassignedSectionItems.length > 0) {
			secondaryGroups.push({
				id: UNASSIGNED_ID,
				name: UNASSIGNED_NAME,
				sort_order: UNASSIGNED_SORT_ORDER,
				items: sortGroupedItems(
					unassignedSectionItems.map((item) => ({
						item,
						product: productMap.get(item.product_id) ?? createFallbackProduct(item)
					}))
				)
			});
		}

		primaryGroups.push({
			id: UNASSIGNED_ID,
			name: UNASSIGNED_NAME,
			sort_order: UNASSIGNED_SORT_ORDER,
			secondaryGroups: sortSecondaryGroups(secondaryGroups)
		});
	}

	return sortPrimaryGroups(primaryGroups);
}
