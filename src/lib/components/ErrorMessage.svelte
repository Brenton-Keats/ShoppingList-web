<script lang="ts">
	import { CircleAlert } from '@lucide/svelte';

	interface Props {
		message: string;
		onRetry?: () => void;
	}

	let { message, onRetry }: Props = $props();
</script>

<div class="flex flex-col items-center gap-3 rounded-xl bg-[var(--color-surface)] p-6 text-center">
	<CircleAlert size={32} class="text-[var(--color-error)]" />
	<p class="text-sm text-[var(--color-text-secondary)]">{message}</p>
	{#if onRetry}
		<button
			onclick={onRetry}
			class="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white active:bg-[var(--color-primary-dark)]"
		>
			Retry
		</button>
	{/if}
</div>
