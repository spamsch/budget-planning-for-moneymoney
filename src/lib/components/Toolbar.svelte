<script lang="ts">
	import { Save, RefreshCw, Route, Settings } from 'lucide-svelte';
	import { budget } from '$lib/stores/budget.svelte';
	import { mm } from '$lib/stores/moneymoney.svelte';
	import { ui } from '$lib/stores/ui.svelte';

	let { showSettings = $bindable(false) }: { showSettings?: boolean } = $props();

	async function handleSave() {
		await budget.saveBudget();
	}

	async function handleRefresh() {
		mm.clearCache();
		await mm.refresh();
	}
</script>

<div class="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-secondary">
	<div class="flex items-center gap-3">
		<h1 class="text-lg font-semibold">
			{budget.current.name}
		</h1>
		{#if budget.dirty}
			<span class="text-xs text-warning">unsaved</span>
		{/if}
	</div>

	<div class="flex items-center gap-2">
		<button
			onclick={() => ui.toggleAccountRouting()}
			class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors {ui.showAccountRouting
				? 'bg-accent/20 text-accent'
				: 'text-text-muted hover:text-text hover:bg-bg-tertiary'}"
			title="Toggle account routing"
		>
			<Route size={14} />
			Konten
		</button>

		<button
			onclick={() => (showSettings = !showSettings)}
			class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors {showSettings
				? 'bg-accent/20 text-accent'
				: 'text-text-muted hover:text-text hover:bg-bg-tertiary'}"
			title="Kontakte & Konten"
		>
			<Settings size={14} />
			Kontakte
		</button>

		<button
			onclick={handleRefresh}
			class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded text-text-muted hover:text-text hover:bg-bg-tertiary transition-colors"
			disabled={mm.loading}
			title="Refresh from MoneyMoney"
		>
			<RefreshCw size={14} class={mm.loading ? 'animate-spin' : ''} />
			Aktualisieren
		</button>

		<button
			onclick={handleSave}
			class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors {budget.dirty
				? 'bg-accent text-white hover:bg-accent-hover'
				: 'text-text-muted hover:text-text hover:bg-bg-tertiary'}"
			disabled={budget.saving}
			title="Save budget (⌘S)"
		>
			<Save size={14} />
			Speichern
		</button>
	</div>
</div>
