# Design System — Workspace Productivity System

> **Canonical Source:** Google Stitch Design System, asset ID `d778924a54e1410caa5f4bc7d35e5bca` (project `5833365205671877695`).
> All design tokens (colors, typography, spacing, elevation) are derived from this Stitch asset. Do not add ad-hoc values.

---

*Inspired by Google Workspace*

## 1. Visual Theme & Atmosphere

Google Workspace's design system embodies clean, minimalist collaboration with a focus on productivity and clarity. The aesthetic is modern and professional, prioritizing information hierarchy and accessible readability over decorative elements. The interface conveys trust through spacious layouts, subtle interactions, and a restrained color palette that emphasizes focus on content. Every visual element serves a functional purpose—whether guiding users through tasks, highlighting collaborative features, or drawing attention to actionable moments. The design balances efficiency with an approachable, human-centered feel, making complex data management and real-time collaboration feel intuitive and empowering.

**Key Characteristics**
- Clean, grid-based layout with generous whitespace
- Minimal use of color for maximum semantic clarity
- Typography-driven hierarchy with bold display text
- Flat design with subtle elevation for layering
- Accessible link styling and interactive affordances
- Emphasis on collaboration and real-time features
- Professional but welcoming tone
- Data-centric interface supporting analytics and visualization

## 2. Color Palette & Roles

### Primary
- **Google Blue** (`#1A73E8`): Primary interactive elements, primary CTAs, and trusted actions
- **Google Dark Blue** (`#1967D2`): Hover and active states for primary actions

### Accent Colors
- **Google Green** (`#1E8E3E`): Success states, positive indicators, and confirmations
- **Google Amber** (`#F9AB00`): Warning states, alerts, and cautionary information

### Interactive
- **Hyperlink Blue** (`#0000EE`): Standard web links and tertiary CTAs
- **Icon Gray** (`#5F6368`): Interactive icons and secondary UI elements in default state

### Neutral Scale
- **Charcoal** (`#202124`): Primary text, headings, and dominant interface elements (most frequent)
- **Dark Gray** (`#3C4043`): Secondary text and supporting copy
- **Medium Gray** (`#49454F`): Tertiary text and subtle labels
- **Light Gray** (`#79747E`): Disabled states and de-emphasized content
- **Off-White** (`#F1F3F4`): Light backgrounds and subtle surface variations
- **Border Gray** (`#DADCE0`): Dividers, borders, and subtle separators

### Surface & Borders
- **Pure White** (`#FFFFFF`): Primary surface background
- **Pale Blue** (`#E8F0FE`): Light background for informational callouts
- **Surface Gray** (`#E8EAED`): Secondary surface backgrounds and containers

## 3. Typography Rules

### Font Family
- **Primary Font:** Plus Jakarta Sans (https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700), with fallback `system-ui, -apple-system, sans-serif`
- **Secondary Font:** Plus Jakarta Sans (same family, body weight 400), with fallback `system-ui, -apple-system, sans-serif`
- **UI Font:** Plus Jakarta Sans (medium weight 500), with fallback `sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|-----------------|-------|
| Display / H1 | Google Sans | 54px | 700 | 64px | 0px | Hero headings, page titles |
| Heading H2 | Google Sans | 40px | 500 | 50px | 0px | Section headings, feature titles |
| Heading H3 | Google Sans | 20px | 500 | 28px | 0px | Subsection titles, card headers |
| Body / Paragraph | Google Sans Text | 14px | 400 | 22px | 0px | Main content, descriptions |
| Body Bold | Google Sans Text | 14px | 500 | 22px | 0px | Emphasized body text, labels |
| Caption / Small | Google Sans Text | 12px | 500 | 19px | 0px | Metadata, timestamps, captions |
| List Item | Google Sans Text | 16px | 400 | 24px | 0px | List content, enumerated items |
| Link | Google Sans Text | 14px | 400 | 22px | 0px | Hyperlinks with underline |
| Button | Arial | 13.33px | 400 | normal | 0px | Button labels, interactive text |

### Principles
- Use **Google Sans** exclusively for display and heading hierarchy to establish visual prominence
- Maintain consistent line-height ratios (1.2–1.5 multiplier) to ensure readability and rhythm
- Limit font weights to 400, 500, and 700 to avoid visual fragmentation
- Preserve generous letter-spacing defaults (0px) to prevent crowding at smaller sizes
- Apply 14px body text as the system baseline; deviate only for emphasized or auxiliary content

## 4. Component Stylings

### Buttons

**Primary Button**
- Background: `#1A73E8`
- Text Color: `#FFFFFF`
- Font: Arial, 13.33px, weight 400
- Padding: `12px 24px`
- Border Radius: `48px`
- Border: `0px`
- Line Height: normal
- Hover State: Background `#1967D2`
- Active State: Background `#1557B0`
- Disabled State: Background `#F1F3F4`, Text Color `#79747E`

