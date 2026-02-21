<script lang="ts">
	import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-svelte';
	import type { CategoryBudgetRow } from '$lib/types';
	import { budget } from '$lib/stores/budget.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { formatEur } from '$lib/utils/budgetCalc';

	let { row }: { row: CategoryBudgetRow } = $props();

	let collapsed = $derived(ui.isCollapsed(row.uuid));
	let isExcluded = $derived(!!row.excluded);

	let diffColor = $derived(
		row.excluded
			? 'text-text-dim'
			: row.difference > 0.005 ? 'text-positive' : row.difference < -0.005 ? 'text-negative' : 'text-text-muted'
	);

	let indent = $derived(row.indentation > 0 ? `${(row.indentation - 1) * 20 + 8}px` : '8px');
</script>

<tr
	class="hover:bg-bg-row-hover transition-colors cursor-pointer group {isExcluded ? 'opacity-50' : ''}"
	onclick={() => ui.toggleGroup(row.uuid)}
>
	<td class="py-1.5 pr-2 text-sm font-medium" style="padding-left: {indent}">
		<span class="inline-flex items-center gap-1">
			{#if collapsed}
				<ChevronRight size={14} class="text-text-dim" />
			{:else}
				<ChevronDown size={14} class="text-text-dim" />
			{/if}
			{row.name}
			<button
				onclick={(e) => { e.stopPropagation(); budget.toggleExcludedCategory(row.uuid); }}
				class="{isExcluded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity text-text-dim hover:text-accent p-0.5"
				title={isExcluded ? 'Gruppe einblenden' : 'Gruppe ausblenden'}
			>
				{#if isExcluded}
					<Eye size={14} />
				{:else}
					<EyeOff size={14} />
				{/if}
			</button>
		</span>
	</td>

	<td class="py-1.5 px-1">
		<span class="block text-right px-2 py-1 text-sm font-mono text-text-muted font-medium">
			{#if isExcluded}—{:else}{formatEur(row.planned)}{/if}
		</span>
	</td>

	<td class="py-1.5 px-3 text-right text-sm font-mono text-text-muted font-medium">
		{formatEur(row.actual)}
	</td>

	<td class="py-1.5 px-3 text-right text-sm font-mono {diffColor} font-medium">
		{formatEur(row.difference)}
	</td>

	{#if ui.showAccountRouting}
		<td class="py-1.5 px-2"></td>
		<td class="py-1.5 px-2"></td>
	{/if}
</tr>
