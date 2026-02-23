import type { Category } from '$lib/types';

/**
 * Demo categories for Familie Müller.
 * Flat list with indentation levels matching MoneyMoney format.
 * buildCategoryTree() converts this into a tree structure.
 */
export const DEMO_CATEGORIES: Category[] = [
	// ── Einnahmen (top-level group, indentation 0) ──
	{ uuid: 'demo-cat-001', name: 'Einnahmen', currency: 'EUR', group: true, indentation: 0, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-002', name: 'Gehalt & Lohn', currency: 'EUR', group: true, indentation: 1, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-003', name: 'Gehalt Max', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-004', name: 'Gehalt Lisa', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-005', name: 'Staatliche Leistungen', currency: 'EUR', group: true, indentation: 1, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-006', name: 'Kindergeld', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-007', name: 'Elterngeld', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-008', name: 'Sonstige Einnahmen', currency: 'EUR', group: true, indentation: 1, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-009', name: 'Freelance-Projekte', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-010', name: 'Zinsen & Dividenden', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },

	// ── Ausgaben (top-level group, indentation 0) ──
	{ uuid: 'demo-cat-100', name: 'Ausgaben', currency: 'EUR', group: true, indentation: 0, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },

	// Wohnen
	{ uuid: 'demo-cat-110', name: 'Wohnen', currency: 'EUR', group: true, indentation: 1, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-111', name: 'Miete', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-112', name: 'Nebenkosten', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-113', name: 'Strom', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-114', name: 'Internet & Telefon', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-115', name: 'GEZ Rundfunkbeitrag', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },

	// Lebensmittel
	{ uuid: 'demo-cat-120', name: 'Lebensmittel', currency: 'EUR', group: true, indentation: 1, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-121', name: 'Supermarkt', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-122', name: 'Wochenmarkt', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-123', name: 'Bäckerei', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },

	// Mobilität
	{ uuid: 'demo-cat-130', name: 'Mobilität', currency: 'EUR', group: true, indentation: 1, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-131', name: 'Benzin & Tanken', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-132', name: 'KFZ-Versicherung', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-133', name: 'Wartung & TÜV', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-134', name: 'ÖPNV', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },

	// Versicherungen
	{ uuid: 'demo-cat-140', name: 'Versicherungen', currency: 'EUR', group: true, indentation: 1, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-141', name: 'Krankenversicherung', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-142', name: 'Haftpflichtversicherung', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-143', name: 'Hausratversicherung', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-144', name: 'Berufsunfähigkeit', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },

	// Kinder
	{ uuid: 'demo-cat-150', name: 'Kinder', currency: 'EUR', group: true, indentation: 1, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-151', name: 'Kita-Gebühren', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-152', name: 'Schulbedarf', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-153', name: 'Kleidung Kinder', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-154', name: 'Freizeit Kinder', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },

	// Freizeit & Kultur
	{ uuid: 'demo-cat-160', name: 'Freizeit & Kultur', currency: 'EUR', group: true, indentation: 1, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-161', name: 'Restaurant & Café', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-162', name: 'Sport & Fitness', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-163', name: 'Streaming & Abos', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-164', name: 'Urlaub & Reisen', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },

	// Gesundheit
	{ uuid: 'demo-cat-170', name: 'Gesundheit', currency: 'EUR', group: true, indentation: 1, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-171', name: 'Arzt & Medikamente', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-172', name: 'Zahnarzt', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },

	// Kleidung & Pflege
	{ uuid: 'demo-cat-180', name: 'Kleidung & Pflege', currency: 'EUR', group: true, indentation: 1, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-181', name: 'Kleidung Erwachsene', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-182', name: 'Friseur & Körperpflege', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },

	// Sparen & Vorsorge
	{ uuid: 'demo-cat-190', name: 'Sparen & Vorsorge', currency: 'EUR', group: true, indentation: 1, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-191', name: 'ETF-Sparplan', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-192', name: 'Tagesgeld-Rücklage', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-193', name: 'Altersvorsorge', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },

	// Sonstiges
	{ uuid: 'demo-cat-200', name: 'Sonstiges', currency: 'EUR', group: true, indentation: 1, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-201', name: 'Geschenke', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-202', name: 'Haushaltswaren', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
	{ uuid: 'demo-cat-203', name: 'Bildung & Bücher', currency: 'EUR', group: false, indentation: 2, isDefault: false, budgetAmount: null, budgetAvailable: null, budgetPeriod: null },
];

/** UUID of the top-level "Einnahmen" group — used as incomeCategories setting */
export const DEMO_INCOME_GROUP_UUID = 'demo-cat-001';
