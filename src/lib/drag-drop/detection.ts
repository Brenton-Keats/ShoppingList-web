export interface DragData {
	type: 'store' | 'section' | 'item';
	id: string;
	listId?: string;
	groupId?: string;
}

export interface DragStartEvent {
	element: HTMLElement;
	data: DragData;
	x: number;
	y: number;
}

const HOLD_DURATION = 500;
const MOVE_THRESHOLD = 10;
const DROP_TARGET_ATTR = 'data-drag-data';

export function setupTouchDrag(
	element: HTMLElement,
	data: DragData,
	onDragStart: (e: DragStartEvent) => void,
	onDragMove: (x: number, y: number) => void,
	onDragEnd: (x: number, y: number, target?: DragData) => void
): () => void {
	let holdTimer: ReturnType<typeof setTimeout> | null = null;
	let startX = 0;
	let startY = 0;
	let isDragging = false;
	let hasMoved = false;

	function handleTouchStart(e: TouchEvent) {
		const touch = e.touches[0];
		startX = touch.clientX;
		startY = touch.clientY;
		hasMoved = false;
		isDragging = false;

		holdTimer = setTimeout(() => {
			if (!hasMoved) {
				isDragging = true;
				if (typeof navigator !== 'undefined' && navigator.vibrate) {
					try {
						navigator.vibrate(50);
					} catch {
						// Ignore haptic feedback errors
					}
				}
				onDragStart({
					element,
					data,
					x: touch.clientX,
					y: touch.clientY
				});
			}
		}, HOLD_DURATION);
	}

	function handleTouchMove(e: TouchEvent) {
		const touch = e.touches[0];
		const dx = touch.clientX - startX;
		const dy = touch.clientY - startY;

		if (!isDragging) {
			if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD) {
				hasMoved = true;
				if (holdTimer) {
					clearTimeout(holdTimer);
					holdTimer = null;
				}
			}
			return;
		}

		e.preventDefault();
		onDragMove(touch.clientX, touch.clientY);
	}

	function handleTouchEnd(e: TouchEvent) {
		if (holdTimer) {
			clearTimeout(holdTimer);
			holdTimer = null;
		}

		if (isDragging) {
			const touch = e.changedTouches[0];
			const target = findDropTarget(touch.clientX, touch.clientY, data);
			onDragEnd(touch.clientX, touch.clientY, target);
			isDragging = false;
		}
	}

	function handleTouchCancel() {
		if (holdTimer) {
			clearTimeout(holdTimer);
			holdTimer = null;
		}
		if (isDragging) {
			onDragEnd(startX, startY, undefined);
			isDragging = false;
		}
	}

	element.addEventListener('touchstart', handleTouchStart, { passive: true });
	element.addEventListener('touchmove', handleTouchMove, { passive: false });
	element.addEventListener('touchend', handleTouchEnd);
	element.addEventListener('touchcancel', handleTouchCancel);

	return () => {
		if (holdTimer) clearTimeout(holdTimer);
		element.removeEventListener('touchstart', handleTouchStart);
		element.removeEventListener('touchmove', handleTouchMove);
		element.removeEventListener('touchend', handleTouchEnd);
		element.removeEventListener('touchcancel', handleTouchCancel);
	};
}

export function findDropTarget(x: number, y: number, excludeData?: DragData): DragData | undefined {
	const element = document.elementFromPoint(x, y);
	if (!element) return undefined;

	let current: HTMLElement | null = element as HTMLElement;
	while (current) {
		const dataAttr = current.getAttribute(DROP_TARGET_ATTR);
		if (dataAttr) {
			try {
				const data = JSON.parse(dataAttr) as DragData;
				if (!excludeData || data.id !== excludeData.id || data.type !== excludeData.type) {
					return data;
				}
			} catch {
				// Ignore invalid JSON
			}
		}
		current = current.parentElement;
	}

	return undefined;
}

export function setDropTargetData(element: HTMLElement, data: DragData): void {
	element.setAttribute(DROP_TARGET_ATTR, JSON.stringify(data));
}

export function clearDropTargetData(element: HTMLElement): void {
	element.removeAttribute(DROP_TARGET_ATTR);
}
