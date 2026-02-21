import type {
	CategoryNode,
	CategoryBudgetRow,
	MonthSummary,
	TemplateEntry,
	Transaction
} from '$lib/types';
import { getLeafCategoryUuids } from './categoryTree';

type TxMap = Map<string, { total: number; transactions: Transaction[] }>;

/**
 * Group transactions by category UUID, summing amounts.
 * MoneyMoney uses negative amounts for expenses, positive for income.
 */
export function groupTransactionsByCategory(transactions: Transaction[]): TxMap {
	const map: TxMap = new Map();
	for (const tx of transactions) {
		const entry = map.get(tx.categoryUuid);
		if (entry) {
			entry.total += tx.amount;
			entry.transactions.push(tx);
		} else {
			map.set(tx.categoryUuid, { total: tx.amount, transactions: [tx] });
		}
	}
	return map;
}

/**
 * Compute budget rows for a tree of categories.
 * For leaf categories: planned = template amount, actual = sum of transactions.
 * For group categories: planned/actual = sum of children.
 * Difference = planned - |actual| for expenses (positive = under budget),
 *              actual - planned for income (positive = above plan).
 */
export function computeCategoryRows(
	nodes: CategoryNode[],
	template: Record<string, TemplateEntry>,
	txMap: TxMap,
	incomeUuids: Set<string>,
	isIncome: boolean,
	excludedUuids: Set<string> = new Set()
): CategoryBudgetRow[] {
	return nodes.map((node) => {
		const excluded = excludedUuids.has(node.uuid);
		const children = computeCategoryRows(
			node.children,
			template,
			txMap,
			incomeUuids,
			isIncome,
			excludedUuids
		);

		let planned: number;
		let actual: number;

		if (node.group && children.length > 0) {
			// Aggregate from children
			planned = children.reduce((sum, c) => sum + c.planned, 0);
			actual = children.reduce((sum, c) => sum + c.actual, 0);
		} else {
			// Leaf category
			const entry = template[node.uuid];
			planned = excluded ? 0 : (entry?.amount ?? 0);

			// Sum transactions for this category and all subcategories
			const leafUuids = getLeafCategoryUuids(node);
			actual = leafUuids.reduce((sum, uuid) => {
				const txEntry = txMap.get(uuid);
				return sum + (txEntry?.total ?? 0);
			}, 0);

			// For expenses, MoneyMoney returns negative amounts - convert to positive for display
			if (!isIncome) {
				actual = Math.abs(actual);
			}
		}

		// Excluded groups: zero out planned (actuals kept for reference)
		if (excluded && node.group) {
			planned = 0;
		}

		// Difference: positive = good (under budget or above income plan)
		const difference = excluded ? 0 : (isIncome ? actual - planned : planned - actual);

		return {
			uuid: node.uuid,
			name: node.name,
			group: node.group,
			indentation: node.indentation,
			isIncome,
			planned,
			actual,
			difference,
			children,
			excluded,
			sourceAccount: template[node.uuid]?.sourceAccount,
			targetAccount: template[node.uuid]?.targetAccount,
			lineItems: template[node.uuid]?.lineItems
		};
	});
}

/**
 * Compute month summary from income and expense rows.
 */
export function computeMonthSummary(
	incomeRows: CategoryBudgetRow[],
	expenseRows: CategoryBudgetRow[]
): MonthSummary {
	const sumPlanned = (rows: CategoryBudgetRow[]): number =>
		rows.reduce((sum, r) => {
			if (r.excluded) return sum;
			if (r.group && r.children.length > 0) return sum + sumPlanned(r.children);
			return sum + r.planned;
		}, 0);

	const sumActual = (rows: CategoryBudgetRow[]): number =>
		rows.reduce((sum, r) => {
			if (r.excluded) return sum;
			if (r.group && r.children.length > 0) return sum + sumActual(r.children);
			return sum + r.actual;
		}, 0);

	const totalIncomePlanned = sumPlanned(incomeRows);
	const totalIncomeActual = sumActual(incomeRows);
	const totalExpensesPlanned = sumPlanned(expenseRows);
	const totalExpensesActual = sumActual(expenseRows);

	return {
		totalIncomePlanned,
		totalIncomeActual,
		totalExpensesPlanned,
		totalExpensesActual,
		netPlanned: totalIncomePlanned - totalExpensesPlanned,
		netActual: totalIncomeActual - totalExpensesActual
	};
}

/**
 * Format a number as EUR currency.
 */
export function formatEur(amount: number): string {
	return new Intl.NumberFormat('de-DE', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(amount);
}
