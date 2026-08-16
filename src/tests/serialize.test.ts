import { describe, it, expect } from 'vitest';
import { serialize, serializeArray } from '$lib/db/serialize';

describe('serialize', () => {
	it('passes through plain objects unchanged', () => {
		const input = { id: '1', name: 'Test', active: true };
		expect(serialize(input)).toEqual(input);
	});

	it('strips undefined values', () => {
		const input = { id: '1', name: 'Test', extra: undefined };
		const result = serialize(input);
		expect(result).toEqual({ id: '1', name: 'Test' });
		expect('extra' in result).toBe(false);
	});

	it('converts Date objects to strings', () => {
		const date = new Date('2026-08-16T00:00:00Z');
		const input = { id: '1', created_at: date };
		const result = serialize(input);
		expect(typeof result.created_at).toBe('string');
		expect(result.created_at).toBe('2026-08-16T00:00:00.000Z');
	});

	it('strips functions', () => {
		const input = { id: '1', name: 'Test', callback: () => {} };
		const result = serialize(input);
		expect(result).toEqual({ id: '1', name: 'Test' });
	});

	it('handles nested objects', () => {
		const input = { id: '1', meta: { count: 5, tags: ['a', 'b'] } };
		expect(serialize(input)).toEqual(input);
	});

	it('handles null values', () => {
		const input = { id: '1', deleted_at: null };
		expect(serialize(input)).toEqual({ id: '1', deleted_at: null });
	});

	it('produces a new object reference (deep copy)', () => {
		const input = { id: '1', nested: { a: 1 } };
		const result = serialize(input);
		expect(result).not.toBe(input);
		expect(result.nested).not.toBe(input.nested);
	});
});

describe('serializeArray', () => {
	it('passes through valid arrays', () => {
		const input = [
			{ id: 'a', name: 'First' },
			{ id: 'b', name: 'Second' }
		];
		expect(serializeArray(input)).toEqual(input);
	});

	it('filters out items without id', () => {
		const input = [
			{ id: 'a', name: 'Good' },
			{ id: '', name: 'Empty ID' },
			{ name: 'No ID field' } as any
		];
		const result = serializeArray(input);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('a');
	});

	it('filters out null items', () => {
		const input = [
			{ id: 'a', name: 'Good' },
			null as any,
			undefined as any
		];
		const result = serializeArray(input);
		expect(result).toHaveLength(1);
	});

	it('strips non-cloneable values from items', () => {
		const input = [
			{ id: 'a', name: 'Test', fn: () => {}, undef: undefined }
		];
		const result = serializeArray(input);
		expect(result[0]).toEqual({ id: 'a', name: 'Test' });
	});

	it('returns empty array for empty input', () => {
		expect(serializeArray([])).toEqual([]);
	});
});

describe('serialize - negative cases', () => {
	it('throws on circular references', () => {
		const obj: any = { id: '1' };
		obj.self = obj;
		expect(() => serialize(obj)).toThrow();
	});

	it('does not preserve symbol-keyed properties (Svelte proxy internals)', () => {
		const sym = Symbol('reactive');
		const input = { id: '1', name: 'Test', [sym]: true };
		const result = serialize(input);
		expect(Object.getOwnPropertySymbols(result)).toHaveLength(0);
		expect(result).toEqual({ id: '1', name: 'Test' });
	});

	it('does not preserve class instances', () => {
		class Custom { id = '1'; value = 42; method() { return this.value; } }
		const input = new Custom();
		const result = serialize(input);
		expect(result).toEqual({ id: '1', value: 42 });
		expect(result).not.toBeInstanceOf(Custom);
	});

	it('converts NaN to null', () => {
		const input = { id: '1', count: NaN };
		const result = serialize(input);
		expect(result.count).toBeNull();
	});

	it('converts Infinity to null', () => {
		const input = { id: '1', score: Infinity };
		const result = serialize(input);
		expect(result.score).toBeNull();
	});
});

describe('serializeArray - negative cases', () => {
	it('handles array with all invalid items', () => {
		const input = [null, undefined, { name: 'no id' }] as any[];
		expect(serializeArray(input)).toEqual([]);
	});

	it('does not include items where id is null', () => {
		const input = [{ id: null, name: 'Bad' }, { id: 'good', name: 'Good' }];
		const result = serializeArray(input);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('good');
	});

	it('handles extremely large arrays without throwing', () => {
		const input = Array.from({ length: 10000 }, (_, i) => ({ id: `id-${i}`, name: `Item ${i}` }));
		const result = serializeArray(input);
		expect(result).toHaveLength(10000);
	});
});
