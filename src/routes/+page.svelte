<script lang="ts">
	import { onMount } from 'svelte';
	import { mm } from '$lib/stores/moneymoney.svelte';
	import { budget } from '$lib/stores/budget.svelte';
	import { ui, monthToDateRange } from '$lib/stores/ui.svelte';
	import {
		groupTransactionsByCategory,
		computeCategoryRows,
		computeMonthSummary
	} from '$lib/utils/budgetCalc';
	import { splitIncomeExpense, collectAllUuids } from '$lib/utils/categoryTree';
	import { AlertTriangle } from 'lucide-svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import OverviewBar from '$lib/components/OverviewBar.svelte';
	import BudgetView from '$lib/components/BudgetView.svelte';
	import AccountSelector from '$lib/components/AccountSelector.svelte';
	import EntityManager from '$lib/components/EntityManager.svelte';
	import NotesPanel from '$lib/components/NotesPanel.svelte';
	import TransactionDrawer from '$lib/components/TransactionDrawer.svelte';

	let initialized = $state(false);
	let showSettings = $state(false);
	let showNotes = $state(false);

	// Derived: split tree into income/expense
	let treeGroups = $derived.by(() => {
		if (mm.categoryTree.length === 0) return { income: [], expenses: [] };
		return splitIncomeExpense(mm.categoryTree, budget.current.settings.incomeCategories);
	});

	// Derived: income category UUIDs (all descendants)
	let incomeUuidSet = $derived.by(() => {
		const uuids = collectAllUuids(treeGroups.income);
		return new Set(uuids);
	});

	// Derived: transaction map
	let txMap = $derived(groupTransactionsByCategory(mm.transactions));

	// Derived: excluded category UUIDs
	let excludedSet = $derived(new Set(budget.current.settings.excludedCategories));

	// Derived: budget rows
	let incomeRows = $derived(
		computeCategoryRows(
			treeGroups.income,
			budget.current.template,
			txMap,
			incomeUuidSet,
			true,
			excludedSet
		)
	);

	let expenseRows = $derived(
		computeCategoryRows(
			treeGroups.expenses,
			budget.current.template,
			txMap,
			incomeUuidSet,
			false,
			excludedSet
		)
	);

	// Derived: month summary
	let summary = $derived(computeMonthSummary(incomeRows, expenseRows));

	// Effect: reload transactions when month changes
	$effect(() => {
		const month = ui.selectedMonth;
		const accounts = budget.current.settings.accounts;
		const { from, to } = monthToDateRange(month);

		// Fetch transactions (uses cache internally)
		mm.fetchTransactions(from, to, accounts);
	});

	// Cmd+S keyboard shortcut
	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 's') {
			e.preventDefault();
			budget.saveBudget();
		}
	}

	onMount(async () => {
		window.addEventListener('keydown', handleKeydown);

		// Initialize: fetch MoneyMoney data + load budget (don't block on MM failures)
		await Promise.all([
			mm.fetchCategories(),
			mm.fetchAccounts(),
			budget.listBudgets()
		]);

		// Load existing budget or create new
		if (budget.budgetNames.length > 0) {
			await budget.loadBudget(budget.budgetNames[0]);
		}

		// Auto-detect income categories if not set
		if (budget.current.settings.incomeCategories.length === 0 && mm.categoryTree.length > 0) {
			const einnahmen = mm.categoryTree.find(
				(n) => n.name.toLowerCase().includes('einnahmen') && n.group
			);
			if (einnahmen) {
				budget.updateSettings({ incomeCategories: [einnahmen.uuid] });
			}
		}

		// Auto-select all accounts if none selected
		if (budget.current.settings.accounts.length === 0 && mm.accounts.length > 0) {
			const nonGroup = mm.accounts.filter((a) => !a.group);
			budget.updateSettings({ accounts: nonGroup.map((a) => a.uuid) });
		}

		// Always mark initialized — even if MM failed, template editing works
		initialized = true;

		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div class="flex flex-col h-full bg-bg">
	<Toolbar bind:showSettings bind:showNotes />

	{#if mm.error}
		<div class="flex items-center gap-3 px-4 py-3 bg-warning/10 border-b border-warning/30">
			<AlertTriangle size={18} class="text-warning shrink-0" />
			<div class="flex-1 text-sm">
				<span class="font-medium text-warning">{mm.error}</span>
				<span class="text-text-dim ml-1">— Budget-Vorlage kann weiterhin bearbeitet werden.</span>
			</div>
			<button
				onclick={() => mm.refresh()}
				class="px-3 py-1 text-xs rounded bg-warning/20 text-warning hover:bg-warning/30 transition-colors shrink-0"
			>
				Erneut verbinden
			</button>
		</div>
	{/if}

	{#if budget.error}
		<div class="flex items-center gap-3 px-4 py-2 bg-negative/10 border-b border-negative/30 text-sm text-negative">
			<AlertTriangle size={16} class="shrink-0" />
			{budget.error}
		</div>
	{/if}

	{#if !initialized}
		<div class="flex-1 flex items-center justify-center">
			<div class="flex flex-col items-center gap-3 text-text-muted">
				<div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
				<span class="text-sm">Verbinde mit MoneyMoney...</span>
			</div>
		</div>
	{:else}
		<OverviewBar {summary} />

		<div class="flex flex-1 overflow-hidden">
			<!-- Main budget table -->
			<div class="flex-1 overflow-hidden flex flex-col">
				<BudgetView {incomeRows} {expenseRows} accounts={mm.accounts} />
				{#if ui.selectedCategoryUuid}
					<TransactionDrawer {incomeRows} {expenseRows} {txMap} />
				{/if}
			</div>

			<!-- Sidebar -->
			{#if showSettings || showNotes}
				<div class="w-72 border-l border-border overflow-auto bg-bg-secondary flex flex-col">
					{#if showNotes}
						<div class="p-4 {showSettings ? 'border-b border-border' : ''}">
							<NotesPanel {incomeRows} {expenseRows} />
						</div>
					{/if}
					{#if showSettings}
						<div class="p-4 border-b border-border">
							<AccountSelector accounts={mm.accounts} />
						</div>
						<div class="p-4">
							<EntityManager />
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
