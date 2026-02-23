import type { BudgetTemplate } from '$lib/types';

/**
 * Pre-built budget template for Familie Müller.
 * Planned amounts are set to create meaningful planned vs actual differences.
 */
export const DEMO_BUDGET: BudgetTemplate = {
	name: 'Demo Familie',
	version: '1.0.0',
	settings: {
		currency: 'EUR',
		accounts: [
			'demo-acc-001',
			'demo-acc-002',
			'demo-acc-003',
			'demo-acc-004',
			'demo-acc-005'
		],
		incomeCategories: ['demo-cat-001'],
		excludedCategories: [],
		startDate: '2025-01',
		customEntities: []
	},
	template: {
		// ── Income ──
		'demo-cat-003': { amount: 4200, note: 'Netto nach Steuer' },                 // Gehalt Max
		'demo-cat-004': { amount: 1850 },                                             // Gehalt Lisa
		'demo-cat-006': { amount: 500 },                                              // Kindergeld
		'demo-cat-007': { amount: 0 },                                                // Elterngeld (not active)
		'demo-cat-009': { amount: 400, note: 'Schwankt monatlich, Durchschnitt' },    // Freelance
		'demo-cat-010': { amount: 30 },                                               // Zinsen

		// ── Wohnen ──
		'demo-cat-111': { amount: 1450 },                                             // Miete
		'demo-cat-112': { amount: 95, note: '~280 EUR pro Quartal' },                 // Nebenkosten (monthly average)
		'demo-cat-113': { amount: 95 },                                               // Strom
		'demo-cat-114': { amount: 60 },                                               // Internet & Telefon
		'demo-cat-115': { amount: 18.36 },                                            // GEZ

		// ── Lebensmittel ──
		'demo-cat-121': { amount: 600, note: 'Budget für 4 Personen' },               // Supermarkt
		'demo-cat-122': { amount: 70 },                                               // Wochenmarkt
		'demo-cat-123': { amount: 30 },                                               // Bäckerei

		// ── Mobilität ──
		'demo-cat-131': { amount: 130 },                                              // Benzin
		'demo-cat-132': { amount: 68.50 },                                            // KFZ-Versicherung
		'demo-cat-133': { amount: 40, note: 'Rückstellung für TÜV/Inspektion' },      // Wartung (monthly average)
		'demo-cat-134': { amount: 49 },                                               // ÖPNV

		// ── Versicherungen ──
		'demo-cat-141': { amount: 45.80 },                                            // Krankenversicherung
		'demo-cat-142': { amount: 12.90 },                                            // Haftpflicht
		'demo-cat-143': { amount: 18.50 },                                            // Hausrat
		'demo-cat-144': { amount: 89 },                                               // BU

		// ── Kinder ──
		'demo-cat-151': { amount: 285 },                                              // Kita
		'demo-cat-152': { amount: 20 },                                               // Schulbedarf
		'demo-cat-153': { amount: 40 },                                               // Kleidung Kinder
		'demo-cat-154': { amount: 35 },                                               // Freizeit Kinder

		// ── Freizeit & Kultur ──
		'demo-cat-161': { amount: 120, note: 'Max 3x essen gehen/Monat' },            // Restaurant
		'demo-cat-162': { amount: 39.90 },                                            // Sport
		'demo-cat-163': {
			amount: 30.98,
			lineItems: [
				{ id: 'li-netflix', name: 'Netflix Standard', amount: 13.99 },
				{ id: 'li-spotify', name: 'Spotify Family', amount: 16.99 }
			]
		},                                                                             // Streaming
		'demo-cat-164': { amount: 200, note: 'Rücklage für Sommerurlaub' },            // Urlaub

		// ── Gesundheit ──
		'demo-cat-171': { amount: 25 },                                               // Arzt
		'demo-cat-172': { amount: 15, note: 'Rückstellung PZR' },                      // Zahnarzt

		// ── Kleidung & Pflege ──
		'demo-cat-181': { amount: 60 },                                               // Kleidung Erwachsene
		'demo-cat-182': { amount: 35 },                                               // Friseur

		// ── Sparen & Vorsorge ──
		'demo-cat-191': { amount: 400 },                                              // ETF
		'demo-cat-192': { amount: 200 },                                              // Tagesgeld
		'demo-cat-193': { amount: 162.17, note: 'Riester Max — staatlich gefördert' }, // Altersvorsorge

		// ── Sonstiges ──
		'demo-cat-201': { amount: 40 },                                               // Geschenke
		'demo-cat-202': { amount: 30 },                                               // Haushaltswaren
		'demo-cat-203': { amount: 25 }                                                // Bildung
	},
	comments: {
		'2026-01': {
			'demo-cat-121': 'Feiertage: mehr ausgegeben als geplant',
			'demo-cat-164': 'Skiurlaub-Anzahlung überwiesen'
		},
		'2026-02': {
			'demo-cat-133': 'TÜV fällig im März — Termin vereinbart'
		}
	},
	unplanned: {
		'2026-01': {
			'demo-cat-202': [
				{ txId: 9001, name: 'Elektro Huber', amount: -320, bookingDate: '2026-01-14', purpose: 'Waschmaschine Reparatur — Notfall' }
			],
			'demo-cat-172': [
				{ txId: 9002, name: 'Dr. Weber Zahnarzt', amount: -245, bookingDate: '2026-01-22', purpose: 'Zahnfüllung — nicht geplant' }
			]
		},
		'2026-02': {
			'demo-cat-133': [
				{ txId: 9003, name: 'Werkstatt Huber', amount: -485, bookingDate: '2026-02-11', purpose: 'Bremsen vorne erneuern — ungeplant' }
			]
		}
	},
	scenarios: [
		{
			id: 'demo-scenario-001',
			name: 'Urlaub Kroatien',
			description: 'Sommerurlaub in Kroatien — 2 Wochen Split/Dubrovnik',
			notes: 'Ferienwohnung bereits angefragt. Fähre vs. Flug noch klären.',
			createdAt: '2025-11-15T10:00:00.000Z',
			overrides: {
				'demo-cat-164': { amount: 1200 }, // Urlaub von 200 auf 1200 für den Monat
				'demo-cat-131': { amount: 200 },  // Mehr Benzin für Autofahrt
				'demo-cat-161': { amount: 250 }   // Mehr Restaurant im Urlaub
			},
			virtualItems: [
				{ id: 'vi-maut', name: 'Autobahnmaut Österreich/Kroatien', amount: 85, isIncome: false },
				{ id: 'vi-ferienwohnung', name: 'Ferienwohnung Split', amount: 980, isIncome: false }
			]
		}
	]
};
