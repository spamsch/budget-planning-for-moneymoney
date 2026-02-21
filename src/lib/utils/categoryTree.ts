import type { Category, CategoryNode } from '$lib/types';

/**
 * Build a tree hierarchy from MoneyMoney's flat category list.
 * MoneyMoney returns categories in order with `group` and `indentation` fields.
 * Groups contain their children at indentation + 1.
 */
export function buildCategoryTree(flat: Category[]): CategoryNode[] {
	const roots: CategoryNode[] = [];
	const stack: CategoryNode[] = [];

	for (const cat of flat) {
		const node: CategoryNode = {
			...cat,
			children: [],
			parent: null
		};

		// Pop stack until we find a parent at a lower indentation
		while (stack.length > 0 && stack[stack.length - 1].indentation >= cat.indentation) {
			stack.pop();
		}

		if (stack.length > 0) {
			const parent = stack[stack.length - 1];
			node.parent = parent;
			parent.children.push(node);
		} else {
			roots.push(node);
		}

		// Groups can be parents, push onto stack
		if (cat.group) {
			stack.push(node);
		}
	}

	return roots;
}

/**
 * Find a category node by UUID in the tree.
 */
export function findCategoryNode(roots: CategoryNode[], uuid: string): CategoryNode | null {
	for (const root of roots) {
		if (root.uuid === uuid) return root;
		if (root.children.length > 0) {
			const found = findCategoryNode(root.children, uuid);
			if (found) return found;
		}
	}
	return null;
}

/**
 * Get all leaf (non-group) category UUIDs under a node, including the node itself if it's a leaf.
 */
export function getLeafCategoryUuids(node: CategoryNode): string[] {
	if (!node.group || node.children.length === 0) {
		return [node.uuid];
	}
	return node.children.flatMap(getLeafCategoryUuids);
}

/**
 * Split roots into income and expense groups.
 */
export function splitIncomeExpense(
	roots: CategoryNode[],
	incomeCategoryUuids: string[]
): { income: CategoryNode[]; expenses: CategoryNode[] } {
	const incomeSet = new Set(incomeCategoryUuids);
	const income: CategoryNode[] = [];
	const expenses: CategoryNode[] = [];

	for (const root of roots) {
		if (incomeSet.has(root.uuid)) {
			income.push(root);
		} else {
			expenses.push(root);
		}
	}

	return { income, expenses };
}

/**
 * Collect all UUIDs (including nested children) under a set of category nodes.
 */
export function collectAllUuids(nodes: CategoryNode[]): string[] {
	const uuids: string[] = [];
	function walk(node: CategoryNode) {
		uuids.push(node.uuid);
		for (const child of node.children) {
			walk(child);
		}
	}
	for (const node of nodes) {
		walk(node);
	}
	return uuids;
}
