import type { UpdateSpec } from 'dexie';
import { db } from './database';
import { recordChange } from './changes';
import { generateUUID, now, isSoftDeleted } from './utils';
import type {
	BaseEntity,
	Product,
	List,
	Section,
	Store,
	ListItem
} from '$lib/types';

export async function createEntity<T extends BaseEntity>(
	table: string,
	entity: Omit<T, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<T> {
	const timestamp = now();
	const newEntity = {
		...entity,
		id: generateUUID(),
		created_at: timestamp,
		updated_at: timestamp,
		deleted_at: null
	} as T;

	await db.table<T>(table).add(newEntity);
	return newEntity;
}

export async function updateEntity<T extends BaseEntity>(
	table: string,
	id: string,
	updates: Partial<T>
): Promise<T> {
	const timestamp = now();
	const changes = { ...updates, updated_at: timestamp } as Partial<T>;

	await db.table<T>(table).update(id, changes as unknown as UpdateSpec<T>);

	const updated = await getEntityById<T>(table, id);
	if (!updated) {
		throw new Error(`Entity not found in table "${table}" with id "${id}"`);
	}
	return updated;
}

export async function softDeleteEntity<T extends BaseEntity>(
	table: string,
	id: string
): Promise<T> {
	const timestamp = now();

	await db.table<T>(table).update(id, { deleted_at: timestamp } as unknown as UpdateSpec<T>);

	const deleted = await getEntityById<T>(table, id);
	if (!deleted) {
		throw new Error(`Entity not found in table "${table}" with id "${id}"`);
	}
	return deleted;
}

export async function getEntityById<T>(table: string, id: string): Promise<T | undefined> {
	return db.table<T>(table).get(id);
}

export async function getAllEntities<T extends BaseEntity>(table: string): Promise<T[]> {
	return db.table<T>(table).toArray();
}

export async function getActiveEntities<T extends BaseEntity>(table: string): Promise<T[]> {
	const all = await getAllEntities<T>(table);
	return all.filter((e) => !isSoftDeleted(e));
}

export async function createProduct(
	data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<Product> {
	const product = await createEntity<Product>('products', data);
	await recordChange('Product', product.id, 'create', { ...data });
	return product;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
	const product = await updateEntity<Product>('products', id, updates);
	await recordChange('Product', id, 'update', { ...updates });
	return product;
}

export async function softDeleteProduct(id: string): Promise<Product> {
	const product = await softDeleteEntity<Product>('products', id);
	await recordChange('Product', id, 'delete', {});
	return product;
}

export async function createList(
	data: Omit<List, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<List> {
	const list = await createEntity<List>('lists', data);
	await recordChange('List', list.id, 'create', { ...data });
	return list;
}

export async function updateList(id: string, updates: Partial<List>): Promise<List> {
	const list = await updateEntity<List>('lists', id, updates);
	await recordChange('List', id, 'update', { ...updates });
	return list;
}

export async function softDeleteList(id: string): Promise<List> {
	const list = await softDeleteEntity<List>('lists', id);
	await recordChange('List', id, 'delete', {});
	return list;
}

export async function createSection(
	data: Omit<Section, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<Section> {
	const section = await createEntity<Section>('sections', data);
	await recordChange('Section', section.id, 'create', { ...data });
	return section;
}

export async function updateSection(id: string, updates: Partial<Section>): Promise<Section> {
	const section = await updateEntity<Section>('sections', id, updates);
	await recordChange('Section', id, 'update', { ...updates });
	return section;
}

export async function softDeleteSection(id: string): Promise<Section> {
	const section = await softDeleteEntity<Section>('sections', id);
	await recordChange('Section', id, 'delete', {});
	return section;
}

export async function createStore(
	data: Omit<Store, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<Store> {
	const store = await createEntity<Store>('stores', data);
	await recordChange('Store', store.id, 'create', { ...data });
	return store;
}

export async function updateStore(id: string, updates: Partial<Store>): Promise<Store> {
	const store = await updateEntity<Store>('stores', id, updates);
	await recordChange('Store', id, 'update', { ...updates });
	return store;
}

export async function softDeleteStore(id: string): Promise<Store> {
	const store = await softDeleteEntity<Store>('stores', id);
	await recordChange('Store', id, 'delete', {});
	return store;
}

export async function createListItem(
	data: Omit<ListItem, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<ListItem> {
	const item = await createEntity<ListItem>('listItems', data);
	await recordChange('ListItem', item.id, 'create', { ...data });
	return item;
}

export async function updateListItem(id: string, updates: Partial<ListItem>): Promise<ListItem> {
	const item = await updateEntity<ListItem>('listItems', id, updates);
	await recordChange('ListItem', id, 'update', { ...updates });
	return item;
}

export async function softDeleteListItem(id: string): Promise<ListItem> {
	const item = await softDeleteEntity<ListItem>('listItems', id);
	await recordChange('ListItem', id, 'delete', {});
	return item;
}
