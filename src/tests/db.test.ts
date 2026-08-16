import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '$lib/db/database';
import { recordChange, markChangesSynced } from '$lib/db/changes';
import { getPendingChanges } from '$lib/db/queries';

describe('IndexedDB operations', () => {
	beforeEach(async () => {
		// Clear all tables before each test
		await db.changes.clear();
		await db.lists.clear();
		await db.sections.clear();
		await db.stores.clear();
		await db.products.clear();
		await db.listItems.clear();
		await db.syncMeta.clear();
	});

	describe('recordChange', () => {
		it('creates a change record with correct fields', async () => {
			const change = await recordChange('Store', 'store-1', 'create', {
				id: 'store-1',
				name: 'Coles',
				active: true
			});

			expect(change.id).toBeDefined();
			expect(change.entity_type).toBe('Store');
			expect(change.entity_id).toBe('store-1');
			expect(change.operation).toBe('create');
			expect(change.synced).toBe(false);
			expect(change.revision).toBeNull();
			expect(change.payload).toEqual({ id: 'store-1', name: 'Coles', active: true });
		});

		it('stores the change in IndexedDB', async () => {
			await recordChange('Product', 'prod-1', 'create', { name: 'Milk' });

			const allChanges = await db.changes.toArray();
			expect(allChanges).toHaveLength(1);
			expect(allChanges[0].entity_type).toBe('Product');
		});
	});

	describe('getPendingChanges', () => {
		it('returns only unsynced changes', async () => {
			await recordChange('Store', 'store-1', 'create', { name: 'Coles' });
			await recordChange('Store', 'store-2', 'create', { name: 'Woolworths' });

			const pending = await getPendingChanges();
			expect(pending).toHaveLength(2);
		});

		it('excludes synced changes', async () => {
			const change = await recordChange('Store', 'store-1', 'create', { name: 'Coles' });
			await markChangesSynced([change.id], 1);

			const pending = await getPendingChanges();
			expect(pending).toHaveLength(0);
		});

		it('handles boolean false correctly (not numeric 0)', async () => {
			// This was a real bug: querying .where('synced').equals(0) missed boolean false
			await recordChange('Store', 'store-1', 'create', { name: 'Test' });

			const raw = await db.changes.toArray();
			expect(raw[0].synced).toBe(false);
			expect(typeof raw[0].synced).toBe('boolean');

			const pending = await getPendingChanges();
			expect(pending).toHaveLength(1);
		});
	});

	describe('markChangesSynced', () => {
		it('marks changes as synced with revision', async () => {
			const c1 = await recordChange('Store', 's1', 'create', { name: 'A' });
			const c2 = await recordChange('Store', 's2', 'create', { name: 'B' });

			await markChangesSynced([c1.id, c2.id], 5);

			const c1After = await db.changes.get(c1.id);
			const c2After = await db.changes.get(c2.id);

			expect(c1After?.synced).toBe(true);
			expect(c1After?.revision).toBe(5);
			expect(c2After?.synced).toBe(true);
			expect(c2After?.revision).toBe(5);
		});
	});

	describe('bulkPut with server data', () => {
		it('handles sanitized server data correctly', async () => {
			// Simulate data from the server (already JSON-parsed)
			const serverStores = [
				{ id: 'store-1', name: 'Coles', sort_order: 0, active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', deleted_at: null },
				{ id: 'store-2', name: 'Woolworths', sort_order: 1, active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', deleted_at: null }
			];

			// Sanitize like the sync engine does
			const sanitized = JSON.parse(JSON.stringify(serverStores.filter((item: any) => item && item.id)));

			await db.stores.bulkPut(sanitized);

			const stored = await db.stores.toArray();
			expect(stored).toHaveLength(2);
			expect(stored[0].name).toBe('Coles');
			expect(stored[1].name).toBe('Woolworths');
		});

		it('filters out items without id', async () => {
			const serverData = [
				{ id: 'valid-1', name: 'Good' },
				{ id: '', name: 'Empty ID' },
				{ name: 'No ID at all' },
				null
			];

			const sanitized = JSON.parse(JSON.stringify(serverData.filter((item: any) => item && item.id)));
			expect(sanitized).toHaveLength(1);
			expect(sanitized[0].id).toBe('valid-1');
		});

		it('strips non-cloneable values via JSON round-trip', async () => {
			const dataWithBadValues = [
				{
					id: 'test-1',
					name: 'Test',
					active: true,
					created_at: '2026-01-01T00:00:00Z',
					updated_at: '2026-01-01T00:00:00Z',
					deleted_at: null,
					sort_order: 0
				}
			];

			// Add a non-serializable value that might come from Google Sheets
			(dataWithBadValues[0] as any).badDate = new Date();
			(dataWithBadValues[0] as any).undefinedVal = undefined;

			const sanitized = JSON.parse(JSON.stringify(dataWithBadValues.filter((item: any) => item && item.id)));

			// undefined is stripped, Date becomes string
			expect(sanitized[0].undefinedVal).toBeUndefined();
			expect(typeof sanitized[0].badDate).toBe('string');

			// Should not throw DataCloneError
			await db.stores.bulkPut(sanitized);
			const stored = await db.stores.toArray();
			expect(stored).toHaveLength(1);
		});
	});
});
