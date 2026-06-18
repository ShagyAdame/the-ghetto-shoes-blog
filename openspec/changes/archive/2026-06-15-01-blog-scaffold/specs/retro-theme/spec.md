# Retro Theme Specification

## Purpose
Defines the CSS design system for the retro/vaporwave aesthetic using the 5-brand color palette: #590111, #BFC024, #7A4D26, #E7A594, #C95F5F.

## Requirements

### R1: CSS Custom Properties
All brand colors MUST be defined as CSS custom properties on `:root`:
- `--color-primary: #590111`
- `--color-accent: #BFC024`
- `--color-secondary: #7A4D26`
- `--color-surface: #E7A594`
- `--color-cta: #C95F5F`

#### Scenario: Custom properties applied
- GIVEN any element using `var(--color-primary)`
- WHEN the page renders
- THEN the color resolves to `#590111`

### R2: Color Application Map
Colors MUST apply as: `#590111` → body/hdr/ftr bg; `#BFC024` → h1/h2, highlights, accent borders; `#7A4D26` → decorative borders, vintage details, secondary text; `#E7A594` → card/section backgrounds; `#C95F5F` → buttons, links, hover states, CTAs.

#### Scenario: Heading color
- GIVEN an h1 element
- WHEN rendered
- THEN its color is `var(--color-accent)` (#BFC024)

#### Scenario: Link hover
- GIVEN a link element
- WHEN hovered
- THEN its color becomes `var(--color-cta)` (#C95F5F)

### R3: Typography
Headings MUST use a chunky retro Google Font (e.g., "Bebas Neue" or "Luckiest Guy"). Body text MUST use a clean sans-serif (e.g., "Inter" or `system-ui`). Fallback fonts MUST be specified.

#### Scenario: Google Font loaded
- GIVEN the built site
- WHEN inspecting `<head>`
- THEN the retro font is imported from Google Fonts and applied to all headings

### R4: Responsive Grid
Layout MUST be mobile-first: 1 column on mobile, 2 on tablet (≥640px), 3 on desktop (≥1024px).

#### Scenario: Mobile viewport
- GIVEN a 375px viewport
- WHEN viewing `/posts`
- THEN posts display in a single column

#### Scenario: Desktop viewport
- GIVEN a 1280px viewport
- WHEN viewing `/posts`
- THEN posts display in 3 columns

### R5: Decorative Elements
The theme SHOULD include geometric borders, grid patterns, and chunky accents consistent with a vaporwave/sneaker aesthetic. These MUST NOT impair readability.

#### Scenario: Post card border
- GIVEN a post card on the homepage
- WHEN rendered
- THEN it has a chunky border using `--color-secondary` (#7A4D26)
