import type { ViewMode, ListItem, Product, Section, Store } from '$lib/types';
import type { PrimaryGroup } from './types';
import { groupByStoreSection } from './store-section';
import { groupBySectionStore } from './section-store';

export async function projectItems(
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
