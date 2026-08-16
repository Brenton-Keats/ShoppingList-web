/**
 * API client for the Google Apps Script backend.
 *
 * Authentication: A shared API key is passed as a query parameter (?key=...)
 * on every request. The key is baked into the frontend build from the
 * PUBLIC_API_KEY environment variable (sourced from GitHub Secrets in CI,
 * or .env locally). See SECURITY.md for the full threat model.
 */

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
		// Attach API key as query param for server-side validation
		const url = new URL(ENV.PUBLIC_APPS_SCRIPT_URL);
		if (ENV.PUBLIC_API_KEY) {
			url.searchParams.set('key', ENV.PUBLIC_API_KEY);
		}

		const response = await withTimeout(
			fetch(url.toString(), {
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
		// API key in both query param and body provides redundancy —
		// the server checks query param first, body as fallback.
		const url = new URL(ENV.PUBLIC_APPS_SCRIPT_URL);
		if (ENV.PUBLIC_API_KEY) {
			url.searchParams.set('key', ENV.PUBLIC_API_KEY);
		}

		const response = await withTimeout(
			fetch(url.toString(), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({ ...params, apiKey: ENV.PUBLIC_API_KEY })
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
