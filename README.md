# Household Finance Ledger PWA

> ⚠️ **License:** This project is licensed under the [PolyForm Noncommercial License](./LICENSE). Free for personal and non-commercial use. For commercial use, contact mustafa.bahaa123@gmail.com.

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

## Starter App

This repo now includes a minimal React/Vite/MUI/Firebase/PWA scaffold. It is intentionally empty of finance implementation logic so Gemini can build from the docs without fighting hardcoded dashboard assumptions.

Run locally:

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```

Firebase config should be added through `.env`, using [app/.env.example](./app/.env.example) as the template.

### Per-project config files

A few files cannot read `.env` and hold project-specific values. The real files are gitignored so your local copies stay untouched; each has a committed `.example` template:

1. **`firebase.json`** — hosting/firestore/functions config including OAuth support email. Copy `firebase.json.example` → `firebase.json`.
2. **`.firebaserc`** — Firebase CLI project alias. Copy `.firebaserc.example` → `.firebaserc`.
3. **`app/public/firebase-messaging-sw.js`** — Cloud Messaging service worker (service workers can't read `.env`, so public client values are inlined). Copy `firebase-messaging-sw.example.js` → `firebase-messaging-sw.js`.

## Design System

Use the local design-system reference:

[docs/design-system](./docs/design-system)

The MUI theme has been initialized from the local Google Workspace-inspired design-system file.

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

## App Icon

Icon source and generated PWA assets live in [public/icons](./public/icons).
