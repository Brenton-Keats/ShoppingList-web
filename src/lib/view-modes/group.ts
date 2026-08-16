import type { ViewMode, ListItem, Section, Store } from '$lib/types';

export interface GroupedItems {
	primaryId: string;
	primaryName: string;
	secondaryGroups: {
		secondaryId: string;
		secondaryName: string;
		items: ListItem[];
	}[];
}

export function groupItemsByViewMode(
	items: ListItem[],
	viewMode: ViewMode,
	sections: Section[],
	stores: Store[]
): GroupedItems[] {
	const sectionMap = new Map(sections.map((s) => [s.id, s]));
	const storeMap = new Map(stores.map((s) => [s.id, s]));

	if (viewMode === 'SECTION_STORE') {
		const bySection = new Map<string, ListItem[]>();
		for (const item of items) {
			const sectionId = item.section_id ?? 'none';
			const list = bySection.get(sectionId) ?? [];
			list.push(item);
			bySection.set(sectionId, list);
		}

		const sortedSections = [...bySection.keys()].sort((a, b) => {
			const sa = sectionMap.get(a);
			const sb = sectionMap.get(b);
			if (!sa && !sb) return 0;
			if (!sa) return 1;
			if (!sb) return -1;
			return sa.sort_order - sb.sort_order;
		});

		return sortedSections.map((sectionId) => {
			const section = sectionMap.get(sectionId);
			const sectionItems = bySection.get(sectionId) ?? [];

			const byStore = new Map<string, ListItem[]>();
			for (const item of sectionItems) {
				const storeId = item.store_id ?? 'none';
				const list = byStore.get(storeId) ?? [];
				list.push(item);
				byStore.set(storeId, list);
			}

			const sortedStores = [...byStore.keys()].sort((a, b) => {
				const sa = storeMap.get(a);
				const sb = storeMap.get(b);
				if (!sa && !sb) return 0;
				if (!sa) return 1;
				if (!sb) return -1;
				return sa.sort_order - sb.sort_order;
			});

			return {
				primaryId: sectionId,
				primaryName: section?.name ?? 'Uncategorized',
				secondaryGroups: sortedStores.map((storeId) => ({
					secondaryId: storeId,
					secondaryName: storeMap.get(storeId)?.name ?? 'Any Store',
					items: byStore.get(storeId) ?? []
				}))
			};
		});
	} else {
		const byStore = new Map<string, ListItem[]>();
		for (const item of items) {
			const storeId = item.store_id ?? 'none';
			const list = byStore.get(storeId) ?? [];
			list.push(item);
			byStore.set(storeId, list);
		}

		const sortedStores = [...byStore.keys()].sort((a, b) => {
			const sa = storeMap.get(a);
			const sb = storeMap.get(b);
			if (!sa && !sb) return 0;
			if (!sa) return 1;
			if (!sb) return -1;
			return sa.sort_order - sb.sort_order;
		});

		return sortedStores.map((storeId) => {
			const store = storeMap.get(storeId);
			const storeItems = byStore.get(storeId) ?? [];

			const bySection = new Map<string, ListItem[]>();
			for (const item of storeItems) {
				const sectionId = item.section_id ?? 'none';
				const list = bySection.get(sectionId) ?? [];
				list.push(item);
				bySection.set(sectionId, list);
			}

			const sortedSections = [...bySection.keys()].sort((a, b) => {
				const sa = sectionMap.get(a);
				const sb = sectionMap.get(b);
				if (!sa && !sb) return 0;
				if (!sa) return 1;
				if (!sb) return -1;
				return sa.sort_order - sb.sort_order;
			});

			return {
				primaryId: storeId,
				primaryName: store?.name ?? 'Any Store',
				secondaryGroups: sortedSections.map((sectionId) => ({
					secondaryId: sectionId,
					secondaryName: sectionMap.get(sectionId)?.name ?? 'Uncategorized',
					items: bySection.get(sectionId) ?? []
				}))
			};
		});
	}
}
