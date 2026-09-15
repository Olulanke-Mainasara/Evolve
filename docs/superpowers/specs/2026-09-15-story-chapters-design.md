# Story chapters: design

**Status:** built 2026-09-15, awaiting the user's browser check · sub-project 2 of 2 (sub-project 1 is the hero: `2026-09-14-hero-pupil-dive-design.md`)
**Plan:** `../plans/2026-09-15-story-chapters.md`

## What

Seven scroll chapters after the hero's pupil dive that show birds are living dinosaurs, then a footer. UI-only (no backend). Stack as the hero: React + Vite, vanilla CSS with tokens, GSAP + ScrollTrigger via `useGSAP`, Lenis.

**All copy, labels, counter values, photo credits and sources are final and live in [`src/content/chapters.ts`](../../../src/content/chapters.ts).** Don't restate or rewrite copy elsewhere. Chapters must stay in time order, because the counter only counts down.

## Visual system

- **Grounds:** chapters sit on the theme ground (Day: bone with ink type, Night: ink with bone type). Chapters with `ground: 'black'` (01, and the impact beat of 06) are pure `--void` with bone type in both themes. The theme toggle must keep working mid-page.
- **Accent:** one flat orange sampled from the hero photo's iris, used only for counter digits and the bird branch of the tree. No gradients, no glassmorphism, no all-caps eyebrows (see `~/.claude/CLAUDE.md`).
- **Type:** Archivo Variable (heavy, wide) for headlines, IBM Plex Mono for everything else. Sentence case.
- **Chapter layout:** 12-column grid using `--gutter-x`. A 1px rule, then a mono label row: number (left), place (centre), period (right). Headline in cols 1–9, lede in cols 7–11 (~38ch), photos full-bleed or spanning columns, small mono captions. Asymmetric, nothing centred. One column on phones.
- **Counter:** fixed bottom-right (bottom-left on phones): large orange number + "million years ago" in small mono. Appears after the dive, ticks between chapter values, hides at the footer.

## Chapters

| # | Scroll | Layout and motion |
|---|---|---|
| 01 | flows · black | Continues the pupil's black with no seam. Rule draws, headline lines rise, lede fades. Counter appears at 230. Ground shifts to theme as 02 arrives. |
| 02 | **pinned** | Headline top-left; cladogram SVG across the lower two-thirds draws with scroll. Dinosaurs split into Stegosaurus's far branch and theropods, then T. rex and Velociraptor, ending in birds (orange). Mono tip labels, fact-checked. Counter 230 → 150. Lede lands when the bird branch completes. |
| 03 | **pinned** | Slab photo right, text left. Text fades out, then the photo zooms from the whole slab into the wing and dissolves to `archaeopteryx-wing` (shot at a different angle, so a dissolve rather than a match) so it stays sharp. Caption at the end. |
| 04 | flows | Layered: tall tail close-up in the right columns, framed holotype overlapping its lower-left edge. Different parallax speeds. Never shown larger than native resolution (both are under 1,500 px). |
| 05 | flows | Headline large, three exhibits scattered around it (no grid): Mei long upper-right, Citipati lower-left, T. rex as a type-only exhibit in a rule frame. Photos drift at different speeds; counter 125 → 68. |
| 06 | **pinned** · black | Hard cut to black. The corner counter hides; a separate full-size "66" fades in, orange. Headline and lede, then the boundary photo slides up full-bleed (transform-only mask). Then the `aftermath` beat fades back to the theme ground, text only. |
| 07 | flows | Tall cassowary photo in cols 1–6, text on the right; counter lands on 0. Pigeon photo full-bleed, then the `closing` line set huge across 3–4 lines, fitted to width; lines rise in. |
| Footer | flows | Huge edge-to-edge EVOLVE wordmark with the eye as the O (static, reuse `drawEye`), then sources and photo credits in two mono columns, generated from `chapters.ts`. |

## Rules

- **Performance (from the hero's zoom-flicker fix):** never scale large text; animate only `transform` and `opacity`; only bitmaps zoom, and deep zooms swap to a higher-resolution crop. Hide off-screen blurred or filtered layers.
- **Reduced motion:** no pins or scrubs; sections fade in; the counter shows a static value per chapter.
- **Phones:** keep the pins with shorter scroll distances; stack the grid.
- **Nav:** `data-on` is `void` over black grounds and `ground` otherwise.
- **Credits:** every photo shows its credit, licence and a "cropped" note in the footer. CC BY-SA crops stay CC BY-SA.
- **Packages:** check current docs before using any GSAP plugin (e.g. SplitText) or new API.
- **No tests** for this sub-project (user decision).

## Architecture

- `src/content/chapters.ts`: data (exists). `src/content/images.ts`: resolves `Photo.file` to the AVIF/WebP URLs in `src/assets/chapters/`.
- `src/components/Chapter/`: `ChapterHeader` (rule + label row), `ChapterText` (headline + lede reveal), `Photo` (`<picture>` with lazy loading, caption).
- One folder per chapter: `Origins`, `FamilyTree`, `Archaeopteryx`, `Feathers`, `Habits`, `Impact`, `StillHere`, plus `Footer`, rendered in order in `App.tsx`. Each uses `Chapter/useChapter` (reveals, counter, ground, reduced-motion branch); pinned ones pass `tick: false` / `ground: false` and drive those in their own timeline.
- `Backdrop` + `lib/ground.ts`: a fixed layer painted with `--ground`, with a black child whose opacity is scrubbed at black-ground boundaries (composited). Chapters tween the exported `ground` object, so mount order doesn't matter; ScrollTrigger updates set nav and counter `data-on`. `chapterScroll.ts` wires each chapter's counter ticks and ground change from `chapters.ts`.
- `Counter` component plus `src/lib/counter.ts` controller (module-level, like `lib/smoothScroll.ts`): `show`, `hide`, `set`, and a scroll-driven tick from/to.
- Images: originals from the Commons links in `chapters.ts`, converted with sharp installed outside the repo (as the hero photo was) to AVIF + WebP at two widths capped at native size. Crops are applied at conversion time.
