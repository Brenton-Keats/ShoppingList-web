import { env } from '$env/dynamic/public';
import { APP_CONFIG } from '../config';

function getEnv(key: string): string | undefined {
	return env[key as keyof typeof env];
}

export const ENV = {
	get PUBLIC_APPS_SCRIPT_URL(): string {
		const value = getEnv('PUBLIC_APPS_SCRIPT_URL');
		if (!value) {
			throw new Error(
				'Missing required environment variable: PUBLIC_APPS_SCRIPT_URL. ' +
				'Please set it in your .env file (local) or GitHub repository secrets (CI).'
			);
		}
		return value;
	},

	get PUBLIC_API_KEY(): string {
		return getEnv('PUBLIC_API_KEY') || '';
	},

	get PUBLIC_APP_NAME(): string {
		return getEnv('PUBLIC_APP_NAME') || APP_CONFIG.APP_NAME;
	},

	get PUBLIC_APP_VERSION(): string {
		return getEnv('PUBLIC_APP_VERSION') || APP_CONFIG.APP_VERSION;
	}
};
