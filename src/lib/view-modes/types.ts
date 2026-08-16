import type { ViewMode, ListItem, Product } from '$lib/types';

export interface ViewModeConfig {
	id: ViewMode;
	name: string;
	description: string;
}

export const VIEW_MODES: ViewModeConfig[] = [
	{ id: 'STORE_SECTION', name: 'Store → Section', description: 'Group by store, then section' },
	{ id: 'SECTION_STORE', name: 'Section → Store', description: 'Group by section, then store' }
];

export interface GroupedItem {
	item: ListItem;
	product: Product;
}

export interface PrimaryGroup {
	id: string;
	name: string;
	sort_order: number;
	secondaryGroups: SecondaryGroup[];
}

export interface SecondaryGroup {
	id: string | null;
	name: string;
	sort_order: number;
	items: GroupedItem[];
}

export const UNASSIGNED_ID = '__unassigned__';
export const UNASSIGNED_NAME = 'Unassigned';
export const UNASSIGNED_SORT_ORDER = Infinity;
