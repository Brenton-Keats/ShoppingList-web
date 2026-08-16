/// <reference types="vite-plugin-pwa/client" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Claim clients immediately
clientsClaim();

// Precache all assets built by Vite
// @ts-expect-error __WB_MANIFEST is injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches
cleanupOutdatedCaches();

// Cache static assets from CDN or external sources
registerRoute(
	({ url }) => url.origin === self.location.origin && url.pathname.match(/\.(js|css|woff2|png|svg|ico)$/),
	new CacheFirst({
		cacheName: 'static-assets',
		plugins: [
			new ExpirationPlugin({
				maxEntries: 100,
				maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
			})
		]
	})
);

// API calls - network first with cache fallback
registerRoute(
	({ url }) => url.href.includes('script.google.com'),
	new NetworkFirst({
		cacheName: 'api-cache',
		plugins: [
			new ExpirationPlugin({
				maxEntries: 50,
				maxAgeSeconds: 60 * 60 * 24 // 1 day
			})
		],
		networkTimeoutSeconds: 10
	})
);

// Navigation fallback for offline support
const navigationRoute = new NavigationRoute(
	new NetworkFirst({
		cacheName: 'pages',
		plugins: [
			new ExpirationPlugin({
				maxEntries: 20,
				maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
			})
		]
	}),
	{ denylist: [/^\/api\//, /^\/auth\//] }
);
registerRoute(navigationRoute);

// Skip waiting on message
sw.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		sw.skipWaiting();
	}
});

// Background sync for deferred operations (optional)
sw.addEventListener('sync', (event) => {
	if (event.tag === 'sync-shopping-list') {
		event.waitUntil(
			// Trigger sync from the app
			sw.clients.matchAll().then((clients) => {
				clients.forEach((client) => {
					client.postMessage({ type: 'SYNC_REQUIRED' });
				});
			})
		);
	}
});
