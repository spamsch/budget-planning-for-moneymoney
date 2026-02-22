<script lang="ts">
	import type { CategoryBudgetRow } from '$lib/types';
	import { budget } from '$lib/stores/budget.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { formatMonthLabel } from '$lib/stores/ui.svelte';
	import { StickyNote, MessageSquareText } from 'lucide-svelte';

	let {
		incomeRows,
		expenseRows
	}: {
		incomeRows: CategoryBudgetRow[];
		expenseRows: CategoryBudgetRow[];
	} = $props();

	type NoteItem = {
		uuid: string;
		name: string;
		path: string;
		note: string;
	};

	function collectNotes(rows: CategoryBudgetRow[], parentPath: string = ''): NoteItem[] {
		const result: NoteItem[] = [];
		for (const row of rows) {
			const currentPath = parentPath ? `${parentPath} › ${row.name}` : row.name;
			if (row.note) {
				result.push({
					uuid: row.uuid,
					name: row.name,
					path: parentPath,
					note: row.note
				});
			}
			if (row.children.length > 0) {
				result.push(...collectNotes(row.children, currentPath));
			}
		}
		return result;
	}

	let allNotes = $derived([
		...collectNotes(incomeRows),
		...collectNotes(expenseRows)
	]);

	type CommentItem = {
		uuid: string;
		name: string;
		path: string;
		text: string;
	};

	function findCategory(rows: CategoryBudgetRow[], uuid: string, parentPath: string = ''): { name: string; path: string } | null {
		for (const row of rows) {
			const currentPath = parentPath ? `${parentPath} › ${row.name}` : row.name;
			if (row.uuid === uuid) {
				return { name: row.name, path: parentPath };
			}
			if (row.children.length > 0) {
				const found = findCategory(row.children, uuid, currentPath);
				if (found) return found;
			}
		}
		return null;
	}

	let monthComments = $derived.by(() => {
		const comments = budget.getCommentsForMonth(ui.selectedMonth);
		const allRows = [...incomeRows, ...expenseRows];
		const items: CommentItem[] = [];
		for (const { uuid, text } of comments) {
			const cat = findCategory(allRows, uuid);
			if (cat) {
				items.push({ uuid, name: cat.name, path: cat.path, text });
			}
		}
		return items;
	});

	function handleBlur(uuid: string, value: string) {
		budget.setNote(uuid, value);
	}
</script>

<div class="flex flex-col gap-5">
	<!-- Monthly comments -->
	<div class="flex flex-col gap-3">
		<span class="text-xs font-medium text-text-muted uppercase tracking-wider">
			Kommentare — {formatMonthLabel(ui.selectedMonth)}
		</span>

		{#if monthComments.length === 0}
			<div class="flex flex-col items-center gap-2 py-4 text-text-dim">
				<MessageSquareText size={20} />
				<p class="text-xs text-center">Keine Kommentare in diesem Monat</p>
			</div>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each monthComments as item (item.uuid)}
					<li class="rounded border border-border bg-bg/50 px-2.5 py-2">
						<button
							class="mb-1 text-left w-full hover:underline"
							onclick={() => ui.selectCategory(item.uuid)}
						>
							<span class="text-sm font-medium text-text">{item.name}</span>
							{#if item.path}
								<span class="text-[10px] text-text-dim ml-1">{item.path}</span>
							{/if}
						</button>
						<p class="text-xs text-text-muted whitespace-pre-wrap">{item.text}</p>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<!-- Template notes -->
	<div class="flex flex-col gap-3">
	<span class="text-xs font-medium text-text-muted uppercase tracking-wider">
		Notizen
	</span>

	{#if allNotes.length === 0}
		<div class="flex flex-col items-center gap-2 py-6 text-text-dim">
			<StickyNote size={20} />
			<p class="text-xs text-center">
				Noch keine Notizen. Klicke auf das Notiz-Symbol neben einer Kategorie, um eine Notiz hinzuzufügen.
			</p>
		</div>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each allNotes as item (item.uuid)}
				<li class="rounded border border-border bg-bg/50 px-2.5 py-2">
					<div class="mb-1">
						<span class="text-sm font-medium text-text">{item.name}</span>
						{#if item.path}
							<span class="text-[10px] text-text-dim ml-1">{item.path}</span>
						{/if}
					</div>
					<textarea
						class="w-full bg-bg-input border border-border rounded px-2 py-1 text-xs text-text focus:outline-none focus:border-accent resize-y min-h-[1.5rem]"
						rows="2"
						value={item.note}
						onblur={(e) => handleBlur(item.uuid, (e.target as HTMLTextAreaElement).value)}
					></textarea>
				</li>
			{/each}
		</ul>
	{/if}
	</div>
</div>
