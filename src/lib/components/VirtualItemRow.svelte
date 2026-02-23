<script lang="ts">
	import type { VirtualItem } from '$lib/types';
	import { budget } from '$lib/stores/budget.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { formatEur } from '$lib/utils/budgetCalc';
	import { Trash2 } from 'lucide-svelte';

	let {
		item,
		scenarioId
	}: {
		item: VirtualItem;
		scenarioId: string;
	} = $props();

	let editingName = $state(false);
	let nameValue = $state('');
	let editingAmount = $state(false);
	let amountValue = $state('');

	function startEditName() {
		nameValue = item.name;
		editingName = true;
	}

	function commitName() {
		editingName = false;
		if (nameValue.trim() && nameValue.trim() !== item.name) {
			budget.updateVirtualItem(scenarioId, item.id, { name: nameValue.trim() });
		}
	}

	function startEditAmount() {
		amountValue = item.amount.toString();
		editingAmount = true;
	}

	function commitAmount() {
		editingAmount = false;
		const val = parseFloat(amountValue) || 0;
		if (val !== item.amount) {
			budget.updateVirtualItem(scenarioId, item.id, { amount: val });
		}
	}

	function handleDelete() {
		budget.removeVirtualItem(scenarioId, item.id);
	}
</script>

<tr class="hover:bg-bg-row-hover transition-colors group border-l-3 border-l-accent/30">
	<td class="py-1.5 pr-2 text-sm" style="padding-left: 28px">
		<span class="inline-flex items-center gap-1.5">
			{#if editingName}
				<input
					type="text"
					bind:value={nameValue}
					onblur={commitName}
					onkeydown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') editingName = false; }}
					class="bg-transparent border-b border-accent text-sm outline-none"
					autofocus
				/>
			{:else}
				<button onclick={startEditName} class="hover:text-accent cursor-pointer italic">
					{item.name}
				</button>
			{/if}
			<span class="text-[9px] px-1 py-0.5 rounded {item.isIncome ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}">
				{item.isIncome ? 'Einnahme' : 'Ausgabe'}
			</span>
			<button
				onclick={handleDelete}
				class="opacity-0 group-hover:opacity-100 transition-opacity text-text-dim hover:text-negative p-0.5"
				title="Löschen"
			>
				<Trash2 size={12} />
			</button>
		</span>
	</td>

	<td class="py-1 px-1">
		{#if editingAmount}
			<input
				type="number"
				step="0.01"
				class="w-full bg-bg-input border border-accent rounded px-2 py-1 text-right text-sm font-mono text-text focus:outline-none"
				bind:value={amountValue}
				onblur={commitAmount}
				onkeydown={(e) => { if (e.key === 'Enter') commitAmount(); if (e.key === 'Escape') editingAmount = false; }}
				autofocus
			/>
		{:else}
			<button
				onclick={startEditAmount}
				class="w-full text-right cursor-text rounded px-2 py-1 text-sm font-mono bg-bg-input/60 border border-accent/30 hover:border-accent text-text"
			>
				{formatEur(item.amount)}
			</button>
		{/if}
	</td>

	<td class="py-1.5 px-3 text-right text-sm font-mono text-text-dim">—</td>
	<td class="py-1.5 px-3 text-right text-sm font-mono text-text-dim">—</td>

	{#if ui.showAccountRouting}
		<td class="py-1.5 px-2"></td>
		<td class="py-1.5 px-2"></td>
	{/if}
</tr>
