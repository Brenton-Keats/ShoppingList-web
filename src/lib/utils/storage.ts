export function getItem<T>(key: string): T | null {
	try {
		const item = localStorage.getItem(key);
		if (item === null) return null;
		return JSON.parse(item) as T;
	} catch {
		return null;
	}
}

export function setItem<T>(key: string, value: T): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.error(`Failed to set localStorage item "${key}":`, error);
	}
}

export function removeItem(key: string): void {
	try {
		localStorage.removeItem(key);
	} catch (error) {
		console.error(`Failed to remove localStorage item "${key}":`, error);
	}
}
