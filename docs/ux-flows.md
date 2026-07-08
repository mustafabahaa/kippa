# UX Flows

## Home Dashboard

The first screen must answer:

- What do I have right now?
- Am I on track?
- Am I saving?
- How much can I safely spend per day?
- What needs attention?

Recommended blocks:

1. Current balances
2. Cycle status
3. Safe daily spend
4. Saving projection
5. Category warnings
6. Fast add expense button

## Fast Expense Entry

Must be optimized for one-handed mobile use.

Flow:

```text
Amount -> Category -> Account -> Save
```

Defaults:

- today
- expense
- active cycle
- current user
- last used account
- account currency

UI details:

- large numeric keypad
- recent categories first
- favorite categories
- account chips
- one save button
- optional note hidden behind expand action

Target:

- common expense in less than 10 seconds

## Salary Entry

Flow:

```text
Amount USD -> Account -> Salary Date -> Save
```

If an expected salary exists for the open/planned cycle, allow linking it to the actual salary.

## Cross-currency Transfer

Flow:

```text
From account -> USD amount -> To account -> EGP amount -> Save
```

App calculates effective rate:

```text
EGP amount / USD amount
```

Show it clearly before saving.

## Cash Withdrawal

Flow:

```text
From EGP Bank -> To EGP Cash -> Amount -> Save
```

This is a transfer, not an expense.

## Reconciliation

Flow:

```text
Choose account -> App balance shown -> Enter actual balance -> Difference shown -> Resolve
```

Resolve options:

- create adjustment
- mark as checked with no adjustment
- cancel

## Cycle Close

Before closing a cycle, show checklist:

- latest bank balance checked
- latest cash balance checked
- USD transfers recorded
- salary recorded if received
- unexplained differences resolved or accepted

Close summary:

- opening balances
- income
- expenses
- cross-currency transfers
- ending balances
- saving result
- categories over budget

