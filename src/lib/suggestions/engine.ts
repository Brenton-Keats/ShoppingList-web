import { db } from '$lib/db/database';
import { getHistoricalLists } from '$lib/db/queries';
import { APP_CONFIG } from '$lib/config';
import type { Product, ListItem } from '$lib/types';

export interface Suggestion {
	product: Product;
	frequency: number;
	strength: 'strong' | 'normal' | 'none';
}

export async function getSuggestions(
	listId: string,
	window: number = APP_CONFIG.SUGGESTION_WINDOW
): Promise<Suggestion[]> {
	const currentItems = await db.listItems
		.where('list_id')
		.equals(listId)
		.and((i) => i.deleted_at === null)
		.toArray();

	const currentProductIds = new Set(currentItems.map((i) => i.product_id));

	const historicalLists = await getHistoricalLists(window);
	const consideredLists = historicalLists.filter(
		(l) => l.id !== listId && l.status !== 'DRAFT'
	);

	if (consideredLists.length === 0) return [];

	const listIds = consideredLists.map((l) => l.id);
	const allHistoricalItems: ListItem[] = [];

	for (const id of listIds) {
		const items = await db.listItems
			.where('list_id')
			.equals(id)
			.and((i) => i.deleted_at === null)
			.toArray();
		allHistoricalItems.push(...items);
	}

	const productListCounts = new Map<string, Set<string>>();

	for (const item of allHistoricalItems) {
		if (!productListCounts.has(item.product_id)) {
			productListCounts.set(item.product_id, new Set());
		}
		productListCounts.get(item.product_id)!.add(item.list_id);
	}

	const allProducts = await db.products
		.filter((p) => p.deleted_at === null && p.active)
		.toArray();

	const suggestions: Suggestion[] = [];

	for (const product of allProducts) {
		if (currentProductIds.has(product.id)) continue;

		const listCount = productListCounts.get(product.id)?.size ?? 0;
		const frequency = listCount / consideredLists.length;

		let strength: Suggestion['strength'];
		if (frequency >= APP_CONFIG.STRONG_SUGGESTION_THRESHOLD) {
			strength = 'strong';
		} else if (frequency >= APP_CONFIG.SUGGESTION_THRESHOLD) {
			strength = 'normal';
		} else {
			continue;
		}

		suggestions.push({
			product,
			frequency,
			strength
		});
	}

	suggestions.sort((a, b) => b.frequency - a.frequency);

	return suggestions;
}
