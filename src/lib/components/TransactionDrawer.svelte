<script lang="ts">
	import type { CategoryBudgetRow, Transaction } from '$lib/types';
	import { ui, offsetMonth } from '$lib/stores/ui.svelte';
	import { budget } from '$lib/stores/budget.svelte';
	import { formatEur, getTransactionsForCategory } from '$lib/utils/budgetCalc';
	import { X, CircleAlert, ArrowRight } from 'lucide-svelte';

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
	let currentComment = $derived(
		ui.selectedCategoryUuid ? budget.getComment(ui.selectedMonth, ui.selectedCategoryUuid) : ''
	);

	function handleCommentBlur(e: FocusEvent) {
		const value = (e.target as HTMLTextAreaElement).value;
		if (ui.selectedCategoryUuid) {
			budget.setComment(ui.selectedMonth, ui.selectedCategoryUuid, value);
		}
	}

	let height = $state(250);
	let dragging = $state(false);
	let startY = 0;
	let startHeight = 0;

	function onPointerDown(e: PointerEvent) {
		dragging = true;
		startY = e.clientY;
		startHeight = height;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		const delta = startY - e.clientY;
		height = Math.max(120, Math.min(startHeight + delta, window.innerHeight * 0.7));
	}

	function onPointerUp() {
		dragging = false;
	}

	import { SvelteSet } from 'svelte/reactivity';

	let selectedTxIds = new SvelteSet<number>();

	// Clear selection when category changes
	$effect(() => {
		ui.selectedCategoryUuid;
		selectedTxIds.clear();
	});

	function toggleTx(id: number, e: MouseEvent) {
		if (e.shiftKey) {
			// Shift-click: toggle individual
			if (selectedTxIds.has(id)) selectedTxIds.delete(id);
			else selectedTxIds.add(id);
		} else {
			// Plain click: exclusive select, or deselect if already the only one
			if (selectedTxIds.size === 1 && selectedTxIds.has(id)) {
				selectedTxIds.clear();
			} else {
				selectedTxIds.clear();
				selectedTxIds.add(id);
			}
		}
	}

	let selectedSum = $derived.by(() => {
		if (selectedTxIds.size === 0) return 0;
		return transactions.filter(tx => selectedTxIds.has(tx.id)).reduce((s, tx) => s + tx.amount, 0);
	});

	let unplannedIds = $derived(
		ui.selectedCategoryUuid ? budget.getUnplannedIds(ui.selectedMonth, ui.selectedCategoryUuid) : new Set<number>()
	);

	let allSelectedMarked = $derived.by(() => {
		if (selectedTxIds.size === 0) return false;
		for (const id of selectedTxIds) {
			if (!unplannedIds.has(id)) return false;
		}
		return true;
	});

	function handleToggleUnplanned() {
		const uuid = ui.selectedCategoryUuid;
		if (!uuid) return;
		const month = ui.selectedMonth;

		if (allSelectedMarked) {
			for (const id of selectedTxIds) {
				budget.unmarkUnplanned(month, uuid, id);
			}
		} else {
			const snapshots = transactions
				.filter((tx) => selectedTxIds.has(tx.id))
				.map((tx) => ({
					txId: tx.id,
					name: tx.name,
					amount: tx.amount,
					bookingDate: tx.bookingDate,
					purpose: tx.purpose
				}));
			budget.markUnplanned(month, uuid, snapshots);
		}
		selectedTxIds.clear();
	}

	// Moved-in transaction IDs for visual indicator
	let movedInTxIds = $derived.by(() => {
		const movedIn = budget.getMovedInForMonth(ui.selectedMonth);
		return new Set(movedIn.map((t) => t.txId));
	});

	// Check if all selected are moved-in (for showing unmove vs move buttons)
	let allSelectedMovedIn = $derived.by(() => {
		if (selectedTxIds.size === 0) return false;
		for (const id of selectedTxIds) {
			if (!movedInTxIds.has(id)) return false;
		}
		return true;
	});

	function handleMoveToMonth(direction: 1 | -1) {
		const uuid = ui.selectedCategoryUuid;
		if (!uuid) return;
		const sourceMonth = ui.selectedMonth;
		const targetMonth = offsetMonth(sourceMonth, direction);

		const snapshots = transactions
			.filter((tx) => selectedTxIds.has(tx.id))
			.map((tx) => ({
				txId: tx.id,
				name: tx.name,
				amount: tx.amount,
				bookingDate: tx.bookingDate,
				purpose: tx.purpose,
				categoryUuid: uuid,
				targetMonth
			}));
		budget.moveTransactions(sourceMonth, targetMonth, snapshots);
		selectedTxIds.clear();
	}

	function handleUnmove() {
		for (const txId of selectedTxIds) {
			// Find the source month for this moved-in transaction
			for (const [sourceMonth, entries] of Object.entries(budget.current.moved)) {
				if (entries.some((t) => t.txId === txId && t.targetMonth === ui.selectedMonth)) {
					budget.unmoveTransaction(sourceMonth, txId);
					break;
				}
			}
		}
		selectedTxIds.clear();
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}
</script>

