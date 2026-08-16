<script lang="ts">
	interface Props {
		checked: boolean;
		onchange: (checked: boolean) => void;
		label?: string;
	}

	let { checked, onchange, label }: Props = $props();
</script>

<button
	role="switch"
	aria-checked={checked}
	aria-label={label}
	onclick={() => onchange(!checked)}
	class="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors
		{checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}"
	style="min-height: 1.75rem; min-width: 3rem;"
>
	<span
		class="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform
			{checked ? 'translate-x-6' : 'translate-x-1'}"
	></span>
</button>
