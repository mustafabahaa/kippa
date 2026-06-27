# Gemini Handoff

## Context

This repository contains the product and architecture spec for a household finance PWA.

The user wants Gemini to take over implementation. The user does not want the app built from hardcoded dashboard assumptions. The most important instruction is:

> Store raw financial facts in a flexible ledger model. Dashboards and calculations must be derived and rebuildable.

## Chosen Stack

- React
- Vite
- Material UI
- Firebase
- PWA

Design system:

https://designmd.me/s/workspace-google-dmepn

Please open the design system directly before implementing UI. This Codex environment could not access it.

## User's Real Financial Situation

- Salary is in USD.
- Spending is mostly in EGP.
- Some USD is converted to EGP for spending.
- User needs to know current USD balance, EGP bank balance, and EGP cash.
- Salary may arrive on the 25th, 26th, or 27th.
- Calendar month close is confusing.
- Previous remaining funds should carry forward automatically.
- There is no bank API, so manual reconciliation is required.
- User often forgets to add expenses and needs reminders.
- Categories must be configurable per cycle/month.

## Highest-Priority MVP

Build these first:

1. Firebase auth and household setup.
2. Accounts: USD account, EGP bank, EGP cash.
3. Ledger-first transaction model.
4. Fast expense entry.
5. USD salary entry.
6. USD to EGP conversion entry.
7. Current balance dashboard.
8. Salary-cycle budget periods.
9. Category budgets per cycle.
10. Manual reconciliation.
11. On-track/overspending/saving dashboard.
12. Daily missing-expense notification.

## Do Not Do

- Do not store current balances as editable truth.
- Do not count transfers as expenses.
- Do not count USD-to-EGP conversion as income.
- Do not hardcode category names in UI logic.
- Do not assume every budget period is a calendar month.
- Do not make dashboards depend on denormalized monthly tables that cannot be rebuilt.

## Implementation Advice

Start with a thin but correct data layer:

- typed models
- transaction creation helpers
- ledger-line balance queries
- derived dashboard selectors

Then build UI around those selectors.

This order matters because the app's long-term value depends on data correctness, not the first dashboard layout.

