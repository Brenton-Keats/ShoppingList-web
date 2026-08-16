import type { ViewMode, Section, Store, ListItem, Product } from '$lib/types';
import { groupItemsByViewMode } from '$lib/view-modes/group';

export interface ExportOptions {
	viewMode: ViewMode;
	sections: Section[];
	stores: Store[];
	items: ListItem[];
	products: Product[];
	includeChecked: boolean;
}

export function exportToPlainText(options: ExportOptions): string {
	const { viewMode, sections, stores, items, includeChecked } = options;

	const filteredItems = includeChecked ? items : items.filter((i) => !i.completed);
	if (filteredItems.length === 0) {
		return 'SHOPPING LIST\n\nNo items to export.';
	}

	const grouped = groupItemsByViewMode(filteredItems, viewMode, sections, stores);
	const lines: string[] = ['SHOPPING LIST', ''];

	for (const primary of grouped) {
		lines.push(primary.primaryName.toUpperCase());
		for (const secondary of primary.secondaryGroups) {
			if (secondary.secondaryName !== 'Uncategorized' && secondary.secondaryName !== 'Any Store') {
				lines.push(`  ${secondary.secondaryName}`);
			}
			for (const item of secondary.items) {
				const checkbox = item.completed ? '☑' : '☐';
				const checkedLabel = item.completed ? ' (checked)' : '';
				lines.push(`  ${checkbox} ${item.name_snapshot}${checkedLabel}`);
			}
		}
		lines.push('');
	}

	return lines.join('\n').trim();
}

export async function copyToClipboard(text: string): Promise<boolean> {
	if (typeof navigator === 'undefined' || !navigator.clipboard) {
		return false;
	}
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}

export async function shareText(text: string, title?: string): Promise<boolean> {
	if (typeof navigator === 'undefined' || !navigator.share) {
		return false;
	}
	try {
		await navigator.share({
			title: title ?? 'Shopping List',
			text
		});
		return true;
	} catch {
		return false;
	}
}
