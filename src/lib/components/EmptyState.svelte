<script lang="ts">
	import type { Component } from 'svelte';
	import type { IconProps } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		icon: Component<IconProps>;
		title: string;
		description: string;
		action?: Snippet;
	}

	let { icon: Icon, title, description, action }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center px-6 py-16 text-center">
	<div class="mb-4 rounded-full bg-[var(--color-surface)] p-4">
		<Icon size={32} class="text-[var(--color-text-secondary)]" />
	</div>
	<h3 class="mb-1 text-lg font-semibold text-[var(--color-text)]">{title}</h3>
	<p class="max-w-xs text-sm text-[var(--color-text-secondary)]">{description}</p>
	{#if action}
		<div class="mt-4">
			{@render action()}
		</div>
	{/if}
</div>
