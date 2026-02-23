<script lang="ts">
	import type { CategoryBudgetRow, Account, VirtualItem, TemplateEntry } from '$lib/types';
	import { ui } from '$lib/stores/ui.svelte';
	import GroupRow from './GroupRow.svelte';
	import CategoryRow from './CategoryRow.svelte';
	import VirtualItemRow from './VirtualItemRow.svelte';

	let {
		incomeRows,
		expenseRows,
		accounts = [],
		virtualItems = [],
		scenarioId = null,
		baselineTemplate = null
	}: {
		incomeRows: CategoryBudgetRow[];
		expenseRows: CategoryBudgetRow[];
		accounts?: Account[];
		virtualItems?: VirtualItem[];
		scenarioId?: string | null;
		baselineTemplate?: Record<string, TemplateEntry> | null;
	} = $props();

	function getScenarioBaseline(uuid: string): number | null {
		if (!scenarioId || !baselineTemplate) return null;
		const baseAmt = baselineTemplate[uuid]?.amount ?? 0;
		const currentAmt = findPlannedInRows(uuid);
		if (Math.abs(currentAmt - baseAmt) > 0.005) return baseAmt;
		return null;
	}

	function findPlannedInRows(uuid: string): number {
		function search(rows: CategoryBudgetRow[]): number | null {
			for (const row of rows) {
				if (row.uuid === uuid) return row.planned;
				if (row.children.length > 0) {
					const found = search(row.children);
					if (found !== null) return found;
				}
			}
			return null;
		}
		return search([...incomeRows, ...expenseRows]) ?? 0;
	}

	function getGroupBaselinePlanned(row: CategoryBudgetRow): number | null {
		if (!scenarioId || !baselineTemplate) return null;
		function sumBaseline(rows: CategoryBudgetRow[]): number {
			let total = 0;
			for (const r of rows) {
				if (r.group && r.children.length > 0) {
					total += sumBaseline(r.children);
				} else {
					total += baselineTemplate![r.uuid]?.amount ?? 0;
				}
			}
			return total;
		}
		return sumBaseline(row.children);
	}

	// Flatten rows with collapse logic
	function flattenRows(rows: CategoryBudgetRow[]): CategoryBudgetRow[] {
		const result: CategoryBudgetRow[] = [];
		for (const row of rows) {
			result.push(row);
			if (row.group && row.children.length > 0 && !ui.isCollapsed(row.uuid)) {
				result.push(...flattenRows(row.children));
			}
		}
		return result;
	}

	let flatIncome = $derived(flattenRows(incomeRows));
	let flatExpenses = $derived(flattenRows(expenseRows));

	let hasVirtualItems = $derived(virtualItems.length > 0 && scenarioId != null);
</script>

{#snippet renderRows(rows: CategoryBudgetRow[])}
	{#each rows as row (row.uuid)}
		{#if row.group && row.children.length > 0}
			<GroupRow {row} scenarioBaselinePlanned={getGroupBaselinePlanned(row)} />
		{:else}
			<CategoryRow {row} {accounts} scenarioBaseline={getScenarioBaseline(row.uuid)} />
		{/if}
	{/each}
{/snippet}

<div class="flex-1 overflow-auto">
	<table class="border-collapse w-full table-fixed">
		<thead class="sticky top-0 bg-bg z-10">
			<tr class="border-b border-border text-text-dim text-[11px] uppercase tracking-wider">
				<th class="py-2 px-2 text-left font-medium">Kategorie</th>
				<th class="py-2 px-1 text-right font-medium w-[110px]">
					<span class="inline-flex items-center gap-1 float-right">
						<svg class="text-accent" width="8" height="8" viewBox="0 0 8 8"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1" fill="none"/></svg>
						Geplant
					</span>
				</th>
				<th class="py-2 px-3 text-right font-medium w-[100px]">Tatsächlich</th>
				<th class="py-2 px-3 text-right font-medium w-[100px]">Differenz</th>
				{#if ui.showAccountRouting}
					<th class="py-2 px-2 text-left font-medium w-[140px]">Quelle</th>
					<th class="py-2 px-2 text-left font-medium w-[140px]">Ziel</th>
				{/if}
			</tr>
		</thead>
		<tbody>
			<!-- Income section -->
			{#if flatIncome.length > 0}
				<tr>
					<td
						colspan={ui.showAccountRouting ? 6 : 4}
						class="py-2 px-2 text-[10px] uppercase tracking-widest text-text-dim font-medium bg-bg-secondary/30"
					>
						Einnahmen
					</td>
				</tr>
				{@render renderRows(flatIncome)}
			{/if}

			<!-- Spacer -->
			<tr>
				<td colspan={ui.showAccountRouting ? 6 : 4} class="py-2"></td>
			</tr>

			<!-- Expenses section -->
			{#if flatExpenses.length > 0}
				<tr>
					<td
						colspan={ui.showAccountRouting ? 6 : 4}
						class="py-2 px-2 text-[10px] uppercase tracking-widest text-text-dim font-medium bg-bg-secondary/30"
					>
						Ausgaben
					</td>
				</tr>
				{@render renderRows(flatExpenses)}
			{/if}

			<!-- Virtual items section (scenario only) -->
			{#if hasVirtualItems}
				<tr>
					<td colspan={ui.showAccountRouting ? 6 : 4} class="py-1"></td>
				</tr>
				<tr>
					<td
						colspan={ui.showAccountRouting ? 6 : 4}
						class="py-2 px-2 text-[10px] uppercase tracking-widest text-accent/70 font-medium bg-accent/5"
					>
						Szenario-Posten
					</td>
				</tr>
				{#each virtualItems as item (item.id)}
					<VirtualItemRow {item} scenarioId={scenarioId!} />
				{/each}
			{/if}
		</tbody>
	</table>
</div>
