import { SvelteSet } from 'svelte/reactivity';

class UiStore {
	selectedMonth = $state(getCurrentMonth());
	collapsedGroups = new SvelteSet<string>();
	expandedLineItems = new SvelteSet<string>();
	expandedNotes = new SvelteSet<string>();
	showAccountRouting = $state(false);
	showNotes = $state(false);
	selectedCategoryUuid = $state<string | null>(null);
	activeScenarioId = $state<string | null>(null);
	showScenarioPanel = $state(false);
	viewMode = $state<'table' | 'analysis'>('table');

	setMonth(month: string) {
		this.selectedMonth = month;
	}

	previousMonth() {
		this.selectedMonth = offsetMonth(this.selectedMonth, -1);
	}

	nextMonth() {
		this.selectedMonth = offsetMonth(this.selectedMonth, 1);
	}

	toggleGroup(uuid: string) {
		if (this.collapsedGroups.has(uuid)) {
			this.collapsedGroups.delete(uuid);
		} else {
			this.collapsedGroups.add(uuid);
		}
	}

	isCollapsed(uuid: string): boolean {
		return this.collapsedGroups.has(uuid);
	}

	toggleLineItems(uuid: string) {
		if (this.expandedLineItems.has(uuid)) {
			this.expandedLineItems.delete(uuid);
		} else {
			this.expandedLineItems.add(uuid);
		}
	}

	isLineItemsExpanded(uuid: string): boolean {
		return this.expandedLineItems.has(uuid);
	}

	toggleNote(uuid: string) {
		if (this.expandedNotes.has(uuid)) {
			this.expandedNotes.delete(uuid);
		} else {
			this.expandedNotes.add(uuid);
		}
	}

	isNoteExpanded(uuid: string): boolean {
		return this.expandedNotes.has(uuid);
	}

	toggleNotesPanel() {
		this.showNotes = !this.showNotes;
	}

	toggleAccountRouting() {
		this.showAccountRouting = !this.showAccountRouting;
	}

	toggleScenarioPanel() {
		this.showScenarioPanel = !this.showScenarioPanel;
	}

	toggleViewMode() {
		this.viewMode = this.viewMode === 'table' ? 'analysis' : 'table';
	}

	activateScenario(id: string) {
		this.activeScenarioId = id;
	}

	deactivateScenario() {
		this.activeScenarioId = null;
	}

	selectCategory(uuid: string) {
		this.selectedCategoryUuid = this.selectedCategoryUuid === uuid ? null : uuid;
	}

	clearSelection() {
		this.selectedCategoryUuid = null;
	}
}

function getCurrentMonth(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function offsetMonth(month: string, offset: number): string {
	const [year, mon] = month.split('-').map(Number);
	const d = new Date(year, mon - 1 + offset, 1);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthToDateRange(month: string): { from: string; to: string } {
	const [year, mon] = month.split('-').map(Number);
	const from = `${year}-${String(mon).padStart(2, '0')}-01`;
	const lastDay = new Date(year, mon, 0).getDate();
	const to = `${year}-${String(mon).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
	return { from, to };
}

export function formatMonthLabel(month: string): string {
	const [year, mon] = month.split('-').map(Number);
	const date = new Date(year, mon - 1, 1);
	return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

export const ui = new UiStore();
