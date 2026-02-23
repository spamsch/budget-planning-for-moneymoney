<script lang="ts">
	let {
		valueMode = $bindable('actual'),
		categoryFilter = $bindable('all')
	}: {
		valueMode: 'planned' | 'actual';
		categoryFilter: 'all' | 'expenses' | 'income';
	} = $props();
</script>

<div class="flex items-center gap-4 px-4 py-2">
	<!-- Value mode toggle -->
	<div class="flex items-center gap-1 bg-bg-secondary rounded-lg border border-border p-0.5">
		<button
			onclick={() => (valueMode = 'actual')}
			class="px-3 py-1 text-xs rounded-md transition-colors {valueMode === 'actual'
				? 'bg-accent/20 text-accent'
				: 'text-text-muted hover:text-text'}"
		>
			Tatsächlich
		</button>
		<button
			onclick={() => (valueMode = 'planned')}
			class="px-3 py-1 text-xs rounded-md transition-colors {valueMode === 'planned'
				? 'bg-accent/20 text-accent'
				: 'text-text-muted hover:text-text'}"
		>
			Geplant
		</button>
	</div>

	<!-- Category filter -->
	<div class="flex items-center gap-1 bg-bg-secondary rounded-lg border border-border p-0.5">
		<button
			onclick={() => (categoryFilter = 'all')}
			class="px-3 py-1 text-xs rounded-md transition-colors {categoryFilter === 'all'
				? 'bg-accent/20 text-accent'
				: 'text-text-muted hover:text-text'}"
		>
			Alle
		</button>
		<button
			onclick={() => (categoryFilter = 'expenses')}
			class="px-3 py-1 text-xs rounded-md transition-colors {categoryFilter === 'expenses'
				? 'bg-accent/20 text-accent'
				: 'text-text-muted hover:text-text'}"
		>
			Ausgaben
		</button>
		<button
			onclick={() => (categoryFilter = 'income')}
			class="px-3 py-1 text-xs rounded-md transition-colors {categoryFilter === 'income'
				? 'bg-accent/20 text-accent'
				: 'text-text-muted hover:text-text'}"
		>
			Einnahmen
		</button>
	</div>
</div>