**Secondary Button**
- Background: `#F7F9FE`
- Text Color: `#202124`
- Font: Google Sans Text, 14px, weight 400
- Padding: `16px 16px`
- Border Radius: `0px`
- Border: `1px solid #DADCE0`
- Line Height: 22px
- Hover State: Background `#F1F3F4`
- Active State: Background `#E8EAED`

**Ghost Button (Text-Only)**
- Background: `transparent`
- Text Color: `#202124`
- Font: Google Sans Text, 14px, weight 400
- Padding: `16px 16px`
- Border Radius: `0px`
- Border: `0px`
- Line Height: 22px
- Hover State: Background `#F1F3F4`

**Icon Button**
- Background: `transparent`
- Text Color: `#5F6368`
- Font: Arial, 13.33px, weight 400
- Padding: `1px 6px`
- Border Radius: `48px`
- Border: `0px`
- Height: `48px`
- Width: `48px`
- Line Height: normal
- Hover State: Background `#F1F3F4`, Text Color `#202124`

### Cards & Containers

**Flat Card**
- Background: `transparent`
- Text Color: `#202124`
- Font: Google Sans Text, 16px, weight 400
- Padding: `0px`
- Border Radius: `0px`
- Border: `0px`
- Line Height: 24px
- Box Shadow: none
- Use Case: Content sections, layout containers

**Bordered Card**
- Background: `#FFFFFF`
- Text Color: `#202124`
- Font: Google Sans Text, 16px, weight 400
- Padding: `20px`
- Border Radius: `20px`
- Border: `1px solid #DADCE0`
- Line Height: 24px
- Box Shadow: none
- Hover State: Border `1px solid #5F6368`, subtle elevation

**Callout Card (Informational)**
- Background: `#E8F0FE`
- Text Color: `#202124`
- Font: Google Sans Text, 14px, weight 400
- Padding: `16px 20px`
- Border Radius: `8px`
- Border: `0px`
- Line Height: 22px
- Box Shadow: none
- Use Case: Tips, feature highlights, AI suggestions

### Inputs & Forms

**Text Input**
- Background: `#EEEEEE`
- Text Color: `#202124`
- Font: Arial (fallback Roboto), 13.33px, weight 400
- Padding: `12px 12px 12px 48px` (with icon space)
- Border Radius: `0px`
- Border: `0px`
- Height: `44px`
- Width: `376px`
- Line Height: normal
- Focus State: Background `#FFFFFF`, Border `2px solid #1A73E8`
- Placeholder Color: `#79747E`

**Dropdown / Select**
- Background: `#FFFFFF`
- Text Color: `#202124`
- Font: Google Sans Text, 14px, weight 400
- Padding: `12px 16px`
- Border Radius: `4px`
- Border: `1px solid #DADCE0`
- Height: auto
- Hover State: Border `1px solid #5F6368`
- Focus State: Border `2px solid #1A73E8`

