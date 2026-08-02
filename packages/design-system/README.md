# @kippa/design-system

Shared visual foundations for Kippa's product, landing page, and documentation.

- `designTokens`: canonical colors, spacing, radii, typography, and elevation.
- `createKippaTheme(mode)`: shared MUI theme factory.
- `tokens.css`: semantic CSS custom properties for non-MUI surfaces.

Product-specific MUI overrides may remain in the consuming application, but raw
visual values must be defined here rather than copied between projects.
