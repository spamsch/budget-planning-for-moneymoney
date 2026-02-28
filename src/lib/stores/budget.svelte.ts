import { invoke } from '@tauri-apps/api/core';
import type { BudgetTemplate, BudgetSettings, TemplateEntry, LineItem, UnplannedTransaction, MovedTransaction, Scenario, ScenarioOverride, VirtualItem } from '$lib/types';
import { isDemoMode, DEMO_BUDGET } from '$lib/demo';

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
		unplanned: {},
		moved: {},
		scenarios: []
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
		if (isDemoMode) {
			this.budgetNames = ['Demo Familie'];
			return;
		}
		try {
			this.budgetNames = await invoke<string[]>('list_budgets');
		} catch (e) {
			this.error = `Failed to list budgets: ${e}`;
		}
	}

	async loadBudget(name: string) {
		this._clearTimers();
		if (isDemoMode) {
			this.current = structuredClone(DEMO_BUDGET);
			this.dirty = false;
			return;
		}
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
			if (!loaded.moved) {
				loaded.moved = {};
			}
			if (!loaded.scenarios) {
				loaded.scenarios = [];
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
		if (isDemoMode) {
			this.dirty = false;
			this.lastSavedAt = new Date();
			return;
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
		if (isDemoMode) return;
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

	// --- Move transaction methods ---

	moveTransactions(sourceMonth: string, targetMonth: string, transactions: MovedTransaction[]) {
		const existing = this.current.moved[sourceMonth] ?? [];
		const existingIds = new Set(existing.map((t) => t.txId));
		const toAdd = transactions.filter((t) => !existingIds.has(t.txId));
		if (toAdd.length > 0) {
			this.current.moved[sourceMonth] = [...existing, ...toAdd];
			this._markDirty();
		}
	}

	unmoveTransaction(sourceMonth: string, txId: number) {
		const entries = this.current.moved[sourceMonth];
		if (!entries) return;
		this.current.moved[sourceMonth] = entries.filter((t) => t.txId !== txId);
		if (this.current.moved[sourceMonth].length === 0) {
			delete this.current.moved[sourceMonth];
		}
		this._markDirty();
	}

	getMovedOutIds(month: string): Set<number> {
		const entries = this.current.moved[month];
		return entries ? new Set(entries.map((t) => t.txId)) : new Set();
	}

	getMovedInForMonth(month: string): MovedTransaction[] {
		const result: MovedTransaction[] = [];
		for (const entries of Object.values(this.current.moved)) {
			for (const tx of entries) {
				if (tx.targetMonth === month) {
					result.push(tx);
				}
			}
		}
		return result;
	}

	getMovedOutForMonth(month: string): MovedTransaction[] {
		return this.current.moved[month] ?? [];
	}

	// --- Scenario methods ---

	private _findScenario(id: string): Scenario | undefined {
		return this.current.scenarios.find((s) => s.id === id);
	}

	createScenario(name: string): string {
		const id = crypto.randomUUID();
		const scenario: Scenario = {
			id,
			name,
			createdAt: new Date().toISOString(),
			overrides: {},
			virtualItems: []
		};
		this.current.scenarios = [...this.current.scenarios, scenario];
		this._markDirty();
		return id;
	}

	duplicateScenario(id: string, newName: string): string | null {
		const source = this._findScenario(id);
		if (!source) return null;
		const newId = crypto.randomUUID();
		const clone: Scenario = {
			id: newId,
			name: newName,
			createdAt: new Date().toISOString(),
			overrides: JSON.parse(JSON.stringify(source.overrides)),
			virtualItems: source.virtualItems.map((v) => ({ ...v, id: crypto.randomUUID() }))
		};
		if (source.description) clone.description = source.description;
		if (source.notes) clone.notes = source.notes;
		this.current.scenarios = [...this.current.scenarios, clone];
		this._markDirty();
		return newId;
	}

	deleteScenario(id: string) {
		this.current.scenarios = this.current.scenarios.filter((s) => s.id !== id);
		this._markDirty();
	}

	renameScenario(id: string, name: string) {
		const scenario = this._findScenario(id);
		if (!scenario) return;
		scenario.name = name.trim();
		this._markDirty();
	}

	updateScenarioDescription(id: string, text: string) {
		const scenario = this._findScenario(id);
		if (!scenario) return;
		const trimmed = text.trim();
		scenario.description = trimmed || undefined;
		this._markDirty();
	}

	updateScenarioNotes(id: string, text: string) {
		const scenario = this._findScenario(id);
		if (!scenario) return;
		const trimmed = text.trim();
		scenario.notes = trimmed || undefined;
		this._markDirty();
	}

	setScenarioOverride(scenarioId: string, categoryUuid: string, amount: number) {
		const scenario = this._findScenario(scenarioId);
		if (!scenario) return;
		const baseline = this.current.template[categoryUuid]?.amount ?? 0;
		if (Math.abs(amount - baseline) < 0.005) {
			delete scenario.overrides[categoryUuid];
		} else {
			scenario.overrides[categoryUuid] = { amount };
		}
		this._markDirty();
	}

	removeScenarioOverride(scenarioId: string, categoryUuid: string) {
		const scenario = this._findScenario(scenarioId);
		if (!scenario) return;
		delete scenario.overrides[categoryUuid];
		this._markDirty();
	}

	addVirtualItem(scenarioId: string, name: string, amount: number, isIncome: boolean): string | null {
		const scenario = this._findScenario(scenarioId);
		if (!scenario) return null;
		const id = crypto.randomUUID();
		scenario.virtualItems = [...scenario.virtualItems, { id, name, amount, isIncome }];
		this._markDirty();
		return id;
	}

	updateVirtualItem(scenarioId: string, itemId: string, updates: Partial<Pick<VirtualItem, 'name' | 'amount' | 'isIncome'>>) {
		const scenario = this._findScenario(scenarioId);
		if (!scenario) return;
		const item = scenario.virtualItems.find((v) => v.id === itemId);
		if (!item) return;
		if (updates.name !== undefined) item.name = updates.name;
		if (updates.amount !== undefined) item.amount = updates.amount;
		if (updates.isIncome !== undefined) item.isIncome = updates.isIncome;
		this._markDirty();
	}

	removeVirtualItem(scenarioId: string, itemId: string) {
		const scenario = this._findScenario(scenarioId);
		if (!scenario) return;
		scenario.virtualItems = scenario.virtualItems.filter((v) => v.id !== itemId);
		this._markDirty();
	}

	applyScenarioToBaseline(scenarioId: string) {
		const scenario = this._findScenario(scenarioId);
		if (!scenario) return;
		for (const [uuid, override] of Object.entries(scenario.overrides)) {
			const existing = this.current.template[uuid];
			if (existing) {
				existing.amount = override.amount;
				if (override.lineItems?.length) {
					existing.lineItems = override.lineItems;
				}
			} else {
				this.current.template[uuid] = { amount: override.amount };
			}
		}
		this.current.scenarios = this.current.scenarios.filter((s) => s.id !== scenarioId);
		this._markDirty();
	}

	getResolvedTemplate(scenarioId: string): Record<string, TemplateEntry> {
		const scenario = this._findScenario(scenarioId);
		if (!scenario) return this.current.template;
		const resolved: Record<string, TemplateEntry> = {};
		for (const [uuid, entry] of Object.entries(this.current.template)) {
			resolved[uuid] = { ...entry };
		}
		for (const [uuid, override] of Object.entries(scenario.overrides)) {
			if (resolved[uuid]) {
				resolved[uuid] = { ...resolved[uuid], amount: override.amount };
			} else {
				resolved[uuid] = { amount: override.amount };
			}
		}
		return resolved;
	}

	getScenarioOverrideCount(scenarioId: string): number {
		const scenario = this._findScenario(scenarioId);
		if (!scenario) return 0;
		return Object.keys(scenario.overrides).length + scenario.virtualItems.length;
	}

	updateSettings(partial: Partial<BudgetSettings>) {
		this.current.settings = { ...this.current.settings, ...partial };
		this._markDirty();
	}

	async renameBudget(newName: string) {
		const trimmed = newName.trim();
		if (!trimmed || trimmed === this.current.name) return;
		if (isDemoMode) {
			this.current.name = trimmed;
			return;
		}
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
