# Household Finance Ledger PWA

Private household finance app specification for a ledger-first PWA used by two partners across phone and PC.

## Goal

Build a fast daily finance app that answers:

- Am I on track or overspending?
- Am I saving or not?
- What do I have right now in USD, EGP bank, and EGP cash?
- Did I forget to record expenses?
- Can I safely spend at the current pace until the next salary?

The app must not hardcode dashboard logic into the stored data model. Store raw financial facts first, then derive dashboards, projections, balances, and reports from those facts.

## Stack

- Frontend: React + Vite
- UI: Material UI (MUI)
- Database/Auth/Backend: Firebase
- Target: Progressive Web App (PWA)
- Users: household/shared use by husband and wife

## Design System

Use this design-system reference:

https://designmd.me/s/workspace-google-dmepn

This environment could not access the page directly, so the implementer must open it in a browser and extract the visual rules/tokens before UI implementation.

## Key Product Decisions

- Ledger-first, not dashboard-first.
- Store immutable or audit-tracked financial events.
- Balances are derived from ledger entries.
- USD salary and EGP spending are first-class requirements.
- USD to EGP conversion is a transfer, not income or expense.
- Budgeting should use salary cycles, not only calendar months.
- Opening balances carry forward automatically through account balances.
- Manual reconciliation is required because there is no bank API.
- Fast expense entry is a core feature, not a convenience.

## Documents

- [Product spec](./docs/product-spec.md)
- [Data model](./docs/data-model.md)
- [Firebase architecture](./docs/firebase-architecture.md)
- [Dashboard calculations](./docs/dashboard-calculations.md)
- [UX flows](./docs/ux-flows.md)
- [Notifications](./docs/notifications.md)
- [Implementation plan](./docs/implementation-plan.md)
- [Gemini handoff](./docs/gemini-handoff.md)
