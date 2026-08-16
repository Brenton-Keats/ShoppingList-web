<script lang="ts">
	import { GripVertical } from '@lucide/svelte';
	import { setupTouchDrag } from '$lib/drag-drop/detection';
	import { setupMouseDrag } from '$lib/drag-drop/desktop';
	import type { DragData, DragStartEvent } from '$lib/drag-drop/detection';

	interface Props {
		data: DragData;
		onDragStart: (e: DragStartEvent) => void;
		onDragMove: (x: number, y: number) => void;
		onDragEnd: (x: number, y: number, target?: DragData) => void;
	}

	let { data, onDragStart, onDragMove, onDragEnd }: Props = $props();
	let handleElement = $state<HTMLElement | null>(null);

	$effect(() => {
		if (!handleElement) return;
		const cleanupTouch = setupTouchDrag(handleElement, data, onDragStart, onDragMove, onDragEnd);
		const cleanupMouse = setupMouseDrag(handleElement, data, onDragStart, onDragMove, onDragEnd);
		return () => {
			cleanupTouch();
			cleanupMouse();
		};
	});
</script>

<div
	bind:this={handleElement}
	class="flex shrink-0 cursor-grab items-center justify-center rounded-lg p-2 text-[var(--color-text-secondary)] active:cursor-grabbing active:bg-[var(--color-surface)]"
	role="button"
	tabindex="0"
	aria-label="Drag to reorder"
>
	<GripVertical size={20} />
</div>