### Navigation

**Primary Navigation**
- Background: `#FFFFFF`
- Text Color: `#202124`
- Font: Google Sans Text, 14px, weight 400
- Padding: `0px`
- Border Radius: `0px`
- Border: `0px`
- Border Bottom: `1px solid #DADCE0`
- Line Height: 22px
- Box Shadow: `rgba(0, 0, 0, 0.12) 0px 2px 6px 0px, rgb(218, 220, 224) 0px -1px 0px 0px inset`
- Active Link Color: `#1A73E8`
- Hover Link Color: `#1967D2`

**Navigation Item Spacing**
- Horizontal Padding: `16px`
- Vertical Padding: `16px`
- Gap Between Items: `16px`

### Links

**Standard Link**
- Background: `transparent`
- Text Color: `#0000EE`
- Font: Google Sans Text, 14px, weight 400
- Padding: `0px`
- Border Radius: `0px`
- Border: `0px`
- Line Height: 22px
- Text Decoration: `underline`
- Hover State: Color `#1A73E8`
- Visited State: Color `#681DA8`

**Navigation Link**
- Background: `transparent`
- Text Color: `#202124`
- Font: Google Sans Text, 14px, weight 400
- Padding: `16px 16px 16px 75px`
- Border Radius: `0px`
- Border: `0px`
- Line Height: 22px
- Text Decoration: none
- Hover State: Background `#F1F3F4`
- Active State: Border Bottom `3px solid #1A73E8`

## 5. Layout Principles

### Spacing System

The spacing system uses `4px` as the base unit, scaling in multiples for consistent visual rhythm:
- **Micro (4px, 8px):** Icon spacing, tight component gutters
- **Small (12px, 16px):** Input padding, button internal spacing, list gaps
- **Medium (20px, 24px):** Section padding, card spacing, component spacing
- **Large (36px, 48px):** Section margins, major layout divisions
- **Extra Large (64px):** Hero section spacing, page-level sections

**Context Usage**
- Cards and containers: `20px` padding minimum
- Button/input padding: `12px` to `16px`
- Section margins: `48px` to `64px` (vertical)
- Gap between grid items: `48px`
- Navigation item spacing: `16px` horizontal padding

### Grid & Container

- **Max Width:** 1200px for main content containers (inferred from component widths)
- **Column Strategy:** 12-column flexible grid supporting 1, 2, 3, 4, and 6-column layouts
- **Gutters:** 48px between columns
- **Section Patterns:**
  - Hero section: Full-width, centered content with 64px top/bottom margin
  - Feature sections: Two-column (content + visual) or three-column card grid
  - Data-heavy sections: Multi-column card grids with consistent 48px gaps
  - Navigation: Full-width sticky header with internal max-width container

### Whitespace Philosophy

Generous whitespace is central to Google Workspace's clarity. Maintain clear visual separation between content regions through:
- 48px minimum gap between major section blocks
- 24px gap between related card groups
- 16px padding inside cards and containers as a minimum
- Abundant whitespace around typography hierarchies to aid scanning
- No visual element should feel crowded; prioritize breathing room over information density

### Border Radius Scale

- **Sharp (0px):** Navigation, buttons without emphasis, input fields, flat cards
- **Subtle (4px):** Secondary input focus states, minor callouts
- **Moderate (8px):** Small alert boxes, dropdown menus
- **Full (20px):** Primary cards, modals, elevated containers
- **Circular (48px):** Icon buttons, avatar elements, floating action buttons

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| **Flat (Base)** | No shadow, border only | Cards, containers, sections at rest |
| **Raised (Elevation 1)** | `rgba(0, 0, 0, 0.12) 0px 2px 6px 0px, rgb(218, 220, 224) 0px -1px 0px 0px inset` | Navigation bars, subtle hover states |
| **Lifted (Elevation 2)** | `rgba(0, 0, 0, 0.15) 0px 4px 12px 0px` | Modals, overlays, floating panels |
| **Floating (Elevation 3)** | `rgba(0, 0, 0, 0.2) 0px 8px 20px 0px` | Dropdowns, tooltips, priority floating elements |

