import { invoke } from '@tauri-apps/api/core';
import type { BudgetTemplate, BudgetSettings, TemplateEntry, LineItem, UnplannedTransaction } from '$lib/types';

function createEmptyBudget(name: string): BudgetTemplate {
	return {
		name,
		version: '1.0.0',
		settings: {
			currency: 'EUR',
			accounts: [],
			incomeCategories: [],
			excludedCategories: [],
			startDate: new Date().toISOString().slice(0, 7),
			customEntities: []
		},
		template: {},
		comments: {},
		unplanned: {}
	};
}

class BudgetStore {
	current = $state<BudgetTemplate>(createEmptyBudget('family'));
	budgetNames = $state<string[]>([]);
	dirty = $state(false);
	saveStatus = $state<'idle' | 'saving'>('idle');
	lastSavedAt = $state<Date | null>(null);
	error = $state<string | null>(null);

	private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

	private _clearTimers() {
		if (this._debounceTimer) {
			clearTimeout(this._debounceTimer);
			this._debounceTimer = null;
		}
	}

	private _markDirty() {
		this.dirty = true;
		this.saveStatus = 'idle';
		if (this._debounceTimer) {
			clearTimeout(this._debounceTimer);
		}
		this._debounceTimer = setTimeout(() => {
			this._debounceTimer = null;
			this.saveBudget();
		}, 1500);
	}

	async listBudgets() {
		try {
			this.budgetNames = await invoke<string[]>('list_budgets');
		} catch (e) {
			this.error = `Failed to list budgets: ${e}`;
		}
	}

	async loadBudget(name: string) {
		this._clearTimers();
		try {
			this.error = null;
			const loaded = await invoke<BudgetTemplate>('load_budget', { name });
			// Backfill for older files missing newer fields
			if (!loaded.settings.customEntities) {
				loaded.settings.customEntities = [];
			}
			if (!loaded.settings.excludedCategories) {
				loaded.settings.excludedCategories = [];
			}
			if (!loaded.comments) {
				loaded.comments = {};
			}
			if (!loaded.unplanned) {
				loaded.unplanned = {};
			}
			this.current = loaded;
			this.dirty = false;
		} catch (e) {
			// Budget doesn't exist yet — create a new one
			this.current = createEmptyBudget(name);
			this.dirty = false;
		}
	}

	async saveBudget() {
		if (this._debounceTimer) {
			clearTimeout(this._debounceTimer);
			this._debounceTimer = null;
		}
		try {
			this.saveStatus = 'saving';
			this.error = null;
			await invoke('save_budget', { budget: this.current });
			this.dirty = false;
			this.lastSavedAt = new Date();
			this.saveStatus = 'idle';
			await this.listBudgets();
		} catch (e) {
			this.saveStatus = 'idle';
			this.error = `Failed to save budget: ${e}`;
		}
	}

	async deleteBudget(name: string) {
		try {
			await invoke('delete_budget', { name });
			await this.listBudgets();
		} catch (e) {
			this.error = `Failed to delete budget: ${e}`;
		}
	}

	setTemplateAmount(uuid: string, amount: number) {
		const existing = this.current.template[uuid];
		if (existing) {
			existing.amount = amount;
		} else {
			this.current.template[uuid] = { amount };
		}
		this._markDirty();
	}

	addLineItem(uuid: string): string {
		const entry = this.current.template[uuid] ?? (this.current.template[uuid] = { amount: 0 });
		const id = crypto.randomUUID();

		if (!entry.lineItems || entry.lineItems.length === 0) {
			// Seed first item with current amount
			entry.lineItems = [{ id, name: '', amount: entry.amount }];
		} else {
			entry.lineItems = [...entry.lineItems, { id, name: '', amount: 0 }];
		}

		this._recomputeLineItemSum(entry);
		this._markDirty();
		return id;
	}

	updateLineItem(uuid: string, itemId: string, updates: Partial<Pick<LineItem, 'name' | 'amount' | 'description'>>) {
		const entry = this.current.template[uuid];
		if (!entry?.lineItems) return;

		const item = entry.lineItems.find((li) => li.id === itemId);
		if (!item) return;

		if (updates.name !== undefined) item.name = updates.name;
		if (updates.amount !== undefined) item.amount = updates.amount;
		if (updates.description !== undefined) item.description = updates.description;

		this._recomputeLineItemSum(entry);
		this._markDirty();
	}

	removeLineItem(uuid: string, itemId: string) {
		const entry = this.current.template[uuid];
		if (!entry?.lineItems) return;

		entry.lineItems = entry.lineItems.filter((li) => li.id !== itemId);

		if (entry.lineItems.length === 0) {
			delete entry.lineItems;
		}

		this._recomputeLineItemSum(entry);
		this._markDirty();
	}

	private _recomputeLineItemSum(entry: TemplateEntry) {
		if (entry.lineItems && entry.lineItems.length > 0) {
			entry.amount = entry.lineItems.reduce((sum, li) => sum + li.amount, 0);
		}
	}

