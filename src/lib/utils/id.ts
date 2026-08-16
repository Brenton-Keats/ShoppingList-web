import { v4 as uuidv4 } from 'uuid';
import { getItem, setItem } from './storage';

const DEVICE_ID_KEY = 'shoppinglist_device_id';

export function generateUUID(): string {
	return uuidv4();
}

export function getOrCreateDeviceId(): string {
	const existing = getItem<string>(DEVICE_ID_KEY);
	if (existing) {
		return existing;
	}

	const newId = generateUUID();
	setItem(DEVICE_ID_KEY, newId);
	return newId;
}
