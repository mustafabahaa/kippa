# Dynamic Currency & Country De-hardcoding — Design

**Date:** 2026-07-02
**Branch:** `feat/dynamic-bank-cards`
**Status:** Approved (pending spec review)

## Goal

Remove every hardcoded `EGP` / Egypt / `USD`-only assumption from the app so that
any user, in any country, gets a first-class experience. Currency becomes fully
dynamic: the user's chosen **base currency** drives conversion, dashboard
aggregation, UI labels, seeded accounts, and account sort order.

The user configures their base currency in the Household settings page. No
"country" field is needed — currency fully captures what we care about.

## Non-goals (YAGNI)

- No country/region field. Currency is the only geographic signal.
- No per-account base-currency override (accounts keep their own `currency`,
  conversion normalizes them to the household base).
- No historical exchange-rate table — still a single "display rate" snapshot.
- No full multi-currency wallet rebalancing UI.
- No backend (`functions/src`) changes — it already reads currency from data.
- No refactor of the Egyptian banks catalog into a country-keyed structure —
  it stays as a generic list of brandable presets.

## Background — what's hardcoded today

Audit found ~30 locations. The root cause is the union type:

```ts
export type CurrencyCode = 'EGP' | 'USD';
```

Everything else flows from there:

1. `baseCurrency: 'EGP'` defaults in `auth.ts`, `AppContext.tsx`, `useFinance.ts`, `ledger.ts`.
2. `currency.ts` only fetches `USD → EGP` (hardcoded endpoint + `50.0` fallback).
3. `selectors.ts` computes `totalEgpEquivalent` with branches on `=== 'EGP'` / `=== 'USD'`.
4. UI labels literally prefix amounts with the string `"EGP "` (~15 components).
5. Currency dropdowns offer only EGP and USD.
6. `seedDefaultAccounts()` creates `"EGP Bank"` / `"EGP Cash"` / `"USD Bank"`.
7. `banks/banks.tsx` is an all-Egyptian bank list (kept as presets, decoupled from country assumption).
8. Account sort puts EGP first (`Reconciliation.tsx`, `FastEntry.tsx`).
9. Metric-explanation copy mentions "EGP" explicitly.

## Design

### 1. Currency type — generic string

```ts
// financeTypes.ts
export type CurrencyCode = string; // ISO 4217 code ('EGP', 'USD', 'SAR', 'AED', 'EUR', …)
```

No code change is required when new currencies appear.

A curated `CURRENCIES` metadata table lives in a new module
`app/src/libs/currencyMeta.ts`:

```ts
export type CurrencyInfo = {
  code: CurrencyCode;     // 'EGP'
  name: string;           // 'Egyptian Pound'
  symbol: string;         // 'E£'  (narrow no-break symbol)
  decimalDigits: number;  // 2
};

export const CURRENCIES: CurrencyInfo[];

export const getCurrencyInfo = (code: CurrencyCode): CurrencyInfo;
export const currencySymbol = (code: CurrencyCode): string;
export const currencyName   = (code: CurrencyCode): string;
```

Seeded from ISO 4217 common currencies; covers ~40 codes that handle virtually
every user. The list is data — adding more is append-only.

### 2. Locale-based default detection

`app/src/libs/currencyMeta.ts` exports:

```ts
export const detectBaseCurrency = (): CurrencyCode => {
  try {
    const locale = navigator.languages?.[0] || navigator.language || 'en-US';
    const code = new Intl.NumberFormat(locale, {
      style: 'currency',
      currencyDisplay: 'code',
    }).resolvedOptions().currency;
    return code || 'USD';
  } catch {
    return 'USD';
  }
};
```

Used only as a **default** when creating a household or falling back on a
missing household-info doc. The user can always override it in settings (see §3).

### 3. User-configurable base currency (Household settings)

The base currency is stored on the `Household` document (already the case):
`household.baseCurrency: CurrencyCode`. This is the single source of truth for
"the main currency of my account."

**UI:** A new "Base Currency" row is added to the existing
`features/household/Household.tsx` settings page. It renders the reusable
`CurrencySelect` component (see §7) bound to `household.baseCurrency`. On
change, it calls a new `ledgerLib.updateHouseholdBaseCurrency(householdId, code)`
that writes the field and logs an audit entry.

- No new route. No new page. No new modal.
- The locale-detected value just pre-fills the household at creation; the
  settings row is how the user changes it later.
- Existing households that already have `baseCurrency: 'EGP'` keep working
  unchanged — the user can edit if they want.

**Fallbacks** that previously hardcoded `'EGP'` now call `detectBaseCurrency()`:
- `auth.ts:131` `createHousehold()`
- `AppContext.tsx:58` missing-info fallback
- `useFinance.ts:200` missing-info fallback
- `ledger.ts:183` `ensureHouseholdExists`

### 4. Generalized currency conversion

`app/src/libs/currency.ts` is rewritten:

