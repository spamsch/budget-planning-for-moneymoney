import { invoke } from '@tauri-apps/api/core';
import type { BudgetTemplate, BudgetSettings, TemplateEntry, LineItem } from '$lib/types';

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
		comments: {}
	};
}

class BudgetStore {
	current = $state<BudgetTemplate>(createEmptyBudget('family'));
	budgetNames = $state<string[]>([]);
	dirty = $state(false);
	saving = $state(false);
	error = $state<string | null>(null);

	async listBudgets() {
		try {
			this.budgetNames = await invoke<string[]>('list_budgets');
		} catch (e) {
			this.error = `Failed to list budgets: ${e}`;
		}
	}

	async loadBudget(name: string) {
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
			this.current = loaded;
			this.dirty = false;
		} catch (e) {
			// Budget doesn't exist yet — create a new one
			this.current = createEmptyBudget(name);
			this.dirty = false;
		}
	}

	async saveBudget() {
		try {
			this.saving = true;
			this.error = null;
			await invoke('save_budget', { budget: this.current });
			this.dirty = false;
			await this.listBudgets();
		} catch (e) {
			this.error = `Failed to save budget: ${e}`;
		} finally {
			this.saving = false;
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
		this.dirty = true;
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
		this.dirty = true;
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
		this.dirty = true;
	}

	removeLineItem(uuid: string, itemId: string) {
		const entry = this.current.template[uuid];
		if (!entry?.lineItems) return;

		entry.lineItems = entry.lineItems.filter((li) => li.id !== itemId);

		if (entry.lineItems.length === 0) {
			delete entry.lineItems;
		}

		this._recomputeLineItemSum(entry);
		this.dirty = true;
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
		this.dirty = true;
	}

	setSourceAccount(uuid: string, accountUuid: string | undefined) {
		const existing = this.current.template[uuid];
		if (existing) {
			existing.sourceAccount = accountUuid;
		} else {
			this.current.template[uuid] = { amount: 0, sourceAccount: accountUuid };
		}
		this.dirty = true;
	}

	setTargetAccount(uuid: string, accountUuid: string | undefined) {
		const existing = this.current.template[uuid];
		if (existing) {
			existing.targetAccount = accountUuid;
		} else {
			this.current.template[uuid] = { amount: 0, targetAccount: accountUuid };
		}
		this.dirty = true;
	}

	addCustomEntity(name: string) {
		const trimmed = name.trim();
		if (trimmed && !this.current.settings.customEntities.includes(trimmed)) {
			this.current.settings.customEntities = [...this.current.settings.customEntities, trimmed];
			this.dirty = true;
		}
	}

	removeCustomEntity(name: string) {
		this.current.settings.customEntities = this.current.settings.customEntities.filter(
			(e) => e !== name
		);
		this.dirty = true;
	}

	toggleExcludedCategory(uuid: string) {
		const current = this.current.settings.excludedCategories;
		if (current.includes(uuid)) {
			this.current.settings.excludedCategories = current.filter((u) => u !== uuid);
		} else {
			this.current.settings.excludedCategories = [...current, uuid];
		}
		this.dirty = true;
	}

	removeTemplateEntry(uuid: string) {
		delete this.current.template[uuid];
		this.dirty = true;
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
		this.dirty = true;
	}

	getComment(month: string, uuid: string): string {
		return this.current.comments[month]?.[uuid] ?? '';
	}

	getCommentsForMonth(month: string): Array<{ uuid: string; text: string }> {
		const monthComments = this.current.comments[month];
		if (!monthComments) return [];
		return Object.entries(monthComments).map(([uuid, text]) => ({ uuid, text }));
	}

	updateSettings(partial: Partial<BudgetSettings>) {
		this.current.settings = { ...this.current.settings, ...partial };
		this.dirty = true;
	}

	setName(name: string) {
		this.current.name = name;
		this.dirty = true;
	}

	createNew(name: string) {
		this.current = createEmptyBudget(name);
		this.dirty = true;
	}
}

export const budget = new BudgetStore();
