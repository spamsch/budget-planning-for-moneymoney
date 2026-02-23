<script lang="ts">
	import type { CategoryNode } from '$lib/types';
	import { budget } from '$lib/stores/budget.svelte';
	import { mm } from '$lib/stores/moneymoney.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { formatEur, computeScenarioImpactSummary } from '$lib/utils/budgetCalc';
	import { FlaskConical, Copy, Trash2, Play, Pencil, ArrowRight, StickyNote } from 'lucide-svelte';

	let {
		categoryNodes = [],
		incomeUuids = new Set<string>(),
		excludedUuids = new Set<string>()
	}: {
		categoryNodes?: CategoryNode[];
		incomeUuids?: Set<string>;
		excludedUuids?: Set<string>;
	} = $props();

	let newName = $state('');
	let editingId = $state<string | null>(null);
	let editValue = $state('');
	let editingDescId = $state<string | null>(null);
	let descValue = $state('');
	let editingNotesId = $state<string | null>(null);
	let notesValue = $state('');
	let confirmDeleteId = $state<string | null>(null);

	// Build a uuid → name lookup from MM categories
	let categoryNameMap = $derived.by(() => {
		const map = new Map<string, string>();
		for (const cat of mm.categories) {
			map.set(cat.uuid, cat.name);
		}
		return map;
	});

	function handleCreate() {
		const name = newName.trim();
		if (!name) return;
		const id = budget.createScenario(name);
		newName = '';
		ui.activateScenario(id);
	}

	function handleCreateKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleCreate();
	}

	function startRename(id: string, name: string) {
		editingId = id;
		editValue = name;
	}

	function commitRename(id: string) {
		editingId = null;
		if (editValue.trim()) {
			budget.renameScenario(id, editValue);
		}
	}

	function startEditDesc(id: string, desc: string | undefined) {
		editingDescId = id;
		descValue = desc ?? '';
	}

	function commitDesc(id: string) {
		editingDescId = null;
		budget.updateScenarioDescription(id, descValue);
	}

	function startEditNotes(id: string, notes: string | undefined) {
		editingNotesId = id;
		notesValue = notes ?? '';
	}

	function commitNotes(id: string) {
		editingNotesId = null;
		budget.updateScenarioNotes(id, notesValue);
	}

	function handleDuplicate(id: string, name: string) {
		budget.duplicateScenario(id, `${name} (Kopie)`);
	}

	function handleDelete(id: string) {
		const count = budget.getScenarioOverrideCount(id);
		if (count > 0 && confirmDeleteId !== id) {
			confirmDeleteId = id;
			return;
		}
		confirmDeleteId = null;
		if (ui.activeScenarioId === id) {
			ui.deactivateScenario();
		}
		budget.deleteScenario(id);
	}

	function handleActivate(id: string) {
		if (ui.activeScenarioId === id) {
			ui.deactivateScenario();
		} else {
			ui.activateScenario(id);
		}
	}

	let scenarios = $derived(budget.current.scenarios);

	function getImpact(scenarioId: string) {
		if (categoryNodes.length === 0) return null;
		const resolved = budget.getResolvedTemplate(scenarioId);
		const scenario = budget.current.scenarios.find((s) => s.id === scenarioId);
		if (!scenario) return null;
		return computeScenarioImpactSummary(
			budget.current.template,
			resolved,
			scenario.virtualItems,
			categoryNodes,
			incomeUuids,
			excludedUuids
		);
	}

	function formatDelta(value: number): string {
		const sign = value > 0 ? '+' : '';
		return sign + formatEur(value);
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-center gap-2">
		<FlaskConical size={16} class="text-accent" />
		<h3 class="text-sm font-semibold">Szenarien</h3>
	</div>

	{#if scenarios.length === 0}
		<p class="text-xs text-text-dim leading-relaxed">
			Erstelle Szenarien, um verschiedene Budget-Varianten zu simulieren, z.B. "Mit Auto" oder "Ohne Streaming".
		</p>
	{/if}

	{#each scenarios as scenario (scenario.id)}
		{@const isActive = ui.activeScenarioId === scenario.id}
		{@const overrideEntries = Object.entries(scenario.overrides)}
		{@const changeCount = overrideEntries.length + scenario.virtualItems.length}
		<div
			class="rounded-lg border transition-colors {isActive
				? 'border-accent/50 bg-accent/5'
				: 'border-border bg-bg-tertiary/50 hover:border-border-hover'}"
		>
			<div class="p-2.5">
				<div class="flex items-center justify-between gap-2">
					{#if editingId === scenario.id}
						<input
							type="text"
							bind:value={editValue}
							onblur={() => commitRename(scenario.id)}
							onkeydown={(e) => { if (e.key === 'Enter') commitRename(scenario.id); if (e.key === 'Escape') editingId = null; }}
							class="flex-1 bg-transparent border-b border-accent text-sm font-medium outline-none px-0 py-0"
							autofocus
						/>
					{:else}
						<button
							onclick={() => handleActivate(scenario.id)}
							class="flex-1 text-left text-sm font-medium truncate hover:text-accent transition-colors"
						>
							{scenario.name}
						</button>
					{/if}
					<div class="flex items-center gap-0.5 shrink-0">
						<button
							onclick={() => handleActivate(scenario.id)}
							class="p-1 rounded text-text-dim hover:text-accent hover:bg-accent/10 transition-colors"
							title={isActive ? 'Deaktivieren' : 'Aktivieren'}
						>
							<Play size={12} class={isActive ? 'text-accent fill-accent' : ''} />
						</button>
						<button
							onclick={() => startRename(scenario.id, scenario.name)}
							class="p-1 rounded text-text-dim hover:text-accent hover:bg-accent/10 transition-colors"
							title="Umbenennen"
						>
							<Pencil size={12} />
						</button>
						<button
							onclick={() => handleDuplicate(scenario.id, scenario.name)}
							class="p-1 rounded text-text-dim hover:text-accent hover:bg-accent/10 transition-colors"
							title="Duplizieren"
						>
							<Copy size={12} />
						</button>
						<button
							onclick={() => handleDelete(scenario.id)}
							class="p-1 rounded text-text-dim hover:text-negative hover:bg-negative/10 transition-colors"
							title="Löschen"
						>
							<Trash2 size={12} />
						</button>
					</div>
				</div>

				{#if confirmDeleteId === scenario.id}
					<div class="mt-1.5 flex items-center gap-2 text-xs">
						<span class="text-text-muted">Löschen?</span>
						<button
							onclick={() => handleDelete(scenario.id)}
							class="px-2 py-0.5 rounded bg-negative/20 text-negative hover:bg-negative/30 transition-colors"
						>
							Ja
						</button>
						<button
							onclick={() => (confirmDeleteId = null)}
							class="px-2 py-0.5 rounded bg-bg-tertiary text-text-muted hover:text-text transition-colors"
						>
							Nein
						</button>
					</div>
				{/if}

				{#if editingDescId === scenario.id}
					<textarea
						class="w-full mt-1.5 bg-bg-input border border-border rounded px-2 py-1 text-xs text-text focus:outline-none focus:border-accent resize-y min-h-[2rem]"
						rows="2"
						placeholder="Beschreibung..."
						bind:value={descValue}
						onblur={() => commitDesc(scenario.id)}
						onkeydown={(e) => { if (e.key === 'Escape') editingDescId = null; }}
						autofocus
					></textarea>
				{:else if scenario.description}
					<button
						onclick={() => startEditDesc(scenario.id, scenario.description)}
						class="mt-1 text-xs text-text-dim hover:text-text transition-colors text-left w-full truncate"
					>
						{scenario.description}
					</button>
				{:else}
					<button
						onclick={() => startEditDesc(scenario.id, undefined)}
						class="mt-1 text-[10px] text-text-dim/50 hover:text-text-dim transition-colors"
					>
						+ Beschreibung
					</button>
				{/if}

				<!-- Notes -->
				{#if editingNotesId === scenario.id}
					<textarea
						class="w-full mt-1.5 bg-bg-input border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-accent resize-y min-h-[3rem]"
						rows="3"
						placeholder="Notizen zum Szenario..."
						bind:value={notesValue}
						onblur={() => commitNotes(scenario.id)}
						onkeydown={(e) => { if (e.key === 'Escape') { editingNotesId = null; } }}
						autofocus
					></textarea>
				{:else if scenario.notes}
					<button
						onclick={() => startEditNotes(scenario.id, scenario.notes)}
						class="mt-1.5 w-full text-left text-xs text-text-dim hover:text-text transition-colors bg-bg-tertiary/50 rounded px-2 py-1.5 whitespace-pre-wrap leading-relaxed"
					>
						<span class="inline-flex items-center gap-1 text-[10px] text-text-dim/70 mb-0.5">
							<StickyNote size={10} /> Notizen
						</span>
						<br />{scenario.notes}
					</button>
				{:else}
					<button
						onclick={() => startEditNotes(scenario.id, undefined)}
						class="mt-1 text-[10px] text-text-dim/50 hover:text-text-dim transition-colors inline-flex items-center gap-1"
					>
						<StickyNote size={10} /> + Notiz
					</button>
				{/if}

				<!-- Compact changes list -->
				{#if changeCount > 0}
					<div class="mt-2 flex flex-col gap-0.5">
						{#each overrideEntries as [uuid, override]}
							{@const catName = categoryNameMap.get(uuid) ?? uuid.slice(0, 8)}
							{@const baselineAmt = budget.current.template[uuid]?.amount ?? 0}
							<div class="flex items-center justify-between text-[11px] leading-tight">
								<span class="text-text-muted truncate mr-2">{catName}</span>
								<span class="shrink-0 font-mono flex items-center gap-1">
									<span class="text-text-dim">{formatEur(baselineAmt)}</span>
									<ArrowRight size={9} class="text-text-dim" />
									<span class="text-accent">{formatEur(override.amount)}</span>
								</span>
							</div>
						{/each}
						{#each scenario.virtualItems as item}
							<div class="flex items-center justify-between text-[11px] leading-tight">
								<span class="text-text-muted truncate mr-2 italic">{item.name}</span>
								<span class="shrink-0 font-mono flex items-center gap-1">
									<span class="text-[9px] px-1 rounded {item.isIncome ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}">
										{item.isIncome ? '+' : '−'}{formatEur(item.amount)}
									</span>
								</span>
							</div>
						{/each}
					</div>

					<!-- Scenario net summary -->
					{@const impact = getImpact(scenario.id)}
					{#if impact}
						{@const scenarioNet = impact.scenarioIncome - impact.scenarioExpenses}
						<div class="mt-2 pt-2 border-t border-border/50 flex items-baseline justify-between">
							<span class="text-[11px] font-medium {scenarioNet >= 0 ? 'text-positive' : 'text-negative'}">
								Netto: {formatEur(scenarioNet)}/Mo
							</span>
							<span class="text-[10px] text-text-dim">
								{formatDelta(impact.netDelta)} vs. Basis
							</span>
						</div>
					{/if}
				{:else}
					<div class="mt-1.5 text-[10px] text-text-dim">
						Keine Änderungen
					</div>
				{/if}
			</div>
		</div>
	{/each}

	<div class="flex gap-1.5">
		<input
			type="text"
			bind:value={newName}
			onkeydown={handleCreateKeydown}
			placeholder="Neues Szenario..."
			class="flex-1 bg-bg-input border border-border rounded px-2 py-1.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
		/>
		<button
			onclick={handleCreate}
			disabled={!newName.trim()}
			class="px-3 py-1.5 text-xs rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
		>
			Erstellen
		</button>
	</div>
</div>
