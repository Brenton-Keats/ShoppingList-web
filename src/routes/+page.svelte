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
	let suggestionsCollapsed = $state(false);
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

<div class="flex min-h-full flex-col gap-4 p-4">
	{#if listStore.loading}
		<div class="flex flex-1 items-center justify-center py-16">
			<LoadingSpinner />
		</div>
	{:else}
		<SearchBar onSelect={handleSelectProduct} onAddNew={handleAddNew} />

		<Suggestions
			suggestions={suggestions}
			loading={suggestionsLoading}
			collapsed={suggestionsCollapsed}
			onToggleCollapse={handleToggleCollapse}
			onAdd={handleAddSuggestion}
			onAddAll={handleAddAllSuggestions}
			getStoreName={listStore.getStoreName.bind(listStore)}
		/>

		{#if listStore.items.length > 0}
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between px-1">
					<h2 class="text-sm font-semibold text-[var(--color-text)]">
						Items ({listStore.completedCount}/{listStore.itemCount})
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
				description="Search for products above or tap the + button to add your first item."
			>
				{#snippet action()}
					<Button onclick={handleQuickAdd}>
						<Plus size={18} />
						<span class="ml-1">Add Item</span>
					</Button>
				{/snippet}
			</EmptyState>
		{/if}
	{/if}
</div>

<button
	onclick={handleQuickAdd}
	class="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg active:bg-[var(--color-primary-dark)]"
	aria-label="Add item"
	style="margin-bottom: var(--safe-area-bottom)"
>
	<Plus size={24} />
</button>

<AddItemDialog
	bind:open={dialogOpen}
	initialName={dialogInitialName}
	sections={sectionsArray}
	stores={storesArray}
	onCreate={handleCreateItem}
	onCancel={() => {}}
/>
