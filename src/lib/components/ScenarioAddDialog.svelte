<script lang="ts">
	import type { CategoryNode } from '$lib/types';
	import { budget } from '$lib/stores/budget.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { X } from 'lucide-svelte';

	let {
		leafCategories,
		onclose
	}: {
		leafCategories: { uuid: string; name: string; path: string }[];
		onclose: () => void;
	} = $props();

	let search = $state('');
	let selectedUuid = $state<string | null>(null);
	let customName = $state('');
	let amount = $state('');
	let isIncome = $state(false);

	let filtered = $derived.by(() => {
		const q = search.toLowerCase();
		if (!q) return leafCategories.slice(0, 20);
		return leafCategories.filter(
			(c) => c.name.toLowerCase().includes(q) || c.path.toLowerCase().includes(q)
		).slice(0, 20);
	});

	let isCustom = $derived(search.trim() !== '' && !selectedUuid);
	let canSubmit = $derived((selectedUuid || search.trim()) && parseFloat(amount) > 0);

	function selectCategory(uuid: string, name: string) {
		selectedUuid = uuid;
		search = name;
	}

	function clearSelection() {
		selectedUuid = null;
	}

	function handleSubmit() {
		const scenarioId = ui.activeScenarioId;
		if (!scenarioId) return;
		const amt = parseFloat(amount) || 0;
		if (amt <= 0) return;

		if (selectedUuid) {
			// Override existing MM category
			budget.setScenarioOverride(scenarioId, selectedUuid, amt);
		} else if (search.trim()) {
			// Virtual item
			budget.addVirtualItem(scenarioId, search.trim(), amt, isIncome);
		}
		onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	let showDropdown = $state(false);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
	onkeydown={handleKeydown}
	onclick={onclose}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="bg-bg border border-border rounded-xl shadow-xl w-[400px] p-5"
		onclick={(e) => e.stopPropagation()}
	>
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-sm font-semibold">Posten hinzufügen</h3>
			<button
				onclick={onclose}
				class="p-1 rounded text-text-dim hover:text-text hover:bg-bg-tertiary transition-colors"
			>
				<X size={16} />
			</button>
		</div>

		<div class="flex flex-col gap-3">
			<!-- Category search -->
			<div class="relative">
				<label for="scenario-cat-search" class="text-xs text-text-dim mb-1 block">Kategorie</label>
				<input
					id="scenario-cat-search"
					type="text"
					bind:value={search}
					oninput={() => { selectedUuid = null; showDropdown = true; }}
					onfocus={() => (showDropdown = true)}
					onblur={() => setTimeout(() => (showDropdown = false), 200)}
					placeholder="Kategorie suchen oder Name eingeben..."
					class="w-full bg-bg-input border border-border rounded px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
				/>
				{#if showDropdown && filtered.length > 0 && !selectedUuid}
					<div class="absolute z-10 w-full mt-1 bg-bg border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
						{#each filtered as cat}
							<button
								class="w-full text-left px-3 py-1.5 text-sm hover:bg-bg-row-hover transition-colors"
								onmousedown={() => selectCategory(cat.uuid, cat.name)}
							>
								<span class="text-text">{cat.name}</span>
								{#if cat.path}
									<span class="text-[10px] text-text-dim ml-1">{cat.path}</span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
				{#if isCustom && search.trim()}
					<span class="text-[10px] text-accent mt-0.5 block">Eigener Posten (nicht in MoneyMoney)</span>
				{/if}
			</div>

			<!-- Amount -->
			<div>
				<label for="scenario-amount" class="text-xs text-text-dim mb-1 block">Betrag</label>
				<input
					id="scenario-amount"
					type="number"
					step="0.01"
					min="0"
					bind:value={amount}
					placeholder="0,00"
					class="w-full bg-bg-input border border-border rounded px-3 py-2 text-sm font-mono text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
					onkeydown={(e) => { if (e.key === 'Enter' && canSubmit) handleSubmit(); }}
				/>
			</div>

			<!-- Type (only for virtual items) -->
			{#if isCustom}
				<div>
					<span class="text-xs text-text-dim mb-1 block">Typ</span>
					<div class="flex gap-3">
						<label class="flex items-center gap-1.5 text-sm cursor-pointer">
							<input
								type="radio"
								name="type"
								checked={!isIncome}
								onchange={() => (isIncome = false)}
								class="accent-accent"
							/>
							Ausgabe
						</label>
						<label class="flex items-center gap-1.5 text-sm cursor-pointer">
							<input
								type="radio"
								name="type"
								checked={isIncome}
								onchange={() => (isIncome = true)}
								class="accent-accent"
							/>
							Einnahme
						</label>
					</div>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex justify-end gap-2 mt-1">
				<button
					onclick={onclose}
					class="px-4 py-2 text-xs rounded bg-bg-tertiary text-text-muted hover:text-text transition-colors"
				>
					Abbrechen
				</button>
				<button
					onclick={handleSubmit}
					disabled={!canSubmit}
					class="px-4 py-2 text-xs rounded bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
				>
					Hinzufügen
				</button>
			</div>
		</div>
	</div>
</div>
