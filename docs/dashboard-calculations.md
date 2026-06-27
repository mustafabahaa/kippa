# Dashboard Calculations

## Rule

Dashboard values are derived from raw data.

Do not store dashboard values as primary data.

## Account Balance

For each account:

```text
balance = sum(ledgerLines.signedAmount where accountId = account.id and status is posted)
```

Filter out voided transactions.

## Total EGP Equivalent

```text
totalEgpEquivalent =
  EGP balances
  + USD balances * selectedDisplayUsdToEgpRate
```

Use a display rate, not a historical conversion rate.

Historical conversions keep their own effective rate.

## Cycle Spending

For expense transactions in cycle:

```text
cycleSpending = sum(abs(expense ledger lines in EGP equivalent))
```

Transfers and conversions are excluded.

## Cycle Income

For income transactions in cycle:

```text
cycleIncome = sum(income in base currency equivalent)
```

USD salary can be shown as original USD plus base-currency equivalent.

Do not count USD-to-EGP conversions as income.

## Saving

Actual saving:

```text
actualSaving = cycleIncome - cycleExpenses
```

Projected saving:

```text
projectedSaving = projectedCycleIncome - projectedCycleExpenses
```

Projected expenses can be calculated using current burn rate:

```text
projectedCycleExpenses = spendingSoFar / cycleProgressRatio
```

Guard against early-cycle distortion by showing low-confidence projection in first few days.

## Cycle Progress

```text
cycleProgressRatio = elapsedDays / totalCycleDays
```

Use inclusive dates carefully. Define one consistent rule in implementation.

## Category Burn Rate

```text
categorySpentRatio = spentInCategory / plannedCategoryBudget
cycleProgressRatio = elapsedDays / totalCycleDays
```

Status:

```text
onTrack if categorySpentRatio <= cycleProgressRatio + tolerance
warning if categorySpentRatio is moderately above pace
over if categorySpentRatio is clearly above pace
```

Suggested tolerance:

- 10 percentage points for flexible categories
- 5 percentage points for essential recurring categories

## Safe Daily Spend

This is one of the most important metrics.

```text
safeDailySpend =
  remainingFlexibleBudget / remainingDaysInCycle
```

Alternative stricter version:

```text
safeDailySpend =
  (availableBaseCurrencyEquivalent - requiredRemainingBills - savingTargetRemaining)
  / remainingDaysInCycle
```

The app may show both:

- budget-safe daily spend
- cash-safe daily spend

## On Track Status

Overall status can be derived from:

- total spending vs cycle progress
- projected saving vs target saving
- cash availability until next salary
- category overruns

Suggested status:

```text
On Track:
  projectedSaving >= savingTarget
  and totalSpendingRatio <= cycleProgressRatio + tolerance

Warning:
  projectedSaving slightly below target
  or one major category is above pace

Over Spending:
  projectedSaving materially below target
  or totalSpendingRatio significantly above cycle progress
```

## Reconciliation Difference

```text
difference = actualBalance - calculatedBalance
```

If accepted, create an adjustment transaction.

Never silently overwrite calculated balance.

