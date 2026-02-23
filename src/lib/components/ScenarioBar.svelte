<script lang="ts">
	import type { ScenarioImpactSummary, Scenario } from '$lib/types';
	import { budget } from '$lib/stores/budget.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { formatEur } from '$lib/utils/budgetCalc';
	import { X, Plus, ArrowRightToLine } from 'lucide-svelte';

	let {
		scenario,
		impact,
		onAddItem
	}: {
		scenario: Scenario;
		impact: ScenarioImpactSummary;
		onAddItem: () => void;
	} = $props();

	let showApplyConfirm = $state(false);

	function handleApply() {
		budget.applyScenarioToBaseline(scenario.id);
		ui.deactivateScenario();
		showApplyConfirm = false;
	}

	function formatDelta(value: number): string {
		const sign = value > 0 ? '+' : '';
		return sign + formatEur(value);
	}

	let scenarioNet = $derived(impact.scenarioIncome - impact.scenarioExpenses);
</script>

<div class="flex items-center justify-between px-4 py-2 border-b border-accent/30 bg-accent/5">
	<div class="flex items-center gap-3">
		<span class="px-2 py-0.5 rounded text-xs font-medium bg-accent/20 text-accent">
			{scenario.name}
		</span>
		<button
			onclick={() => ui.deactivateScenario()}
			class="text-xs text-text-dim hover:text-text transition-colors"
		>
			Baseline
		</button>
	</div>

	<div class="flex items-center gap-4 text-xs">
		<span class="px-2 py-0.5 rounded bg-bg-tertiary text-text-muted">
			Einnahmen: {formatEur(impact.scenarioIncome)}
		</span>
		<span class="px-2 py-0.5 rounded bg-bg-tertiary text-text-muted">
			Ausgaben: {formatEur(impact.scenarioExpenses)}
		</span>
		<span
			class="px-2 py-1 rounded font-semibold {scenarioNet >= 0
				? 'bg-positive/10 text-positive'
				: 'bg-negative/10 text-negative'}"
		>
			Netto: {formatEur(scenarioNet)}/Mo
		</span>
		<span
			class="px-1.5 py-0.5 rounded text-[10px] {impact.netDelta >= 0
				? 'text-positive'
				: 'text-negative'}"
		>
			({formatDelta(impact.netDelta)} vs. Basis)
		</span>
	</div>

	<div class="flex items-center gap-2">
		<button
			onclick={onAddItem}
			class="flex items-center gap-1 px-2 py-1 text-xs rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
		>
			<Plus size={12} />
			Posten
		</button>

		{#if showApplyConfirm}
			<div class="flex items-center gap-1">
				<span class="text-xs text-text-muted">Übernehmen?</span>
				<button
					onclick={handleApply}
					class="px-2 py-1 text-xs rounded bg-accent text-white hover:bg-accent/80 transition-colors"
				>
					Ja
				</button>
				<button
					onclick={() => (showApplyConfirm = false)}
					class="px-2 py-1 text-xs rounded bg-bg-tertiary text-text-muted hover:text-text transition-colors"
				>
					Nein
				</button>
			</div>
		{:else}
			<button
				onclick={() => (showApplyConfirm = true)}
				class="flex items-center gap-1 px-2 py-1 text-xs rounded text-text-dim hover:text-accent hover:bg-accent/10 transition-colors"
				title="Szenario in Baseline übernehmen"
			>
				<ArrowRightToLine size={12} />
				Übernehmen
			</button>
		{/if}

		<button
			onclick={() => ui.deactivateScenario()}
			class="p-1 rounded text-text-dim hover:text-text hover:bg-bg-tertiary transition-colors"
			title="Szenario schließen"
		>
			<X size={14} />
		</button>
	</div>
</div>
