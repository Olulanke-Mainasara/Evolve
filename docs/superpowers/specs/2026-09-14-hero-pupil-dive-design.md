# Evolve — hero intro and pupil dive

**Date:** 2026-09-14
**Scope:** Sub-project 1 of 2. This covers the hero section's intro animation, the scroll-driven zoom into the pupil, light/dark theming, and removing the Vite template. Sub-project 2 (the dinosaurs-to-birds story chapters with parallax) gets its own design round later.
**Mode:** UI-only. No backend.

## Context

Evolve is a landing page about how birds evolved from dinosaurs. It will lean heavily on scroll animation. The hero is the first thing on the page, and it plays an intro animation (there is no separate splash screen). The page cannot scroll while the intro plays. Once it finishes, scrolling zooms into the pupil of the eye photo until the pupil's black fills the screen, and the story starts on that black.

The starting point is the stock Vite 8 + React 19 + TypeScript template. The hero photo is `src/assets/eye.png` (1537×1023), a macro shot of a bird's eye with an orange iris, red skin and cream feathers.

## Decisions

| Topic | Decision |
|---|---|
| Splash vs hero | The hero is the animation. No separate splash. |
| Photo vs O size | The photo shows only inside the O, sized to fit it exactly, then expands to cover the hero. In the end state the pupil stays centered in the O and the iris is larger than the O. |
| Animation stack | GSAP 3.15 + ScrollTrigger, `@gsap/react` 2.1 (`useGSAP`), Lenis 1.3 for smooth native scroll |
| Display type | Archivo variable, `font-stretch: 125%`, weight 900 |
| Secondary type | Instrument Serif, regular and italic |
| Light sweep | Soft band confined to the letters. This is the only gradient on the page, used as a mask and not as a color fill. |
| Dark mode over photo | The photo is identical in both themes. The letters turn ink as the photo passes under them. |
| Tests | Vitest unit tests for `geometry.ts` only |
| Favicon | Custom SVG mark: an almond eye outline with a three-toed theropod/bird track as the pupil |
| Execution | Built directly in this session. No subagent pipeline. |

## Visual system

### Color tokens (flat, no gradients except the sweep mask)

| Token | Light | Dark |
|---|---|---|
| `--ground` (hero before reveal) | `#EDE8DD` bone | `#0E0D0B` ink |
| `--fg` (word, eye strokes, UI before reveal) | `#0E0D0B` ink | `#EDE8DD` bone |
| `--ink` (text over the photo, both themes) | `#0E0D0B` | `#0E0D0B` |
| `--bone` (text over black, both themes) | `#EDE8DD` | `#EDE8DD` |
| `--void` (pupil and story start, both themes) | `#000000` | `#000000` |
| `--light` (sweep core) | `#FFFFFF` | `#FFFFFF` |

### Type

- **Hero word "EVOLVE":** Archivo 900 at 125% width, uppercase (a deliberate wordmark moment), tight tracking. It is sized to span about 88vw, with its cap height capped at about 30svh on short, wide screens.
- **Nav name "Evolve", tagline and scroll prompt:** Instrument Serif. The tagline is italic. Sentence case, and no eyebrow labels.
- **Fonts:** self-hosted through `@fontsource-variable/archivo` and `@fontsource/instrument-serif`.

### Eye icon (the O before the photo appears)

- **Drawing:** hand-drawn SVG. Its stroke weight matches the letter stems at the rendered size.
- **Closed state:** a downward-curving lid line with five short lashes.
- **Open state:** the upper lid lifts into an almond with a matching lower lid. The lashes rotate with the upper lid.
- **O slot:** an inline box between "EV" and "LVE". Its width is the almond's width (aspect ratio about 1.6:1) and its height is the cap height, so the word lays out naturally.

### Copy (placeholders)

- **Tagline:** *Birds never stopped being dinosaurs.*
- **Scroll prompt:** *Scroll to look closer*
- **Nav:** "Evolve" (text, left) and the theme toggle "Light / Dark" (right). Chapter links arrive with sub-project 2.

## Hero structure

```
<Nav>                         fixed; color follows what is behind it
<section.hero>                100svh, overflow hidden, pinned by ScrollTrigger
  <div.stage>                 the dive transform (scale around the pupil) applies here
                              children listed bottom layer → top layer
    <h1>                      accessible name "Evolve"; visual layers are aria-hidden
      .word--base             letters in --fg, with the O slot empty
      .word--light            white copy of the letters and closed eye; mask = moving soft band
    <div.reveal>              clip-path: almond path (computed per frame)
      <picture> eye photo     transform computed by geometry.ts
      .word--ink              ink copy of the letters, exactly aligned with .word--base
    <EyeIcon>                 in the O slot, above .reveal so its strokes show over the photo until they fade
    <div.pupil-cover>         solid --void circle aligned with the photo's pupil, opacity 0
  <p.tagline>, <p.scroll-cue> outside .stage; fade in at the end of the intro, fade out at dive start
<ChapterStub>                 --void section, "Chapter 1" placeholder fades in
```

