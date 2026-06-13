---
name: Field & Form
colors:
  surface: '#f7f9ff'
  surface-dim: '#d7dadf'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f9'
  surface-container: '#ebeef3'
  surface-container-high: '#e5e8ee'
  surface-container-highest: '#e0e3e8'
  on-surface: '#181c20'
  on-surface-variant: '#414844'
  inverse-surface: '#2d3135'
  inverse-on-surface: '#eef1f6'
  outline: '#717973'
  outline-variant: '#c1c8c2'
  surface-tint: '#3f6653'
  primary: '#012d1d'
  on-primary: '#ffffff'
  primary-container: '#1b4332'
  on-primary-container: '#86af99'
  inverse-primary: '#a5d0b9'
  secondary: '#5c5f60'
  on-secondary: '#ffffff'
  secondary-container: '#e1e3e4'
  on-secondary-container: '#626566'
  tertiary: '#4c1200'
  on-tertiary: '#ffffff'
  tertiary-container: '#711f00'
  on-tertiary-container: '#ff835a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c1ecd4'
  primary-fixed-dim: '#a5d0b9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#274e3d'
  secondary-fixed: '#e1e3e4'
  secondary-fixed-dim: '#c5c7c8'
  on-secondary-fixed: '#191c1d'
  on-secondary-fixed-variant: '#454748'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59e'
  on-tertiary-fixed: '#390b00'
  on-tertiary-fixed-variant: '#842500'
  background: '#f7f9ff'
  on-background: '#181c20'
  surface-variant: '#e0e3e8'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
  data-mono:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is engineered for the high-stakes environment of professional sports analytics. The brand personality is authoritative, energetic, and precise, mirroring the focus of an elite athlete and the rigor of a data scientist. 

The visual style follows a **Modern Corporate** aesthetic with a lean toward **High-Contrast Data Visualization**. It utilizes a card-based architecture to modularize complex statistics, ensuring that dense information remains digestible during live events. The UI prioritizes legibility in high-ambient light (outdoor stadium settings) by employing crisp borders, significant value contrast, and a purposeful use of whitespace to separate distinct data streams.

Targeting professional scouts, dedicated fans, and analysts, the design system evokes a sense of reliability and "on-the-field" immediacy.

## Colors

The palette is rooted in the physical elements of the sporting arena.

*   **Primary (Stadium Green):** A deep, commanding green (#1B4332) used for headers, primary actions, and branding elements. It provides a stable, professional foundation.
*   **Secondary (Baseline White):** A clean, high-brightness neutral (#F8F9FA) used for backgrounds and card surfaces to ensure maximum contrast for data points.
*   **Tertiary (Clay Orange):** A vibrant, high-visibility accent (#D9480F) reserved for "live" indicators, critical alerts, and key performance highlights.
*   **Neutral:** A range of grays from Charcoal (#212529) for primary text to Cool Silver for borders, ensuring a structured hierarchy without visual clutter.

## Typography

This design system utilizes **Inter** exclusively to leverage its exceptional legibility and systematic feel. The type scale is optimized for "glanceability."

*   **Headlines:** Bold and tight, using negative letter-spacing to create a compact, impactful look suitable for player names and scores.
*   **Data Points:** Large-scale numbers should use tabular figures (`tnum`) to ensure columns of statistics align perfectly for comparison.
*   **Labels:** Small caps or bold uppercase are used for category headers (e.g., "AVG", "PTS", "REB") to distinguish metadata from actual values.

## Layout & Spacing

The design system employs a **Fluid Grid** model based on a 4px baseline shift. 

*   **Mobile:** A 4-column grid with 16px side margins and 16px gutters.
*   **Desktop:** A 12-column grid centered in a max-width container of 1280px.
*   **Hierarchy:** Spacing is used to group related statistics. Vertical rhythm is strictly maintained; use `12px` (sm) for internal card padding and `24px` (lg) to separate distinct content blocks. 

Data density should be managed through "Progressive Disclosure"—showing high-level stats first, with tap-to-expand details to avoid cognitive overload.

## Elevation & Depth

To maintain high contrast and clarity in outdoor settings, this design system avoids heavy shadows. Instead, it utilizes **Tonal Layers** and **Low-Contrast Outlines**.

*   **Surface Hierarchy:** The base background is "Baseline White." Content cards sit at Elevation 1, using a 1px solid border (#E9ECEF) instead of a shadow.
*   **Active States:** Interactive cards or selected items use a subtle 4px Stadium Green bottom-border or a very soft, low-opacity green inner-tint to indicate focus.
*   **Overlays:** Modals and bottom sheets use a 20% opacity black backdrop blur to maintain focus while keeping the stadium-context visible in the background.

## Shapes

The shape language is **Soft (Level 1)**. This ensures the interface feels modern and approachable without losing the professional, "engineered" edge required for a data-driven app.

*   **Standard Cards:** 4px (0.25rem) corner radius.
*   **Action Buttons:** 8px (0.5rem) corner radius to make them more distinct from data cards.
*   **Status Badges:** Fully rounded (pill-shaped) to differentiate "Live" or "Final" indicators from structural UI elements.

## Components

*   **Buttons:** Primary buttons are solid Stadium Green with Baseline White text. Secondary buttons are outlined with a 2px Stadium Green border.
*   **Data Cards:** Containers for statistics should have a 1px border. Use "Clay Orange" sparingly within cards to highlight lead changes or record-breaking stats.
*   **Chips/Badges:** Small, high-contrast labels for player positions (e.g., "QB", "ST") using Stadium Green backgrounds with white text.
*   **Input Fields:** Minimalist design with a 1px bottom border that transforms into a 2px Stadium Green border on focus.
*   **Progress Bars / Graphs:** Use Stadium Green for positive progress and a neutral gray for the track. Clay Orange is used for "Critical" areas or threshold alerts.
*   **Score Strips:** A specialized persistent component at the top of the view that uses the Primary Green background for a "broadcast-style" aesthetic.