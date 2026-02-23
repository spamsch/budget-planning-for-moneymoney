import type { Account } from '$lib/types';

export const DEMO_ACCOUNTS: Account[] = [
	{
		uuid: 'demo-acc-001',
		name: 'Girokonto Max',
		accountNumber: 'DE89370400440532013000',
		bankCode: '37040044',
		currency: 'EUR',
		balanceAmount: 3240,
		balanceCurrency: 'EUR',
		group: false,
		indentation: 0,
		owner: 'Max Müller',
		accountType: 'Giro',
		portfolio: false
	},
	{
		uuid: 'demo-acc-002',
		name: 'Girokonto Lisa',
		accountNumber: 'DE27100777770209299700',
		bankCode: '10077777',
		currency: 'EUR',
		balanceAmount: 1870,
		balanceCurrency: 'EUR',
		group: false,
		indentation: 0,
		owner: 'Lisa Müller',
		accountType: 'Giro',
		portfolio: false
	},
	{
		uuid: 'demo-acc-003',
		name: 'Gemeinsames Konto',
		accountNumber: 'DE91100000000123456789',
		bankCode: '10000000',
		currency: 'EUR',
		balanceAmount: 2150,
		balanceCurrency: 'EUR',
		group: false,
		indentation: 0,
		owner: 'Max & Lisa Müller',
		accountType: 'Giro',
		portfolio: false
	},
	{
		uuid: 'demo-acc-004',
		name: 'Tagesgeldkonto',
		accountNumber: 'DE75512108001245126199',
		bankCode: '51210800',
		currency: 'EUR',
		balanceAmount: 15400,
		balanceCurrency: 'EUR',
		group: false,
		indentation: 0,
		owner: 'Max & Lisa Müller',
		accountType: 'Savings',
		portfolio: false
	},
	{
		uuid: 'demo-acc-005',
		name: 'Depot',
		accountNumber: 'DE123456789',
		bankCode: '00000000',
		currency: 'EUR',
		balanceAmount: 42300,
		balanceCurrency: 'EUR',
		group: false,
		indentation: 0,
		owner: 'Max Müller',
		accountType: 'Investment',
		portfolio: true
	}
];
