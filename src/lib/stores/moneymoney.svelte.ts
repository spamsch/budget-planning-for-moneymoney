import { invoke } from '@tauri-apps/api/core';
import type { Category, CategoryNode, Account, Transaction } from '$lib/types';
import { buildCategoryTree } from '$lib/utils/categoryTree';

function formatError(context: string, e: unknown): string {
	const msg = String(e);
	if (msg.includes('Locked database')) {
		return 'MoneyMoney-Datenbank ist gesperrt. Bitte öffne MoneyMoney und entsperre die Datenbank.';
	}
	if (msg.includes('(-1728)') || msg.includes('not running')) {
		return 'MoneyMoney ist nicht geöffnet. Bitte starte MoneyMoney und versuche es erneut.';
	}
	if (msg.includes('not allowed') || msg.includes('(-1743)')) {
		return 'Zugriff auf MoneyMoney verweigert. Bitte erlaube den Zugriff unter Systemeinstellungen → Datenschutz → Automatisierung.';
	}
	return `${context}: ${msg}`;
}

class MoneyMoneyStore {
	categories = $state<Category[]>([]);
	accounts = $state<Account[]>([]);
	transactions = $state<Transaction[]>([]);
	categoryTree = $state<CategoryNode[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);
	connected = $state(false);
	lastRefresh = $state<Date | null>(null);

	// Cache: month key → transactions
	private txCache = new Map<string, Transaction[]>();

	async fetchCategories() {
		try {
			this.loading = true;
			this.error = null;
			this.categories = await invoke<Category[]>('fetch_categories');
			this.categoryTree = buildCategoryTree(this.categories);
			this.connected = true;
		} catch (e) {
			this.error = formatError('Kategorien laden', e);
			console.error(this.error);
		} finally {
			this.loading = false;
		}
	}

	async fetchAccounts() {
		try {
			this.loading = true;
			this.error = null;
			this.accounts = await invoke<Account[]>('fetch_accounts');
			this.connected = true;
		} catch (e) {
			this.error = formatError('Konten laden', e);
			console.error(this.error);
		} finally {
			this.loading = false;
		}
	}

	async fetchTransactions(from: string, to: string, accountUuids: string[]) {
		const cacheKey = `${from}_${to}_${accountUuids.sort().join(',')}`;
		const cached = this.txCache.get(cacheKey);
		if (cached) {
			this.transactions = cached;
			return;
		}

		try {
			this.loading = true;
			this.error = null;
			const txs = await invoke<Transaction[]>('fetch_transactions', {
				from,
				to,
				accounts: accountUuids
			});
			this.txCache.set(cacheKey, txs);
			this.transactions = txs;
			this.lastRefresh = new Date();
		} catch (e) {
			this.error = formatError('Transaktionen laden', e);
			console.error(this.error);
		} finally {
			this.loading = false;
		}
	}

	clearCache() {
		this.txCache.clear();
	}

	async refresh() {
		this.txCache.clear();
		await Promise.all([this.fetchCategories(), this.fetchAccounts()]);
	}
}

export const mm = new MoneyMoneyStore();
