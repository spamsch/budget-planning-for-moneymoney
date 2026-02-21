# Budget Planning Tool with MoneyMoney Integration

## Context

Build a standalone Tauri desktop app for macOS that connects to MoneyMoney (banking app) via AppleScript to retrieve categories and transaction data, then provides budget planning with custom targets, actuals vs. budget tracking, and historical trends.

MoneyMoney exposes 8 AppleScript commands. The two we need most:
- `export categories` — returns all categories with UUIDs, hierarchy (group/indentation), and built-in budget data
- `export transactions` — returns transactions filterable by date range, account, or category

Both return plist XML. The `rust-moneymoney` crate (v0.2, MIT, crates.io) wraps these calls via JXA and deserializes plist into typed Rust structs.

## Verified: MoneyMoney Connection

AppleScript connection tested and working. Category hierarchy confirmed:
```
[G] Einnahmen (income group)
      Einnahme Johanna, Einnahme Simon, Kindergeld, ...
[G] Ausgaben (expenses group)
      Lebensmittel
  [G] Haus → Kredit, Putzen, Nebenkosten, Einrichtung
  [G] Versicherung → Versicherung Simon, Versicherung Johanna
  [G] Freizeit → Streaming, Taschengeld, Mobilität, Games, Handy, Fitness
  [G] Kinder → Thore, Isabella
  [G] Haustiere → Hund, Meerschweinchen
      Bankkosten, Kredite
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Tauri 2.x |
| Frontend | SvelteKit + Svelte 5 (runes), adapter-static |
| Styling | Tailwind CSS v4 |
| Icons | lucide-svelte |
| Backend | Rust with `moneymoney` crate (0.2) for AppleScript calls |
| Persistence | JSON file at `~/.budgetbudget/budgets/<name>.json` |
| Plist parsing | `plist` crate (via moneymoney crate) |

## Project Structure

```
budgetplanner/
├── src/                              # Frontend (SvelteKit)
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/                   # Button, Card, Input (reusable)
│   │   │   ├── BudgetGrid.svelte     # Main month-column grid
│   │   │   ├── CategorySidebar.svelte # Left sidebar with category tree
│   │   │   ├── MonthColumn.svelte    # Single month: budgeted/spent/balance
│   │   │   ├── CategoryRow.svelte    # One category row (editable budget input)
│   │   │   ├── TrendChart.svelte     # Sparkline/bar chart for trends
│   │   │   ├── OverviewBar.svelte    # Top bar: income, budgeted, to-budget
│   │   │   └── AccountSelector.svelte # Pick which MM accounts to include
│   │   ├── stores/
│   │   │   ├── budget.svelte.ts      # Budget state, persistence, computation
│   │   │   ├── moneymoney.svelte.ts  # Categories, transactions, accounts from MM
│   │   │   └── settings.svelte.ts    # App settings (currency, accounts, income categories)
│   │   ├── types.ts                  # Shared TypeScript types
│   │   └── utils/
│   │       ├── categoryTree.ts       # Build hierarchy from flat list
│   │       └── budgetCalc.ts         # Month-by-month envelope calculation
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +layout.ts               # ssr = false
│   │   └── +page.svelte             # Main app view
│   └── app.css                       # Tailwind theme
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs                    # Tauri commands
│   │   └── moneymoney.rs            # MM wrapper: categories, transactions, accounts
│   ├── tauri.conf.json
│   ├── capabilities/default.json
│   ├── Cargo.toml
│   ├── Entitlements.plist            # com.apple.security.automation.apple-events
│   └── Info.plist                    # NSAppleEventsUsageDescription
├── package.json
├── svelte.config.js
├── vite.config.js
└── tsconfig.json
```

## Implementation Steps

### Step 1: Scaffold Tauri project

```bash
npm create tauri-app@latest budgetplanner -- --template sveltekit-ts
cd budgetplanner
npm install tailwindcss @tailwindcss/vite lucide-svelte
```

Configure:
- `svelte.config.js` with `adapter-static`, `fallback: "index.html"`
- `vite.config.js` with tailwindcss plugin, port 1420
- `app.css` with Tailwind theme (similar to macbot app)
- `+layout.ts` with `export const ssr = false`

### Step 2: Rust backend — MoneyMoney integration

**`Cargo.toml` dependencies:**
```toml
[dependencies]
tauri = { version = "2" }
tauri-plugin-shell = "2"
tauri-plugin-fs = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
moneymoney = "0.2"
dirs = "5"
chrono = { version = "0.4", features = ["serde"] }
```

**`src-tauri/src/moneymoney.rs`** — Wrapper module:
- `get_categories()` → calls `moneymoney::export_categories()`, returns `Vec<Category>` with uuid, name, group, indentation, currency, budget info
- `get_accounts()` → calls `moneymoney::export_accounts()`, returns `Vec<Account>` with uuid, name, balance, type
- `get_transactions(from_date, to_date, account_uuids)` → calls `moneymoney::export_transactions()`, returns `Vec<Transaction>` with amount, categoryUuid, bookingDate, name, purpose
- All calls wrapped in `tokio::task::spawn_blocking` since the moneymoney crate is synchronous

**`src-tauri/src/lib.rs`** — Tauri commands:
```rust
#[tauri::command]
async fn fetch_categories() -> Result<Vec<Category>, String>

#[tauri::command]
async fn fetch_accounts() -> Result<Vec<Account>, String>

