<script lang="ts">
	import { ChevronDown, ChevronRight } from '@lucide/svelte';
	import { preferencesStore } from '$lib/stores/preferences.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		groupKey: string;
		title: string;
		itemCount: number;
		children: Snippet;
		level?: 'primary' | 'secondary';
	}

	let { groupKey, title, itemCount, children, level = 'primary' }: Props = $props();

	const isCollapsed = $derived(preferencesStore.collapsedGroups[groupKey] ?? false);

	function toggle() {
		preferencesStore.toggleGroup(groupKey);
	}
</script>

<div class="overflow-hidden rounded-lg border border-[var(--color-border)]">
	<button
		onclick={toggle}
		class="flex w-full items-center justify-between transition-colors active:bg-[var(--color-border)]/50 {level === 'primary'
			? 'px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]'
			: 'px-4 py-2 pl-8 bg-[var(--color-bg)]'}"
		aria-expanded={!isCollapsed}
	>
		<div class="flex items-center gap-2">
			{#if isCollapsed}
				<ChevronRight size={16} class="text-[var(--color-text-secondary)]" />
			{:else}
				<ChevronDown size={16} class="text-[var(--color-text-secondary)]" />
			{/if}
			<span class="{level === 'primary' ? 'text-sm font-semibold text-[var(--color-text)]' : 'text-xs font-medium text-[var(--color-text-secondary)]'}">
				{title}
			</span>
		</div>
		<span class="text-xs text-[var(--color-text-secondary)]">{itemCount}</span>
	</button>

	{#if !isCollapsed}
		<div class="transition-all">
			{@render children()}
		</div>
	{/if}
</div>
