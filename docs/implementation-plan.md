# Implementation Plan

## Phase 1: Foundation

- Create Vite React app.
- Install Material UI.
- Configure Firebase project.
- Set up Firebase Authentication.
- Create household membership model.
- Define TypeScript types for accounts, transactions, ledger lines, categories, cycles, and reconciliations.

## Phase 2: Ledger Core

- Create accounts.
- Create transaction writer.
- Create ledger-line writer.
- Create balance calculation selector.
- Support transaction types:
  - income
  - expense
  - transfer
  - conversion
  - adjustment

Acceptance:

- User can create accounts.
- User can record salary.
- User can record expense.
- User can record USD to EGP conversion.
- Account balances calculate correctly from ledger lines.

## Phase 3: Daily Use

- Build mobile-first fast expense entry.
- Add recent/favorite categories.
- Add last-used account default.
- Add home dashboard with current balances.

Acceptance:

- A normal expense can be entered in less than 10 seconds.

## Phase 4: Budget Cycles

- Create salary-cycle budget periods.
- Create category allocations per cycle.
- Allow copying previous cycle categories/budgets.
- Calculate spending per cycle and category.

Acceptance:

- User can see whether spending is on pace for current cycle.

## Phase 5: Saving And Projection

- Add expected income.
- Add saving target.
- Calculate projected cycle expenses.
- Calculate projected saving.
- Calculate safe daily spend.

Acceptance:

- Dashboard clearly says on track, warning, or overspending.

## Phase 6: Reconciliation

- Build manual balance check flow.
- Show calculated vs actual balance.
- Create adjustment transactions for accepted differences.

Acceptance:

- User can correct drift caused by forgotten expenses or bank fees without corrupting transaction history.

## Phase 7: Notifications

- Add notification settings.
- Add daily missing-expense reminder.
- Add reconciliation reminder.
- Add saving/category warning notifications.

Acceptance:

- User can configure reminder time and receive a reminder if no expense was added today.

## Phase 8: Polish And Reports

- Add calendar-month report views.
- Add export to CSV or Google Sheets.
- Add closed-cycle summary.
- Add revision/audit behavior for edits after cycle close.