	setNote(uuid: string, note: string) {
		const trimmed = note.trim();
		const existing = this.current.template[uuid];
		if (trimmed) {
			if (existing) {
				existing.note = trimmed;
			} else {
				this.current.template[uuid] = { amount: 0, note: trimmed };
			}
		} else if (existing) {
			delete existing.note;
		}
		this._markDirty();
	}

	setSourceAccount(uuid: string, accountUuid: string | undefined) {
		const existing = this.current.template[uuid];
		if (existing) {
			existing.sourceAccount = accountUuid;
		} else {
			this.current.template[uuid] = { amount: 0, sourceAccount: accountUuid };
		}
		this._markDirty();
	}

	setTargetAccount(uuid: string, accountUuid: string | undefined) {
		const existing = this.current.template[uuid];
		if (existing) {
			existing.targetAccount = accountUuid;
		} else {
			this.current.template[uuid] = { amount: 0, targetAccount: accountUuid };
		}
		this._markDirty();
	}

	addCustomEntity(name: string) {
		const trimmed = name.trim();
		if (trimmed && !this.current.settings.customEntities.includes(trimmed)) {
			this.current.settings.customEntities = [...this.current.settings.customEntities, trimmed];
			this._markDirty();
		}
	}

	removeCustomEntity(name: string) {
		this.current.settings.customEntities = this.current.settings.customEntities.filter(
			(e) => e !== name
		);
		this._markDirty();
	}

	toggleExcludedCategory(uuid: string) {
		const current = this.current.settings.excludedCategories;
		if (current.includes(uuid)) {
			this.current.settings.excludedCategories = current.filter((u) => u !== uuid);
		} else {
			this.current.settings.excludedCategories = [...current, uuid];
		}
		this._markDirty();
	}

	removeTemplateEntry(uuid: string) {
		delete this.current.template[uuid];
		this._markDirty();
	}

	setComment(month: string, uuid: string, text: string) {
		const trimmed = text.trim();
		if (trimmed) {
			if (!this.current.comments[month]) {
				this.current.comments[month] = {};
			}
			this.current.comments[month][uuid] = trimmed;
		} else if (this.current.comments[month]) {
			delete this.current.comments[month][uuid];
			if (Object.keys(this.current.comments[month]).length === 0) {
				delete this.current.comments[month];
			}
		}
		this._markDirty();
	}

	getComment(month: string, uuid: string): string {
		return this.current.comments[month]?.[uuid] ?? '';
	}

	getCommentsForMonth(month: string): Array<{ uuid: string; text: string }> {
		const monthComments = this.current.comments[month];
		if (!monthComments) return [];
		return Object.entries(monthComments).map(([uuid, text]) => ({ uuid, text }));
	}

	markUnplanned(month: string, categoryUuid: string, transactions: UnplannedTransaction[]) {
		if (!this.current.unplanned[month]) {
			this.current.unplanned[month] = {};
		}
		const existing = this.current.unplanned[month][categoryUuid] ?? [];
		const existingIds = new Set(existing.map((t) => t.txId));
		const toAdd = transactions.filter((t) => !existingIds.has(t.txId));
		if (toAdd.length > 0) {
			this.current.unplanned[month][categoryUuid] = [...existing, ...toAdd];
			this._markDirty();
		}
	}

	unmarkUnplanned(month: string, categoryUuid: string, txId: number) {
		const monthMap = this.current.unplanned[month];
		if (!monthMap?.[categoryUuid]) return;
		monthMap[categoryUuid] = monthMap[categoryUuid].filter((t) => t.txId !== txId);
		if (monthMap[categoryUuid].length === 0) {
			delete monthMap[categoryUuid];
		}
		if (Object.keys(monthMap).length === 0) {
			delete this.current.unplanned[month];
		}
		this._markDirty();
	}

	getUnplannedIds(month: string, categoryUuid: string): Set<number> {
		const txs = this.current.unplanned[month]?.[categoryUuid];
		return txs ? new Set(txs.map((t) => t.txId)) : new Set();
	}

	getUnplannedForMonth(month: string): Array<{ categoryUuid: string; transactions: UnplannedTransaction[] }> {
		const monthMap = this.current.unplanned[month];
		if (!monthMap) return [];
		return Object.entries(monthMap).map(([categoryUuid, transactions]) => ({ categoryUuid, transactions }));
	}

	updateSettings(partial: Partial<BudgetSettings>) {
		this.current.settings = { ...this.current.settings, ...partial };
		this._markDirty();
	}

	async renameBudget(newName: string) {
		const trimmed = newName.trim();
		if (!trimmed || trimmed === this.current.name) return;
		const oldName = this.current.name;
		this.current.name = trimmed;
		try {
			this.saveStatus = 'saving';
			this.error = null;
			await invoke('save_budget', { budget: this.current });
			await invoke('delete_budget', { name: oldName });
			this.dirty = false;
			this.lastSavedAt = new Date();
			this.saveStatus = 'idle';
			await this.listBudgets();
		} catch (e) {
			this.current.name = oldName;
			this.saveStatus = 'idle';
			this.error = `Failed to rename budget: ${e}`;
		}
	}

	createNew(name: string) {
		this.current = createEmptyBudget(name);
		this._markDirty();
	}
}

export const budget = new BudgetStore();
