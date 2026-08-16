<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		fullWidth?: boolean;
		onclick?: () => void;
		type?: 'button' | 'submit';
	}

	let {
		children,
		variant = 'primary',
		size = 'md',
		disabled = false,
		fullWidth = false,
		onclick,
		type = 'button'
	}: Props = $props();

	const variantClasses = {
		primary:
			'bg-[var(--color-primary)] text-white active:brightness-90',
		secondary:
			'bg-[var(--color-surface)] text-[var(--color-text)] ring-1 ring-[var(--color-border)] active:bg-[var(--color-bg)]',
		danger: 'bg-[var(--color-error)] text-white active:brightness-90',
		ghost: 'bg-transparent text-[var(--color-text-secondary)] active:bg-[var(--color-surface)]'
	};

	const sizeClasses = {
		sm: 'px-3 py-2 text-sm rounded-lg',
		md: 'px-4 py-2.5 text-base rounded-xl',
		lg: 'px-6 py-3 text-lg rounded-xl'
	};
</script>

<button
	{type}
	{disabled}
	onclick={onclick}
	class="inline-flex items-center justify-center font-medium transition-all disabled:opacity-40 {variantClasses[variant]} {sizeClasses[size]} {fullWidth ? 'w-full' : ''}"
>
	{@render children()}
</button>
