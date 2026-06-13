# T-002: Field & Form design tokens + shared UI components

## Status
Done

## Epic
E-01 Foundation

## Priority
P0

## Goal
Implement the "Field & Form" shared UI component library — Button, Card, Badge, and Input — wired to the design tokens already in `tailwind.config.ts`. These four primitives are used by every feature screen in E-02 through E-05; getting them right now prevents drift and re-work downstream.

## Why it matters
Feature screens in E-02 will import from `src/shared/ui/`. If components are missing or tokens are inconsistent, every feature screen must work around it. Establishing correct touch targets (≥ 44px), correct border radii (4px cards, 8px buttons, pills), and correct color usage now means each feature agent can focus on layout rather than styling primitives.

## Scope
- Implement `Button` — variants: primary, secondary, danger, ghost; sizes: sm, md, lg; all sizes must satisfy ≥ 44px touch target; fullWidth prop
- Implement `Card` — bg-surface, 4px border radius, 1px border-border, configurable padding
- Implement `Badge` — pill shape, variants: default, success, warning, danger; uppercase tracking label style
- Implement `Input` — label + input combo; min-h-[44px]; focus ring using primary color; error and hint states
- Barrel export from `src/shared/ui/index.ts`
- All components use only Field & Form design tokens from `tailwind.config.ts`

## Out of scope
- Dexie schema or repository layer (T-003)
- TypeScript row/stat interfaces (T-004)
- Any feature screen (E-02+)
- Icon system (deferred; icons will be inline SVG per screen as needed)
- Select, Checkbox, Radio, Textarea (add as needed in E-02 tickets)
- Animation or transition beyond `transition-colors`

## Dependencies
- T-001 Done — scaffold, Tailwind config with Field & Form tokens, path alias `@/`

## Files to touch
- `src/shared/ui/Button.tsx` (new)
- `src/shared/ui/Card.tsx` (new)
- `src/shared/ui/Badge.tsx` (new)
- `src/shared/ui/Input.tsx` (new)
- `src/shared/ui/index.ts` (new)
- `tickets/T-002-design-tokens-ui-components.md` (this file)
- `TASKS.md` (status update)

## Ticket sizing check
- Expected to fit in one focused agent session: Yes
- Expected new files: 5 (4 components + 1 barrel)
- Split required if: icon system or additional form controls are added (defer to E-02 tickets)

## Acceptance criteria
- `npm run typecheck` passes with zero errors
- `npm run build` completes without errors
- Button renders in all four variants and three sizes; all sizes are ≥ 44px tall
- Card renders with correct 4px radius, 1px border, white surface
- Badge renders in pill shape with correct uppercase label style; all four variants are distinct
- Input renders label + input with 44px touch target; error state shows clay-colored message; focus shows primary ring
- All components are importable via `import { Button, Card, Badge, Input } from '@/shared/ui'`
- No hardcoded hex values in component files — only Tailwind design-token classes

## Test plan
- `npm run typecheck` — zero errors
- `npm run build` — clean dist output
- Manual: import and render all components in `App.tsx` temporarily; verify in browser at `http://localhost:5173`

## Delegation category
Any-model

## Recommended owner
Codex

## Risks
- Tailwind's `bg-primary/90` (opacity modifier) requires Tailwind v3.3+; version installed (3.4.17) satisfies this
- Touch target enforcement: `min-h-[44px]` is CSS min-height — verify that text content or flex layout does not collapse the button below 44px on any variant

## Completion notes
Implemented 2026-06-10. All acceptance criteria met.

**Files created:**
- `src/shared/ui/Button.tsx` — variants: primary, secondary, danger, ghost; sizes: sm (44px), md (44px), lg (52px); fullWidth prop
- `src/shared/ui/Card.tsx` — bg-surface, 4px radius, 1px border-border, padding prop
- `src/shared/ui/Badge.tsx` — pill shape, variants: default, success, warning, danger; uppercase tracking
- `src/shared/ui/Input.tsx` — label + input combo, 44px touch target, error/hint states, primary focus ring
- `src/shared/ui/index.ts` — barrel export

**Validation:**
- `npm run typecheck` → zero errors
- `npm run build` → clean; dist produced in 253ms; Tailwind scans component files and includes token-based classes

**Notes for downstream tickets:**
- Import pattern: `import { Button, Card, Badge, Input } from '@/shared/ui'`
- `for` attribute on label in `Input.tsx` works correctly with Preact's JSX types (strict mode passes)
- Tailwind opacity modifier syntax (`bg-primary/90`, `bg-clay/10`) confirmed working with Tailwind 3.4.17
- No hardcoded hex values in component files — all styling via design-token utility classes