```ts
const cacheKey = (from: string, to: string) => `finance_rate_${from}_${to}`;

// Any foreign → base. Returns the rate so that `amountInForeign * rate = amountInBase`.
async getRate(from: CurrencyCode, to: CurrencyCode): Promise<number>

// Bulk: all rates needed to convert any of `foreignCodes` into `base`.
// Returns { [foreignCode]: rate }. Base itself is implicitly 1 (omitted).
async getRatesToBase(base: CurrencyCode, foreignCodes: CurrencyCode[]): Promise<Record<string, number>>
```

- Primary source: Frankfurter (`https://api.frankfurter.app/latest?from=X&to=Y`).
- Fallback: `open.er-api.com/v6/latest/X`, read `rates[Y]`.
- 1-hour sessionStorage cache per `(from,to)` pair.
- The `50.0` magic-number fallback is removed. On total failure: return last
  cached value if present, otherwise `1` and log a warning.

`useUsdRate()` is replaced by:

```ts
// useFinance.ts
export function useDisplayRates(
  baseCurrency: CurrencyCode,
  foreignCurrencies: CurrencyCode[]
): { data: Record<string, number>; isLoading: boolean }
```

It computes the distinct foreign currencies used by the household's accounts and
fetches `foreign → base` rates for each. Dashboard components call it with the
household's `baseCurrency`.

### 5. Dashboard selectors — base-currency agnostic

`app/src/libs/selectors.ts`:

- `DashboardData.totalEgpEquivalent` → **`totalBaseEquivalent`**.
- `DashboardData` gains `baseCurrency: CurrencyCode` (so UI knows the label).
- `computeDashboard(..., displayUsdToEgpRate: number)` →
  `computeDashboard(..., displayRates: Record<string, number>, baseCurrency: CurrencyCode)`.
- Every `if (currency === 'EGP') … else if ('USD') amount * displayUsdToEgpRate`
  becomes:

  ```ts
  const rate = displayRates[currency] ?? 1;
  const amountBase = amount * rate;
  ```

- "Cash-Safe" liquid balance: keys on account **type**
  (`running | cash | wallet`) **AND** `acc.currency === baseCurrency`
  (instead of literally `'EGP'`). Foreign-currency cash accounts are converted
  via `displayRates` before being added to the liquid pool.
- `expectedRateToBaseCurrency` on `ExpectedIncome` is honored as today; the
  fallback when missing changes from `displayUsdToEgpRate` to
  `displayRates[income.currency] ?? 1`.

### 6. UI labels — dynamic currency formatter

A new helper in `app/src/libs/format.ts`:

```ts
export const formatCurrency = (
  amount: number,
  code: CurrencyCode,
  maxDigits = 0
): string =>
  `${code} ${amount.toLocaleString(undefined, { maximumFractionDigits: maxDigits })}`;
```

Every literal `EGP {amount}` prefix is replaced with
`formatCurrency(amount, baseCurrency)` (or the account's own currency where
that's what's being shown).

Affected components:
- `TotalBalanceHeroCard.tsx` — also relabels "Total EGP Equivalent" →
  `Total ({baseCurrency}) Equivalent` → simpler: **"Total Balance"** with the
  base currency shown next to the number.
- `BudgetPulseCard.tsx`
- `BudgetBreakdownCard.tsx`
- `CardDetail.tsx` — `"Pay all (EGP X)"` → `"Pay all (CODE X)"` using the card's
  own currency; `"Amount (EGP)"` → `"Amount (CODE)"`.
- `BudgetAllocationsConfig.tsx`, `BudgetCycles.tsx` — `"Category Budgets (EGP)"`
  → `(baseCurrency)`; footer `{n} EGP` → `formatCurrency`.
- `FastEntry.tsx` — kills the `currency === 'USD' ? '$' : 'EGP'` ternary;
  uses `formatCurrency(amount, selectedAccount.currency)`.

`metricExplanations.ts` copy is de-Egyptianized:
- `safeDailyCash`: "Your available **cash/bank balance in your base currency**
  (after essential bills)…"
- `totalEgpEquivalent` key is renamed `totalBaseEquivalent`; text:
  "The combined balance of all your accounts, converted to **your base
  currency** at today's display rate…"

### 7. Currency dropdowns — reusable `CurrencySelect`

New `app/src/features/shared/components/CurrencySelect.tsx` — a controlled MUI
`Select` that maps over `CURRENCIES` and renders
`<MenuItem value={c.code}>{c.code} ({c.name})</MenuItem>`.

Used in:
- `Accounts.tsx` (add-account + edit-account dialogs) — replaces both
  EGP/USD-only dropdowns.
- `Household.tsx` — the new base-currency row.
- Anywhere else a currency is picked (e.g. `AddCardDialog` if relevant).

### 8. Seeded accounts — generic, currency-aware names

