<script lang="ts">
	interface Props {
		completed: number;
		total: number;
	}

	let { completed, total }: Props = $props();

	const percentage = $derived(total > 0 ? Math.round((completed / total) * 100) : 0);
	const isComplete = $derived(completed >= total && total > 0);
</script>

<div class="w-full">
	<div class="flex items-center justify-between px-4 py-2">
		<span class="text-xs font-semibold text-[var(--color-text-secondary)]">
			{isComplete ? 'All Done!' : 'Shopping'}
		</span>
		<span class="text-xs font-medium text-[var(--color-text-secondary)]">
			{completed}/{total}
		</span>
	</div>
	<div class="h-1.5 w-full bg-[var(--color-surface)]">
		<div
			class="h-full transition-all duration-500 ease-out {isComplete ? 'bg-[var(--color-success)]' : 'bg-[var(--color-primary)]'}"
			style="width: {percentage}%"
		></div>
	</div>
</div>
