<script lang="ts">
	import { WifiOff, Home, RefreshCw } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { uiStore } from '$lib/stores/ui.svelte';

	let isRetrying = $state(false);

	function goHome() {
		goto(resolve('/'));
	}

	async function retry() {
		isRetrying = true;
		try {
			const response = await fetch(window.location.href, { method: 'HEAD' });
			if (response.ok) {
				window.location.reload();
			}
		} catch {
			// Still offline
		} finally {
			isRetrying = false;
		}
	}
</script>

<svelte:head>
	<title>Offline - Shopping List</title>
</svelte:head>

<div class="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-16 text-center">
	<div class="mb-6 rounded-full bg-[var(--color-surface)] p-6">
		<WifiOff size={48} class="text-[var(--color-text-secondary)]" />
	</div>

	<h1 class="mb-2 text-2xl-mobile font-bold text-[var(--color-text)]">
		You're Offline
	</h1>

	<p class="mb-2 max-w-xs text-base-mobile text-[var(--color-text-secondary)]">
		{#if uiStore.online}
			This page isn't available offline. Your shopping list data is still safe on your device.
		{:else}
			No internet connection detected. Don't worry — your shopping list is still available and works offline.
		{/if}
	</p>

	<div class="mt-8 flex flex-col gap-3 sm:flex-row">
		<button
			onclick={goHome}
			class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-base-mobile font-semibold text-white active:bg-[var(--color-primary-dark)]"
		>
			<Home size={20} />
			Go to Shopping List
		</button>

		<button
			onclick={retry}
			disabled={isRetrying}
			class="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-base-mobile font-medium text-[var(--color-text)] active:bg-[var(--color-border)] disabled:opacity-50"
		>
			<RefreshCw size={20} class={isRetrying ? 'animate-spin' : ''} />
			{isRetrying ? 'Checking...' : 'Try Again'}
		</button>
	</div>

	<div class="mt-12 text-sm text-[var(--color-text-secondary)]">
		<p>Tips for offline use:</p>
		<ul class="mt-2 space-y-1">
			<li>Your list syncs automatically when you're back online</li>
			<li>Add, edit, and check off items while offline</li>
			<li>All changes are saved locally on your device</li>
		</ul>
	</div>
</div>
