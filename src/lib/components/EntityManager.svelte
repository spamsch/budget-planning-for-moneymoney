<script lang="ts">
	import { Plus, Trash2 } from 'lucide-svelte';
	import { budget } from '$lib/stores/budget.svelte';

	let newName = $state('');

	let entities = $derived(budget.current.settings.customEntities ?? []);

	function add() {
		const trimmed = newName.trim();
		if (trimmed) {
			budget.addCustomEntity(trimmed);
			newName = '';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			add();
		}
	}

	function remove(name: string) {
		budget.removeCustomEntity(name);
	}

	// Count how many template entries reference this entity
	function usageCount(name: string): number {
		const ref = `ext:${name}`;
		let count = 0;
		for (const entry of Object.values(budget.current.template)) {
			if (entry.sourceAccount === ref) count++;
			if (entry.targetAccount === ref) count++;
		}
		return count;
	}
</script>

<div class="flex flex-col gap-3">
	<span class="text-xs font-medium text-text-muted uppercase tracking-wider">
		Externe Kontakte
	</span>

	{#if entities.length === 0}
		<p class="text-xs text-text-dim">
			Noch keine externen Kontakte. Füge Arbeitgeber, Vermieter oder andere hinzu.
		</p>
	{:else}
		<ul class="flex flex-col gap-0.5">
			{#each entities as entity (entity)}
				{@const count = usageCount(entity)}
				<li class="flex items-center gap-2 group rounded px-2 py-1.5 hover:bg-bg-row-hover">
					<span class="flex-1 text-sm text-text truncate">{entity}</span>
					{#if count > 0}
						<span class="text-[10px] text-text-dim">{count}×</span>
					{/if}
					<button
						onclick={() => remove(entity)}
						class="opacity-0 group-hover:opacity-100 text-text-dim hover:text-negative transition-opacity p-0.5"
						title="Entfernen"
					>
						<Trash2 size={12} />
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="flex gap-1.5">
		<input
			type="text"
			placeholder="z.B. Arbeitgeber, Vermieter…"
			bind:value={newName}
			onkeydown={handleKeydown}
			class="flex-1 bg-bg-input border border-border rounded px-2 py-1.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
		/>
		<button
			onclick={add}
			disabled={!newName.trim()}
			class="px-2 py-1.5 rounded bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
			title="Hinzufügen"
		>
			<Plus size={14} />
		</button>
	</div>
</div>
