<script lang="ts">
	import type { CategoryBudgetRow, MonthSummary, UnplannedTransaction } from '$lib/types';
	import {
		rowsToBarData,
		collectOverBudgetItems,
		collectUnplannedAlerts
	} from '$lib/utils/chartData';
	import KpiCards from './KpiCards.svelte';
	import ChartFilterBar from './ChartFilterBar.svelte';
	import PieChartPanel from './PieChartPanel.svelte';
	import BarChartPanel from './BarChartPanel.svelte';
	import AlertsPanel from './AlertsPanel.svelte';

	let {
		incomeRows,
		expenseRows,
		summary,
		unplannedForMonth
	}: {
		incomeRows: CategoryBudgetRow[];
		expenseRows: CategoryBudgetRow[];
		summary: MonthSummary;
		unplannedForMonth: Array<{
			categoryUuid: string;
			transactions: UnplannedTransaction[];
		}>;
	} = $props();

	let valueMode = $state<'planned' | 'actual'>('actual');
	let categoryFilter = $state<'all' | 'expenses' | 'income'>('all');

	// Derived chart data
	let barData = $derived(rowsToBarData(expenseRows));
	let overBudgetAlerts = $derived(collectOverBudgetItems(incomeRows, expenseRows));
	let unplannedAlerts = $derived(
		collectUnplannedAlerts(unplannedForMonth, [...incomeRows, ...expenseRows])
	);

	let showExpensePie = $derived(categoryFilter === 'all' || categoryFilter === 'expenses');
	let showIncomePie = $derived(categoryFilter === 'all' || categoryFilter === 'income');
</script>

<div class="flex-1 overflow-auto">
	<!-- KPI Cards -->
	<KpiCards {summary} {overBudgetAlerts} {unplannedAlerts} />

	<!-- Filter Bar -->
	<ChartFilterBar bind:valueMode bind:categoryFilter />

	<!-- Pie Charts -->
	<div class="flex gap-4 px-4 py-2">
		{#if showExpensePie}
			<PieChartPanel title="Ausgaben" rows={expenseRows} {valueMode} color="negative" />
		{/if}
		{#if showIncomePie}
			<PieChartPanel title="Einnahmen" rows={incomeRows} {valueMode} color="positive" />
		{/if}
	</div>

	<!-- Bar Chart -->
	{#if barData.length > 0}
		<BarChartPanel items={barData} />
	{/if}

	<!-- Alerts -->
	<AlertsPanel {overBudgetAlerts} {unplannedAlerts} />
</div>