- **Why `.word--ink` sits inside `.reveal`:** it shares the photo's clip, so each letter turns ink exactly as the expanding photo passes under it. In light mode this is invisible, because `--fg` is already ink.

## Geometry (`src/components/Hero/geometry.ts`)

These are pure functions with no DOM access, which is what makes them unit-testable.

**Photo constants:** measured from the source image and calibrated during implementation against a crop of the image:
- natural size (1537×1023)
- pupil center (about 44%, 48%)
- pupil radius
- the eyelid opening's bounding box

**Functions:**
- `fitToSlot(almond, photo)` returns the photo scale and translation that put the pupil on the almond's center, with iris height equal to almond height.
- `coverAnchored(viewport, anchorPoint, photo)` returns the smallest scale where the photo covers the viewport with its pupil pinned at `anchorPoint` (the O slot's center). That scale is `max(ax / (px·w), (W−ax) / ((1−px)·w), ay / (py·h), (H−ay) / ((1−py)·h))`, with the translation derived from it.
- `almondPath(center, width, height, openness)` returns the SVG path string for both the icon's opening and the reveal clip. Openness 0 is a flat line and 1 is fully open.
- `almondCoverScale(viewport, center, almond)` returns the scale at which the almond clip contains all four viewport corners.
- `diveEndScale(viewport, pupilCenterPx, pupilRadiusPx)` returns the scale at which the pupil circle's radius reaches the farthest viewport corner.
- `logLerp(a, b, t)` interpolates scale in log space, so the zoom has a constant perceived speed.

## Intro timeline (`useIntroTimeline.ts`)

**Preconditions:**
- `document.fonts.load` has resolved for both faces and the photo's `img.decode()` has resolved.
- Until then the hero shows only `--ground`.
- If assets take longer than 4s, the timeline starts anyway.

| t (s) | Step |
|---|---|
| 0.0–0.3 | Word and closed eye fade in |
| 0.3–0.8 | Hold |
| 0.8–1.4 | Soft light band sweeps left to right across `.word--light` (mask-position), ease `power2.inOut` |
| 1.3–1.75 | Eye opens: lid path openness 0→1, lashes rotate, `.reveal` clip opens with the same almond. Ease `power3.out`. The photo is sized with `fitToSlot`, so nothing of it is visible while the eye is closed. |
| 1.75–2.0 | Eye icon strokes fade out |
| 2.0–2.4 | Hold on the eye-as-O |
| 2.4–3.2 | Grow: the photo scales from the fit transform to the `coverAnchored` transform (`power3.inOut`), and the almond clip scales with it so the lids stay on the real eye. The pupil stays on the O center throughout. |
| 3.2–3.7 | Burst: the almond clip opens out to `almondCoverScale` (`power2.in`), revealing the rest of the photo, which already covers the hero. |
| 3.2–3.9 | Nav, tagline and scroll prompt fade and rise in, staggered |
| ~3.9 | Unlock scrolling, then create the dive ScrollTrigger |

**Scroll lock during the intro:**
- set `history.scrollRestoration = 'manual'` and call `scrollTo(0, 0)` on load
- call `lenis.stop()`
- add `html.is-locked { overflow: hidden }` to block touch and keyboard scrolling

**Resize during the intro:** jump the timeline to its end, then recompute the end-state geometry.

**Resize after the intro:** recompute `coverAnchored` and the dive values (`invalidateOnRefresh`).

## Pupil dive (`usePupilDive.ts`)

**Setup:**
- ScrollTrigger on `.hero`: `pin: true`, `start: 'top top'`, `end: '+=150%'`, smoothed scrub.
- A scroll-linked timeline, reversible by scrolling back up. The intro never replays.

**Timeline:**
- **0–15%:** tagline and scroll prompt fade out.
- **Zoom (0–100%):** `.stage` scales from 1 to `diveEndScale` around the pupil's screen position, using `logLerp` with an ease-in so it accelerates into the pupil. The letters scale with the stage and leave the screen past its edges.
- **66–100%:** `.pupil-cover` opacity goes from 0 to 1, so the final frames are crisp black rather than an upscaled, blurry pupil and its reflection.
- **100%:** the screen is fully `--void`. The pin releases and `ChapterStub` (already `--void`) continues without a seam.

**Nav color:**
- `data-on="photo"` (ink) while over the hero photo.
- `data-on="void"` (bone) once the dive passes the black point and throughout the chapter stub.
- This follows the backdrop, not the theme.

**Mobile:**
- native touch scrolling; Lenis `syncTouch` stays off
- `ScrollTrigger.config({ ignoreMobileResize: true })`
- `svh` units

## Theme (`src/lib/theme.ts`)

**Resolution:** a saved choice in `localStorage` wins; otherwise `prefers-color-scheme` decides. The result sets `data-theme` on `<html>`.

**No flash:** a small inline script in `index.html` sets `data-theme` before first paint.

**Toggle:**
- a `<button>` with `aria-pressed`, in the nav
- it saves the choice and reacts to system changes while no choice is saved
- `localStorage` access is wrapped in try/catch

**Scope in the hero:** after the reveal, the hero looks the same in both themes. This is accepted as a known consequence of choosing to keep the photo identical.

## Reduced motion and failure paths

- **`prefers-reduced-motion: reduce`** (via `gsap.matchMedia`):
  - The hero cross-fades straight to the end state: photo covering, pupil in the O, no icon, no sweep.
  - Scrolling is not locked.
  - The dive is replaced by a scroll-linked cross-fade from the hero to `--void`.
- **Photo fails to load or decode:** the eye icon opens and stays drawn, the hero stays on `--ground`, and the dive uses the same cross-fade to `--void`.
- **Fonts time out (4s):** the intro proceeds with fallback metrics and geometry is re-measured on `document.fonts.ready`.

## Assets

- **Photo formats:** convert `eye.png` once to `eye.avif` and `eye.webp` at full 1537px resolution, and serve them through `<picture>`. The original PNG stays in the repo but is not imported, so it is not bundled.
- **Higher-resolution photo (optional):** a version at least 3000px wide would sharpen large and high-density screens and the zoom. Swapping it in means replacing the files and updating the photo constants.
- **Favicon:** `public/favicon.svg`, the eye-and-track mark. Its stroke color flips with a `prefers-color-scheme` media query inside the SVG.

## Template removal

- **Delete:** `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`, `public/icons.svg`, the Vite `public/favicon.svg` (replaced by the new mark), and `src/App.css`.
- **Replace:** the template contents of `src/index.css`, `src/App.tsx` and `README.md`.

## File layout

```
index.html                         theme script, favicon, title
public/favicon.svg                 eye + track mark
src/main.tsx                       fonts, global CSS, render
src/App.tsx                        Nav, Hero, ChapterStub; scroll setup
src/styles/tokens.css              color + type tokens, theme blocks
src/styles/global.css              reset, base, html.is-locked
src/lib/theme.ts                   theme resolve/persist/toggle
src/lib/smoothScroll.ts            Lenis + GSAP ticker wiring, lock/unlock
src/components/Nav/Nav.tsx (+css)
src/components/Hero/Hero.tsx (+Hero.css)
src/components/Hero/EyeIcon.tsx
src/components/Hero/geometry.ts
src/components/Hero/geometry.test.ts
src/components/Hero/useIntroTimeline.ts
src/components/Hero/usePupilDive.ts
src/components/ChapterStub.tsx
src/assets/eye.avif, eye.webp      (eye.png kept, not imported)
```

## Verification

- `npm run build` (runs `tsc -b` and `vite build`) passes.
- `npm run lint` (oxlint) passes.
- `geometry.test.ts` passes under Vitest.
- There is no automated browser scan. The user reviews the page in their own browser.

## Out of scope

- Story chapters, parallax sections, chapter navigation and their content and imagery (sub-project 2)
- Sourcing a higher-resolution photo
- Deployment

## Planning revisions (2026-09-14)

1. **Photo fit:** the pupil sits at the almond's center and the iris height equals the almond height. Matching the eyelid opening instead would be unreliable, because the photo's eyelid is tilted about 15°.
2. **Expansion runs in two phases:**
   - *Grow* (2.4–3.2s, `power3.inOut`): the photo scales from its fit size to cover size, and the clip tracks the eye exactly.
   - *Burst* (3.2–3.7s, `power2.in`): the clip opens out to cover the viewport.
   - A single combined tween would let the clip outrun the photo and expose its rectangular edges.
3. **Resize during the intro:** the geometry is re-measured and the current frame redrawn (every frame is drawn from proxy state). The timeline does not jump to its end.
4. **Files:**
   - The two animations are plain functions (`introTimeline.ts`, `pupilDive.ts`) orchestrated by `Hero.tsx`, not hooks. Their ordering depends on async asset loading.
   - Added: `layout.ts` (DOM measurement), `drawEye.ts`, `photo.ts`, `lib/gsap.ts`, `lib/useTheme.ts`, `ChapterStub.css`, `Nav.css`.
5. **Theme control:** two buttons, "Light" and "Dark", each with `aria-pressed`, inside a labelled group. This keeps each accessible name identical to its visible text.
6. **`.hero__void`:** a full-screen black cover used by the fade dive (reduced motion or a failed photo).
