<script lang="ts">
	import type { CategoryBudgetRow, Account } from '$lib/types';
	import { budget } from '$lib/stores/budget.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { formatEur } from '$lib/utils/budgetCalc';
	import { ChevronDown, ChevronRight, ListPlus, Plus, Eye, EyeOff } from 'lucide-svelte';
	import LineItemRow from './LineItemRow.svelte';

	const ADD_NEW = '__add_new__';

	let {
		row,
		accounts = []
	}: {
		row: CategoryBudgetRow;
		accounts?: Account[];
	} = $props();

	let editingAmount = $state(false);
	let inputValue = $state('');
	let newlyAddedItemId = $state<string | null>(null);

	let hasLineItems = $derived(row.lineItems && row.lineItems.length > 0);
	let expanded = $derived(ui.isLineItemsExpanded(row.uuid));

	function startEdit() {
		if (hasLineItems) return; // read-only when line items exist
		inputValue = row.planned === 0 ? '' : row.planned.toString();
		editingAmount = true;
	}

	function commitEdit() {
		editingAmount = false;
		const val = parseFloat(inputValue) || 0;
		if (val !== row.planned) {
			budget.setTemplateAmount(row.uuid, val);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			commitEdit();
		} else if (e.key === 'Escape') {
			editingAmount = false;
		}
	}

	function focusThenClear(id: string) {
		newlyAddedItemId = id;
		requestAnimationFrame(() => {
			newlyAddedItemId = null;
		});
	}

	function handleAddLineItem() {
		const id = budget.addLineItem(row.uuid);
		if (!ui.isLineItemsExpanded(row.uuid)) {
			ui.toggleLineItems(row.uuid);
		}
		focusThenClear(id);
	}

	function handleAddAnotherLineItem() {
		const id = budget.addLineItem(row.uuid);
		focusThenClear(id);
	}

	function handleAccountChange(
		value: string,
		setter: (uuid: string, val: string | undefined) => void
	) {
		if (value === ADD_NEW) {
			const name = prompt('Name des externen Kontakts:');
			if (name?.trim()) {
				budget.addCustomEntity(name.trim());
				setter(row.uuid, `ext:${name.trim()}`);
			}
			return;
		}
		setter(row.uuid, value || undefined);
	}

	let isExcluded = $derived(!!row.excluded);

	let diffColor = $derived(
		row.excluded
			? 'text-text-dim'
			: row.difference > 0.005
				? 'text-positive'
				: row.difference < -0.005
					? 'text-negative'
					: 'text-text-muted'
	);

	let indent = $derived(row.indentation > 0 ? `${(row.indentation - 1) * 20 + 8}px` : '8px');
	let lineItemIndentPx = $derived(row.indentation > 0 ? (row.indentation - 1) * 20 + 8 + 24 : 8 + 24);

	let nonGroupAccounts = $derived(accounts.filter((a) => !a.group));
	let customEntities = $derived(budget.current.settings.customEntities ?? []);
</script>

