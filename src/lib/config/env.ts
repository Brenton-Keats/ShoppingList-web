import { env } from '$env/dynamic/public';
import { APP_CONFIG } from '../config';

interface EnvVars {
	PUBLIC_APPS_SCRIPT_URL: string;
	PUBLIC_APP_NAME: string;
	PUBLIC_APP_VERSION: string;
}

function validateEnv(): EnvVars {
	const required: Array<keyof EnvVars> = [
		'PUBLIC_APPS_SCRIPT_URL',
		'PUBLIC_APP_NAME',
		'PUBLIC_APP_VERSION'
	];

	const missing = required.filter((key) => !env[key]);

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(', ')}`
		);
	}

	return {
		PUBLIC_APPS_SCRIPT_URL: env.PUBLIC_APPS_SCRIPT_URL as string,
		PUBLIC_APP_NAME: (env.PUBLIC_APP_NAME ?? APP_CONFIG.APP_NAME) as string,
		PUBLIC_APP_VERSION: (env.PUBLIC_APP_VERSION ?? APP_CONFIG.APP_VERSION) as string
	};
}

export const ENV = validateEnv();
