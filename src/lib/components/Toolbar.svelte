<script lang="ts">
	import { Save, RefreshCw, Route, Settings, StickyNote } from 'lucide-svelte';
	import { budget } from '$lib/stores/budget.svelte';
	import { mm } from '$lib/stores/moneymoney.svelte';
	import { ui, monthToDateRange } from '$lib/stores/ui.svelte';

	let {
		showSettings = $bindable(false),
		showNotes = $bindable(false)
	}: {
		showSettings?: boolean;
		showNotes?: boolean;
	} = $props();

	async function handleSave() {
		await budget.saveBudget();
	}

	let editing = $state(false);
	let editValue = $state('');

	function startRename() {
		editValue = budget.current.name;
		editing = true;
	}

	async function commitRename() {
		editing = false;
		await budget.renameBudget(editValue);
	}

	function handleRenameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			(e.target as HTMLInputElement).blur();
		} else if (e.key === 'Escape') {
			editing = false;
		}
	}

	async function handleRefresh() {
		mm.clearCache();
		await mm.refresh();
		const { from, to } = monthToDateRange(ui.selectedMonth);
		await mm.fetchTransactions(from, to, budget.current.settings.accounts);
	}
</script>

<div class="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-secondary">
	<div class="flex items-center gap-3">
		{#if editing}
			<input
				type="text"
				bind:value={editValue}
				onblur={commitRename}
				onkeydown={handleRenameKeydown}
				class="text-lg font-semibold bg-transparent border-b border-accent outline-none px-0 py-0"
				autofocus
			/>
		{:else}
			<h1
				class="text-lg font-semibold cursor-pointer hover:text-accent transition-colors"
				ondblclick={startRename}
				title="Doppelklick zum Umbenennen"
			>
				{budget.current.name}
			</h1>
		{/if}
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
			onclick={() => (showNotes = !showNotes)}
			class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors {showNotes
				? 'bg-accent/20 text-accent'
				: 'text-text-muted hover:text-text hover:bg-bg-tertiary'}"
			title="Notizen"
		>
			<StickyNote size={14} />
			Notizen
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

		{#if mm.lastRefresh}
			<span class="text-[10px] text-text-dim" title="Letzte Aktualisierung">
				{mm.lastRefresh.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
			</span>
		{/if}

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
