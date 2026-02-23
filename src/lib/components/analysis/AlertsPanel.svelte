<script lang="ts">
	import type { OverBudgetAlert, UnplannedAlert } from '$lib/utils/chartData';
	import { formatEur } from '$lib/utils/budgetCalc';
	import { ui } from '$lib/stores/ui.svelte';
	import { ChevronDown, ChevronUp, AlertTriangle, CircleAlert } from 'lucide-svelte';

	let {
		overBudgetAlerts,
		unplannedAlerts
	}: {
		overBudgetAlerts: OverBudgetAlert[];
		unplannedAlerts: UnplannedAlert[];
	} = $props();

	let collapsed = $state(false);

	let totalAlerts = $derived(overBudgetAlerts.length + unplannedAlerts.length);
	let overBudgetSum = $derived(overBudgetAlerts.reduce((sum, a) => sum + a.overAmount, 0));
	let unplannedSum = $derived(unplannedAlerts.reduce((sum, a) => sum + a.totalAmount, 0));
</script>

{#if totalAlerts > 0}
	<div class="px-4 py-2">
		<button
			onclick={() => (collapsed = !collapsed)}
			class="flex items-center gap-2 text-xs font-medium text-text-muted hover:text-text transition-colors w-full"
		>
			{#if collapsed}
				<ChevronDown size={14} />
			{:else}
				<ChevronUp size={14} />
			{/if}
			Warnungen ({totalAlerts})
		</button>

		{#if !collapsed}
			<div class="mt-2 grid grid-cols-2 gap-3">
				<!-- Over Budget -->
				<div class="rounded-lg bg-bg-secondary border border-border p-3">
					<div class="flex items-center gap-2 mb-2">
						<AlertTriangle size={14} class="text-negative" />
						<span class="text-xs font-medium text-negative">
							Budgetüberschreitung ({overBudgetAlerts.length})
						</span>
					</div>
					{#if overBudgetAlerts.length === 0}
						<div class="text-[11px] text-text-dim py-2">Keine Überschreitungen</div>
					{:else}
						<div class="flex flex-col gap-1 max-h-48 overflow-auto">
							{#each overBudgetAlerts as alert}
								<button
									onclick={() => ui.selectCategory(alert.uuid)}
									class="flex items-center justify-between px-2 py-1.5 text-[11px] rounded hover:bg-bg-row-hover transition-colors text-left"
								>
									<span class="text-text truncate mr-2">{alert.name}</span>
									<span class="text-negative whitespace-nowrap font-medium">
										+{formatEur(alert.overAmount)} €
									</span>
								</button>
							{/each}
						</div>
						<div class="flex items-center justify-between px-2 pt-2 mt-1 border-t border-border text-[11px]">
							<span class="text-text-muted font-medium">Summe</span>
							<span class="text-negative font-semibold">+{formatEur(overBudgetSum)} €</span>
						</div>
					{/if}
				</div>

				<!-- Unplanned -->
				<div class="rounded-lg bg-bg-secondary border border-border p-3">
					<div class="flex items-center gap-2 mb-2">
						<CircleAlert size={14} class="text-warning" />
						<span class="text-xs font-medium text-warning">
							Ungeplant ({unplannedAlerts.length})
						</span>
					</div>
					{#if unplannedAlerts.length === 0}
						<div class="text-[11px] text-text-dim py-2">Keine ungeplanten Transaktionen</div>
					{:else}
						<div class="flex flex-col gap-1 max-h-48 overflow-auto">
							{#each unplannedAlerts as alert}
								<button
									onclick={() => ui.selectCategory(alert.categoryUuid)}
									class="flex items-center justify-between px-2 py-1.5 text-[11px] rounded hover:bg-bg-row-hover transition-colors text-left"
								>
									<div class="truncate mr-2">
										<span class="text-text">{alert.categoryName}</span>
										<span class="text-text-dim ml-1">({alert.transactions.length})</span>
									</div>
									<span class="text-warning whitespace-nowrap font-medium">
										{formatEur(alert.totalAmount)} €
									</span>
								</button>
							{/each}
						</div>
						<div class="flex items-center justify-between px-2 pt-2 mt-1 border-t border-border text-[11px]">
							<span class="text-text-muted font-medium">Summe</span>
							<span class="text-warning font-semibold">{formatEur(unplannedSum)} €</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
