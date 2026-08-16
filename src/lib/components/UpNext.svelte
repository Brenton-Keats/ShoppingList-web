<script lang="ts">
	import type { PrimaryGroup } from '$lib/view-modes/types';

	interface Props {
		nextGroup: PrimaryGroup | null;
	}

	let { nextGroup }: Props = $props();

	function getNextSecondaryName(group: PrimaryGroup): string | null {
		for (const secondary of group.secondaryGroups) {
			const hasIncomplete = secondary.items.some((gi) => !gi.item.completed);
			if (hasIncomplete) {
				return secondary.name;
			}
		}
		return null;
	}
</script>

{#if nextGroup}
	{@const secondaryName = getNextSecondaryName(nextGroup)}
	<div class="border-t border-[var(--color-border)] px-4 py-3">
		<div class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
			Up Next
		</div>
		<div class="mt-0.5 text-sm font-medium text-[var(--color-text)]">
			{nextGroup.name}
		</div>
		{#if secondaryName}
			<div class="text-xs text-[var(--color-text-secondary)]">
				{secondaryName}
			</div>
		{/if}
	</div>
{/if}
