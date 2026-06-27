# Notifications

## Goals

Notifications should support the habit and prevent drift.

They should not shame the user or spam the household.

## Notification Types

### Daily Missing Expense Reminder

Trigger:

```text
No expense transaction created today by configured reminder time.
```

Message idea:

```text
No expenses recorded today. Add anything you spent before the day slips.
```

### Category Warning

Trigger:

```text
Category spent ratio crosses configured threshold.
```

Suggested thresholds:

- 80 percent of category budget
- over pace compared to cycle progress

### Saving Target Warning

Trigger:

```text
Projected saving falls below target.
```

### Reconciliation Reminder

Trigger:

```text
No balance check for important accounts in N days.
```

Suggested default:

- every 3 days

### Cycle Close Reminder

Trigger:

```text
Cycle expected end date passed and cycle is still open.
```

## User Settings

Per user:

- enable daily reminder
- reminder time
- quiet hours
- enable category warnings
- enable saving warnings
- enable reconciliation reminders

## Implementation Notes

Use Firebase Cloud Messaging where appropriate.

For PWA push support, implementation must account for browser/platform restrictions, especially iOS Home Screen web apps.