**Shadow Philosophy**

Google Workspace employs subtle, restrained shadows to indicate layering without overwhelming the interface. Shadows are primarily used to distinguish navigation and interactive overlays from the base content layer. The system favors minimal depth cues, relying instead on color, borders, and spacing to establish visual hierarchy. When shadows are applied, they use soft blur radii (6–20px) and low opacity (12–20%) to maintain a clean, modern appearance. Shadows should never be harsh or darkly colored; they always respect the system's light, professional aesthetic.

## 7. Do's and Don'ts

### Do

- Use `#1A73E8` for all primary CTAs and interactive focus states to establish consistent actionability
- Apply **Google Sans** at 54px weight 700 for hero headlines to command attention and establish page hierarchy
- Maintain 48px minimum gap between major content sections for visual clarity and scanning efficiency
- Keep button padding at 12–16px with 48px border-radius for icon buttons and 0px for text buttons
- Use `#F1F3F4` backgrounds for hover states on flat elements to indicate interactivity subtly
- Apply `16px` line-height multiplier for body text (14px × 1.57) to ensure comfortable readability
- Group related actions in secondary buttons with `1px solid #DADCE0` borders for visual distinction
- Leverage the neutral scale (`#202124` → `#79747E`) to create depth through subtle color shifts
- Use `#E8F0FE` backgrounds for informational callouts and AI suggestions without overwhelming the interface
- Ensure all interactive elements have visible focus states with `2px solid #1A73E8` borders

### Don't

- Do not use `#202124` text on `#F1F3F4` backgrounds without additional contrast reinforcement
- Avoid stacking multiple elevation shadows; use maximum one shadow per element except for modal overlays
- Do not deviate from the specified typography hierarchy; add custom sizes only with design system approval
- Avoid mixing Google Sans and Arial in the same content section; maintain clear font family separation
- Do not apply border-radius greater than 20px except for circular icon buttons (48px)
- Avoid using bright accent colors (`#F9AB00`, `#1E8E3E`) for primary CTAs; reserve for status and semantic messaging
- Do not compress padding below 12px for interactive elements; maintain fingertip-friendly touch targets
- Avoid using more than three opacity levels for disabled states; leverage color shifts and border changes instead
- Do not apply box shadows to cards with borders; choose shadow OR border, not both
- Avoid inconsistent link styling; all web links must be `#0000EE` with `underline` unless in navigation context

## 8. Responsive Behavior

### Breakpoints

| Breakpoint | Width | Key Changes |
|------------|-------|-------------|
| **Mobile** | ≤ 480px | Single column, 16px padding, stacked navigation, full-width cards, 24px gap |
| **Tablet** | 481px – 768px | Two-column grid, 20px padding, collapsible navigation, 36px gap |
| **Small Desktop** | 769px – 1024px | Three-column grid, 24px padding, expanded navigation visible, 48px gap |
| **Large Desktop** | ≥ 1025px | Four-column grid, max 1200px container, full navigation, 48px gap |

### Touch Targets

- Minimum interactive element size: **48px × 48px** (buttons, icon buttons, touch zones)
- Button/input minimum height: **44px**
- Link underline thickness: **1px** (increased to **2px** on focus for visibility)
- Minimum spacing between interactive elements: **8px** (to prevent accidental adjacent taps)
- Icon size in buttons: **24px** with 12px padding on all sides

### Collapsing Strategy

