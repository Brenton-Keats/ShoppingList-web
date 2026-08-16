import Dexie, { type EntityTable } from 'dexie';
import type {
	Product,
	List,
	Section,
	Store,
	ListItem,
	ChangeRecord,
	LocalPreferences
} from '$lib/types';

interface SyncMeta {
	id: string;
	lastRevision: number | null;
	lastSyncTime: string | null;
}

class ShoppingListDatabase extends Dexie {
	products!: EntityTable<Product, 'id'>;
	lists!: EntityTable<List, 'id'>;
	sections!: EntityTable<Section, 'id'>;
	stores!: EntityTable<Store, 'id'>;
	listItems!: EntityTable<ListItem, 'id'>;
	changes!: EntityTable<ChangeRecord, 'id'>;
	syncMeta!: EntityTable<SyncMeta, 'id'>;
	localPrefs!: EntityTable<LocalPreferences, 'deviceId'>;

	constructor() {
		super('ShoppingListDB');

		this.version(1).stores({
			products: 'id, name',
			lists: 'id, status',
			sections: 'id, list_id',
			stores: 'id, active',
			listItems: 'id, list_id, product_id, section_id, store_id, completed',
			changes: 'id, synced, revision',
			syncMeta: 'id',
			localPrefs: 'deviceId'
		});
	}
}

export const db = new ShoppingListDatabase();
