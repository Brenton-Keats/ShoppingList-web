<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import InstallPrompt from '$lib/components/InstallPrompt.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import { page } from '$app/state';

	let { children } = $props();

	const isShoppingMode = $derived(
		page.url.pathname === '/shopping' || page.url.pathname.endsWith('/shopping')
	);
	const isErrorPage = $derived(page.status >= 400);
</script>

<svelte:head>
	<title>Shopping List</title>
	<meta name="theme-color" content={uiStore.resolvedTheme === 'dark' ? '#0f172a' : '#ffffff'} />
</svelte:head>

<div class="flex min-h-[100dvh] flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
	{#if !isShoppingMode && !isErrorPage}
		<Header />
	{/if}

	<main class="flex-1 overflow-y-auto {isShoppingMode || isErrorPage ? '' : 'pt-14 pb-16'}">
		{@render children()}
	</main>

	{#if !isShoppingMode && !isErrorPage}
		<BottomNav />
	{/if}
</div>

<InstallPrompt />
