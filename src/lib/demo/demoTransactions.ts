import type { Transaction } from '$lib/types';

/**
 * Seeded PRNG (mulberry32) for deterministic-per-month transaction generation.
 */
function mulberry32(seed: number): () => number {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Hash a month string like "2026-02" into a numeric seed */
function monthSeed(month: string): number {
	let hash = 0;
	for (let i = 0; i < month.length; i++) {
		hash = ((hash << 5) - hash + month.charCodeAt(i)) | 0;
	}
	return hash;
}

/** Round to 2 decimal places */
function r2(n: number): number {
	return Math.round(n * 100) / 100;
}

/** Get days in month */
function daysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

type TxSpec = {
	day: number;
	name: string;
	purpose: string | null;
	amount: number; // positive = income, negative = expense
	categoryUuid: string;
	accountUuid: string;
};

const GEMEINSAM = 'demo-acc-003';
const MAX_GIRO = 'demo-acc-001';
const LISA_GIRO = 'demo-acc-002';
const TAGESGELD = 'demo-acc-004';
const DEPOT = 'demo-acc-005';

/**
 * Generate demo transactions for a date range.
 * Produces 50-80 deterministic transactions per month.
 */
export function generateDemoTransactions(
	from: string,
	to: string,
	accountUuids: string[]
): Transaction[] {
	const accountSet = new Set(accountUuids);
	const fromDate = new Date(from + 'T00:00:00');
	const toDate = new Date(to + 'T00:00:00');
	const transactions: Transaction[] = [];
	let idCounter = 1;

	// Iterate over each month in the range
	const cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
	const endMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 1);

	while (cursor <= endMonth) {
		const year = cursor.getFullYear();
		const month = cursor.getMonth() + 1; // 1-based
		const monthStr = `${year}-${String(month).padStart(2, '0')}`;
		const maxDay = daysInMonth(year, month);
		const rng = mulberry32(monthSeed(monthStr));

		/** Vary an amount by ±percentage using seeded rng */
		function vary(base: number, pct: number): number {
			return r2(base * (1 + (rng() * 2 - 1) * pct));
		}

		/** Random int in [min, max] */
		function randInt(min: number, max: number): number {
			return min + Math.floor(rng() * (max - min + 1));
		}

		/** Clamp day to valid range for month */
		function clampDay(d: number): number {
			return Math.min(d, maxDay);
		}

		const specs: TxSpec[] = [];

		// ── Fixed monthly income ──
		specs.push({ day: clampDay(28), name: 'TechCorp GmbH', purpose: 'Gehalt Max Müller', amount: vary(4200, 0), categoryUuid: 'demo-cat-003', accountUuid: MAX_GIRO });
		specs.push({ day: clampDay(28), name: 'Freistaat Bayern', purpose: 'Gehalt Lisa Müller', amount: vary(1850, 0), categoryUuid: 'demo-cat-004', accountUuid: LISA_GIRO });
		specs.push({ day: 5, name: 'Familienkasse', purpose: 'Kindergeld 2 Kinder', amount: 500, categoryUuid: 'demo-cat-006', accountUuid: GEMEINSAM });

		// Freelance — some months only
		if (rng() > 0.5) {
			specs.push({ day: randInt(10, 20), name: 'Webprojekt Kunde', purpose: 'Freelance Webentwicklung', amount: vary(800, 0.3), categoryUuid: 'demo-cat-009', accountUuid: MAX_GIRO });
		}

		// Zinsen & Dividenden — quarterly
		if (month % 3 === 0) {
			specs.push({ day: clampDay(15), name: 'ING DiBa', purpose: 'Zinsgutschrift Tagesgeld', amount: r2(15400 * 0.03 / 4), categoryUuid: 'demo-cat-010', accountUuid: TAGESGELD });
		}

		// ── Fixed monthly expenses ──
		specs.push({ day: 1, name: 'Hausverwaltung München', purpose: 'Miete Wohnung Schwabing', amount: -1450, categoryUuid: 'demo-cat-111', accountUuid: GEMEINSAM });

		// Nebenkosten — quarterly (Jan, Apr, Jul, Oct)
		if (month % 3 === 1) {
			specs.push({ day: 1, name: 'Hausverwaltung München', purpose: 'Nebenkosten Q' + Math.ceil(month / 3), amount: vary(-280, 0.05), categoryUuid: 'demo-cat-112', accountUuid: GEMEINSAM });
		}

		specs.push({ day: 3, name: 'Stadtwerke München', purpose: 'Strom Abschlag', amount: vary(-95, 0.03), categoryUuid: 'demo-cat-113', accountUuid: GEMEINSAM });
		specs.push({ day: 5, name: 'Telekom', purpose: 'Internet + Mobilfunk', amount: -59.95, categoryUuid: 'demo-cat-114', accountUuid: GEMEINSAM });
		specs.push({ day: 1, name: 'ARD ZDF', purpose: 'Rundfunkbeitrag', amount: -18.36, categoryUuid: 'demo-cat-115', accountUuid: GEMEINSAM });

		// ── Groceries: 8-12 supermarket trips ──
		const supermarketCount = randInt(8, 12);
		const supermarkets = ['REWE', 'EDEKA', 'Aldi Süd', 'Lidl'];
		for (let i = 0; i < supermarketCount; i++) {
			const store = supermarkets[randInt(0, supermarkets.length - 1)];
			specs.push({
				day: randInt(1, maxDay),
				name: store,
				purpose: 'Lebensmittel',
				amount: vary(-65, 0.5), // 35-120 EUR range
				categoryUuid: 'demo-cat-121',
				accountUuid: GEMEINSAM
			});
		}

		// Wochenmarkt: 2 visits
		for (let i = 0; i < 2; i++) {
			const saturday = 6 + i * 14; // roughly every 2 weeks
			specs.push({ day: clampDay(saturday), name: 'Viktualienmarkt', purpose: 'Obst, Gemüse, Käse', amount: vary(-35, 0.3), categoryUuid: 'demo-cat-122', accountUuid: GEMEINSAM });
		}

		// Bäckerei: 2-4 visits
		const bakeryCount = randInt(2, 4);
		for (let i = 0; i < bakeryCount; i++) {
			specs.push({ day: randInt(1, maxDay), name: 'Bäckerei Müller', purpose: 'Brot & Brötchen', amount: vary(-8, 0.3), categoryUuid: 'demo-cat-123', accountUuid: GEMEINSAM });
		}

		// ── Mobility ──
		specs.push({ day: randInt(5, 15), name: 'Shell Tankstelle', purpose: 'Super E10', amount: vary(-75, 0.2), categoryUuid: 'demo-cat-131', accountUuid: MAX_GIRO });
		if (rng() > 0.4) {
			specs.push({ day: randInt(16, 28), name: 'Aral Tankstelle', purpose: 'Super E10', amount: vary(-65, 0.2), categoryUuid: 'demo-cat-131', accountUuid: MAX_GIRO });
		}

		// KFZ insurance — monthly
		specs.push({ day: 1, name: 'HUK-Coburg', purpose: 'KFZ-Versicherung VW Golf', amount: -68.50, categoryUuid: 'demo-cat-132', accountUuid: MAX_GIRO });

		// Wartung/TÜV — rare surprise
		if (rng() > 0.85) {
			specs.push({ day: randInt(10, 25), name: 'ATU München', purpose: 'Inspektion & Ölwechsel', amount: vary(-380, 0.15), categoryUuid: 'demo-cat-133', accountUuid: MAX_GIRO });
		}

		// ÖPNV
		specs.push({ day: 1, name: 'MVV München', purpose: 'Deutschlandticket Lisa', amount: -49, categoryUuid: 'demo-cat-134', accountUuid: LISA_GIRO });

		// ── Insurance ──
		specs.push({ day: 1, name: 'TK Krankenkasse', purpose: 'Zusatzbeitrag', amount: -45.80, categoryUuid: 'demo-cat-141', accountUuid: GEMEINSAM });
		specs.push({ day: 1, name: 'Allianz', purpose: 'Haftpflichtversicherung', amount: -12.90, categoryUuid: 'demo-cat-142', accountUuid: GEMEINSAM });
		specs.push({ day: 1, name: 'Allianz', purpose: 'Hausratversicherung', amount: -18.50, categoryUuid: 'demo-cat-143', accountUuid: GEMEINSAM });
		specs.push({ day: 1, name: 'Ergo', purpose: 'Berufsunfähigkeit Max', amount: -89, categoryUuid: 'demo-cat-144', accountUuid: MAX_GIRO });

		// ── Children ──
		specs.push({ day: 5, name: 'Stadt München', purpose: 'Kita-Gebühren Emil', amount: -285, categoryUuid: 'demo-cat-151', accountUuid: GEMEINSAM });
		if (rng() > 0.6) {
			specs.push({ day: randInt(5, 25), name: 'Müller Drogerie', purpose: 'Schulhefte, Stifte', amount: vary(-25, 0.4), categoryUuid: 'demo-cat-152', accountUuid: GEMEINSAM });
		}
		if (rng() > 0.5) {
			specs.push({ day: randInt(5, 25), name: 'H&M Kids', purpose: 'Kinderkleidung', amount: vary(-55, 0.3), categoryUuid: 'demo-cat-153', accountUuid: GEMEINSAM });
		}
		specs.push({ day: randInt(10, 20), name: 'Schwimmverein München', purpose: 'Schwimmkurs Mia', amount: -35, categoryUuid: 'demo-cat-154', accountUuid: GEMEINSAM });

		// ── Leisure & Culture ──
		const restaurantCount = randInt(2, 4);
		const restaurants = ['Restaurant Augustiner', 'Café Luitpold', 'Pizza Hut', 'Wirtshaus zum Isartal'];
		for (let i = 0; i < restaurantCount; i++) {
			const place = restaurants[randInt(0, restaurants.length - 1)];
			specs.push({ day: randInt(1, maxDay), name: place, purpose: 'Essen gehen', amount: vary(-42, 0.4), categoryUuid: 'demo-cat-161', accountUuid: GEMEINSAM });
		}

		specs.push({ day: 1, name: 'FitStar München', purpose: 'Fitnessstudio Max', amount: -39.90, categoryUuid: 'demo-cat-162', accountUuid: MAX_GIRO });

		// Streaming & Abos
		specs.push({ day: 3, name: 'Netflix', purpose: 'Standard-Abo', amount: -13.99, categoryUuid: 'demo-cat-163', accountUuid: GEMEINSAM });
		specs.push({ day: 5, name: 'Spotify', purpose: 'Family Premium', amount: -16.99, categoryUuid: 'demo-cat-163', accountUuid: GEMEINSAM });

		// Urlaub — rare bigger expense
		if (rng() > 0.8) {
			specs.push({ day: randInt(10, 20), name: 'Booking.com', purpose: 'Hotelreservierung', amount: vary(-450, 0.3), categoryUuid: 'demo-cat-164', accountUuid: GEMEINSAM });
		}

		// ── Health ──
		if (rng() > 0.6) {
			specs.push({ day: randInt(5, 25), name: 'Apotheke am Marienplatz', purpose: 'Medikamente', amount: vary(-28, 0.4), categoryUuid: 'demo-cat-171', accountUuid: GEMEINSAM });
		}

		// Zahnarzt — surprise expense
		if (rng() > 0.85) {
			specs.push({ day: randInt(8, 22), name: 'Dr. Weber Zahnarzt', purpose: 'Kontrolluntersuchung + PZR', amount: vary(-180, 0.2), categoryUuid: 'demo-cat-172', accountUuid: GEMEINSAM });
		}

		// ── Clothing & Care ──
		if (rng() > 0.5) {
			specs.push({ day: randInt(5, 25), name: 'Zalando', purpose: 'Kleidung', amount: vary(-75, 0.4), categoryUuid: 'demo-cat-181', accountUuid: rng() > 0.5 ? MAX_GIRO : LISA_GIRO });
		}
		specs.push({ day: randInt(10, 25), name: 'Friseur Schick', purpose: 'Haarschnitt', amount: vary(-35, 0.2), categoryUuid: 'demo-cat-182', accountUuid: LISA_GIRO });

		// ── Savings ──
		specs.push({ day: 1, name: 'Trade Republic', purpose: 'ETF-Sparplan MSCI World', amount: -400, categoryUuid: 'demo-cat-191', accountUuid: DEPOT });
		specs.push({ day: 1, name: 'ING DiBa', purpose: 'Dauerauftrag Tagesgeld', amount: -200, categoryUuid: 'demo-cat-192', accountUuid: TAGESGELD });
		specs.push({ day: 1, name: 'Allianz', purpose: 'Riester-Rente Max', amount: -162.17, categoryUuid: 'demo-cat-193', accountUuid: MAX_GIRO });

		// ── Miscellaneous ──
		if (rng() > 0.6) {
			specs.push({ day: randInt(5, 25), name: 'Amazon', purpose: 'Geschenk Geburtstag', amount: vary(-45, 0.4), categoryUuid: 'demo-cat-201', accountUuid: GEMEINSAM });
		}
		if (rng() > 0.5) {
			specs.push({ day: randInt(5, 25), name: 'IKEA München', purpose: 'Haushaltswaren', amount: vary(-55, 0.4), categoryUuid: 'demo-cat-202', accountUuid: GEMEINSAM });
		}
		if (rng() > 0.7) {
			specs.push({ day: randInt(5, 25), name: 'Thalia', purpose: 'Bücher', amount: vary(-25, 0.3), categoryUuid: 'demo-cat-203', accountUuid: GEMEINSAM });
		}

		// ── Surprise / unplanned transactions (specific months, stable IDs) ──
		// These use IDs 9001+ so they don't shift when conditional transactions change.
		const surprises: (TxSpec & { stableId: number })[] = [];

		if (monthStr === '2026-01') {
			surprises.push({ stableId: 9001, day: 14, name: 'Elektro Huber', purpose: 'Waschmaschine Reparatur — Notfall', amount: -320, categoryUuid: 'demo-cat-202', accountUuid: GEMEINSAM });
			surprises.push({ stableId: 9002, day: 22, name: 'Dr. Weber Zahnarzt', purpose: 'Zahnfüllung — nicht geplant', amount: -245, categoryUuid: 'demo-cat-172', accountUuid: GEMEINSAM });
		}
		if (monthStr === '2026-02') {
			surprises.push({ stableId: 9003, day: 11, name: 'Werkstatt Huber', purpose: 'Bremsen vorne erneuern — ungeplant', amount: -485, categoryUuid: 'demo-cat-133', accountUuid: MAX_GIRO });
		}

		// Convert specs to Transaction objects, filtering by date range and account
		for (const spec of specs) {
			const day = clampDay(spec.day);
			const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

			if (dateStr < from || dateStr > to) continue;
			if (!accountSet.has(spec.accountUuid)) continue;

			transactions.push({
				id: idCounter++,
				amount: spec.amount,
				currency: 'EUR',
				bookingDate: dateStr,
				valueDate: dateStr,
				name: spec.name,
				purpose: spec.purpose,
				categoryUuid: spec.categoryUuid,
				accountUuid: spec.accountUuid,
				booked: true,
				checkmark: false
			});
		}

		// Add surprise transactions with stable IDs
		for (const s of surprises) {
			const day = clampDay(s.day);
			const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

			if (dateStr < from || dateStr > to) continue;
			if (!accountSet.has(s.accountUuid)) continue;

			transactions.push({
				id: s.stableId,
				amount: s.amount,
				currency: 'EUR',
				bookingDate: dateStr,
				valueDate: dateStr,
				name: s.name,
				purpose: s.purpose,
				categoryUuid: s.categoryUuid,
				accountUuid: s.accountUuid,
				booked: true,
				checkmark: false
			});
		}

		// Advance to next month
		cursor.setMonth(cursor.getMonth() + 1);
	}

	// Sort by booking date
	transactions.sort((a, b) => a.bookingDate.localeCompare(b.bookingDate));

	return transactions;
}