<tr class="hover:bg-bg-row-hover transition-colors group {isExcluded ? 'opacity-50' : ''}">
	<td class="py-1.5 pr-2 text-sm" style="padding-left: {indent}">
		<span class="inline-flex items-center gap-1">
			{#if hasLineItems}
				<button
					onclick={() => ui.toggleLineItems(row.uuid)}
					class="p-0 text-text-dim hover:text-text"
				>
					{#if expanded}
						<ChevronDown size={14} />
					{:else}
						<ChevronRight size={14} />
					{/if}
				</button>
			{/if}
			{#if hasLineItems}
				<button
					onclick={() => ui.toggleLineItems(row.uuid)}
					class="hover:text-text cursor-pointer"
				>
					{row.name}
				</button>
				<span class="text-[10px] text-text-dim ml-0.5">({row.lineItems!.length})</span>
			{:else}
				{row.name}
				{#if !isExcluded}
					<button
						onclick={handleAddLineItem}
						class="opacity-0 group-hover:opacity-100 transition-opacity text-text-dim hover:text-accent p-0.5"
						title="Positionen hinzufügen"
					>
						<ListPlus size={14} />
					</button>
				{/if}
			{/if}
			<button
				onclick={(e) => { e.stopPropagation(); budget.toggleExcludedCategory(row.uuid); }}
				class="{isExcluded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity text-text-dim hover:text-accent p-0.5"
				title={isExcluded ? 'Kategorie einblenden' : 'Kategorie ausblenden'}
			>
				{#if isExcluded}
					<Eye size={14} />
				{:else}
					<EyeOff size={14} />
				{/if}
			</button>
		</span>
	</td>

	<td class="py-1 px-1">
		{#if isExcluded}
			<span class="block text-right px-2 py-1 text-sm font-mono text-text-dim">—</span>
		{:else if hasLineItems}
			<span class="block text-right px-2 py-1 text-sm font-mono text-text-muted">
				{formatEur(row.planned)}
			</span>
		{:else if editingAmount}
			<input
				type="number"
				step="0.01"
				class="w-full bg-bg-input border border-accent rounded px-2 py-1 text-right text-sm font-mono text-text focus:outline-none"
				bind:value={inputValue}
				onblur={commitEdit}
				onkeydown={handleKeydown}
				autofocus
			/>
		{:else}
			<button
				onclick={startEdit}
				class="w-full text-right cursor-text rounded px-2 py-1 text-sm font-mono
					bg-bg-input/60 border border-border/50
					hover:bg-bg-input hover:border-border
					{row.planned === 0 ? 'text-text-dim' : 'text-text'}"
			>
				{formatEur(row.planned)}
			</button>
		{/if}
	</td>

	<td class="py-1.5 px-3 text-right text-sm font-mono text-text-muted">
		{formatEur(row.actual)}
	</td>

	<td class="py-1.5 px-3 text-right text-sm font-mono {diffColor}">
		{formatEur(row.difference)}
	</td>

	{#if ui.showAccountRouting}
		{#snippet accountSelect(value: string | undefined, setter: (uuid: string, val: string | undefined) => void)}
			<div class="relative">
				<select
					class="select-dark"
					value={value ?? ''}
					onchange={(e) => handleAccountChange((e.target as HTMLSelectElement).value, setter)}
				>
					<option value="">—</option>
					{#if nonGroupAccounts.length > 0}
						<optgroup label="Bankkonten">
							{#each nonGroupAccounts as acc}
								<option value={acc.uuid}>{acc.name}</option>
							{/each}
						</optgroup>
					{/if}
					{#if customEntities.length > 0}
						<optgroup label="Extern">
							{#each customEntities as entity}
								<option value="ext:{entity}">{entity}</option>
							{/each}
						</optgroup>
					{/if}
					<option value={ADD_NEW}>+ Neu…</option>
				</select>
				<svg class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-text-dim" width="10" height="10" viewBox="0 0 10 10" fill="none">
					<path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</div>
		{/snippet}

		<td class="py-1.5 px-2 text-xs">
			{@render accountSelect(row.sourceAccount, budget.setSourceAccount.bind(budget))}
		</td>
		<td class="py-1.5 px-2 text-xs">
			{@render accountSelect(row.targetAccount, budget.setTargetAccount.bind(budget))}
		</td>
	{/if}
</tr>

{#if hasLineItems && expanded}
	{#each row.lineItems! as item (item.id)}
		<LineItemRow
			{item}
			categoryUuid={row.uuid}
			indentPx={lineItemIndentPx}
			focusName={newlyAddedItemId === item.id}
		/>
	{/each}
	<tr class="hover:bg-bg-row-hover/30 transition-colors">
		<td
			colspan={ui.showAccountRouting ? 6 : 4}
			class="py-1 text-xs"
			style="padding-left: {lineItemIndentPx}px"
		>
			<button
				onclick={handleAddAnotherLineItem}
				class="inline-flex items-center gap-1 text-text-dim hover:text-accent border-l border-dashed border-border pl-3 cursor-pointer"
			>
				<Plus size={12} />
				Neue Position
			</button>
		</td>
	</tr>
{/if}