`ledger.ts` `seedDefaultAccounts(householdId, baseCurrency?)`:

```ts
const base = baseCurrency || detectBaseCurrency();
const symbol = currencySymbol(base);
const defaultAccounts = [
  { name: `${symbol} Bank`, type: 'running', currency: base, … },
  { name: `${symbol} Cash`, type: 'cash',    currency: base, … },
];
```

No second "USD Bank" is force-created. The previous three-account seed is
reduced to two; the user adds foreign-currency accounts themselves if needed.

The call site in `auth.ts:createHousehold` passes the chosen `baseCurrency`
through.

### 9. Banks catalog — decoupled from country

- `banks/banks.tsx` keeps its built-in entries (Egyptian banks remain as
  branded presets — HSBC, CIB, NBE, …). The file's doc-comment is rewritten to
  describe it as a **generic preset catalog of international banks**, not
  "the Egyptian banks."
- `logos.tsx` and `bankBackgrounds.tsx` comments are generalized.
- The placeholder `"e.g. CIB Bank"` in `Accounts.tsx` becomes `"e.g. My Bank"`.
- No structural change to the catalog itself; adding non-Egyptian banks later
  is a data-only edit.

### 10. Sort / priority logic — base-currency aware

- `Reconciliation.tsx:61`: `if (acc.currency === 'EGP') return 0;` →
  `if (acc.currency === baseCurrency) return 0;`.
- `FastEntry.tsx:81-85`: same change — priority for
  `acc.currency === baseCurrency && acc.type === 'running'`.

Both read `baseCurrency` from the household info (already in context).

### 11. Fallback currency when lookup fails

Components that fell back to `'EGP'` when a ledger line / account / card had no
currency now fall back to the **household's `baseCurrency`** (read from
context), or `detectBaseCurrency()` as a last resort:

- `RecentActivityItem.tsx:31`
- `EditTransactionDialog.tsx:87,154`
- `TransactionHistory.tsx:280,300`
- `AddCardDialog.tsx:36`
- `Accounts.tsx:51,57` — `useState<CurrencyCode>('EGP')` initial state becomes
  the household base currency.

### 12. Data compatibility

No Firestore migration required:
- `baseCurrency` and `currency` are already stored as strings.
- Existing households with `baseCurrency: 'EGP'` keep working; users can edit.
- `CurrencyCode = string` is a strict superset of the old union.

## Files touched (summary)

**New:**
- `app/src/libs/currencyMeta.ts` — `CURRENCIES`, `CurrencyInfo`, `detectBaseCurrency`, accessors.
- `app/src/libs/format.ts` — `formatCurrency`.
- `app/src/features/shared/components/CurrencySelect.tsx`.

**Modified (logic):**
- `app/src/domain/financeTypes.ts` — `CurrencyCode = string`.
- `app/src/libs/currency.ts` — generalized `getRate` / `getRatesToBase`.
- `app/src/libs/selectors.ts` — `totalBaseEquivalent`, `displayRates`, `baseCurrency`.
- `app/src/libs/auth.ts`, `ledger.ts` — `detectBaseCurrency()` defaults + `seedDefaultAccounts` + `updateHouseholdBaseCurrency`.
- `app/src/contexts/AppContext.tsx`, `app/src/hooks/useFinance.ts` — fallbacks + `useDisplayRates`.

**Modified (UI):**
- `app/src/features/household/Household.tsx` — base-currency setting row.
- `app/src/features/accounts/Accounts.tsx` — `CurrencySelect`, placeholder.
- `TotalBalanceHeroCard`, `BudgetPulseCard`, `BudgetBreakdownCard`, `CardDetail`, `BudgetAllocationsConfig`, `BudgetCycles`, `FastEntry`, `RecentActivityItem`, `EditTransactionDialog`, `TransactionHistory`, `AddCardDialog`, `CycleAnalytics` — dynamic labels.
- `app/src/features/shared/constants/metricExplanations.ts` — copy.
- `app/src/features/reconciliation/Reconciliation.tsx` — base-currency sort.
- `app/src/features/cards/banks/banks.tsx`, `logos.tsx`, `bankBackgrounds.tsx` — comments only.

**Tests (mirror new assumptions):**
- `app/src/libs/cardSelectors.test.ts`, `cards.test.ts`, `features/cards/CardDesign.test.tsx`.
- `functions/src/test/warnings.test.ts`, `onTransactionCreated.test.ts`.

## Testing strategy

- Unit: `currencyMeta` (`detectBaseCurrency` with mocked `navigator`), `formatCurrency`, generalized `currency.getRate` (mock `fetch`).
- Unit: `selectors.computeDashboard` with a non-EGP base (e.g. SAR) and a mix of foreign accounts.
- Existing tests updated to use `baseCurrency` from the test household rather than assuming EGP.
- Manual: create a new household in an `ar-SA` locale → confirm seeded accounts are SAR-named and dashboard labels say SAR.
