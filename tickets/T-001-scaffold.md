# T-001: Vite + Preact + TypeScript + Tailwind + PWA scaffold

## Status
Done

## Epic
E-01 Foundation

## Priority
P0

## Goal
Create the project scaffold that every other ticket builds on: a working Vite + Preact + TypeScript app with Tailwind CSS configured for the Field & Form design tokens, a Vite PWA plugin producing a service worker and web app manifest, and a passing dev server on a clean clone.

## Why it matters
Every subsequent ticket in E-02 through E-05 depends on this scaffold existing. A missing or misconfigured base (wrong TypeScript target, Tailwind not resolving tokens, service worker not registering) will cause silent failures in downstream tickets that are hard to debug later. Get this right before writing any feature code.

## Scope
- Initialize Vite project with Preact + TypeScript template
- Configure `tsconfig.json`: strict mode, path aliases (`@/` → `src/`)
- Install and configure Tailwind CSS v3 with `tailwind.config.ts`
- Define Field & Form design tokens in Tailwind config: Stadium Green (`#1B4332`), Clay Orange (`#D9480F`), background (`#F7F9FF`), surface white, text charcoal, Inter font family
- Install and configure `vite-plugin-pwa` (Workbox): web app manifest (name, icons, theme color, display: standalone), service worker with `NetworkFirst` for navigation and `CacheFirst` for static assets
- Configure `index.html` with correct `<meta name="theme-color">`, `<meta name="apple-mobile-web-app-capable">`, and viewport settings for mobile-first use
- Verify dev server starts, app renders "BaseballTracker" placeholder, service worker registers in browser devtools
- Add `.gitignore` covering `node_modules/`, `dist/`, `.env`

## Out of scope
- Any feature UI or screens
- Dexie schema or storage layer (T-003)
- Shared UI components (T-002)
- TypeScript interfaces (T-004)

## Dependencies
- None

## Files likely touched
- `package.json`
- `vite.config.ts`
- `tailwind.config.ts`
- `tsconfig.json`
- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `.gitignore`

## Ticket sizing check
- Expected to fit in one focused agent session: Yes
- Expected files touched: 9
- Split required if: PWA manifest icon generation requires a separate asset pipeline (break into a T-001b ticket)

## Implementation notes
- Use `@vitejs/plugin-react` is incorrect — this is a Preact project; use `@preact/preset-vite`
- Tailwind must scan `./src/**/*.{ts,tsx}` in `content`
- PWA plugin `registerType: 'autoUpdate'` is appropriate for a local-only app with no server
- Theme color in manifest should be `#1B4332` (Stadium Green)
- `display: 'standalone'` enables full-screen mode when installed on iOS/Android
- Apple touch icon (180×180) and maskable icon (512×512) are required for iOS add-to-home-screen

## Acceptance criteria
- `npm run dev` starts the app with no TypeScript errors
- Browser devtools → Application → Service Workers shows service worker registered and active
- Browser devtools → Application → Manifest shows correct app name, theme color, and at least one icon
- Tailwind utility classes using the Field & Form color tokens (e.g., `bg-primary`, `text-clay`) resolve correctly in the browser
- `npm run build` completes without errors and produces a `dist/` folder with a service worker file

## Test plan
- Manual: clone into a clean directory, run `npm install && npm run dev`, verify app loads
- Manual: open Chrome DevTools → Application → Manifest; verify fields are populated
- Manual: run `npm run build`, serve `dist/` with a local static server, install via Chrome "Add to Home Screen" on Android Chrome

## Deployment or observability notes
- No deployment infrastructure at this stage; PWA is distributed by opening its URL
- No new log events required

## Validation commands
```bash
npm install
npm run dev
# Open http://localhost:5173 — verify app renders
# Open DevTools → Application → Service Workers — verify registration
npm run build
# Verify dist/ contains sw.js or workbox-*.js
npm run typecheck
# Should produce zero errors
```

## Delegation category
Any-model

## Recommended owner
Codex

## Handoff notes
After this ticket, all subsequent tickets may assume:
- Path alias `@/` resolves to `src/`
- Tailwind Field & Form tokens are available as utility classes
- PWA service worker is present and registers correctly
- TypeScript strict mode is active

## Risks
- Preact + Vite + Tailwind version combination may have peer dependency conflicts — resolve by using exact versions documented in this ticket's completion notes
- iOS PWA requires specific `<meta>` tags that are easy to miss; verify on a real iOS device, not just Chrome DevTools mobile emulation

## Completion notes
Implemented 2026-06-10. All acceptance criteria met.

**Exact versions resolved:**
- vite 5.4.21, @preact/preset-vite 2.9.5, preact 10.25.4
- tailwindcss 3.4.17, autoprefixer 10.4.20, postcss 8.4.49
- typescript 5.7.2, vite-plugin-pwa 0.21.2, workbox-window 7.3.0

**Validation:**
- `npm run typecheck` → zero errors
- `npm run build` → dist/sw.js + dist/workbox-9c191d2f.js produced; 11 entries precached
- Field & Form tokens available as `bg-primary`, `text-clay`, `bg-background`, etc.
- Path alias `@/` → `src/` active in tsconfig.json + vite.config.ts
- PWA manifest produced at dist/manifest.webmanifest with correct name, theme_color (#1B4332), and 3 SVG icons

**Icon note:**
SVG placeholder icons in public/ (icon-192.svg, icon-512.svg, apple-touch-icon.svg). Replace with rasterized PNG before release (T-040 or a T-001b follow-up). SVGs satisfy the manifest acceptance criteria but iOS add-to-home-screen benefits from a PNG apple-touch-icon.

**PWA workbox strategy:**
- All static assets (js, css, html, svg, fonts) are precached — CacheFirst effectively
- Navigation falls back to /index.html offline (navigateFallback)
- registerType: autoUpdate — service worker replaces itself on new build
