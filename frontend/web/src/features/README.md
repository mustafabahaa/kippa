# Frontend feature modules

Feature code lives under `src/features/<feature>/`. Current modules are:

- `accounts`
- `activity`
- `ai`
- `auth`
- `budget-cycles`
- `cards`
- `categories`
- `dashboard`
- `fast-entry`
- `household`
- `loans`
- `mcp`
- `notifications`
- `pending-transactions`
- `reconciliation`
- `transactions`
- `shared`

Keep feature-only UI and hooks in their feature. Put reusable UI in `shared`,
and export intentional cross-feature APIs from the owning feature's `index.ts`.
Do not import Firebase SDKs from UI, hooks, or contexts; put data access in a
feature `services/` module or shared infrastructure adapter. Keep financial
calculations in pure selectors and services rather than presentational JSX.

These boundaries are checked by the frontend ESLint architecture rules.
