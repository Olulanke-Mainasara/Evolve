# Story chapters: plan

**Spec:** `../specs/2026-09-15-story-chapters-design.md` · **Branch:** `feature/story-chapters` · **Content:** `src/content/chapters.ts`

Work directly (no subagent review pipeline), no tests. Before each commit, run `npx tsc -b && npm run lint && npm run build`. Commit at the end of each phase; the user checks each phase in the browser (don't run browser scans unless asked). Tick boxes as you go.

## Phase 1: Foundation

- [x] Content file `src/content/chapters.ts` (copy, credits, sources)
- [x] Images: download originals, crop `sinosauropteryx-tail` to panel B (drop panel letters and scale bars), convert to AVIF + WebP at two widths into `src/assets/chapters/`; add `src/content/images.ts`
- [x] Sample the iris orange from `src/assets/eye.png`; add `--amber`, `--rust`, `--accent` to `tokens.css` (hairlines use `currentColor` at 30%)
- [x] `Backdrop` + `lib/ground.ts` (ground + scrubbed black layer + nav/counter `data-on`); delete `ChapterStub`
- [x] `Counter` + `lib/counter.ts` (show, hide, set, tick; tabular digits; bottom-left on phones)
- [x] Shared `ChapterHeader`, `ChapterText`, `Photo`, `reveal.ts` (SplitText lines, autoSplit), `chapterScroll.ts` (counter ticks + ground changes per chapter)
- [x] Interim `ChapterSection` renders every chapter plainly from data; removed in Phase 3 once every chapter had its own component. Chapters share `useChapter` (reveals, counter, ground, reduced-motion branch) and `scrubY` for parallax
- [x] `Footer`: eye-O wordmark (reuse `drawEye`/geometry), sources and credits generated from `chapters.ts`
- [x] Commit

## Phase 2: Flowing chapters

- [x] `Origins` (01, black): title card; fades out over the same range the ground lifts into 02 (the ground change itself lives in `chapterScroll` for the entering chapter)
- [x] `Feathers` (04): layered photos with two parallax speeds
- [x] `Habits` (05): scattered exhibits, type-only T. rex exhibit, counter 125 → 68
- [x] `StillHere` (07): cassowary split, full-bleed pigeon (both pan inside their frames), closing split into 4 balanced lines (`closingLines.ts`) and fitted to width
- [x] Commit

## Phase 3: Set pieces (pinned)

- [x] `FamilyTree` (02): labels fact-checked (Paraves); lines are CSS bars scaled from their nodes (transform-only, crisp at any size); bird lineage in accent; counter 230 → 150 inside the pin timeline; lede after birds
- [x] `Archaeopteryx` (03): text out, the photo-only frame zooms into the right wing (`WING` fractions), dissolve to `archaeopteryx-wing` (shot ~23° apart, so not a pixel match), caption
- [x] `Impact` (06): hard cut to black at mid-screen (`toggleGround` with duration 0), corner counter hands over to a full-size 66, boundary photo rises in a counter-moving mask, `aftermath` scrubs back to the theme ground
- [x] Pins refresh in page order: chapters create triggers top to bottom at mount; the hero (created later) keeps `refreshPriority: 1` (higher refreshes first, per the docs)
- [x] Commit

## Phase 4: Finish

- [ ] Reduced motion: no pins or scrubs, fades only, static counter values
- [ ] Phones (~390 px): stacked grid, shorter pin distances, counter bottom-left
- [ ] Performance: no large text scaling, no filters on scaled layers; confirm smooth scroll in Chrome with the user
- [x] Replace the Discovery source in chapter 02 with museum pages (NHM Stegosaurus, Australian Museum T. rex)
- [ ] Commit; update the spec's status line if anything changed