- **Cards:** At 768px and below, shift from three-column to two-column, then single-column layouts
- **Navigation:** Collapse horizontal top navigation into hamburger menu at 768px; maintain active link indicator
- **Typography:** Reduce display heading (H1) from 54px to 36px at tablet; maintain 40px for H2
- **Padding:** Reduce section padding from 64px to 48px at tablet, to 36px at mobile
- **Gaps:** Reduce column/row gaps from 48px to 36px at tablet, to 24px at mobile
- **Containers:** Set max-width 100% with 16px side margin at mobile; 20px at tablet; 24px at desktop
- **Feature sections:** Stack content and visuals vertically at 768px and below; maintain side-by-side at desktop

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA:** Google Blue (`#1A73E8`) — buttons, links, active states
- **Hover State:** Google Dark Blue (`#1967D2`) — interactive element hover
- **Body Text:** Charcoal (`#202124`) — headings, primary text
- **Secondary Text:** Dark Gray (`#3C4043`) — supporting copy
- **Disabled Text:** Light Gray (`#79747E`) — de-emphasized content
- **Background:** Pure White (`#FFFFFF`) — primary surface
- **Light Background:** Off-White (`#F1F3F4`) — secondary surface, hover states
- **Borders & Dividers:** Border Gray (`#DADCE0`) — lines, card edges
- **Callout Background:** Pale Blue (`#E8F0FE`) — informational boxes
- **Success Indicator:** Google Green (`#1E8E3E`) — confirmations, positive states
- **Warning Indicator:** Google Amber (`#F9AB00`) — alerts, caution messaging
- **Icon Default:** Icon Gray (`#5F6368`) — icon elements at rest

### Iteration Guide

1. **Typography Foundation:** Always begin with **Google Sans** at 54px weight 700 for hero text; use **Google Sans Text** at 14px weight 400 for body; apply **Arial** only for button labels.

2. **Spacing Discipline:** Implement the 4px base unit rigorously. Use 12px/16px for component internals, 20px/24px for section divisions, 48px/64px for major layout blocks. Never deviate without explicit design review.

3. **Color Hierarchy:** Text hierarchy follows the neutral scale (`#202124` → `#79747E`). Interactive elements always use **Google Blue** (`#1A73E8`) for primary actions; reserve status colors (`#1E8E3E`, `#F9AB00`) for semantic messaging only.

4. **Elevation Restraint:** Apply shadows sparingly—navigation and modals only. Use `rgba(0, 0, 0, 0.12) 0px 2px 6px 0px` for raised elements, `rgba(0, 0, 0, 0.15) 0px 4px 12px 0px` for lifted overlays. Flat cards use borders (`#DADCE0`) instead of shadows.

5. **Interactive States:** All interactive elements require four states: default, hover, active, and focus. Hover states shift background to `#F1F3F4` or darken primary color. Focus states apply `2px solid #1A73E8` border. Disabled states use `#79747E` text on `#F1F3F4` background.

6. **Border Radius Consistency:** 0px for navigation, buttons, and inputs; 4px for secondary inputs; 8px for callouts; 20px for cards; 48px for icon buttons and avatars. Never mix radius scales within a single component family.

7. **Padding & Margin Scale:** Buttons: 12–16px. Cards: 20px minimum. Sections: 48–64px vertical. Navigation: 16px horizontal item spacing. Maintain this hierarchy across all breakpoints; reduce by one scale level on mobile.

8. **Link Treatment:** Web links default to `#0000EE` with `underline`. Navigation links use `#202124` with no underline, active state applies bottom border `3px solid #1A73E8`. Never use link blue for non-hyperlink text.

9. **Mobile Responsiveness:** At 768px and below, collapse multi-column grids to single column, reduce padding by one scale, collapse navigation to hamburger menu, and reduce typography sizes by 2–4px for display headings. Maintain 48px touch targets always.

10. **Accessibility:** Ensure all text meets WCAG AA contrast ratios (4.5:1 minimum). Apply consistent focus indicators (`2px solid #1A73E8`). Use semantic HTML (`<button>`, `<nav>`, `<main>`) to support screen readers. Never rely on color alone for status indication; pair with icons or text.