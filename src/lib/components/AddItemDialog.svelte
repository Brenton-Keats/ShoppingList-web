<script lang="ts">
	import { X } from '@lucide/svelte';
	import Button from './Button.svelte';
	import type { Section, Store } from '$lib/types';

	interface Props {
		open: boolean;
		initialName?: string;
		sections: Section[];
		stores: Store[];
		onCreate: (name: string, sectionId: string | null, storeId: string | null) => void;
		onCancel: () => void;
	}

	let {
		open = $bindable(),
		initialName = '',
		sections,
		stores,
		onCreate,
		onCancel
	}: Props = $props();

	let name = $state('');
	let sectionId = $state<string>('');
	let storeId = $state<string>('');

	$effect(() => {
		if (open) {
			name = initialName;
			sectionId = '';
			storeId = '';
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim()) return;

		onCreate(
			name.trim(),
			sectionId || null,
			storeId || null
		);
		open = false;
	}

	function handleCancel() {
		open = false;
		onCancel();
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
		<div
			class="absolute inset-0 bg-black/40"
			onclick={handleCancel}
			role="presentation"
		></div>

		<div class="relative w-full max-w-sm rounded-t-2xl bg-[var(--color-bg)] p-6 shadow-xl sm:rounded-2xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-[var(--color-text)]">Add New Item</h2>
				<button
					onclick={handleCancel}
					class="flex items-center justify-center rounded-full p-1 text-[var(--color-text-secondary)] active:bg-[var(--color-surface)]"
					aria-label="Close dialog"
				>
					<X size={20} />
				</button>
			</div>

			<form onsubmit={handleSubmit} class="flex flex-col gap-4">
				<div>
					<label for="product-name" class="mb-1 block text-sm font-medium text-[var(--color-text)]">
						Name
					</label>
					<input
						id="product-name"
						type="text"
						bind:value={name}
						placeholder="e.g. Milk"
						class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-base text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
						required
					/>
				</div>

				<div>
					<label for="section-select" class="mb-1 block text-sm font-medium text-[var(--color-text)]">
						Section
					</label>
					<select
						id="section-select"
						bind:value={sectionId}
						class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-base text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
					>
						<option value="">None</option>
						{#each sections as section (section.id)}
							<option value={section.id}>{section.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="store-select" class="mb-1 block text-sm font-medium text-[var(--color-text)]">
						Store (optional)
					</label>
					<select
						id="store-select"
						bind:value={storeId}
						class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-base text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
					>
						<option value="">None</option>
						{#each stores as store (store.id)}
							<option value={store.id}>{store.name}</option>
						{/each}
					</select>
				</div>

				<div class="mt-2 flex gap-3">
					<Button variant="secondary" fullWidth onclick={handleCancel} type="button">
						Cancel
					</Button>
					<Button variant="primary" fullWidth type="submit">
						Create and Add
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
