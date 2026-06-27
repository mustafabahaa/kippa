# Data Model

## Design Principle

Use a ledger-first model.

The system stores financial facts and account movements. Dashboards, balances, monthly reports, savings, overspending status, and projections are derived from those records.

Do not make UI dashboards the source of truth.

## Entities

### users

Firebase Authentication users.

Fields:

- displayName
- email
- householdId
- role: owner or member
- createdAt

### households

Shared container for the couple's data.

Fields:

- name
- baseCurrency: likely EGP
- createdAt
- createdBy

### accounts

Places where money exists.

Fields:

- householdId
- name
- type: cash, bank, wallet, card, adjustment
- currency: USD or EGP
- isActive
- sortOrder
- createdAt

Examples:

- USD Bank
- EGP Bank
- EGP Cash

### transactions

Financial events.

Fields:

- householdId
- type: income, expense, transfer, conversion, adjustment
- date
- description
- categoryId, optional
- budgetCycleId, optional
- createdBy
- createdAt
- updatedAt
- status: draft, posted, voided
- revisionOf, optional

Notes:

- A transaction should not directly store account balance.
- For closed-cycle edits, prefer audit behavior or revision markers.

### ledgerLines

Account movements for a transaction.

Fields:

- householdId
- transactionId
- accountId
- amount
- currency
- direction or signedAmount
- createdAt

Recommendation:

Use signed amounts for implementation simplicity:

- positive amount means money enters the account
- negative amount means money leaves the account

Examples:

Salary:

```json
[
  { "account": "USD Bank", "signedAmount": 3000, "currency": "USD" }
]
```

Expense:

```json
[
  { "account": "EGP Cash", "signedAmount": -250, "currency": "EGP" }
]
```

Conversion:

```json
[
  { "account": "USD Bank", "signedAmount": -500, "currency": "USD" },
  { "account": "EGP Bank", "signedAmount": 24000, "currency": "EGP" }
]
```

### conversionDetails

Extra metadata for currency conversion transactions.

Fields:

- transactionId
- fromCurrency
- toCurrency
- fromAmount
- toAmount
- effectiveRate
- rateSource: manual, bank, expected, api

### categories

Stable category definitions.

Fields:

- householdId
- name
- type: income, expense
- priority: essential, flexible, saving, debt, other
- isActive
- parentCategoryId, optional
- createdAt

Important:

Use category IDs. Do not rely on names as historical identifiers.

### budgetCycles

Budget periods.

Fields:

- householdId
- name
- startDate
- endDate
- status: planned, open, closed
- salaryTransactionId, optional
- closedAt, optional
- closedBy, optional
- revisedAt, optional

### budgetAllocations

Category budget for a cycle.

Fields:

- householdId
- budgetCycleId
- categoryId
- plannedAmount
- currency: usually EGP
- carryLeftover
- notes

### expectedIncome

Forecast records before income is received.

Fields:

- householdId
- budgetCycleId
- expectedDate
- amount
- currency
- expectedRateToBaseCurrency
- label
- status: expected, received, cancelled
- receivedTransactionId, optional

### exchangeRates

Rates used for forecasts and display.

Fields:

- householdId
- date
- fromCurrency
- toCurrency
- rate
- source: manual, bank, api, expected
- createdAt

Historical conversion transactions should store their actual effective rate separately.

### reconciliations

Manual balance checks.

Fields:

- householdId
- accountId
- date
- calculatedBalance
- actualBalance
- difference
- currency
- createdBy
- createdAt
- adjustmentTransactionId, optional
- note

### notificationSettings

Per-user notification preferences.

Fields:

- userId
- householdId
- dailyReminderEnabled
- dailyReminderTime
- timezone
- categoryWarningEnabled
- savingWarningEnabled
- cycleCloseReminderEnabled

## Derived Values

These should be calculated, not stored as source truth:

- account balances
- total net worth in EGP
- cycle spending
- category spending
- remaining budget
- saving amount
- projected saving
- safe daily spend
- on-track status
- overspending status
- burn rate

