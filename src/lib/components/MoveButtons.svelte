<script lang="ts">
	import { ChevronUp, ChevronDown, Store, LayoutGrid } from '@lucide/svelte';

	interface Props {
		canMoveUp: boolean;
		canMoveDown: boolean;
		canMoveSection: boolean;
		canMoveStore: boolean;
		onMoveUp?: () => void;
		onMoveDown?: () => void;
		onMoveSection?: () => void;
		onMoveStore?: () => void;
	}

	let {
		canMoveUp,
		canMoveDown,
		canMoveSection,
		canMoveStore,
		onMoveUp,
		onMoveDown,
		onMoveSection,
		onMoveStore
	}: Props = $props();
</script>

<div class="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
	<button
		onclick={onMoveUp}
		disabled={!canMoveUp}
		class="rounded-md p-1.5 text-[var(--color-text-secondary)] active:bg-[var(--color-bg)] disabled:opacity-30"
		aria-label="Move up"
	>
		<ChevronUp size={16} />
	</button>
	<button
		onclick={onMoveDown}
		disabled={!canMoveDown}
		class="rounded-md p-1.5 text-[var(--color-text-secondary)] active:bg-[var(--color-bg)] disabled:opacity-30"
		aria-label="Move down"
	>
		<ChevronDown size={16} />
	</button>
	{#if canMoveSection}
		<button
			onclick={onMoveSection}
			class="rounded-md p-1.5 text-[var(--color-text-secondary)] active:bg-[var(--color-bg)]"
			aria-label="Move to section"
		>
			<LayoutGrid size={16} />
		</button>
	{/if}
	{#if canMoveStore}
		<button
			onclick={onMoveStore}
			class="rounded-md p-1.5 text-[var(--color-text-secondary)] active:bg-[var(--color-bg)]"
			aria-label="Move to store"
		>
			<Store size={16} />
		</button>
	{/if}
</div>
