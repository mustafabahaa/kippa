# Firebase Architecture

## Firebase Services

Use:

- Firebase Authentication for users.
- Cloud Firestore for ledger data.
- Firebase Hosting for the PWA.
- Cloud Functions for scheduled notifications, derived summaries, and server-controlled writes if needed.
- Firebase Cloud Messaging for push notifications where supported.

## Firestore Shape

Recommended top-level structure:

```text
households/{householdId}
households/{householdId}/accounts/{accountId}
households/{householdId}/transactions/{transactionId}
households/{householdId}/ledgerLines/{ledgerLineId}
households/{householdId}/categories/{categoryId}
households/{householdId}/budgetCycles/{cycleId}
households/{householdId}/budgetAllocations/{allocationId}
households/{householdId}/expectedIncome/{expectedIncomeId}
households/{householdId}/exchangeRates/{rateId}
households/{householdId}/reconciliations/{reconciliationId}
users/{userId}
users/{userId}/notificationSettings/{householdId}
```

Alternative:

Ledger lines can be subcollections under transactions:

```text
households/{householdId}/transactions/{transactionId}/ledgerLines/{lineId}
```

However, account balance queries are easier if ledger lines are queryable by `accountId`. If using subcollections, use collection group queries and appropriate indexes.

## Write Strategy

Transaction creation should be atomic:

- create transaction
- create all ledger lines
- optionally create conversion details
- update lightweight metadata if required

Use Firestore batched writes or transactions.

## Security Rules Requirements

Rules must enforce:

- users can only access households they belong to
- only household members can read/write household data
- transaction writes must include householdId matching the path
- ledger lines must reference valid account IDs in the same household

Some validation may need Cloud Functions because Firestore rules are limited for cross-document validation.

## Derived Data Strategy

Prefer calculating from raw ledger data for MVP.

Possible later optimization:

- Maintain cached monthly summaries using Cloud Functions.
- Treat caches as disposable derived data.
- Provide a rebuild function to regenerate summaries from raw transactions.

Never let cached summaries become the only source of truth.

## Indexes Likely Needed

Ledger lines:

- householdId + accountId + date
- householdId + transactionId

Transactions:

- householdId + date
- householdId + budgetCycleId + date
- householdId + type + date
- householdId + categoryId + date

Budget allocations:

- householdId + budgetCycleId
- householdId + budgetCycleId + categoryId

Reconciliations:

- householdId + accountId + date

