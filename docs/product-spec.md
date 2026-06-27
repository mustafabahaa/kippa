# Product Spec

## Problem

The household earns salary in USD, spends mostly in EGP, converts some USD to EGP, and tracks cash/bank balances manually. Salary may arrive on the 25th, 26th, or 27th, which makes calendar-month budgeting confusing.

Current pain points:

- Hard to know current USD balance, EGP bank balance, and EGP cash.
- Hard to know whether the household is saving or overspending.
- Hard to decide when to close the month.
- Hard to carry previous remaining funds into the next month.
- No bank API, so balances can drift when transactions are forgotten.
- Expense entry must be extremely fast or the system will not be used.

## Product Goal

The app should be a daily financial control system.

Primary promise:

> Tell the household today whether it is financially on track, and make recording expenses fast enough that the habit survives.

## Non-Goals For MVP

- Bank API integration.
- Complex investment tracking.
- Full accounting system for taxes.
- AI categorization.
- Receipt OCR.
- Multi-household SaaS.

## Core Concepts

### Account

A place where money exists.

Examples:

- USD bank/wallet
- EGP bank
- EGP cash
- Credit card, if needed later

### Transaction

A financial event.

Examples:

- salary received
- expense paid
- USD converted to EGP
- bank withdrawal to cash
- manual correction

### Ledger Line

The account-level movement caused by a transaction.

Examples:

- Salary: `+3000 USD` to USD account
- Expense: `-250 EGP` from EGP cash
- Conversion: `-500 USD` from USD account and `+24000 EGP` to EGP bank

### Budget Cycle

A budgeting period. For this household, the primary cycle should be salary-based.

Example:

- Cycle starts when salary is actually received.
- Cycle ends the day before the next salary or when manually closed.

Calendar reports should still be possible, but budget control should not depend on calendar months only.

## MVP Features

### 1. Fast Expense Entry

The add-expense flow must take less than 10 seconds.

Required fields:

- amount
- category
- account

Defaults:

- type: expense
- currency: account currency
- date: today
- account: last used account
- user: current signed-in user

Optional fields:

- note
- tags
- merchant

### 2. Current Balances

Home screen must show:

- USD balance
- EGP bank balance
- EGP cash balance
- total EGP equivalent using selected display exchange rate

Balances are derived from ledger lines, not manually stored as truth.

### 3. USD Salary

Salary should be recorded in USD when received.

Before salary arrives, forecasting may use expected salary and expected exchange rate.

After salary arrives, actual received values should be locked as historical facts.

### 4. Currency Conversion

USD to EGP conversion must be treated as a transfer.

It should not increase income and should not count as expense.

Each conversion stores:

- USD amount
- EGP amount
- effective exchange rate
- source account
- destination account
- date

### 5. Budget Cycles

The app should support:

- planned cycles
- open cycle
- closed cycle
- revised cycle marker if historical data changes after close

Cycles should have:

- name
- start date
- end date
- status
- optional salary transaction reference

### 6. Category Budgets

Categories are configurable per cycle.

Each cycle can copy categories and budget allocations from a previous cycle, then adjust them.

Category fields:

- name
- type: income or expense
- active/inactive
- priority: essential, flexible, saving, debt, other
- budget amount for the cycle
- carry leftover flag, optional

### 7. Manual Reconciliation

Because there is no bank API, the app needs a balance-check flow.

For each account:

- app-calculated balance
- user-entered actual balance
- difference
- adjustment action

Adjustment reasons:

- forgotten expense
- bank fee
- exchange difference
- cash counting correction
- unknown difference

### 8. Notifications

The app should remind users when:

- no expense was added today by the configured reminder time
- a category crosses a warning threshold
- projected saving falls below target
- cycle close checklist is overdue

Notifications must be configurable and not spammy.

### 9. Dashboard

Home dashboard should answer:

- am I on track?
- am I overspending?
- am I saving?
- what can I safely spend per day until next salary?
- which categories are causing the problem?
- what balances do I have right now?

## Important Product Rules

- Store raw facts. Compute dashboards.
- Do not store UI dashboard results as source data.
- Transfers are not expenses.
- Conversions are not income.
- Old conversion rates should not be silently recalculated.
- Closed cycles should be protected with audit/revision behavior.
- Manual corrections should be explicit and explainable.

