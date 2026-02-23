/**
 * Pure data transformation functions for charts.
 * Converts CategoryBudgetRow[] into ECharts-compatible data structures.
 */
import type { CategoryBudgetRow, UnplannedTransaction } from '$lib/types';

/** Threshold below which small slices merge into "Sonstige" */
const SMALL_SLICE_THRESHOLD = 0.02; // 2%

export type PieSlice = {
	uuid: string;
	name: string;
	value: number;
	group: boolean;
	children: CategoryBudgetRow[];
};

export type BarItem = {
	uuid: string;
	name: string;
	planned: number;
	actual: number;
	difference: number;
	isOverBudget: boolean;
};

export type OverBudgetAlert = {
	uuid: string;
	name: string;
	planned: number;
	actual: number;
	overAmount: number;
	severity: number; // ratio actual/planned
};

export type UnplannedAlert = {
	categoryUuid: string;
	categoryName: string;
	transactions: UnplannedTransaction[];
	totalAmount: number;
};

/**
 * Transform rows into pie chart data at a given level.
 * @param rows - CategoryBudgetRow[] at current drill level
 * @param valueMode - 'planned' or 'actual'
 */
export function rowsToPieData(
	rows: CategoryBudgetRow[],
	valueMode: 'planned' | 'actual'
): PieSlice[] {
	const visibleRows = rows.filter((r) => !r.excluded);
	const rawSlices: PieSlice[] = visibleRows.map((r) => ({
		uuid: r.uuid,
		name: r.name,
		value: Math.abs(r[valueMode]),
		group: r.group && r.children.length > 0,
		children: r.children
	}));

	// Filter out zero-value slices
	const nonZero = rawSlices.filter((s) => s.value > 0);
	if (nonZero.length === 0) return nonZero;

	const total = nonZero.reduce((sum, s) => sum + s.value, 0);
	if (total === 0) return nonZero;

	// Merge small slices into "Sonstige"
	const significant: PieSlice[] = [];
	let sonstigeValue = 0;

	for (const slice of nonZero) {
		if (slice.value / total < SMALL_SLICE_THRESHOLD) {
			sonstigeValue += slice.value;
		} else {
			significant.push(slice);
		}
	}

	if (sonstigeValue > 0) {
		significant.push({
			uuid: '__sonstige__',
			name: 'Sonstige',
			value: sonstigeValue,
			group: false,
			children: []
		});
	}

	return significant;
}

/**
 * Transform top-level expense rows into bar chart comparison data.
 */
export function rowsToBarData(rows: CategoryBudgetRow[]): BarItem[] {
	return rows
		.filter((r) => !r.excluded)
		.filter((r) => r.planned > 0 || r.actual > 0)
		.map((r) => ({
			uuid: r.uuid,
			name: r.name,
			planned: r.planned,
			actual: r.actual,
			difference: r.difference,
			isOverBudget: r.actual > r.planned && r.planned > 0
		}));
}

/**
 * Collect all categories where actual exceeds planned (expenses only).
 */
export function collectOverBudgetItems(
	incomeRows: CategoryBudgetRow[],
	expenseRows: CategoryBudgetRow[]
): OverBudgetAlert[] {
	const alerts: OverBudgetAlert[] = [];

	function walkExpenses(rows: CategoryBudgetRow[]) {
		for (const row of rows) {
			if (row.excluded) continue;
			if (row.group && row.children.length > 0) {
				walkExpenses(row.children);
			} else if (row.planned > 0 && row.actual > row.planned) {
				const overAmount = row.actual - row.planned;
				alerts.push({
					uuid: row.uuid,
					name: row.name,
					planned: row.planned,
					actual: row.actual,
					overAmount,
					severity: row.actual / row.planned
				});
			}
		}
	}

	// Income under-performance is also an alert
	function walkIncome(rows: CategoryBudgetRow[]) {
		for (const row of rows) {
			if (row.excluded) continue;
			if (row.group && row.children.length > 0) {
				walkIncome(row.children);
			} else if (row.planned > 0 && row.actual < row.planned) {
				const shortfall = row.planned - row.actual;
				alerts.push({
					uuid: row.uuid,
					name: row.name,
					planned: row.planned,
					actual: row.actual,
					overAmount: shortfall,
					severity: row.planned / Math.max(row.actual, 0.01)
				});
			}
		}
	}

	walkExpenses(expenseRows);
	walkIncome(incomeRows);

	// Sort by severity descending
	alerts.sort((a, b) => b.severity - a.severity);
	return alerts;
}

/**
 * Build unplanned transaction alerts grouped by category.
 */
export function collectUnplannedAlerts(
	unplannedForMonth: Array<{
		categoryUuid: string;
		transactions: UnplannedTransaction[];
	}>,
	allRows: CategoryBudgetRow[]
): UnplannedAlert[] {
	function findName(rows: CategoryBudgetRow[], uuid: string): string {
		for (const r of rows) {
			if (r.uuid === uuid) return r.name;
			if (r.children.length > 0) {
				const found = findName(r.children, uuid);
				if (found) return found;
			}
		}
		return '';
	}

	return unplannedForMonth
		.filter((entry) => entry.transactions.length > 0)
		.map((entry) => ({
			categoryUuid: entry.categoryUuid,
			categoryName: findName(allRows, entry.categoryUuid) || entry.categoryUuid,
			transactions: entry.transactions,
			totalAmount: entry.transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
		}));
}
