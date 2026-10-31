# Kippa architecture and folder structure

Kippa is a feature-oriented monorepo. The frontend is a layered React application organized around product features; shared domain contracts and design foundations live in workspace packages. This is a modular monolith, not a set of independently deployed frontend services.

## Workspace map

```text
kippa/
├── frontend/
│   ├── web/                         # Product PWA
│   │   └── src/
│   │       ├── components/app-shell/ # Routing shell and global navigation
│   │       ├── config/              # SDK initialization and environment config
│   │       ├── contexts/            # App-wide state composition
│   │       ├── features/            # Feature pages, UI, hooks, and services
│   │       ├── hooks/               # Shared app hooks and React Query APIs
│   │       ├── libs/                # App services, adapters, and pure calculations
│   │       ├── notifications/       # Notification integration
│   │       └── main.tsx             # App bootstrap
│   └── landing/                     # Public landing site
├── backend/functions/src/
│   ├── domain/                      # Pure server-side rules
│   ├── features/                    # Cloud Function handlers by feature
│   ├── libs/                        # Firebase Admin infrastructure adapters
│   └── index.ts                     # Stable deployment exports
├── docs/                            # Docusaurus documentation
└── packages/
    ├── design-system/               # Shared visual foundations and MUI theme
    └── domain/                      # Type-only cross-runtime contracts
```

## Frontend dependency rules

1. **The app shell composes features.** Routing and global navigation live in `components/app-shell/`; they may load feature pages.
2. **A feature owns its implementation.** Put page-specific components, hooks, and feature services under `features/<feature>/`. Keep shared UI in `features/shared/`.
3. **Feature internals stay private.** A feature that intentionally reuses another feature exports that surface from its `index.ts`. Other features must import through that public entry point; deep imports across feature boundaries are lint errors. Shared components remain directly importable from `features/shared/`.
4. **UI consumes services.** Components, hooks, contexts, and app-shell UI do not import Firebase SDKs or `config/firebase`. Firebase access belongs in `config/`, `libs/`, notification adapters, or a feature-local `services/` module. Hooks and context may coordinate those services.
5. **Keep calculations pure.** Financial calculations and selectors should not depend on React or Firebase. Put cross-feature pure calculations in `src/libs/`; keep feature-specific calculations with their feature when they are not shared.

## Shared packages

### `packages/domain/`

Contains type-only Firestore and cross-runtime contracts. Keep Firebase, React, browser, and Node imports out of this package. Runtime rules remain in the app or Functions workspace until Functions can safely bundle shared runtime packages.

### `packages/design-system/`

This is the source of truth for colors, spacing, radii, typography, component variants, and themes. Feature code reuses named variants. Add new reusable appearance here, with TypeScript augmentation where required, instead of styling it ad hoc in a feature.

## Backend layers

- `src/domain/` contains deterministic rules and must not import Firebase.
- `src/features/` contains callable, HTTP, scheduled, and Firestore handlers grouped by product feature.
- `src/libs/` contains Firebase Admin and other infrastructure adapters.
- `src/index.ts` is the deployed API boundary. Keep exported Cloud Function names stable.

## Enforcement

Frontend ESLint errors on direct Firebase imports from UI layers and cross-feature deep imports. It also errors on direct icon-library imports, visual `sx` overrides, and ad hoc typography styles. Backend ESLint errors if `src/domain/` imports Firebase packages. Run `npm run lint` and `npm run typecheck` before merging.
