<script lang="ts">
	import { Search, X, Plus } from '@lucide/svelte';
	import type { Product } from '$lib/types';
	import { getProductsForSearch } from '$lib/db/queries';

	interface Props {
		onSelect: (product: Product) => void;
		onAddNew: (query: string) => void;
	}

	let { onSelect, onAddNew }: Props = $props();

	let query = $state('');
	let results = $state<Product[]>([]);
	let isOpen = $state(false);
	let isLoading = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	function handleInput() {
		if (debounceTimer) clearTimeout(debounceTimer);

		if (!query.trim()) {
			results = [];
			isOpen = false;
			isLoading = false;
			return;
		}

		isLoading = true;
		debounceTimer = setTimeout(async () => {
			results = await getProductsForSearch(query);
			isOpen = true;
			isLoading = false;
		}, 300);
	}

	function handleSelect(product: Product) {
		query = '';
		results = [];
		isOpen = false;
		onSelect(product);
	}

	function handleAddNew() {
		const q = query.trim();
		query = '';
		results = [];
		isOpen = false;
		onAddNew(q);
	}

	function handleClear() {
		query = '';
		results = [];
		isOpen = false;
		if (debounceTimer) clearTimeout(debounceTimer);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isOpen = false;
		}
	}

	const hasExactMatch = $derived(
		results.some((p) => p.name.toLowerCase() === query.toLowerCase().trim())
	);
</script>

<div class="relative">
	<div class="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
		<Search size={18} class="shrink-0 text-[var(--color-text-secondary)]" />
		<input
			type="text"
			placeholder="Search products..."
			bind:value={query}
			oninput={handleInput}
			onkeydown={handleKeyDown}
			class="flex-1 bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-secondary)]"
			aria-label="Search products"
			aria-controls="search-results"
			aria-autocomplete="list"
		/>
		{#if query}
			<button
				onclick={handleClear}
				class="flex shrink-0 items-center justify-center rounded-full p-1 text-[var(--color-text-secondary)] active:bg-[var(--color-border)]"
				aria-label="Clear search"
			>
				<X size={16} />
			</button>
		{/if}
		{#if isLoading}
			<div class="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent text-[var(--color-primary)]"></div>
		{/if}
	</div>

	{#if isOpen && (results.length > 0 || !hasExactMatch)}
		<div
			id="search-results"
			role="listbox"
			class="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg"
		>
			{#if results.length > 0}
				<div class="py-1">
					{#each results as product (product.id)}
						<button
							role="option"
							aria-selected="false"
							onclick={() => handleSelect(product)}
							class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-[var(--color-surface)]"
						>
							<div class="flex-1 min-w-0">
								<div class="truncate text-sm font-medium text-[var(--color-text)]">
									{product.name}
								</div>
								<div class="flex gap-2 mt-0.5">
									{#if product.default_section_id}
										<span class="text-xs text-[var(--color-text-secondary)]">
											Section
										</span>
									{/if}
									{#if product.default_store_id}
										<span class="text-xs text-[var(--color-text-secondary)]">
											Store
										</span>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}

			{#if !hasExactMatch && query.trim()}
				<button
					onclick={handleAddNew}
					class="flex w-full items-center gap-2 border-t border-[var(--color-border)] px-4 py-3 text-left transition-colors active:bg-[var(--color-surface)]"
				>
					<Plus size={16} class="text-[var(--color-primary)]" />
					<span class="text-sm font-medium text-[var(--color-primary)]">
						Add "{query.trim()}"
					</span>
				</button>
			{/if}
		</div>
	{/if}
</div>

<svelte:window
	onclick={(e) => {
		const target = e.target as HTMLElement;
		if (!target.closest('.relative')) {
			isOpen = false;
		}
	}}
/>
