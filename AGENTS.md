# Kippa UI Rules

- The shared `@monochrome-ui/design-system` package from `github.com/mustafabahaa/monochrome-ui` is the single source of truth for component appearance.
- Application views must import UI primitives and components from the shared design-system package, never directly from MUI. The package may re-export MUI primitives, but should also expose reusable project components and named variants through the same public API. Framework/theme utilities may be imported from MUI's non-component entry points when needed.
- Enforce the design-system import boundary with lint: application code may not import visual primitives directly from MUI; exceptions should be limited to design-system internals and the shared icon adapter.
- Reuse an existing MUI/design-system variant whenever it fits. If a reusable visual treatment is missing, define a named variant in the design system and add its TypeScript augmentation before using it.
- Name design-system variants for reusable UI roles and visual intent, never for an app, feature, business domain, or data entity. Prefer names such as `surface`, `hero`, `metadata`, `selected`, and `emptyState` over product- or feature-specific names. Keep business meaning in component props and content, not in design-system variant names.
- A variant must be reusable across multiple app areas or products. If a treatment is only needed once, first compose existing primitives and variants; add a new variant only when it expresses a distinct, repeatable UI role.
- Feature components must not recreate visual appearance through `sx`. Use `sx` only for layout and positioning concerns such as grid placement, flex alignment, sizing constraints, spacing between regions, responsive placement, and sticky/fixed coordinates.
- Typography appearance must use named theme variants. Do not set font size, weight, line height, letter spacing, or text transformation ad hoc in feature components.
- Icons must use the shared `AppIcon` Iconsax adapters; do not import icon libraries directly into features.
- Import shared components such as `PageHeader` directly from `@monochrome-ui/design-system`; do not add feature-level re-export adapters or duplicate shared components.
- `npm run lint --workspace kippa-app` runs `monochrome-ui/known-variants` against the installed shared package and checks that every routed page listed in `frontend/web/eslint.config.js` inherits `PageScaffold` from the app shell. Keep that route list synchronized with `frontend/web/src/App.tsx`.
- The app shell owns the shared `PageScaffold`. It keeps each page header on the shell baseline and applies the same responsive inset to page content, so page modules should not add another page-level indent.
- Async Button and IconButton actions use the shared `loading` prop. Do not render `CircularProgress` inside a button or replace its stable action label with a spinner; `kippa-design/button-loading-prop` enforces this.
