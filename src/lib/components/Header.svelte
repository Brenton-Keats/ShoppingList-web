<script lang="ts">
	import { ArrowLeft, Moon, Sun, Monitor } from '@lucide/svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import { APP_CONFIG } from '$lib/config';
	import SyncStatus from './SyncStatus.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const isHome = $derived(page.url.pathname === resolve('/'));

	function goBack() {
		if (history.length > 1) {
			history.back();
		} else {
			goto(resolve('/'));
		}
	}
</script>

<header
	class="fixed left-0 right-0 top-0 z-50 bg-[var(--color-bg)]"
	style="padding-top: var(--safe-area-top)"
>
	<div class="flex h-14 items-center justify-between px-4">
		<div class="flex items-center gap-2">
			{#if !isHome || uiStore.showBackButton}
				<button
					onclick={goBack}
					class="-ml-2 flex items-center justify-center rounded-full p-2 text-[var(--color-text)] active:bg-[var(--color-surface)]"
					aria-label="Go back"
				>
					<ArrowLeft size={22} />
				</button>
			{/if}
			<h1 class="text-lg font-semibold text-[var(--color-text)]">
				{uiStore.headerTitle || APP_CONFIG.APP_NAME}
			</h1>
		</div>

		<div class="flex items-center gap-1">
			<SyncStatus />
			<button
				onclick={() => uiStore.cycleTheme()}
				class="flex items-center justify-center rounded-full p-2 text-[var(--color-text-secondary)] active:bg-[var(--color-surface)]"
				aria-label="Toggle theme (current: {uiStore.theme})"
			>
				{#if uiStore.theme === 'dark'}
					<Moon size={18} />
				{:else if uiStore.theme === 'light'}
					<Sun size={18} />
				{:else}
					<Monitor size={18} />
				{/if}
			</button>
		</div>
	</div>
</header>
