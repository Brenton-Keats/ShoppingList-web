import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'service-worker.ts',
			manifest: {
				name: 'Shopping List',
				short_name: 'Shopping',
				description: 'Offline-first shared shopping list',
				start_url: '/',
				display: 'standalone',
				background_color: '#ffffff',
				theme_color: '#0f766e',
				orientation: 'portrait-primary',
				scope: '/',
				icons: [
					{
						src: '/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: '/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: '/icon.svg',
						sizes: 'any',
						type: 'image/svg+xml',
						purpose: 'any'
					}
				],
				categories: ['productivity', 'shopping'],
				lang: 'en'
			},
			injectManifest: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
				globIgnores: ['**/screenshots/*']
			},
			devOptions: {
				enabled: true,
				type: 'module',
				navigateFallback: '/'
			}
		})
	],
	build: {
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					if (id.includes('node_modules/dexie') || id.includes('node_modules/uuid')) {
						return 'vendor';
					}
					return undefined;
				}
			}
		}
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
	}
});
