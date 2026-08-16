<script lang="ts">
	import { onMount } from 'svelte';
	import { X, ShoppingCart, CheckCircle2, ArrowRight } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { listStore } from '$lib/stores/list.svelte';
	import { preferencesStore } from '$lib/stores/preferences.svelte';
	import { calculateShoppingState } from '$lib/shopping/progression';
	import type { GroupedItem } from '$lib/view-modes/types';
	import ShoppingItem from '$lib/components/ShoppingItem.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import UpNext from '$lib/components/UpNext.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	onMount(() => {
		listStore.loadActiveList();
	});

	const productsArray = $derived(Array.from(listStore.products.values()));
	const sectionsArray = $derived(Array.from(listStore.sections.values()));
	const storesArray = $derived(Array.from(listStore.stores.values()));

	let shoppingState = $state<import('$lib/shopping/progression').ShoppingState>({
		currentGroup: null,
		nextGroup: null,
		currentItem: null,
		remainingItems: 0,
		totalItems: 0,
		completedItems: 0
	});

	$effect(() => {
		const items = listStore.items;
		const viewMode = preferencesStore.viewMode;
		calculateShoppingState(items, productsArray, sectionsArray, storesArray, viewMode).then(
			(state) => {
				shoppingState = state;
			}
		);
	});

	const currentGroupItems = $derived.by((): GroupedItem[] => {
		if (!shoppingState.currentGroup) return [];
		const items: GroupedItem[] = [];
		for (const secondary of shoppingState.currentGroup.secondaryGroups) {
			for (const groupedItem of secondary.items) {
				items.push(groupedItem);
			}
		}
		return items.sort((a, b) => {
			const aComplete = a.item.completed ? 1 : 0;
			const bComplete = b.item.completed ? 1 : 0;
			if (aComplete !== bComplete) return aComplete - bComplete;
			return a.item.sort_order - b.item.sort_order;
		});
	});

	function handleToggleItem(itemId: string) {
		listStore.toggleItem(itemId);
	}

	function handleExit() {
		goto('/');
	}

	function getSectionName(sectionId: string | null): string | null {
		if (!sectionId) return null;
		return listStore.getSectionName(sectionId);
	}

	function getStoreName(storeId: string | null): string | null {
		if (!storeId) return null;
		return listStore.getStoreName(storeId);
	}
</script>

<div class="flex min-h-[100dvh] flex-col bg-[var(--color-bg)]">
	<div class="sticky top-0 z-40 bg-[var(--color-bg)]/95 backdrop-blur-sm">
		<div class="flex items-center justify-between px-4 pt-2">
			<button
				onclick={handleExit}
				class="flex items-center justify-center rounded-full p-2 text-[var(--color-text)] active:bg-[var(--color-surface)]"
				aria-label="Exit shopping mode"
			>
				<X size={24} />
			</button>
			<span class="text-sm font-semibold text-[var(--color-text)]">Shopping</span>
			<div class="w-10"></div>
		</div>
		<ProgressBar
			completed={shoppingState.completedItems}
			total={shoppingState.totalItems}
		/>
	</div>

	<div class="flex-1 overflow-y-auto">
		{#if listStore.loading}
			<div class="flex items-center justify-center py-16">
				<div
					class="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]"
				></div>
			</div>
		{:else if shoppingState.totalItems === 0}
			<EmptyState
				icon={ShoppingCart}
				title="Ready to shop?"
				description="Your shopping list is empty. Add items from the List Builder first."
			/>
		{:else if shoppingState.currentGroup === null}
			<div class="flex flex-col items-center justify-center px-6 py-16 text-center">
				<div class="mb-4 rounded-full bg-[var(--color-success)]/10 p-4">
					<CheckCircle2 size={40} class="text-[var(--color-success)]" />
				</div>
				<h3 class="mb-1 text-xl font-bold text-[var(--color-text)]">All Done!</h3>
				<p class="max-w-xs text-sm text-[var(--color-text-secondary)]">
					You've completed all {shoppingState.totalItems} items. Great job!
				</p>
				<button
					onclick={handleExit}
					class="mt-6 flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white active:bg-[var(--color-primary-dark)]"
				>
					<span>Back to List</span>
					<ArrowRight size={18} />
				</button>
			</div>
		{:else}
			<div class="flex flex-col gap-3 p-4">
				<div class="px-1">
					<h2 class="text-xl font-bold text-[var(--color-text)]">
						{shoppingState.currentGroup.name}
					</h2>
					{#if shoppingState.currentItem}
						<p class="text-sm text-[var(--color-text-secondary)]">
							{shoppingState.remainingItems} remaining
						</p>
					{/if}
				</div>

				<div class="flex flex-col gap-2">
					{#each currentGroupItems as groupedItem (groupedItem.item.id)}
						<ShoppingItem
							item={groupedItem.item}
							sectionName={getSectionName(groupedItem.item.section_id)}
							storeName={getStoreName(groupedItem.item.store_id)}
							onComplete={() => handleToggleItem(groupedItem.item.id)}
						/>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	{#if shoppingState.nextGroup && shoppingState.currentGroup !== null}
		<UpNext nextGroup={shoppingState.nextGroup} />
	{/if}

	{#if shoppingState.totalItems > 0}
		<div class="border-t border-[var(--color-border)] p-4">
			<button
				onclick={handleExit}
				class="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 text-sm font-semibold text-[var(--color-text)] active:bg-[var(--color-border)]"
			>
				<X size={18} />
				<span>Exit Shopping</span>
			</button>
		</div>
	{/if}
</div>
