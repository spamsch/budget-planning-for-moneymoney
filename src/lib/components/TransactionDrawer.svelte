<script lang="ts">
	import type { CategoryBudgetRow, Transaction } from '$lib/types';
	import { ui } from '$lib/stores/ui.svelte';
	import { formatEur, getTransactionsForCategory } from '$lib/utils/budgetCalc';
	import { X } from 'lucide-svelte';

	type TxMap = Map<string, { total: number; transactions: Transaction[] }>;

	let {
		incomeRows,
		expenseRows,
		txMap
	}: {
		incomeRows: CategoryBudgetRow[];
		expenseRows: CategoryBudgetRow[];
		txMap: TxMap;
	} = $props();

	let allRows = $derived([...incomeRows, ...expenseRows]);

	let result = $derived.by(() => {
		const uuid = ui.selectedCategoryUuid;
		if (!uuid) return { row: undefined, transactions: [] };
		return getTransactionsForCategory(uuid, allRows, txMap);
	});

	let categoryName = $derived(result.row?.name ?? '');
	let transactions = $derived(result.transactions);

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}
</script>

<div class="h-[250px] border-t border-border bg-bg-secondary flex flex-col shrink-0">
	<!-- Header -->
	<div class="flex items-center justify-between px-4 py-2 border-b border-border">
		<div class="flex items-center gap-2 text-sm">
			<span class="font-medium text-text">{categoryName}</span>
			<span class="text-text-dim">({transactions.length} Transaktionen)</span>
		</div>
		<button
			onclick={() => ui.clearSelection()}
			class="p-1 text-text-dim hover:text-text rounded hover:bg-bg-row-hover transition-colors"
		>
			<X size={16} />
		</button>
	</div>

	<!-- Table -->
	{#if transactions.length === 0}
		<div class="flex-1 flex items-center justify-center text-sm text-text-dim">
			Keine Transaktionen in diesem Monat
		</div>
	{:else}
		<div class="flex-1 overflow-auto">
			<table class="w-full text-sm">
				<thead class="sticky top-0 bg-bg-secondary">
					<tr class="text-text-dim text-xs">
						<th class="text-left py-1.5 px-4 font-medium">Datum</th>
						<th class="text-left py-1.5 px-3 font-medium">Name</th>
						<th class="text-left py-1.5 px-3 font-medium">Verwendungszweck</th>
						<th class="text-right py-1.5 px-4 font-medium">Betrag</th>
					</tr>
				</thead>
				<tbody>
					{#each transactions as tx (tx.id)}
						<tr class="hover:bg-bg-row-hover transition-colors border-t border-border/50">
							<td class="py-1.5 px-4 text-text-muted whitespace-nowrap">{formatDate(tx.bookingDate)}</td>
							<td class="py-1.5 px-3 text-text truncate max-w-[200px]">{tx.name}</td>
							<td class="py-1.5 px-3 text-text-muted truncate max-w-[300px]">{tx.purpose ?? ''}</td>
							<td class="py-1.5 px-4 text-right font-mono whitespace-nowrap {tx.amount >= 0 ? 'text-positive' : 'text-negative'}">
								{formatEur(tx.amount)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
