<script lang="ts">
	import type { MonthSummary } from '$lib/types';
	import { formatEur } from '$lib/utils/budgetCalc';
	import MonthSelector from './MonthSelector.svelte';

	let { summary }: { summary: MonthSummary } = $props();
</script>

<div class="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary/50">
	<MonthSelector />

	<div class="flex items-center gap-6 text-sm">
		<div class="flex flex-col items-end">
			<span class="text-[10px] uppercase tracking-wider text-text-dim">Einnahmen</span>
			<div class="flex items-center gap-2">
				<span class="text-text-muted">{formatEur(summary.totalIncomePlanned)}</span>
				<span class="font-medium text-positive">{formatEur(summary.totalIncomeActual)}</span>
			</div>
		</div>

		<div class="flex flex-col items-end">
			<span class="text-[10px] uppercase tracking-wider text-text-dim">Ausgaben</span>
			<div class="flex items-center gap-2">
				<span class="text-text-muted">{formatEur(summary.totalExpensesPlanned)}</span>
				<span class="font-medium text-negative">{formatEur(summary.totalExpensesActual)}</span>
			</div>
		</div>

		<div class="flex flex-col items-end">
			<span class="text-[10px] uppercase tracking-wider text-text-dim">Netto</span>
			<div class="flex items-center gap-2">
				<span class="text-text-muted">{formatEur(summary.netPlanned)}</span>
				<span
					class="font-medium {summary.netActual >= 0 ? 'text-positive' : 'text-negative'}"
				>
					{formatEur(summary.netActual)}
				</span>
			</div>
		</div>
	</div>
</div>