<div class="border-t border-border bg-bg-secondary flex flex-col shrink-0" style:height="{height}px">
	<!-- Resize handle -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="h-1.5 cursor-row-resize flex items-center justify-center hover:bg-accent/20 transition-colors shrink-0 {dragging ? 'bg-accent/20' : ''}"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
	>
		<div class="w-8 h-0.5 rounded-full bg-text-dim/40"></div>
	</div>

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
						<tr
							class="transition-colors border-t border-border/50 cursor-pointer select-none {selectedTxIds.has(tx.id) ? 'bg-accent/15' : 'hover:bg-bg-row-hover'} {movedInTxIds.has(tx.id) ? 'border-l-2 border-l-accent' : unplannedIds.has(tx.id) ? 'border-l-2 border-l-warning' : ''}"
							onclick={(e) => toggleTx(tx.id, e)}
						>
							<td class="py-1.5 px-4 text-text-muted whitespace-nowrap">
								<span class="inline-flex items-center gap-1">
									{#if movedInTxIds.has(tx.id)}<ArrowRight size={12} class="text-accent shrink-0" />{:else if unplannedIds.has(tx.id)}<CircleAlert size={12} class="text-warning shrink-0" />{/if}
									{formatDate(tx.bookingDate)}
								</span>
							</td>
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

	{#if selectedTxIds.size > 0}
		<div class="flex items-center justify-between px-4 py-1.5 border-t border-accent/30 bg-accent/10 text-xs">
			<span class="text-text-muted">{selectedTxIds.size} ausgewählt</span>
			<div class="flex items-center gap-3">
				{#if allSelectedMovedIn}
					<button
						onclick={handleUnmove}
						class="text-accent hover:text-accent/80 font-medium transition-colors"
					>
						Verschiebung aufheben
					</button>
				{:else}
					<button
						onclick={() => handleMoveToMonth(-1)}
						class="text-accent hover:text-accent/80 font-medium transition-colors"
					>
						← Vormonat
					</button>
					<button
						onclick={() => handleMoveToMonth(1)}
						class="text-accent hover:text-accent/80 font-medium transition-colors"
					>
						Nächster Monat →
					</button>
					<button
						onclick={handleToggleUnplanned}
						class="text-warning hover:text-warning/80 font-medium transition-colors"
					>
						{allSelectedMarked ? 'Markierung aufheben' : 'Als ungeplant markieren'}
					</button>
				{/if}
				<span class="font-mono font-medium text-accent">{formatEur(selectedSum)}</span>
			</div>
		</div>
	{/if}

	<!-- Monthly comment -->
	<div class="px-4 py-2 border-t border-border">
		<textarea
			class="w-full bg-bg-input border border-border rounded px-2 py-1 text-xs text-text focus:outline-none focus:border-accent resize-none"
			rows="2"
			placeholder="Kommentar für diesen Monat…"
			value={currentComment}
			onblur={handleCommentBlur}
		></textarea>
	</div>
</div>
