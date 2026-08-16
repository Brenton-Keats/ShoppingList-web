<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		color?: string;
	}

	let { size = 'md', color = 'var(--color-primary)' }: Props = $props();

	const sizeMap = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-8 w-8'
	};
</script>

<div class="inline-block animate-spin rounded-full border-2 border-current border-t-transparent {sizeMap[size]}" style="color: {color}"></div>