#[tauri::command]
async fn fetch_transactions(from: String, to: String, accounts: Vec<String>) -> Result<Vec<Transaction>, String>

#[tauri::command]
async fn load_budget(name: String) -> Result<BudgetState, String>

#[tauri::command]
async fn save_budget(name: String, state: BudgetState) -> Result<(), String>

#[tauri::command]
async fn list_budgets() -> Result<Vec<String>, String>
```

**Entitlements.plist:**
```xml
<key>com.apple.security.automation.apple-events</key>
<true/>
```

**Info.plist:**
```xml
<key>NSAppleEventsUsageDescription</key>
<string>Budget Planner needs to access MoneyMoney to retrieve your categories and transactions.</string>
```

### Step 3: Frontend types and utilities

**`src/lib/types.ts`:**
```typescript
type Category = {
  uuid: string;
  name: string;
  currency: string;
  group: boolean;
  indentation: number;
  isDefault: boolean;
  budget?: { amount: number; available: number; period: string };
};

type CategoryNode = Category & {
  children: CategoryNode[];
  collapsed: boolean;
};

type Transaction = {
  id: number;
  amount: number;
  bookingDate: string;
  categoryUuid: string;
  name: string;
  purpose?: string;
  booked: boolean;
};

type MonthBudget = {
  categories: Record<string, { amount?: number; rollover?: boolean }>;
};

type BudgetState = {
  name: string;
  version: string;
  settings: {
    currency: string;
    accounts: string[];        // selected account UUIDs
    incomeCategories: string[]; // category UUIDs treated as income
    startDate: string;         // YYYY-MM
  };
  months: Record<string, MonthBudget>; // keyed by "YYYY-MM"
};
```

**`src/lib/utils/categoryTree.ts`:**
- `buildCategoryTree(flat: Category[]): CategoryNode[]` — stack-based hierarchy builder using `group` + `indentation`

**`src/lib/utils/budgetCalc.ts`:**
- `calculateMonthData(month, categories, transactions, budgetState, previousMonth)` — envelope-style computation:
  - Income = sum of transactions in income categories
  - Per category: budgeted (user input), spent (sum of transactions), balance = budgeted + spent + rollover
  - Group rows aggregate children
  - toBudget = available - total budgeted

### Step 4: Svelte stores

**`moneymoney.svelte.ts`:**
- Fetches categories, accounts, transactions via `invoke()`
- Caches results, provides refresh method
- Builds category tree from flat list

**`budget.svelte.ts`:**
- Loads/saves budget JSON via `invoke()`
- Manages month-by-month budget allocations
- Computes derived data: spent per category per month, balances, trends
- Methods: `setBudget(month, categoryUuid, amount)`, `toggleRollover(month, categoryUuid)`

**`settings.svelte.ts`:**
- Account selection, income category selection, currency, start date

### Step 5: UI Components

**Layout:** Fixed category sidebar on the left, horizontally scrollable month columns on the right.

**`CategorySidebar.svelte`:**
- Renders category tree with indentation
- Group headers are collapsible
- Scroll position synced vertically with month columns

**`MonthColumn.svelte`:**
- Header: month name, overview (income, budgeted, to-budget)
- Per-category rows: editable budget input | spent amount | balance
- Color coding: green (under budget), red (over budget)

**`CategoryRow.svelte`:**
- Inline editable budget amount
- Shows spent and balance
- Group rows show aggregated totals (read-only)

**`TrendChart.svelte`:**
- Small sparkline or bar chart showing spending over last N months
- Displayed when hovering/clicking a category

**`OverviewBar.svelte`:**
- Top-level summary: total income, total budgeted, remaining to budget
- Alerts when overbudgeted

**`AccountSelector.svelte`:**
- Multi-select of MoneyMoney accounts to include in budget

### Step 6: Historical trends view

- Toggle between "Budget" and "Trends" views
- Trends view shows per-category spending over 6-12 months as bar charts
- Helps inform budget decisions ("average grocery spend is X")
- Uses the same transaction data, just visualized differently

## Data Flow

```
MoneyMoney (AppleScript)
    ↓ plist XML
Rust backend (moneymoney crate, plist deserialize)
    ↓ JSON via invoke()
Svelte stores (moneymoney.svelte.ts)
    ↓ category tree + transactions
Budget computation (budgetCalc.ts)
    ↓ per-month, per-category: budgeted / spent / balance
UI components (BudgetGrid, MonthColumn, CategoryRow)
    ↓ user edits budget amounts
Budget store (budget.svelte.ts)
    ↓ save via invoke()
JSON file (~/.budgetplanner/budgets/<name>.json)
```

## Persistence

- Budget files stored at `~/.budgetplanner/budgets/<name>.json`
- Each budget is independent (can have multiple budgets)
- Only user-entered data is persisted (budget amounts, rollover flags, settings)
- Transaction/category data is always fetched fresh from MoneyMoney

## Verification

1. **Build & run:** `cd budgetplanner && npm install && npm run tauri dev`
2. **MoneyMoney connection:** App launches, fetches categories → category sidebar renders the tree
3. **Transactions:** Select accounts, pick a month → spending amounts appear per category
4. **Budget entry:** Click a budget cell, type an amount → balance updates = budgeted + spent
5. **Persistence:** Enter budgets, close app, reopen → budgets preserved
6. **Trends:** Switch to trends view → bar charts show multi-month spending per category
7. **Rollover:** Set rollover on a category, overspend in month 1 → negative balance carries to month 2
