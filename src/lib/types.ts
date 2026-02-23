// Mirror of Rust types from MoneyMoney
export type Category = {
	uuid: string;
	name: string;
	currency: string;
	group: boolean;
	indentation: number;
	isDefault: boolean;
	budgetAmount: number | null;
	budgetAvailable: number | null;
	budgetPeriod: string | null;
};

export type CategoryNode = Category & {
	children: CategoryNode[];
	parent: CategoryNode | null;
};

export type Account = {
	uuid: string;
	name: string;
	accountNumber: string;
	bankCode: string;
	currency: string;
	balanceAmount: number;
	balanceCurrency: string;
	group: boolean;
	indentation: number;
	owner: string;
	accountType: string;
	portfolio: boolean;
};

export type Transaction = {
	id: number;
	amount: number;
	currency: string;
	bookingDate: string;
	valueDate: string;
	name: string;
	purpose: string | null;
	categoryUuid: string;
	accountUuid: string;
	booked: boolean;
	checkmark: boolean;
};

export type UnplannedTransaction = {
	txId: number;
	name: string;
	amount: number;
	bookingDate: string;
	purpose: string | null;
};

// Budget persistence types
export type LineItem = {
	id: string;
	name: string;
	amount: number;
	description?: string;
};

export type TemplateEntry = {
	amount: number;
	sourceAccount?: string;
	targetAccount?: string;
	lineItems?: LineItem[];
	note?: string;
};

export type BudgetSettings = {
	currency: string;
	accounts: string[];
	incomeCategories: string[];
	excludedCategories: string[];
	startDate: string;
	customEntities: string[];
};

export type BudgetTemplate = {
	name: string;
	version: string;
	settings: BudgetSettings;
	template: Record<string, TemplateEntry>;
	comments: Record<string, Record<string, string>>;
	unplanned: Record<string, Record<string, UnplannedTransaction[]>>;
	scenarios: Scenario[];
};

// Scenario types
export type ScenarioOverride = {
	amount: number;
	lineItems?: LineItem[];
};

export type VirtualItem = {
	id: string;
	name: string;
	amount: number;
	isIncome: boolean;
};

export type Scenario = {
	id: string;
	name: string;
	description?: string;
	createdAt: string;
	overrides: Record<string, ScenarioOverride>;
	virtualItems: VirtualItem[];
};

export type ScenarioImpactSummary = {
	baselineExpenses: number;
	scenarioExpenses: number;
	baselineIncome: number;
	scenarioIncome: number;
	netDelta: number;
	overriddenCount: number;
	virtualItemsTotal: number;
};

// Computed types for the UI
export type CategoryBudgetRow = {
	uuid: string;
	name: string;
	group: boolean;
	indentation: number;
	isIncome: boolean;
	planned: number;
	actual: number;
	difference: number;
	children: CategoryBudgetRow[];
	excluded?: boolean;
	sourceAccount?: string;
	targetAccount?: string;
	lineItems?: LineItem[];
	note?: string;
};

export type MonthSummary = {
	totalIncomePlanned: number;
	totalIncomeActual: number;
	totalExpensesPlanned: number;
	totalExpensesActual: number;
	netPlanned: number;
	netActual: number;
};
