<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, ClipboardList } from '@lucide/svelte';
	import { listStore } from '$lib/stores/list.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import { preferencesStore } from '$lib/stores/preferences.svelte';
	import { getSuggestions, type Suggestion } from '$lib/suggestions/engine';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import AddItemDialog from '$lib/components/AddItemDialog.svelte';
	import Suggestions from '$lib/components/Suggestions.svelte';
	import GroupedList from '$lib/components/GroupedList.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Button from '$lib/components/Button.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ViewModeSelector from '$lib/components/ViewModeSelector.svelte';
	import { createList } from '$lib/db/operations';
	import type { Product } from '$lib/types';

	uiStore.setHeaderTitle('');
	uiStore.setShowBackButton(false);

	let suggestions = $state<Suggestion[]>([]);
	let suggestionsLoading = $state(false);
	let suggestionsCollapsed = $state(true);
	let dialogOpen = $state(false);
	let dialogInitialName = $state('');

	const sectionsArray = $derived(Array.from(listStore.sections.values()));
	const storesArray = $derived(Array.from(listStore.stores.values()));

	async function ensureActiveList() {
		if (!listStore.activeList) {
			const list = await createList({
				name: 'Shopping List',
				status: 'ACTIVE',
				sort_order: 0,
				started_at: new Date().toISOString(),
				archived_at: null
			});
			listStore.activeList = list;
			await listStore.loadListData(list.id);
		}
	}

	async function loadSuggestions() {
		if (!listStore.activeList) return;
		suggestionsLoading = true;
		try {
			suggestions = await getSuggestions(listStore.activeList.id);
		} finally {
			suggestionsLoading = false;
		}
	}

	onMount(async () => {
		await listStore.loadActiveList();
		await ensureActiveList();
		await loadSuggestions();
	});

	function handleSelectProduct(product: Product) {
		listStore.addItem(product.id, product.default_section_id, product.default_store_id);
	}

	function handleAddNew(query: string) {
		dialogInitialName = query;
		dialogOpen = true;
	}

	function handleCreateItem(name: string, sectionId: string | null, storeId: string | null) {
		listStore.addNewProductAndItem(name, sectionId, storeId);
	}

	function handleAddSuggestion(productId: string) {
		listStore.addItem(productId);
		suggestions = suggestions.filter((s) => s.product.id !== productId);
	}

	function handleAddAllSuggestions(productIds: string[]) {
		for (const id of productIds) {
			listStore.addItem(id);
		}
		suggestions = suggestions.filter((s) => !productIds.includes(s.product.id));
	}

	function handleToggleCollapse() {
		suggestionsCollapsed = !suggestionsCollapsed;
	}

	function handleQuickAdd() {
		dialogInitialName = '';
		dialogOpen = true;
	}
</script>

<div class="flex min-h-full flex-col">
	{#if listStore.loading}
		<div class="flex flex-1 items-center justify-center py-16">
			<LoadingSpinner />
		</div>
	{:else}
		<!-- Search - sticky at top of content area -->
		<div class="sticky top-14 z-30 bg-[var(--color-bg)] px-4 pb-3 pt-4">
			<SearchBar onSelect={handleSelectProduct} onAddNew={handleAddNew} />
		</div>

		<div class="flex flex-col gap-3 px-4 pb-24">
			<!-- Suggestions - collapsed by default to prioritize the list -->
			{#if suggestions.length > 0 || suggestionsLoading}
				<Suggestions
					suggestions={suggestions}
					loading={suggestionsLoading}
					collapsed={suggestionsCollapsed}
					onToggleCollapse={handleToggleCollapse}
					onAdd={handleAddSuggestion}
					onAddAll={handleAddAllSuggestions}
					getStoreName={listStore.getStoreName.bind(listStore)}
				/>
			{/if}

			<!-- Main list content -->
			{#if listStore.items.length > 0}
				<div class="flex flex-col gap-2">
					<div class="flex items-center justify-between">
						<h2 class="text-sm font-semibold text-[var(--color-text-secondary)]">
							{listStore.completedCount}/{listStore.itemCount} done
						</h2>
						<ViewModeSelector currentMode={preferencesStore.viewMode} />
					</div>
					<GroupedList
						viewMode={preferencesStore.viewMode}
						items={listStore.items}
						products={Array.from(listStore.products.values())}
						sections={sectionsArray}
						stores={storesArray}
						onToggleItem={(id) => listStore.toggleItem(id)}
						onDeleteItem={(id) => listStore.removeItem(id)}
						onReorder={() => listStore.refresh()}
					/>
				</div>
			{:else}
				<EmptyState
					icon={ClipboardList}
					title="Your list is empty"
					description="Search above or tap + to start adding items."
				>
					{#snippet action()}
						<Button onclick={handleQuickAdd}>
							<Plus size={18} />
							<span class="ml-1">Add Item</span>
						</Button>
					{/snippet}
				</EmptyState>
			{/if}
		</div>
	{/if}
</div>

<!-- FAB - positioned above bottom nav -->
<button
	onclick={handleQuickAdd}
	class="fixed bottom-[5.5rem] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25 transition-transform active:scale-95"
	aria-label="Add item"
>
	<Plus size={24} strokeWidth={2.5} />
</button>

<AddItemDialog
	bind:open={dialogOpen}
	initialName={dialogInitialName}
	sections={sectionsArray}
	stores={storesArray}
	onCreate={handleCreateItem}
	onCancel={() => {}}
/>
