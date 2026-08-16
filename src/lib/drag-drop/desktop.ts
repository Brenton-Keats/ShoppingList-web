import { findDropTarget } from './detection';
import type { DragData, DragStartEvent } from './detection';

export function setupMouseDrag(
	element: HTMLElement,
	data: DragData,
	onDragStart: (e: DragStartEvent) => void,
	onDragMove: (x: number, y: number) => void,
	onDragEnd: (x: number, y: number, target?: DragData) => void
): () => void {
	let isDragging = false;
	let startX = 0;
	let startY = 0;

	function handleMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		startX = e.clientX;
		startY = e.clientY;
		isDragging = true;

		onDragStart({
			element,
			data,
			x: e.clientX,
			y: e.clientY
		});

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		document.addEventListener('keydown', handleKeyDown);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		onDragMove(e.clientX, e.clientY);
	}

	function handleMouseUp(e: MouseEvent) {
		if (!isDragging) return;
		isDragging = false;

		const target = findDropTarget(e.clientX, e.clientY, data);
		onDragEnd(e.clientX, e.clientY, target);

		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
		document.removeEventListener('keydown', handleKeyDown);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isDragging) {
			isDragging = false;
			onDragEnd(startX, startY, undefined);

			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			document.removeEventListener('keydown', handleKeyDown);
		}
	}

	element.addEventListener('mousedown', handleMouseDown);

	return () => {
		if (isDragging) {
			isDragging = false;
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			document.removeEventListener('keydown', handleKeyDown);
		}
		element.removeEventListener('mousedown', handleMouseDown);
	};
}
