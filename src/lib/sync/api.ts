import { ENV } from '$lib/config/env';
import type { List, Section, Store, Product, ListItem, Setting } from '$lib/types';

const REQUEST_TIMEOUT_MS = 30000;

export interface ServerDataResponse {
	serverRevision: number;
	lists: List[];
	sections: Section[];
	stores: Store[];
	products: Product[];
	listItems: ListItem[];
	settings: Setting[];
}

export interface SubmitChangesParams {
	deviceId: string;
	baseRevision: number;
	changes: Array<{
		id: string;
		entityType: string;
		entityId: string;
		operation: string;
		data: Record<string, unknown>;
	}>;
}

export interface SubmitChangesResponse {
	success: boolean;
	serverRevision: number;
	acceptedChanges: string[];
	changes: Array<{
		revision: number;
		entityType: string;
		entityId: string;
		operation: string;
		data: Record<string, unknown>;
		timestamp: string;
	}>;
}

export interface ApiError {
	type: 'network' | 'timeout' | 'http' | 'cors' | 'parse' | 'unknown';
	status?: number;
	message: string;
}

class ApiErrorImpl extends Error implements ApiError {
	type: ApiError['type'];
	status?: number;

	constructor(type: ApiError['type'], message: string, status?: number) {
		super(message);
		this.type = type;
		this.status = status;
		this.name = 'ApiError';
	}
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new ApiErrorImpl('timeout', `Request timed out after ${ms}ms`));
		}, ms);

		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error) => {
				clearTimeout(timer);
				reject(error);
			}
		);
	});
}

function isCorsError(error: unknown): boolean {
	if (error instanceof TypeError) {
		const message = error.message.toLowerCase();
		return (
			message.includes('cors') ||
			message.includes('cross-origin') ||
			message.includes('failed to fetch') ||
			message.includes('networkerror')
		);
	}
	return false;
}

function handleFetchError(error: unknown): ApiErrorImpl {
	if (error instanceof ApiErrorImpl) {
		return error;
	}

	if (error instanceof TypeError) {
		if (isCorsError(error)) {
			return new ApiErrorImpl('cors', 'CORS error: unable to reach server', undefined);
		}
		return new ApiErrorImpl('network', `Network error: ${error.message}`, undefined);
	}

	if (error instanceof SyntaxError) {
		return new ApiErrorImpl('parse', `JSON parse error: ${error.message}`, undefined);
	}

	return new ApiErrorImpl('unknown', `Unexpected error: ${String(error)}`, undefined);
}

export async function fetchServerData(): Promise<ServerDataResponse> {
	try {
		const response = await withTimeout(
			fetch(ENV.PUBLIC_APPS_SCRIPT_URL, {
				method: 'GET',
				headers: {
					Accept: 'application/json'
				}
			}),
			REQUEST_TIMEOUT_MS
		);

		if (!response.ok) {
			throw new ApiErrorImpl(
				'http',
				`HTTP error: ${response.status} ${response.statusText}`,
				response.status
			);
		}

		const data = (await response.json()) as ServerDataResponse;
		return data;
	} catch (error) {
		throw handleFetchError(error);
	}
}

export async function submitChanges(params: SubmitChangesParams): Promise<SubmitChangesResponse> {
	try {
		const response = await withTimeout(
			fetch(ENV.PUBLIC_APPS_SCRIPT_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify(params)
			}),
			REQUEST_TIMEOUT_MS
		);

		if (!response.ok) {
			throw new ApiErrorImpl(
				'http',
				`HTTP error: ${response.status} ${response.statusText}`,
				response.status
			);
		}

		const data = (await response.json()) as SubmitChangesResponse;
		return data;
	} catch (error) {
		throw handleFetchError(error);
	}
}
