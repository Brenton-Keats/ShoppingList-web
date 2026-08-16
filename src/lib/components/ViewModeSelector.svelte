<script lang="ts">
	import { LayoutGrid, Store } from '@lucide/svelte';
	import { preferencesStore } from '$lib/stores/preferences.svelte';
	import { VIEW_MODES } from '$lib/view-modes/types';
	import type { ViewMode } from '$lib/types';

	interface Props {
		currentMode: ViewMode;
	}

	let { currentMode }: Props = $props();

	function setMode(mode: ViewMode) {
		preferencesStore.setViewMode(mode);
	}

	const iconMap: Record<ViewMode, typeof LayoutGrid> = {
		STORE_SECTION: Store,
		SECTION_STORE: LayoutGrid
	};
</script>

<div class="inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5">
	{#each VIEW_MODES as mode}
		{@const Icon = iconMap[mode.id]}
		<button
			onclick={() => setMode(mode.id)}
			class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors {currentMode === mode.id
				? 'bg-[var(--color-primary)] text-white'
				: 'text-[var(--color-text-secondary)] active:bg-[var(--color-border)]'}"
			aria-pressed={currentMode === mode.id}
			title={mode.description}
		>
			<Icon size={14} />
			<span class="hidden sm:inline">{mode.name}</span>
		</button>
	{/each}
</div>
