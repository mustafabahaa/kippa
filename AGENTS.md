# Kippa UI Rules

- The shared package at `packages/design-system` is the single source of truth for component appearance.
- Reuse an existing MUI/design-system variant whenever it fits. If a reusable visual treatment is missing, define a named variant in the design system and add its TypeScript augmentation before using it.
- Feature components must not recreate visual appearance through `sx`. Use `sx` only for layout and positioning concerns such as grid placement, flex alignment, sizing constraints, spacing between regions, responsive placement, and sticky/fixed coordinates.
- Typography appearance must use named theme variants. Do not set font size, weight, line height, letter spacing, or text transformation ad hoc in feature components.
- Icons must use the shared `AppIcon` Iconsax adapters; do not import icon libraries directly into features.
