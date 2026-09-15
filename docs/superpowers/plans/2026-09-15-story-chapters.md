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
- [x] Interim `ChapterSection` renders every chapter plainly from data; each bespoke component below replaces it for its chapter in `App.tsx`
- [x] `Footer`: eye-O wordmark (reuse `drawEye`/geometry), sources and credits generated from `chapters.ts`
- [x] Commit

## Phase 2: Flowing chapters

- [ ] `Origins` (01, black): reveal sequence, counter appears, black → theme handoff into 02
- [ ] `Feathers` (04): layered photos with two parallax speeds
- [ ] `Habits` (05): scattered exhibits, type-only T. rex exhibit, counter 125 → 68
- [ ] `StillHere` (07): cassowary split, full-bleed pigeon, width-fitted closing lines, counter 0, counter hides at footer
- [ ] Commit

## Phase 3: Set pieces (pinned)

- [ ] `FamilyTree` (02): fact-check tip labels first; SVG stroke draw scrubbed, bird branch in accent, counter 230 → 150, lede after birds
- [ ] `Archaeopteryx` (03): text out, zoom the slab `<img>` into the wing, crossfade to `archaeopteryx-wing`, caption
- [ ] `Impact` (06): hard cut to black, full-size "66" fade (don't scale the counter), boundary photo slide-up (transform mask), `aftermath` beat back to theme ground
- [ ] Set `refreshPriority` so pins refresh in page order (the hero already uses 1)
- [ ] Commit

## Phase 4: Finish

- [ ] Reduced motion: no pins or scrubs, fades only, static counter values
- [ ] Phones (~390 px): stacked grid, shorter pin distances, counter bottom-left
- [ ] Performance: no large text scaling, no filters on scaled layers; confirm smooth scroll in Chrome with the user
- [ ] Replace the Discovery source in chapter 02 with a museum page
- [ ] Commit; update the spec's status line if anything changed
