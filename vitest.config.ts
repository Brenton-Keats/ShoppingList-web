import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		environment: 'node',
		setupFiles: ['./src/tests/setup.ts'],
		include: ['src/tests/**/*.test.ts']
	}
});
