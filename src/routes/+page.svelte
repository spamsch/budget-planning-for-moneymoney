<script lang="ts">
	import { onMount } from 'svelte';
	import { mm } from '$lib/stores/moneymoney.svelte';
	import { budget } from '$lib/stores/budget.svelte';
	import { ui, monthToDateRange } from '$lib/stores/ui.svelte';
	import { isDemoMode } from '$lib/demo';
	import {
		groupTransactionsByCategory,
		computeCategoryRows,
		computeMonthSummary,
		computeScenarioImpactSummary
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
	import ScenarioPanel from '$lib/components/ScenarioPanel.svelte';
	import ScenarioBar from '$lib/components/ScenarioBar.svelte';
	import ScenarioAddDialog from '$lib/components/ScenarioAddDialog.svelte';
	import AnalysisView from '$lib/components/analysis/AnalysisView.svelte';
	import ChatPanel from '$lib/components/ChatPanel.svelte';

	let initialized = $state(false);
	let showSettings = $state(false);
	let showNotes = $state(false);
	let showScenarios = $state(false);
	let showChat = $state(false);
	let chatWidth = $state(420);
	let showAddDialog = $state(false);

	function startChatResize(e: MouseEvent) {
		e.preventDefault();
		const startX = e.clientX;
		const startWidth = chatWidth;

		function onMouseMove(e: MouseEvent) {
			chatWidth = Math.max(280, startWidth + (startX - e.clientX));
		}

		function onMouseUp() {
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		}

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}

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

	// Derived: adjusted transactions (filter out moved-out, inject moved-in)
	let adjustedTransactions = $derived.by(() => {
		const movedOutIds = budget.getMovedOutIds(ui.selectedMonth);
		let txs = movedOutIds.size > 0
			? mm.transactions.filter((tx) => !movedOutIds.has(tx.id))
			: mm.transactions;
		const movedIn = budget.getMovedInForMonth(ui.selectedMonth);
		if (movedIn.length > 0) {
			txs = [
				...txs,
				...movedIn.map((mtx) => ({
					id: mtx.txId,
					amount: mtx.amount,
					currency: budget.current.settings.currency,
					bookingDate: mtx.bookingDate,
					valueDate: mtx.bookingDate,
					name: mtx.name,
					purpose: mtx.purpose,
					categoryUuid: mtx.categoryUuid,
					accountUuid: '',
					booked: true,
					checkmark: false
				}))
			];
		}
		return txs;
	});

	// Derived: transaction map
	let txMap = $derived(groupTransactionsByCategory(adjustedTransactions));

	// Derived: excluded category UUIDs
	let excludedSet = $derived(new Set(budget.current.settings.excludedCategories));

	// Derived: active scenario
	let activeScenario = $derived.by(() => {
		if (!ui.activeScenarioId) return null;
		return budget.current.scenarios.find((s) => s.id === ui.activeScenarioId) ?? null;
	});

	// Derived: resolved template (with scenario overrides applied)
	let resolvedTemplate = $derived.by(() => {
		if (ui.activeScenarioId) {
			return budget.getResolvedTemplate(ui.activeScenarioId);
		}
		return budget.current.template;
	});

	// Derived: budget rows
	let incomeRows = $derived(
		computeCategoryRows(
			treeGroups.income,
			resolvedTemplate,
			txMap,
			incomeUuidSet,
			true,
			excludedSet
		)
	);

	let expenseRows = $derived(
		computeCategoryRows(
			treeGroups.expenses,
			resolvedTemplate,
			txMap,
			incomeUuidSet,
			false,
			excludedSet
		)
	);

	// Derived: month summary
	let summary = $derived(computeMonthSummary(incomeRows, expenseRows));

	// Derived: scenario impact
	let scenarioImpact = $derived.by(() => {
		if (!activeScenario) return null;
		return computeScenarioImpactSummary(
			budget.current.template,
			resolvedTemplate,
			activeScenario.virtualItems,
			[...treeGroups.income, ...treeGroups.expenses],
			incomeUuidSet,
			excludedSet
		);
	});

	// Derived: leaf categories for add dialog
	let leafCategories = $derived.by(() => {
		const result: { uuid: string; name: string; path: string }[] = [];
		function walk(nodes: import('$lib/types').CategoryNode[], pathParts: string[]) {
			for (const node of nodes) {
				if (node.group && node.children.length > 0) {
					walk(node.children, [...pathParts, node.name]);
				} else {
					result.push({
						uuid: node.uuid,
						name: node.name,
						path: pathParts.join(' > ')
					});
				}
			}
		}
		walk(mm.categoryTree, []);
		return result;
	});

	// Effect: reload transactions when month changes
	$effect(() => {
		const month = ui.selectedMonth;
		const accounts = budget.current.settings.accounts;
		const { from, to } = monthToDateRange(month);

		// Fetch transactions (uses cache internally)
		mm.fetchTransactions(from, to, accounts);
	});

	// Keyboard shortcuts
	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 's') {
			e.preventDefault();
			budget.saveBudget();
		}
		// Escape to deactivate scenario
		if (e.key === 'Escape' && ui.activeScenarioId && !showAddDialog) {
			ui.deactivateScenario();
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
	<Toolbar bind:showSettings bind:showNotes bind:showScenarios bind:showChat />

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
				<span class="text-sm">{isDemoMode ? 'Demo-Modus wird geladen...' : 'Verbinde mit MoneyMoney...'}</span>
			</div>
		</div>
	{:else}
		<OverviewBar {summary} />

		{#if activeScenario && scenarioImpact}
			<ScenarioBar scenario={activeScenario} impact={scenarioImpact} onAddItem={() => (showAddDialog = true)} />
		{/if}

		<div class="flex flex-1 overflow-hidden">
			<!-- Main content: table or analysis -->
			<div class="flex-1 overflow-hidden flex flex-col">
				{#if ui.viewMode === 'analysis'}
					<AnalysisView
						{incomeRows}
						{expenseRows}
						{summary}
						unplannedForMonth={budget.getUnplannedForMonth(ui.selectedMonth)}
					/>
				{:else}
					<BudgetView
						{incomeRows}
						{expenseRows}
						accounts={mm.accounts}
						virtualItems={activeScenario?.virtualItems ?? []}
						scenarioId={ui.activeScenarioId}
						baselineTemplate={ui.activeScenarioId ? budget.current.template : null}
					/>
				{/if}
				{#if ui.selectedCategoryUuid}
					<TransactionDrawer {incomeRows} {expenseRows} {txMap} />
				{/if}
			</div>

			<!-- Sidebar -->
			{#if showSettings || showNotes || showScenarios}
				<div class="w-80 border-l border-border overflow-auto bg-bg-secondary flex flex-col">
					{#if showScenarios}
						<div class="p-4 {showSettings || showNotes ? 'border-b border-border' : ''}">
							<ScenarioPanel
								categoryNodes={[...treeGroups.income, ...treeGroups.expenses]}
								incomeUuids={incomeUuidSet}
								excludedUuids={excludedSet}
							/>
						</div>
					{/if}
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

			<!-- Chat Panel -->
			{#if showChat}
				<div
					class="border-l border-border bg-bg-secondary flex flex-col relative"
					style="width: {chatWidth}px; min-width: 280px; max-width: 50vw;"
				>
					<!-- Resize handle -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent/30 active:bg-accent/50 transition-colors z-10"
						onmousedown={startChatResize}
					></div>
					<ChatPanel
						{incomeRows}
						{expenseRows}
						{summary}
						month={ui.selectedMonth}
						scenarioName={activeScenario?.name}
					/>
				</div>
			{/if}
		</div>

		{#if showAddDialog && ui.activeScenarioId}
			<ScenarioAddDialog {leafCategories} onclose={() => (showAddDialog = false)} />
		{/if}
	{/if}
</div>
