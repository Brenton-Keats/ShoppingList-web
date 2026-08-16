import type { ViewMode, ListItem, Product, Section, Store } from '$lib/types';
import type { PrimaryGroup, GroupedItem } from '$lib/view-modes/types';
import { groupByStoreSection } from '$lib/view-modes/store-section';
import { groupBySectionStore } from '$lib/view-modes/section-store';

export interface ShoppingState {
	currentGroup: PrimaryGroup | null;
	nextGroup: PrimaryGroup | null;
	currentItem: ListItem | null;
	remainingItems: number;
	totalItems: number;
	completedItems: number;
}

async function groupItems(
	viewMode: ViewMode,
	items: ListItem[],
	products: Product[],
	sections: Section[],
	stores: Store[]
): Promise<PrimaryGroup[]> {
	switch (viewMode) {
		case 'STORE_SECTION':
			return groupByStoreSection(items, products, sections, stores);
		case 'SECTION_STORE':
			return groupBySectionStore(items, products, sections, stores);
		default:
			const _exhaustive: never = viewMode;
			throw new Error(`Unknown view mode: ${_exhaustive}`);
	}
}

function getIncompleteItems(group: PrimaryGroup): GroupedItem[] {
	const incomplete: GroupedItem[] = [];
	for (const secondary of group.secondaryGroups) {
		for (const groupedItem of secondary.items) {
			if (!groupedItem.item.completed) {
				incomplete.push(groupedItem);
			}
		}
	}
	return incomplete;
}

function getFirstIncompleteItem(group: PrimaryGroup): ListItem | null {
	for (const secondary of group.secondaryGroups) {
		for (const groupedItem of secondary.items) {
			if (!groupedItem.item.completed) {
				return groupedItem.item;
			}
		}
	}
	return null;
}

export async function calculateShoppingState(
	items: ListItem[],
	products: Product[],
	sections: Section[],
	stores: Store[],
	viewMode: ViewMode
): Promise<ShoppingState> {
	const activeItems = items.filter((i) => i.deleted_at === null);
	const totalItems = activeItems.length;
	const completedItems = activeItems.filter((i) => i.completed).length;
	const remainingItems = totalItems - completedItems;

	if (totalItems === 0) {
		return {
			currentGroup: null,
			nextGroup: null,
			currentItem: null,
			remainingItems: 0,
			totalItems: 0,
			completedItems: 0
		};
	}

	const groups = await groupItems(viewMode, activeItems, products, sections, stores);

	let currentGroup: PrimaryGroup | null = null;
	let nextGroup: PrimaryGroup | null = null;
	let foundCurrent = false;

	for (const group of groups) {
		const hasIncomplete = getIncompleteItems(group).length > 0;
		if (hasIncomplete) {
			if (!foundCurrent) {
				currentGroup = group;
				foundCurrent = true;
			} else if (currentGroup !== null && nextGroup === null) {
				nextGroup = group;
				break;
			}
		}
	}

	const currentItem = currentGroup ? getFirstIncompleteItem(currentGroup) : null;

	return {
		currentGroup,
		nextGroup,
		currentItem,
		remainingItems,
		totalItems,
		completedItems
	};
}
