<script lang="ts">
	import type { CategoryBudgetRow, Account } from '$lib/types';
	import { ui } from '$lib/stores/ui.svelte';
	import GroupRow from './GroupRow.svelte';
	import CategoryRow from './CategoryRow.svelte';

	let {
		incomeRows,
		expenseRows,
		accounts = []
	}: {
		incomeRows: CategoryBudgetRow[];
		expenseRows: CategoryBudgetRow[];
		accounts?: Account[];
	} = $props();

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
</script>

{#snippet renderRows(rows: CategoryBudgetRow[])}
	{#each rows as row (row.uuid)}
		{#if row.group && row.children.length > 0}
			<GroupRow {row} />
		{:else}
			<CategoryRow {row} {accounts} />
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
		</tbody>
	</table>
</div>
