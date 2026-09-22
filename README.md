# Evolve

A scroll-driven landing page about how birds evolved from dinosaurs.

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: type-check and build
- `npm run icons`: redraw the home-screen PNGs from `src/assets/icon.svg`
- `npm run lint`: lint with oxlint
- `npm test`: run unit tests (Vitest)

## Stack

- React 19, TypeScript and Vite 8
- GSAP 3.15 with ScrollTrigger, plus Lenis for smooth scrolling
- Archivo (variable width) and IBM Plex Mono, self-hosted through Fontsource

## PWA

Installable, and offline after a first visit. `vite-plugin-pwa` precaches the ~780 KB shell
(code, CSS, fonts, icons) and leaves the ~17 MB of chapter photography to a `CacheFirst`
runtime cache, so each chapter goes offline once you have scrolled past it. Updates apply
silently on the next visit.

The home-screen icons are generated, not hand-exported: edit `src/assets/icon.svg`, run
`npm run icons`, and commit the PNGs in `public/icons/`.

## Design docs

- Specs: `docs/superpowers/specs/`
- Plans: `docs/superpowers/plans/`
