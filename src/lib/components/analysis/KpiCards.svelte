<script lang="ts">
	import type { MonthSummary } from '$lib/types';
	import type { OverBudgetAlert, UnplannedAlert } from '$lib/utils/chartData';
	import { formatEur } from '$lib/utils/budgetCalc';
	import { TrendingUp, TrendingDown, AlertTriangle, CircleDollarSign } from 'lucide-svelte';

	let {
		summary,
		overBudgetAlerts,
		unplannedAlerts
	}: {
		summary: MonthSummary;
		overBudgetAlerts: OverBudgetAlert[];
		unplannedAlerts: UnplannedAlert[];
	} = $props();

	let net = $derived(summary.netActual);
	let incomePercent = $derived(
		summary.totalIncomePlanned > 0
			? Math.round((summary.totalIncomeActual / summary.totalIncomePlanned) * 100)
			: 0
	);
	let expensePercent = $derived(
		summary.totalExpensesPlanned > 0
			? Math.round((summary.totalExpensesActual / summary.totalExpensesPlanned) * 100)
			: 0
	);
	let alertCount = $derived(overBudgetAlerts.length + unplannedAlerts.length);
</script>

<div class="grid grid-cols-4 gap-3 px-4 py-3">
	<!-- Net -->
	<div class="rounded-lg bg-bg-secondary border border-border p-3">
		<div class="flex items-center gap-2 mb-1">
			<CircleDollarSign size={14} class="text-text-muted" />
			<span class="text-xs text-text-muted">Netto</span>
		</div>
		<div class="text-lg font-semibold {net >= 0 ? 'text-positive' : 'text-negative'}">
			{net >= 0 ? '+' : ''}{formatEur(net)} €
		</div>
		<div class="text-[10px] text-text-dim mt-0.5">
			Geplant: {formatEur(summary.netPlanned)} €
		</div>
	</div>

	<!-- Income % -->
	<div class="rounded-lg bg-bg-secondary border border-border p-3">
		<div class="flex items-center gap-2 mb-1">
			<TrendingUp size={14} class="text-positive" />
			<span class="text-xs text-text-muted">Einnahmen</span>
		</div>
		<div class="text-lg font-semibold {incomePercent >= 100 ? 'text-positive' : 'text-warning'}">
			{incomePercent}%
		</div>
		<div class="text-[10px] text-text-dim mt-0.5">
			{formatEur(summary.totalIncomeActual)} / {formatEur(summary.totalIncomePlanned)} €
		</div>
	</div>

	<!-- Expenses % -->
	<div class="rounded-lg bg-bg-secondary border border-border p-3">
		<div class="flex items-center gap-2 mb-1">
			<TrendingDown size={14} class="text-negative" />
			<span class="text-xs text-text-muted">Ausgaben</span>
		</div>
		<div class="text-lg font-semibold {expensePercent <= 100 ? 'text-positive' : 'text-negative'}">
			{expensePercent}%
		</div>
		<div class="text-[10px] text-text-dim mt-0.5">
			{formatEur(summary.totalExpensesActual)} / {formatEur(summary.totalExpensesPlanned)} €
		</div>
	</div>

	<!-- Alerts -->
	<div class="rounded-lg bg-bg-secondary border border-border p-3">
		<div class="flex items-center gap-2 mb-1">
			<AlertTriangle size={14} class={alertCount > 0 ? 'text-warning' : 'text-text-muted'} />
			<span class="text-xs text-text-muted">Warnungen</span>
		</div>
		<div class="text-lg font-semibold {alertCount > 0 ? 'text-warning' : 'text-text-dim'}">
			{alertCount}
		</div>
		<div class="text-[10px] text-text-dim mt-0.5">
			{overBudgetAlerts.length} Budget · {unplannedAlerts.length} Ungeplant
		</div>
	</div>
</div>
