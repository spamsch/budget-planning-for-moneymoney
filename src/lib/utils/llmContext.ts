import type { CategoryBudgetRow, MonthSummary } from '$lib/types';
import { formatMonthLabel } from '$lib/stores/ui.svelte';
import { formatEur } from '$lib/utils/budgetCalc';

function formatRows(rows: CategoryBudgetRow[], indent = 0): string {
	const lines: string[] = [];
	for (const row of rows) {
		if (row.excluded) continue;
		const prefix = '  '.repeat(indent);
		if (row.group && row.children.length > 0) {
			lines.push(`${prefix}[${row.name}]`);
			lines.push(formatRows(row.children, indent + 1));
		} else {
			const diff = row.actual - row.planned;
			const sign = diff >= 0 ? '+' : '';
			lines.push(
				`${prefix}${row.name}: planned ${formatEur(row.planned)}, actual ${formatEur(row.actual)}, diff ${sign}${formatEur(diff)}`
			);
		}
	}
	return lines.filter(Boolean).join('\n');
}

export function buildBudgetContext(
	incomeRows: CategoryBudgetRow[],
	expenseRows: CategoryBudgetRow[],
	summary: MonthSummary,
	month: string,
	scenarioName?: string | null
): string {
	const parts: string[] = [
		`You are a helpful financial advisor analyzing a personal budget.`,
		`Current month: ${formatMonthLabel(month)}`,
	];

	if (scenarioName) {
		parts.push(`Active scenario: "${scenarioName}"`);
	}

	parts.push('');
	parts.push('== Summary ==');
	parts.push(`Income planned: ${formatEur(summary.totalIncomePlanned)} | actual: ${formatEur(summary.totalIncomeActual)}`);
	parts.push(`Expenses planned: ${formatEur(summary.totalExpensesPlanned)} | actual: ${formatEur(summary.totalExpensesActual)}`);
	parts.push(`Net planned: ${formatEur(summary.netPlanned)} | net actual: ${formatEur(summary.netActual)}`);

	parts.push('');
	parts.push('== Income Categories ==');
	parts.push(formatRows(incomeRows));

	parts.push('');
	parts.push('== Expense Categories ==');
	parts.push(formatRows(expenseRows));

	return parts.join('\n');
}
