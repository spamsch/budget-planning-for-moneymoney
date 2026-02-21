<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { ui, formatMonthLabel } from '$lib/stores/ui.svelte';

	let label = $derived(formatMonthLabel(ui.selectedMonth));
</script>

<div class="flex items-center gap-2">
	<button
		onclick={() => ui.previousMonth()}
		class="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text transition-colors"
	>
		<ChevronLeft size={20} />
	</button>
	<span class="text-sm font-medium min-w-[140px] text-center">{label}</span>
	<button
		onclick={() => ui.nextMonth()}
		class="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text transition-colors"
	>
		<ChevronRight size={20} />
	</button>
</div>
