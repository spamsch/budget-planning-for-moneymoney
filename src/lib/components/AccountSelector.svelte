<script lang="ts">
	import type { Account } from '$lib/types';
	import { budget } from '$lib/stores/budget.svelte';

	let { accounts }: { accounts: Account[] } = $props();

	let nonGroupAccounts = $derived(accounts.filter((a) => !a.group));
	let selectedSet = $derived(new Set(budget.current.settings.accounts));

	function toggle(uuid: string) {
		const current = budget.current.settings.accounts;
		if (current.includes(uuid)) {
			budget.updateSettings({ accounts: current.filter((u) => u !== uuid) });
		} else {
			budget.updateSettings({ accounts: [...current, uuid] });
		}
	}

	function selectAll() {
		budget.updateSettings({ accounts: nonGroupAccounts.map((a) => a.uuid) });
	}

	function selectNone() {
		budget.updateSettings({ accounts: [] });
	}
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center justify-between">
		<span class="text-xs font-medium text-text-muted uppercase tracking-wider">Konten</span>
		<div class="flex gap-2 text-[10px]">
			<button onclick={selectAll} class="text-accent hover:underline">Alle</button>
			<button onclick={selectNone} class="text-accent hover:underline">Keine</button>
		</div>
	</div>
	{#each nonGroupAccounts as account (account.uuid)}
		<label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-bg-row-hover rounded px-2 py-1">
			<input
				type="checkbox"
				checked={selectedSet.has(account.uuid)}
				onchange={() => toggle(account.uuid)}
				class="accent-accent"
			/>
			<span class="text-text">{account.name}</span>
			<span class="text-text-dim text-xs ml-auto">{account.balanceCurrency}</span>
		</label>
	{/each}
</div>
