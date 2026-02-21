<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import type { LineItem } from '$lib/types';
	import { budget } from '$lib/stores/budget.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { formatEur } from '$lib/utils/budgetCalc';

	let {
		item,
		categoryUuid,
		indentPx,
		focusName = false
	}: {
		item: LineItem;
		categoryUuid: string;
		indentPx: number;
		focusName?: boolean;
	} = $props();

	let editingName = $state(false);
	let editingAmount = $state(false);
	let editingDescription = $state(false);
	let nameValue = $state('');
	let amountValue = $state('');
	let descriptionValue = $state('');

	$effect(() => {
		if (focusName) {
			editingName = true;
			nameValue = item.name;
		}
	});

	function startNameEdit() {
		nameValue = item.name;
		editingName = true;
	}

	function commitName() {
		editingName = false;
		if (nameValue !== item.name) {
			budget.updateLineItem(categoryUuid, item.id, { name: nameValue });
		}
	}

	function startAmountEdit() {
		amountValue = item.amount === 0 ? '' : item.amount.toString();
		editingAmount = true;
	}

	function commitAmount() {
		editingAmount = false;
		const val = parseFloat(amountValue) || 0;
		if (val !== item.amount) {
			budget.updateLineItem(categoryUuid, item.id, { amount: val });
		}
	}

	function handleNameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') commitName();
		else if (e.key === 'Escape') editingName = false;
	}

	function handleAmountKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') commitAmount();
		else if (e.key === 'Escape') editingAmount = false;
	}

	function startDescriptionEdit() {
		descriptionValue = item.description ?? '';
		editingDescription = true;
	}

	function commitDescription() {
		editingDescription = false;
		const val = descriptionValue.trim() || undefined;
		if (val !== (item.description ?? undefined)) {
			budget.updateLineItem(categoryUuid, item.id, { description: val });
		}
	}

	function handleDescriptionKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') commitDescription();
		else if (e.key === 'Escape') editingDescription = false;
	}
</script>

<tr class="hover:bg-bg-row-hover/50 transition-colors group/li">
	<td class="py-1 pr-2 text-xs text-text-muted" style="padding-left: {indentPx}px">
		<span class="inline-flex items-center gap-1.5 border-l border-dashed border-border pl-3">
			{#if editingName}
				<input
					type="text"
					class="bg-bg-input border border-accent rounded px-1.5 py-0.5 text-xs text-text focus:outline-none w-28"
					bind:value={nameValue}
					onblur={commitName}
					onkeydown={handleNameKeydown}
					autofocus
				/>
			{:else}
				<button
					onclick={startNameEdit}
					class="text-left cursor-text text-xs hover:text-text {item.name ? 'text-text-muted' : 'text-text-dim italic'} px-0.5"
				>
					{item.name || 'Bezeichnung…'}
				</button>
			{/if}
			{#if editingDescription}
				<span class="text-text-dim">—</span>
				<input
					type="text"
					class="bg-bg-input border border-accent rounded px-1.5 py-0.5 text-[10px] text-text-muted focus:outline-none w-36"
					placeholder="Beschreibung…"
					bind:value={descriptionValue}
					onblur={commitDescription}
					onkeydown={handleDescriptionKeydown}
					autofocus
				/>
			{:else if item.description}
				<span class="text-text-dim">—</span>
				<button
					onclick={startDescriptionEdit}
					class="text-left cursor-text text-[10px] text-text-dim hover:text-text-muted px-0.5"
				>
					{item.description}
				</button>
			{:else}
				<button
					onclick={startDescriptionEdit}
					class="text-[10px] text-text-dim/40 italic hover:text-text-dim px-0.5"
					title="Beschreibung hinzufügen"
				>
					Notiz…
				</button>
			{/if}
		</span>
	</td>

	<td class="py-0.5 px-1">
		{#if editingAmount}
			<input
				type="number"
				step="0.01"
				class="w-full bg-bg-input border border-accent rounded px-2 py-0.5 text-right text-xs font-mono text-text focus:outline-none"
				bind:value={amountValue}
				onblur={commitAmount}
				onkeydown={handleAmountKeydown}
				autofocus
			/>
		{:else}
			<button
				onclick={startAmountEdit}
				class="w-full text-right cursor-text rounded px-2 py-0.5 text-xs font-mono
					bg-bg-input/60 border border-border/50
					hover:bg-bg-input hover:border-border
					{item.amount === 0 ? 'text-text-dim' : 'text-text'}"
			>
				{formatEur(item.amount)}
			</button>
		{/if}
	</td>

	<td class="py-1 px-3 text-right text-xs font-mono text-text-dim"></td>

	<td class="py-1 px-3 text-right">
		<button
			onclick={() => budget.removeLineItem(categoryUuid, item.id)}
			class="opacity-0 group-hover/li:opacity-100 transition-opacity text-text-dim hover:text-negative p-0.5"
		>
			<Trash2 size={12} />
		</button>
	</td>

	{#if ui.showAccountRouting}
		<td class="py-1 px-2"></td>
		<td class="py-1 px-2"></td>
	{/if}
</tr>
