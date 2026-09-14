# Evolve hero intro and pupil dive: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The user chose inline execution. Each code block preceded by a `<!-- file: path -->` marker is the complete content of that file.

**Goal:** Build the Evolve hero with these pieces:
- The EVOLVE intro: closed eye as the O, light sweep, eye opens, the photo appears in the O and expands to fill the hero
- A scroll-scrubbed zoom into the pupil that hands off to a black chapter placeholder
- Light and dark themes

**Architecture:**
- Pure geometry functions (unit-tested) compute every size and position from DOM measurements.
- The hero DOM is a stack of absolutely positioned layers inside a `.stage`.
- Motion comes from one GSAP timeline (the intro) and one pinned, scrubbed ScrollTrigger timeline (the dive).
- Both timelines draw from proxy state objects, so a resize only needs a re-measure and a redraw.
- Lenis provides smooth native scroll and is stopped during the intro.

**Tech stack:** React 19, TypeScript 6, Vite 8, GSAP 3.15.0 (ScrollTrigger), `@gsap/react` 2.1.2, Lenis 1.3.26, Fontsource (`@fontsource-variable/archivo` 5.3.0, `@fontsource/instrument-serif` 5.3.0), Vitest 5.0.0, oxlint.

**Spec:** `docs/superpowers/specs/2026-09-14-hero-pupil-dive-design.md`

## Global constraints

- **Gradients:** no gradients anywhere except the sweep's `mask-image` on `.hero__layer--light`. No glassmorphism.
- **Colors:**
  - Theme tokens: `--bone #EDE8DD`, `--ink #0E0D0B`, `--void #000000`, `--light #FFFFFF`.
  - Light theme: `--ground` is bone and `--fg` is ink. Dark theme: `--ground` is ink and `--fg` is bone.
  - Fixed text colors: over the photo, text is always `--ink`. Over black, text is always `--bone`.
- **Type:** the hero word is Archivo 900 at `font-stretch: 125%`, family `'Archivo Variable'`. The UI uses `'Instrument Serif'`. Sentence case everywhere except the EVOLVE wordmark. No eyebrow labels.
- **Copy:** tagline *Birds never stopped being dinosaurs.*, scroll prompt *Scroll to look closer*, nav name "Evolve", theme control "Light / Dark".
- **Scroll:** the page cannot scroll during the intro. Reloads start at the top.
- **Reduced motion:** no sweep, expansion or zoom, and no scroll lock.
- **GSAP:** import `gsap`, `ScrollTrigger` and `useGSAP` only from `src/lib/gsap.ts`, which registers the plugins.
- **TypeScript:** `verbatimModuleSyntax` is on, so type-only imports use `import type` or inline `type`. `erasableSyntaxOnly` is on, so no enums and no parameter properties.
- **Checks:** `npm run build`, `npm run lint` and `npm test` must pass at the end of every task.
- **No automated browser scans.** The user checks visuals in their browser.

## Planning revisions to the spec

These are recorded in the spec in Task 1.

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

---

### Task 1: Project setup and template removal

**Files:**
- Create: `src/lib/gsap.ts`, `src/styles/tokens.css`, `src/styles/global.css`, `src/assets/eye.avif`, `src/assets/eye.webp` (generated)
- Modify: `package.json` (dependencies and a `test` script), `index.html`, `src/main.tsx`, `src/App.tsx`, `README.md`, `public/favicon.svg`, `docs/superpowers/specs/2026-09-14-hero-pupil-dive-design.md`
- Delete: `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`, `public/icons.svg`, `src/App.css`, `src/index.css`

**Interfaces:**
- **Produces:**
  - `src/lib/gsap.ts` exports `{ gsap, ScrollTrigger, useGSAP }`.
  - CSS tokens: `--bone`, `--ink`, `--void`, `--light`, `--ground`, `--fg`, `--font-display`, `--font-serif`.
  - `.sr-only` class and the `html.is-locked` rule.
  - `index.html` sets `html[data-theme]` before paint, using storage key `evolve-theme`.

- [ ] **Step 1: Install dependencies**

```bash
npm install gsap@3.15.0 @gsap/react@2.1.2 lenis@1.3.26 @fontsource-variable/archivo@5.3.0 @fontsource/instrument-serif@5.3.0
npm install -D vitest@5.0.0
npm pkg set scripts.test="vitest run"
```

- [ ] **Step 2: Delete template files**

```bash
rm src/assets/hero.png src/assets/react.svg src/assets/vite.svg public/icons.svg src/App.css src/index.css
```

- [ ] **Step 3: Generate compressed photos.** Use sharp installed outside the repo, so it is not added as a dependency.

<!-- file: scratch/convert-eye.mjs -->
```js
import sharp from 'sharp'

const [src, outDir] = process.argv.slice(2)
await sharp(src).avif({ quality: 62, effort: 6 }).toFile(`${outDir}/eye.avif`)
await sharp(src).webp({ quality: 84 }).toFile(`${outDir}/eye.webp`)
console.log('converted')
```

Run it from the scratch directory where `sharp@0.35.4` is installed:
`node convert-eye.mjs <repo>/src/assets/eye.png <repo>/src/assets`.
Expected output: `converted`. Both files exist and are far smaller than 3.4MB.

- [ ] **Step 4: Write the GSAP registration module**

<!-- file: src/lib/gsap.ts -->
```ts
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export { gsap, ScrollTrigger, useGSAP }
```

- [ ] **Step 5: Write the tokens and global styles**

<!-- file: src/styles/tokens.css -->
```css
:root {
  --bone: #ede8dd;
  --ink: #0e0d0b;
  --void: #000000;
  --light: #ffffff;

  --ground: var(--bone);
  --fg: var(--ink);

  --font-display: 'Archivo Variable', 'Arial Black', system-ui, sans-serif;
  --font-serif: 'Instrument Serif', Georgia, 'Times New Roman', serif;

  color-scheme: light;
}

/* Fallback when the inline theme script could not run */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --ground: var(--ink);
    --fg: var(--bone);
    color-scheme: dark;
  }
}

:root[data-theme='dark'] {
  --ground: var(--ink);
  --fg: var(--bone);
  color-scheme: dark;
}
```

<!-- file: src/styles/global.css -->
```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
}

body {
  background: var(--ground);
  color: var(--fg);
  font-family: var(--font-serif);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

html.is-locked,
html.is-locked body {
  overflow: hidden;
}

img {
  display: block;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 6: Write the entry files**

<!-- file: index.html -->
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="How birds evolved from dinosaurs." />
    <title>Evolve</title>
    <script>
      ;(function () {
        var theme
        try {
          theme = localStorage.getItem('evolve-theme')
        } catch (error) {}
        if (theme !== 'light' && theme !== 'dark') {
          theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        document.documentElement.dataset.theme = theme
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
      })()
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

<!-- file: src/main.tsx -->
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import 'lenis/dist/lenis.css'
import './styles/tokens.css'
import './styles/global.css'
import App from './App.tsx'

window.scrollTo(0, 0)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

<!-- file: src/App.tsx -->
```tsx
export default function App() {
  return <main />
}
```

- [ ] **Step 7: Write the favicon.** It combines an almond eye with a three-toed track as the pupil.

<!-- file: public/favicon.svg -->
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <style>
    .mark { stroke: #0e0d0b; }
    @media (prefers-color-scheme: dark) { .mark { stroke: #ede8dd; } }
  </style>
  <g class="mark" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 32C15 13 49 13 60 32C49 51 15 51 4 32Z" />
    <path d="M32 42V22M32 42L23.5 26.5M32 42L40.5 26.5" />
  </g>
</svg>
```

- [ ] **Step 8: Replace the README**

<!-- file: README.md -->
```md
# Evolve

A scroll-driven landing page about how birds evolved from dinosaurs.

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: type-check and build
- `npm run lint`: lint with oxlint
- `npm test`: run unit tests (Vitest)

## Stack

- React 19, TypeScript and Vite 8
- GSAP 3.15 with ScrollTrigger, plus Lenis for smooth scrolling
- Archivo (variable width) and Instrument Serif, self-hosted through Fontsource

## Design docs

- Specs: `docs/superpowers/specs/`
- Plans: `docs/superpowers/plans/`
```

- [ ] **Step 9: Append planning revisions to the spec.** Copy the "Planning revisions to the spec" list above into a new `## Planning revisions (2026-09-14)` section at the end of the spec. Then update these spec lines:
  - the `fitToSlot` bullet, to say "puts the pupil on the almond center with iris height = almond height"
  - the 2.4–3.6 timeline row, to describe the grow (2.4–3.2) and burst (3.2–3.7) phases

- [ ] **Step 10: Verify**

Run: `npm run build && npm run lint`
Expected: both succeed. The build output lists no `hero.png`, `react.svg` or `vite.svg`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "Set up Evolve: animation deps, fonts, tokens, favicon; remove Vite template"
```

---

### Task 2: Geometry (test-driven) and photo constants

**Files:**
- Create: `src/components/Hero/geometry.ts`, `src/components/Hero/photo.ts`
- Test: `src/components/Hero/geometry.test.ts`

**Interfaces:**
- **Produces (types):** `Point`, `Size`, `Almond {cx, cy, width, height}`, `PhotoTransform {x, y, scale}`, `PhotoMetrics`, `Lash`.
- **Produces (constants and helpers):** `CLOSED_SAG`, `LASH_COUNT`, `lerp`, `logLerp`.
- **Produces (functions):**
  - `fitWordFontSize(viewport, widthPer100px, capPer100px, widthRatio?, maxCapRatio?)`
  - `anchoredAt(anchor, photo, scale)`
  - `fitToSlot(almond, photo)`
  - `coverAnchored(viewport, anchor, photo)`
  - `scaleAlmond(almond, factor)`
  - `lidControls(height, openness)`
  - `lidPaths(almond, openness)` returns `{upper, lower, clip}`
  - `almondPath(almond, openness)`
  - `almondHalfHeightAt(almond, dx)`
  - `almondCoverScale(viewport, almond)`
  - `diveEndScale(viewport, pupil, radius)`
  - `lashes(almond, openness, length)`
- **Produces (photo):** `PHOTO` from `photo.ts`, with shape `PhotoMetrics & {avif, webp}`.

- [ ] **Step 1: Write the failing tests**

<!-- file: src/components/Hero/geometry.test.ts -->
```ts
import { describe, expect, it } from 'vitest'
import {
  almondCoverScale,
  almondHalfHeightAt,
  almondPath,
  anchoredAt,
  CLOSED_SAG,
  coverAnchored,
  diveEndScale,
  fitToSlot,
  fitWordFontSize,
  lashes,
  LASH_COUNT,
  lidControls,
  logLerp,
  scaleAlmond,
  type Almond,
  type PhotoMetrics,
} from './geometry'

const photo: PhotoMetrics = {
  width: 1537,
  height: 1023,
  pupil: { x: 676, y: 486, r: 98 },
  iris: { rx: 237, ry: 202 },
}
const almond: Almond = { cx: 600, cy: 400, width: 210, height: 140 }

describe('fitWordFontSize', () => {
  it('fits the word to the viewport width', () => {
    expect(fitWordFontSize({ width: 1440, height: 900 }, 400, 72)).toBeCloseTo(316.8)
  })

  it('caps the size on short, wide viewports', () => {
    expect(fitWordFontSize({ width: 1440, height: 500 }, 400, 72)).toBeCloseTo(208.33, 1)
  })
})

describe('photo placement', () => {
  it('anchoredAt puts the pupil on the anchor', () => {
    const t = anchoredAt({ x: 300, y: 200 }, photo, 0.5)
    expect(t.x + photo.pupil.x * t.scale).toBeCloseTo(300)
    expect(t.y + photo.pupil.y * t.scale).toBeCloseTo(200)
  })

  it('fitToSlot centers the pupil and matches iris height to the almond', () => {
    const t = fitToSlot(almond, photo)
    expect(photo.iris.ry * 2 * t.scale).toBeCloseTo(almond.height)
    expect(t.x + photo.pupil.x * t.scale).toBeCloseTo(almond.cx)
    expect(t.y + photo.pupil.y * t.scale).toBeCloseTo(almond.cy)
  })

  it('coverAnchored covers the viewport with the smallest scale', () => {
    const viewport = { width: 1440, height: 900 }
    const anchor = { x: 634, y: 450 }
    const t = coverAnchored(viewport, anchor, photo)
    const right = t.x + photo.width * t.scale
    const bottom = t.y + photo.height * t.scale

    expect(t.x + photo.pupil.x * t.scale).toBeCloseTo(anchor.x)
    expect(t.y + photo.pupil.y * t.scale).toBeCloseTo(anchor.y)
    expect(t.x).toBeLessThanOrEqual(1e-6)
    expect(t.y).toBeLessThanOrEqual(1e-6)
    expect(right).toBeGreaterThanOrEqual(viewport.width - 1e-6)
    expect(bottom).toBeGreaterThanOrEqual(viewport.height - 1e-6)
    const slack = Math.min(Math.abs(t.x), Math.abs(t.y), Math.abs(right - viewport.width), Math.abs(bottom - viewport.height))
    expect(slack).toBeLessThan(1e-6)
  })
})

describe('almond lids', () => {
  it('closed lids coincide and dip below the corners', () => {
    const { upper, lower } = lidControls(140, 0)
    expect(upper).toBe(lower)
    expect(upper).toBeGreaterThan(0)
  })

  it('open lids reach half the height above and below center', () => {
    const { upper, lower } = lidControls(140, 1)
    expect(upper * 0.75).toBeCloseTo(-70)
    expect(lower * 0.75).toBeCloseTo(70)
  })

  it('almondPath is a closed path starting at the left corner', () => {
    const d = almondPath(almond, 1)
    expect(d.startsWith('M495 400C')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
  })

  it('half-height is h/2 at the center, 0 at the corners, and symmetric', () => {
    expect(almondHalfHeightAt(almond, 0)).toBeCloseTo(70)
    expect(almondHalfHeightAt(almond, 105)).toBe(0)
    expect(almondHalfHeightAt(almond, -40)).toBeCloseTo(almondHalfHeightAt(almond, 40))
  })

  it('scaleAlmond keeps the center', () => {
    expect(scaleAlmond(almond, 2)).toEqual({ cx: 600, cy: 400, width: 420, height: 280 })
  })
})

describe('almondCoverScale', () => {
  it('returns the smallest scale whose almond contains every viewport corner', () => {
    const viewport = { width: 1000, height: 600 }
    const a: Almond = { cx: 500, cy: 300, width: 150, height: 100 }
    const scale = almondCoverScale(viewport, a)
    const contains = (factor: number) =>
      [
        [0, 0],
        [1000, 0],
        [0, 600],
        [1000, 600],
      ].every(([x, y]) => almondHalfHeightAt(scaleAlmond(a, factor), x - a.cx) >= Math.abs(y - a.cy))

    expect(contains(scale)).toBe(true)
    expect(contains(scale * 0.98)).toBe(false)
  })
})

describe('dive', () => {
  it('diveEndScale grows the pupil to the farthest corner', () => {
    expect(diveEndScale({ width: 1000, height: 800 }, { x: 400, y: 300 }, 50)).toBeCloseTo(Math.hypot(600, 500) / 50)
  })

  it('logLerp interpolates geometrically', () => {
    expect(logLerp(1, 16, 0)).toBe(1)
    expect(logLerp(1, 16, 1)).toBeCloseTo(16)
    expect(logLerp(1, 16, 0.5)).toBeCloseTo(4)
  })
})

describe('lashes', () => {
  it('hang down when closed and point up when open', () => {
    const closed = lashes(almond, 0, 20)
    const open = lashes(almond, 1, 20)
    expect(closed).toHaveLength(LASH_COUNT)
    closed.forEach((lash) => expect(lash.y2).toBeGreaterThan(lash.y1))
    open.forEach((lash) => expect(lash.y2).toBeLessThan(lash.y1))
  })

  it('fan outward when open', () => {
    const open = lashes(almond, 1, 20)
    expect(open[0].x2).toBeLessThan(open[0].x1)
    expect(open[LASH_COUNT - 1].x2).toBeGreaterThan(open[LASH_COUNT - 1].x1)
  })

  it('shrink to nothing where the lid is straight', () => {
    const flip = CLOSED_SAG / (1 + CLOSED_SAG)
    lashes(almond, flip, 20).forEach((lash) => {
      expect(lash.x2).toBeCloseTo(lash.x1)
      expect(lash.y2).toBeCloseTo(lash.y1)
    })
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npm test`
Expected: FAIL, because `./geometry` cannot be resolved.

- [ ] **Step 3: Implement the geometry**

<!-- file: src/components/Hero/geometry.ts -->
```ts
export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

/** An eye-shaped box: two cubic Bézier lids meeting at the left and right corners. */
export interface Almond {
  cx: number
  cy: number
  width: number
  height: number
}

/** Translation (px) and scale applied to the photo with transform-origin at its top-left. */
export interface PhotoTransform {
  x: number
  y: number
  scale: number
}

/** Pupil and iris measured in the photo's source pixels. */
export interface PhotoMetrics {
  width: number
  height: number
  pupil: { x: number; y: number; r: number }
  iris: { rx: number; ry: number }
}

export interface Lash {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** How far the closed lid dips, as a fraction of the open lid's control offset. */
export const CLOSED_SAG = 0.35
const LASH_POSITIONS = [0.18, 0.34, 0.5, 0.66, 0.82]
export const LASH_COUNT = LASH_POSITIONS.length

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Interpolates scale in log space so a zoom reads at a constant speed. */
export const logLerp = (a: number, b: number, t: number) => a * Math.pow(b / a, t)

const round = (n: number) => Math.round(n * 100) / 100

const corners = ({ width, height }: Size): Point[] => [
  { x: 0, y: 0 },
  { x: width, y: 0 },
  { x: 0, y: height },
  { x: width, y: height },
]

/** Font size (px) that spans `widthRatio` of the viewport, capped so the cap height stays within `maxCapRatio` of its height. */
export function fitWordFontSize(
  viewport: Size,
  widthPer100px: number,
  capPer100px: number,
  widthRatio = 0.88,
  maxCapRatio = 0.3,
): number {
  const byWidth = (viewport.width * widthRatio * 100) / widthPer100px
  const byHeight = (viewport.height * maxCapRatio * 100) / capPer100px
  return Math.min(byWidth, byHeight)
}

/** Photo transform that puts the pupil on `anchor` at `scale`. */
export function anchoredAt(anchor: Point, photo: PhotoMetrics, scale: number): PhotoTransform {
  return { x: anchor.x - photo.pupil.x * scale, y: anchor.y - photo.pupil.y * scale, scale }
}

/** Pupil on the almond's center, iris exactly as tall as the almond. */
export function fitToSlot(almond: Almond, photo: PhotoMetrics): PhotoTransform {
  return anchoredAt({ x: almond.cx, y: almond.cy }, photo, almond.height / (photo.iris.ry * 2))
}

/** Smallest transform that covers the viewport while the pupil stays on `anchor`. */
export function coverAnchored(viewport: Size, anchor: Point, photo: PhotoMetrics): PhotoTransform {
  const { x: px, y: py } = photo.pupil
  const scale = Math.max(
    anchor.x / px,
    (viewport.width - anchor.x) / (photo.width - px),
    anchor.y / py,
    (viewport.height - anchor.y) / (photo.height - py),
  )
  return anchoredAt(anchor, photo, scale)
}

export function scaleAlmond(almond: Almond, factor: number): Almond {
  return { ...almond, width: almond.width * factor, height: almond.height * factor }
}

/** Control-point y offsets (relative to center) for both lids. Openness 0 is a closed, dipped lid; 1 is fully open. */
export function lidControls(height: number, openness: number): { upper: number; lower: number } {
  const open = (height * 2) / 3 // a cubic with this control offset peaks at height / 2
  const sag = open * CLOSED_SAG
  return { upper: lerp(sag, -open, openness), lower: lerp(sag, open, openness) }
}

export function lidPaths(almond: Almond, openness: number): { upper: string; lower: string; clip: string } {
  const { cx, cy, width } = almond
  const { upper, lower } = lidControls(almond.height, openness)
  const left = round(cx - width / 2)
  const right = round(cx + width / 2)
  const innerLeft = round(cx - width / 4)
  const innerRight = round(cx + width / 4)
  const y = round(cy)
  const upperY = round(cy + upper)
  const lowerY = round(cy + lower)
  const upperCurve = `C${innerLeft} ${upperY} ${innerRight} ${upperY} ${right} ${y}`
  const lowerCurve = `C${innerRight} ${lowerY} ${innerLeft} ${lowerY} ${left} ${y}`
  return {
    upper: `M${left} ${y}${upperCurve}`,
    lower: `M${right} ${y}${lowerCurve}`,
    clip: `M${left} ${y}${upperCurve}${lowerCurve}Z`,
  }
}

export const almondPath = (almond: Almond, openness: number) => lidPaths(almond, openness).clip

/** Lid x-position normalized to -1…1 at Bézier parameter t. */
const lidX = (t: number) => {
  const u = 1 - t
  return -(u ** 3) - 1.5 * u * u * t + 1.5 * u * t * t + t ** 3
}

const lidXSlope = (t: number) => {
  const u = 1 - t
  return 1.5 * u * u + 6 * u * t + 1.5 * t * t
}

/** Half-height of the fully open almond at horizontal offset `dx` from its center. */
export function almondHalfHeightAt(almond: Almond, dx: number): number {
  const target = Math.abs(dx) / (almond.width / 2)
  if (target >= 1) return 0
  let lo = 0.5
  let hi = 1
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (lidX(mid) < target) lo = mid
    else hi = mid
  }
  const t = (lo + hi) / 2
  return 2 * almond.height * t * (1 - t)
}

/** Smallest scale at which the open almond contains all four viewport corners. */
export function almondCoverScale(viewport: Size, almond: Almond): number {
  if (almond.width <= 0 || almond.height <= 0) return 1
  const covers = (factor: number) => {
    const scaled = scaleAlmond(almond, factor)
    return corners(viewport).every((c) => almondHalfHeightAt(scaled, c.x - almond.cx) >= Math.abs(c.y - almond.cy))
  }
  if (covers(1)) return 1
  let lo = 1
  let hi = 2
  while (!covers(hi)) {
    lo = hi
    hi *= 2
  }
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (covers(mid)) hi = mid
    else lo = mid
  }
  return hi
}

/** Scale at which a pupil of `radius` reaches the farthest viewport corner. */
export function diveEndScale(viewport: Size, pupil: Point, radius: number): number {
  if (radius <= 0) return 1
  const farthest = Math.max(...corners(viewport).map((c) => Math.hypot(c.x - pupil.x, c.y - pupil.y)))
  return farthest / radius
}

/**
 * Lashes along the upper lid. They hang down while the lid dips, shrink to nothing
 * where the lid is straight, then grow back pointing up and fanned outward.
 */
export function lashes(almond: Almond, openness: number, length: number): Lash[] {
  const { cx, cy, width } = almond
  const { upper } = lidControls(almond.height, openness)
  const flip = CLOSED_SAG / (1 + CLOSED_SAG)
  const hanging = openness < flip
  const size = length * (hanging ? 1 - openness / flip : (openness - flip) / (1 - flip))
  const direction = hanging ? 1 : -1

  return LASH_POSITIONS.map((t) => {
    const x1 = cx + (width / 2) * lidX(t)
    const y1 = cy + upper * 3 * t * (1 - t)
    const dx = (width / 2) * lidXSlope(t)
    const dy = upper * 3 * (1 - 2 * t)
    const norm = Math.hypot(dx, dy) || 1
    return {
      x1,
      y1,
      x2: x1 + (-dy / norm) * size * direction,
      y2: y1 + (dx / norm) * size * direction,
    }
  })
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npm test`
Expected: PASS, all `geometry.test.ts` tests green.

- [ ] **Step 5: Add the photo constants**

<!-- file: src/components/Hero/photo.ts -->
```ts
import eyeAvif from '../../assets/eye.avif'
import eyeWebp from '../../assets/eye.webp'
import type { PhotoMetrics } from './geometry'

/** Measured in source pixels of src/assets/eye.png (1537×1023). Re-measure if the photo is replaced. */
export const PHOTO = {
  avif: eyeAvif,
  webp: eyeWebp,
  width: 1537,
  height: 1023,
  pupil: { x: 676, y: 486, r: 98 },
  iris: { rx: 237, ry: 202 },
} satisfies PhotoMetrics & { avif: string; webp: string }
```

- [ ] **Step 6: Verify**

Run: `npm test && npm run build && npm run lint`
Expected: all succeed.

- [ ] **Step 7: Commit**

```bash
git add src/components/Hero/geometry.ts src/components/Hero/geometry.test.ts src/components/Hero/photo.ts
git commit -m "Add hero geometry with unit tests and photo measurements"
```

---

### Task 3: Theme and nav

**Files:**
- Create: `src/lib/theme.ts`, `src/lib/useTheme.ts`, `src/components/Nav/Nav.tsx`, `src/components/Nav/Nav.css`
- Modify: `src/App.tsx`

**Interfaces:**
- **Consumes:** tokens from Task 1.
- **Produces:**
  - `Theme = 'light' | 'dark'`
  - `useTheme(): { theme, setTheme(theme) }`
  - `<Nav ref>`, rendering `<header class="nav" data-on>`.
  - Values of `data-on`: `ground` (uses `--fg`), `photo` (uses `--ink`), `void` (uses `--bone`).

- [ ] **Step 1: Write the theme logic**

<!-- file: src/lib/theme.ts -->
```ts
export type Theme = 'light' | 'dark'

/** Must match the key read by the inline script in index.html. */
export const THEME_STORAGE_KEY = 'evolve-theme'

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

export function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage unavailable (private mode, blocked); the choice lasts for this page view only.
  }
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

export function onSystemThemeChange(callback: (theme: Theme) => void): () => void {
  const query = darkQuery()
  const handle = () => callback(query.matches ? 'dark' : 'light')
  query.addEventListener('change', handle)
  return () => query.removeEventListener('change', handle)
}
```

<!-- file: src/lib/useTheme.ts -->
```ts
import { useEffect, useState } from 'react'
import { applyTheme, currentTheme, onSystemThemeChange, readStoredTheme, saveTheme, type Theme } from './theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(currentTheme)

  useEffect(
    () =>
      onSystemThemeChange((next) => {
        if (readStoredTheme()) return
        applyTheme(next)
        setThemeState(next)
      }),
    [],
  )

  const setTheme = (next: Theme) => {
    applyTheme(next)
    saveTheme(next)
    setThemeState(next)
  }

  return { theme, setTheme }
}
```

- [ ] **Step 2: Write the nav**

<!-- file: src/components/Nav/Nav.tsx -->
```tsx
import type { Ref } from 'react'
import { useTheme } from '../../lib/useTheme'
import './Nav.css'

export function Nav({ ref }: { ref?: Ref<HTMLElement> }) {
  const { theme, setTheme } = useTheme()

  return (
    <header ref={ref} className="nav" data-on="ground">
      <span className="nav__name">Evolve</span>
      <div className="nav__theme" role="group" aria-label="Color theme">
        <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>
          Light
        </button>
        <span aria-hidden="true">/</span>
        <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>
          Dark
        </button>
      </div>
    </header>
  )
}
```

<!-- file: src/components/Nav/Nav.css -->
```css
.nav {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 10;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: clamp(16px, 2.4vw, 32px) clamp(16px, 3vw, 44px);
  font-family: var(--font-serif);
  font-size: clamp(18px, 1.5vw, 24px);
  color: var(--fg);
  transition: color 0.35s ease;
}

.nav[data-on='photo'] {
  color: var(--ink);
}

.nav[data-on='void'] {
  color: var(--bone);
}

.nav__name {
  font-size: 1.3em;
  line-height: 1;
}

.nav__theme {
  display: flex;
  align-items: baseline;
  gap: 0.3em;
}

.nav__theme button {
  padding: 0.25em 0.1em;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  opacity: 0.5;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.nav__theme button[aria-pressed='true'] {
  font-style: italic;
  opacity: 1;
}

@media (hover: hover) {
  .nav__theme button:hover {
    opacity: 1;
  }
}

.nav__theme button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}
```

- [ ] **Step 3: Render the nav**

<!-- file: src/App.tsx -->
```tsx
import { useRef } from 'react'
import { Nav } from './components/Nav/Nav'

export default function App() {
  const navRef = useRef<HTMLElement>(null)

  return (
    <>
      <Nav ref={navRef} />
      <main />
    </>
  )
}
```

- [ ] **Step 4: Verify**

Run: `npm test && npm run build && npm run lint`
Expected: all succeed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.ts src/lib/useTheme.ts src/components/Nav src/App.tsx
git commit -m "Add light/dark theme with persisted choice and nav toggle"
```

---

### Task 4: Hero intro

**Files:**
- Create: `src/lib/smoothScroll.ts`, `src/components/Hero/EyeIcon.tsx`, `src/components/Hero/drawEye.ts`, `src/components/Hero/layout.ts`, `src/components/Hero/introTimeline.ts`, `src/components/Hero/Hero.tsx`, `src/components/Hero/Hero.css`
- Modify: `src/App.tsx`

**Interfaces:**
- **Consumes:** geometry and `PHOTO` (Task 2), `Nav` (Task 3), `lib/gsap.ts` (Task 1).
- **Produces:**
  - `initSmoothScroll(): () => void`, `lockScroll()`, `unlockScroll()`
  - `HeroParts`, `HeroGeometry`, `collectParts(hero)`, `measureHero(parts)`, `setPhotoTransform(img, t)`, `applyRevealedState(parts, geo)`, `waitForAssets(img): Promise<{photoOk}>`
  - `createIntro(parts, nav, getGeo, {photoOk, onComplete}): Intro {timeline, redraw}`
  - `<Hero navRef>`

- [ ] **Step 1: Write the smooth scroll module**

<!-- file: src/lib/smoothScroll.ts -->
```ts
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'

let lenis: Lenis | null = null
let locked = false

/** Creates Lenis (skipped for reduced motion) driven by GSAP's ticker. Returns a cleanup. */
export function initSmoothScroll(): () => void {
  ScrollTrigger.config({ ignoreMobileResize: true })
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const instance = new Lenis()
  lenis = instance
  if (locked) instance.stop()
  instance.on('scroll', ScrollTrigger.update)
  const tick = (time: number) => instance.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(tick)
    gsap.ticker.lagSmoothing(500, 33)
    instance.destroy()
    if (lenis === instance) lenis = null
  }
}

/** Blocks wheel, touch and keyboard scrolling. Safe to call before initSmoothScroll. */
export function lockScroll(): void {
  locked = true
  document.documentElement.classList.add('is-locked')
  lenis?.stop()
}

export function unlockScroll(): void {
  locked = false
  document.documentElement.classList.remove('is-locked')
  lenis?.start()
}
```

- [ ] **Step 2: Write the eye icon and its drawing function**

<!-- file: src/components/Hero/EyeIcon.tsx -->
```tsx
import { LASH_COUNT } from './geometry'

const LASH_KEYS = Array.from({ length: LASH_COUNT }, (_, index) => index)

/** Empty SVG in stage pixel coordinates; drawEye() fills in the geometry every frame. */
export function EyeIcon({ part }: { part: string }) {
  return (
    <svg className="eye" data-part={part} aria-hidden="true" focusable="false">
      <path />
      <path />
      {LASH_KEYS.map((key) => (
        <line key={key} />
      ))}
    </svg>
  )
}
```

<!-- file: src/components/Hero/drawEye.ts -->
```ts
import { lashes, lidPaths, type Almond } from './geometry'

const LASH_LENGTH_RATIO = 1.6 // lash length as a multiple of the stroke width

export function drawEye(svg: SVGSVGElement, almond: Almond, openness: number, strokeWidth: number): void {
  const [upperLid, lowerLid] = svg.querySelectorAll('path')
  const { upper, lower } = lidPaths(almond, openness)
  upperLid?.setAttribute('d', upper)
  lowerLid?.setAttribute('d', lower)
  // Closed lids overlap exactly, so the lower one only appears once the eye starts opening.
  lowerLid?.style.setProperty('opacity', String(Math.min(1, openness * 4)))
  svg.style.strokeWidth = `${strokeWidth}px`

  const lines = svg.querySelectorAll('line')
  lashes(almond, openness, strokeWidth * LASH_LENGTH_RATIO).forEach((lash, index) => {
    const line = lines[index]
    if (!line) return
    line.setAttribute('x1', String(lash.x1))
    line.setAttribute('y1', String(lash.y1))
    line.setAttribute('x2', String(lash.x2))
    line.setAttribute('y2', String(lash.y2))
  })
}
```

- [ ] **Step 3: Write the layout module (DOM measurement)**

<!-- file: src/components/Hero/layout.ts -->
```ts
import {
  almondCoverScale,
  coverAnchored,
  diveEndScale,
  fitToSlot,
  fitWordFontSize,
  type Almond,
  type PhotoTransform,
  type Size,
} from './geometry'
import { PHOTO } from './photo'

/** Eye stroke width as a fraction of the word's font size, close to the letter stems. */
const EYE_STROKE_EM = 0.15
const ASSET_TIMEOUT_MS = 4000

export interface HeroParts {
  hero: HTMLElement
  stage: HTMLElement
  baseLayer: HTMLElement
  lightLayer: HTMLElement
  reveal: HTMLElement
  photo: HTMLImageElement
  eye: SVGSVGElement
  eyeLight: SVGSVGElement
  pupilCover: HTMLElement
  voidCover: HTMLElement
  tagline: HTMLElement
  cue: HTMLElement
  slot: HTMLElement
}

export interface HeroGeometry {
  viewport: Size
  /** The O slot in stage pixels; also the pupil's screen position. */
  almond: Almond
  strokeWidth: number
  fit: PhotoTransform
  cover: PhotoTransform
  clipCoverScale: number
  pupilRadius: number
  diveScale: number
}

export function collectParts(hero: HTMLElement): HeroParts {
  const part = <T extends Element = HTMLElement>(name: string): T => {
    const element = hero.querySelector<T>(`[data-part="${name}"]`)
    if (!element) throw new Error(`Hero is missing [data-part="${name}"]`)
    return element
  }

  return {
    hero,
    stage: part('stage'),
    baseLayer: part('base-layer'),
    lightLayer: part('light-layer'),
    reveal: part('reveal'),
    photo: part<HTMLImageElement>('photo'),
    eye: part<SVGSVGElement>('eye'),
    eyeLight: part<SVGSVGElement>('eye-light'),
    pupilCover: part('pupil-cover'),
    voidCover: part('void'),
    tagline: part('tagline'),
    cue: part('cue'),
    slot: part('slot'),
  }
}

/** Layout offsets ignore transforms, so this is safe while the stage is scaled by the dive. */
function offsetWithin(element: HTMLElement, ancestor: HTMLElement): { left: number; top: number } {
  let left = 0
  let top = 0
  let node: HTMLElement | null = element
  while (node && node !== ancestor) {
    left += node.offsetLeft
    top += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return { left, top }
}

/** Sizes the word to the viewport (via --word-size) and derives every hero measurement. */
export function measureHero(parts: HeroParts): HeroGeometry {
  const { hero, stage, baseLayer, slot } = parts
  const word = slot.parentElement as HTMLElement

  hero.style.setProperty('--word-size', '100px')
  const fontSize = fitWordFontSize(
    { width: stage.clientWidth, height: baseLayer.clientHeight },
    word.offsetWidth,
    slot.offsetHeight,
  )
  hero.style.setProperty('--word-size', `${fontSize}px`)

  const viewport = { width: stage.clientWidth, height: stage.clientHeight }
  const offset = offsetWithin(slot, stage)
  const almond: Almond = {
    cx: offset.left + slot.offsetWidth / 2,
    cy: offset.top + slot.offsetHeight / 2,
    width: slot.offsetWidth,
    height: slot.offsetHeight,
  }
  const center = { x: almond.cx, y: almond.cy }
  const cover = coverAnchored(viewport, center, PHOTO)
  const pupilRadius = PHOTO.pupil.r * cover.scale

  return {
    viewport,
    almond,
    strokeWidth: fontSize * EYE_STROKE_EM,
    fit: fitToSlot(almond, PHOTO),
    cover,
    clipCoverScale: almondCoverScale(viewport, almond),
    pupilRadius,
    diveScale: diveEndScale(viewport, center, pupilRadius),
  }
}

export function setPhotoTransform(photo: HTMLImageElement, t: PhotoTransform): void {
  photo.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.scale})`
}

/** End state of the intro: photo covering the hero, no clip, pupil cover sized for the dive. */
export function applyRevealedState(parts: HeroParts, geo: HeroGeometry): void {
  setPhotoTransform(parts.photo, geo.cover)
  parts.reveal.style.clipPath = 'none'
  const r = geo.pupilRadius
  parts.pupilCover.style.width = `${r * 2}px`
  parts.pupilCover.style.height = `${r * 2}px`
  parts.pupilCover.style.transform = `translate3d(${geo.almond.cx - r}px, ${geo.almond.cy - r}px, 0)`
}

/** Waits for both fonts and the photo decode, giving up after 4s. */
export async function waitForAssets(photo: HTMLImageElement): Promise<{ photoOk: boolean }> {
  const fonts = Promise.all([
    document.fonts.load('900 100px "Archivo Variable"'),
    document.fonts.load('italic 400 32px "Instrument Serif"'),
  ]).catch(() => undefined)
  const decoded = photo.decode().then(
    () => true,
    () => false,
  )
  const timeout = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), ASSET_TIMEOUT_MS))

  const result = await Promise.race([Promise.all([fonts, decoded]), timeout])
  if (result === 'timeout') return { photoOk: photo.complete && photo.naturalWidth > 0 }
  return { photoOk: result[1] }
}
```

- [ ] **Step 4: Write the intro timeline**

<!-- file: src/components/Hero/introTimeline.ts -->
```ts
import { gsap } from '../../lib/gsap'
import { drawEye } from './drawEye'
import { almondPath, anchoredAt, lerp, scaleAlmond } from './geometry'
import { setPhotoTransform, type HeroGeometry, type HeroParts } from './layout'
import { PHOTO } from './photo'

export interface Intro {
  timeline: gsap.core.Timeline
  /** Re-renders the current frame, e.g. after a resize re-measured the geometry. */
  redraw: () => void
}

interface IntroOptions {
  photoOk: boolean
  onComplete: () => void
}

export function createIntro(
  parts: HeroParts,
  nav: HTMLElement,
  getGeo: () => HeroGeometry,
  { photoOk, onComplete }: IntroOptions,
): Intro {
  // sweep: mask-position % (100 = band off the left edge, 0 = off the right edge)
  // open: eyelid openness; grow: photo fit → cover; burst: clip eye-sized → covering the viewport
  const state = { sweep: 100, open: 0, grow: 0, burst: 0 }

  const redraw = () => {
    const geo = getGeo()
    parts.lightLayer.style.setProperty('--sweep', `${state.sweep}%`)
    drawEye(parts.eye, geo.almond, state.open, geo.strokeWidth)
    drawEye(parts.eyeLight, geo.almond, state.open, geo.strokeWidth)
    if (!photoOk) return

    const photoScale = lerp(geo.fit.scale, geo.cover.scale, state.grow)
    setPhotoTransform(parts.photo, anchoredAt({ x: geo.almond.cx, y: geo.almond.cy }, PHOTO, photoScale))
    // While growing, the clip scales with the photo so the lids stay on the real eye.
    const tracked = photoScale / geo.fit.scale
    const clipScale = lerp(tracked, Math.max(tracked, geo.clipCoverScale), state.burst)
    parts.reveal.style.clipPath = `path("${almondPath(scaleAlmond(geo.almond, clipScale), state.open)}")`
  }

  const timeline = gsap.timeline({ onUpdate: redraw, onComplete })

  timeline
    .to(parts.stage, { autoAlpha: 1, duration: 0.3, ease: 'power1.out' }, 0)
    .set(parts.lightLayer, { autoAlpha: 1 }, 0.8)
    .to(state, { sweep: 0, duration: 0.6, ease: 'power2.inOut' }, 0.8)
    .set(parts.lightLayer, { autoAlpha: 0 }, 1.4)
    .to(state, { open: 1, duration: 0.45, ease: 'power3.out' }, 1.3)

  if (photoOk) {
    timeline
      .set(parts.reveal, { autoAlpha: 1 }, 1.3)
      .to(parts.eye, { autoAlpha: 0, duration: 0.25, ease: 'power1.out' }, 1.75)
      .to(state, { grow: 1, duration: 0.8, ease: 'power3.inOut' }, 2.4)
      .to(state, { burst: 1, duration: 0.5, ease: 'power2.in' }, 3.2)
  }

  timeline.to(
    [nav, parts.tagline, parts.cue],
    { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.12 },
    photoOk ? 3.2 : 1.9,
  )

  redraw()
  return { timeline, redraw }
}
```

- [ ] **Step 5: Write the hero component**

<!-- file: src/components/Hero/Hero.tsx -->
```tsx
import { useRef, type RefObject } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { lockScroll, unlockScroll } from '../../lib/smoothScroll'
import { drawEye } from './drawEye'
import { EyeIcon } from './EyeIcon'
import { createIntro, type Intro } from './introTimeline'
import { applyRevealedState, collectParts, measureHero, waitForAssets, type HeroGeometry } from './layout'
import { PHOTO } from './photo'
import './Hero.css'

function Word({ slotPart }: { slotPart?: string }) {
  return (
    <p className="word" aria-hidden="true">
      <span>EV</span>
      <span className="word__slot" data-part={slotPart} />
      <span>LVE</span>
    </p>
  )
}

export function Hero({ navRef }: { navRef: RefObject<HTMLElement | null> }) {
  const heroRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const hero = heroRef.current
      const nav = navRef.current
      if (!hero || !nav) return
      const parts = collectParts(hero)
      gsap.set([nav, parts.tagline, parts.cue], { autoAlpha: 0, y: 12 })

      const mm = gsap.matchMedia()
      mm.add(
        { reduce: '(prefers-reduced-motion: reduce)', motion: '(prefers-reduced-motion: no-preference)' },
        (context) => {
          const reduce = Boolean(context.conditions?.reduce)
          let cancelled = false
          let geo: HeroGeometry | null = null
          let intro: Intro | null = null
          let revealed = false
          let frame = 0

          const getGeo = () => {
            if (!geo) throw new Error('Hero geometry read before measurement')
            return geo
          }

          const relayout = () => {
            if (!geo) return
            geo = measureHero(parts)
            if (revealed) applyRevealedState(parts, geo)
            else intro?.redraw()
          }

          const onResize = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(relayout)
          }

          const settle = (photoOk: boolean) => {
            nav.dataset.on = photoOk ? 'photo' : 'ground'
            unlockScroll()
          }

          if (!reduce) lockScroll()

          waitForAssets(parts.photo).then(({ photoOk }) => {
            if (cancelled) return
            context.add(() => {
              hero.dataset.photo = photoOk ? 'ok' : 'failed'
              geo = measureHero(parts)
              window.addEventListener('resize', onResize)
              document.fonts.ready.then(() => {
                if (!cancelled) relayout()
              })

              if (reduce) {
                if (photoOk) {
                  revealed = true
                  applyRevealedState(parts, geo)
                  gsap.set(parts.eye, { autoAlpha: 0 })
                  gsap.set(parts.reveal, { autoAlpha: 1 })
                } else {
                  drawEye(parts.eye, geo.almond, 1, geo.strokeWidth)
                }
                gsap.to([parts.stage, nav, parts.tagline, parts.cue], {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.4,
                  ease: 'power1.out',
                  onComplete: () => settle(photoOk),
                })
                return
              }

              intro = createIntro(parts, nav, getGeo, {
                photoOk,
                onComplete: () => {
                  if (photoOk) {
                    revealed = true
                    applyRevealedState(parts, getGeo())
                  }
                  settle(photoOk)
                },
              })
            })
          })

          return () => {
            cancelled = true
            cancelAnimationFrame(frame)
            window.removeEventListener('resize', onResize)
            unlockScroll()
          }
        },
      )

      return () => mm.revert()
    },
    { scope: heroRef },
  )

  return (
    <section ref={heroRef} className="hero" id="top">
      <h1 className="sr-only">Evolve</h1>
      <div className="hero__stage" data-part="stage">
        <div className="hero__layer" data-part="base-layer">
          <Word slotPart="slot" />
        </div>
        <div className="hero__layer hero__layer--light" data-part="light-layer">
          <Word />
          <EyeIcon part="eye-light" />
        </div>
        <div className="hero__reveal" data-part="reveal">
          <picture>
            <source srcSet={PHOTO.avif} type="image/avif" />
            <img
              className="hero__photo"
              data-part="photo"
              src={PHOTO.webp}
              width={PHOTO.width}
              height={PHOTO.height}
              style={{ width: PHOTO.width, height: PHOTO.height }}
              alt=""
            />
          </picture>
          <div className="hero__layer">
            <Word />
          </div>
        </div>
        <EyeIcon part="eye" />
        <div className="hero__pupil-cover" data-part="pupil-cover" />
      </div>
      <div className="hero__void" data-part="void" />
      <p className="hero__tagline" data-part="tagline">
        Birds never stopped being dinosaurs.
      </p>
      <p className="hero__cue" data-part="cue">
        Scroll to look closer
      </p>
    </section>
  )
}
```

- [ ] **Step 6: Write the hero styles**

<!-- file: src/components/Hero/Hero.css -->
```css
.hero {
  position: relative;
  height: 100lvh;
  overflow: hidden;
  background: var(--ground);
}

.hero__stage {
  position: absolute;
  inset: 0;
  color: var(--fg);
  visibility: hidden;
  opacity: 0;
}

/* Word layers share one box (the small viewport) so the three copies align exactly. */
.hero__layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100svh;
  display: grid;
  place-items: center;
  color: var(--fg);
}

.hero__layer--light {
  color: var(--light);
  visibility: hidden;
  /* The only gradient on the page: a soft light band, used as a mask and never as a fill. */
  -webkit-mask-image: linear-gradient(100deg, transparent 42%, #000 48%, #000 52%, transparent 58%);
  mask-image: linear-gradient(100deg, transparent 42%, #000 48%, #000 52%, transparent 58%);
  -webkit-mask-size: 250% 100%;
  mask-size: 250% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: var(--sweep, 100%) 0;
  mask-position: var(--sweep, 100%) 0;
}

.hero__reveal {
  position: absolute;
  inset: 0;
  visibility: hidden;
}

.hero__reveal .hero__layer {
  color: var(--ink);
}

.hero__photo {
  position: absolute;
  top: 0;
  left: 0;
  max-width: none;
  transform-origin: 0 0;
  user-select: none;
}

.word {
  position: relative;
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--word-size, 14vw);
  font-weight: 900;
  font-stretch: 125%;
  line-height: 1;
  letter-spacing: -0.01em;
  white-space: nowrap;
  user-select: none;
}

.word__slot {
  display: inline-block;
  width: 1.5cap;
  height: 1cap;
  margin-inline: 0.1em;
  vertical-align: baseline;
}

.eye {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

.hero__pupil-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: var(--void);
  opacity: 0;
}

.hero__void {
  position: absolute;
  inset: 0;
  background: var(--void);
  opacity: 0;
  pointer-events: none;
}

.hero__tagline,
.hero__cue {
  position: absolute;
  left: 0;
  right: 0;
  margin: 0;
  padding-inline: 16px;
  text-align: center;
  font-family: var(--font-serif);
  color: var(--ink);
  visibility: hidden;
  opacity: 0;
}

.hero[data-photo='failed'] :is(.hero__tagline, .hero__cue) {
  color: var(--fg);
}

.hero__tagline {
  top: calc(50svh + var(--word-size, 14vw) * 0.55);
  font-size: clamp(20px, 2.4vw, 36px);
  font-style: italic;
}

.hero__cue {
  bottom: calc(100lvh - 100svh + clamp(20px, 4svh, 40px));
  font-size: clamp(15px, 1.2vw, 18px);
}
```

- [ ] **Step 7: Mount the hero and smooth scroll**

<!-- file: src/App.tsx -->
```tsx
import { useEffect, useRef } from 'react'
import { Hero } from './components/Hero/Hero'
import { Nav } from './components/Nav/Nav'
import { initSmoothScroll } from './lib/smoothScroll'

export default function App() {
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => initSmoothScroll(), [])

  return (
    <>
      <Nav ref={navRef} />
      <main>
        <Hero navRef={navRef} />
      </main>
    </>
  )
}
```

- [ ] **Step 8: Verify**

Run: `npm test && npm run build && npm run lint`
Expected: all succeed.

- [ ] **Step 9: Commit**

```bash
git add src/lib/smoothScroll.ts src/components/Hero src/App.tsx
git commit -m "Build hero intro: eye-as-O, light sweep, photo reveal and expansion, scroll lock"
```

---

### Task 5: Pupil dive and chapter handoff

**Files:**
- Create: `src/components/Hero/pupilDive.ts`, `src/components/ChapterStub.tsx`, `src/components/ChapterStub.css`
- Modify: `src/components/Hero/Hero.tsx`, `src/App.tsx`

**Interfaces:**
- **Consumes:** `HeroParts`, `HeroGeometry` and `logLerp` (Tasks 2 and 4).
- **Produces:**
  - `createPupilDive(parts, nav, getGeo, {mode: 'zoom' | 'fade', restingBackdrop: 'photo' | 'ground'}): PupilDive {render, kill}`
  - `<ChapterStub>`

- [ ] **Step 1: Write the dive**

<!-- file: src/components/Hero/pupilDive.ts -->
```ts
import { gsap } from '../../lib/gsap'
import { logLerp } from './geometry'
import type { HeroGeometry, HeroParts } from './layout'

export interface PupilDive {
  /** Re-applies the stage transform for the current scroll progress (after a resize). */
  render: () => void
  kill: () => void
}

interface DiveOptions {
  /** 'zoom' pushes into the pupil; 'fade' cross-fades to black (reduced motion or no photo). */
  mode: 'zoom' | 'fade'
  restingBackdrop: 'photo' | 'ground'
}

const NAV_VOID_PROGRESS = 0.85

export function createPupilDive(
  parts: HeroParts,
  nav: HTMLElement,
  getGeo: () => HeroGeometry,
  { mode, restingBackdrop }: DiveOptions,
): PupilDive {
  const state = { zoom: 0 }

  const render = () => {
    if (mode !== 'zoom') return
    const geo = getGeo()
    gsap.set(parts.stage, {
      scale: logLerp(1, geo.diveScale, state.zoom),
      transformOrigin: `${geo.almond.cx}px ${geo.almond.cy}px`,
      force3D: true,
    })
  }

  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: parts.hero,
      start: 'top top',
      end: '+=150%',
      pin: true,
      scrub: true,
      refreshPriority: 1, // the hero is first on the page but is created after the chapter's trigger
      onUpdate: (self) => {
        nav.dataset.on = self.progress > NAV_VOID_PROGRESS ? 'void' : restingBackdrop
      },
    },
  })

  timeline.to([parts.tagline, parts.cue], { autoAlpha: 0, duration: 0.15 }, 0)

  if (mode === 'zoom') {
    timeline
      .to(state, { zoom: 1, duration: 1, ease: 'power2.in', onUpdate: render }, 0)
      // Solid black over the upscaled pupil so the last frames stay crisp.
      .to(parts.pupilCover, { opacity: 1, duration: 0.34 }, 0.66)
  } else {
    timeline.to(parts.voidCover, { opacity: 1, duration: 1 }, 0)
  }

  render()

  return {
    render,
    kill: () => {
      timeline.scrollTrigger?.kill(true)
      timeline.kill()
    },
  }
}
```

- [ ] **Step 2: Wire the dive into `Hero.tsx`.** Apply these exact edits.

Import (replace the `introTimeline` import line):

```tsx
import { createIntro, type Intro } from './introTimeline'
import { createPupilDive, type PupilDive } from './pupilDive'
```

Replace `import { gsap, useGSAP } from '../../lib/gsap'` with:

```tsx
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap'
```

After `let intro: Intro | null = null` add:

```tsx
          let dive: PupilDive | null = null
```

Replace the `relayout` body's last two lines:

```tsx
            if (revealed) applyRevealedState(parts, geo)
            else intro?.redraw()
            dive?.render()
```

Replace `settle` with:

```tsx
          const settle = (photoOk: boolean) => {
            nav.dataset.on = photoOk ? 'photo' : 'ground'
            unlockScroll()
            dive = createPupilDive(parts, nav, getGeo, {
              mode: photoOk && !reduce ? 'zoom' : 'fade',
              restingBackdrop: photoOk ? 'photo' : 'ground',
            })
            ScrollTrigger.refresh()
          }
```

In the cleanup returned from `mm.add`, add `dive?.kill()` before `unlockScroll()`.

- [ ] **Step 3: Write the chapter placeholder**

<!-- file: src/components/ChapterStub.tsx -->
```tsx
import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import './ChapterStub.css'

export function ChapterStub() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.from('.chapter__inner > *', {
        autoAlpha: 0,
        duration: 0.9,
        ease: 'power2.out',
        stagger: 0.15,
        scrollTrigger: { trigger: ref.current, start: 'top 55%', toggleActions: 'play none none reverse' },
      })
    },
    { scope: ref },
  )

  return (
    <section ref={ref} className="chapter" aria-labelledby="chapter-1-title">
      <div className="chapter__inner">
        <p className="chapter__number">Chapter 1</p>
        <h2 id="chapter-1-title" className="chapter__title">
          The story starts here.
        </h2>
      </div>
    </section>
  )
}
```

<!-- file: src/components/ChapterStub.css -->
```css
.chapter {
  display: grid;
  place-items: center;
  min-height: 100svh;
  padding-block: 16svh;
  padding-inline: clamp(16px, 6vw, 96px);
  background: var(--void);
  color: var(--bone);
}

.chapter__inner {
  max-width: 18ch;
  text-align: center;
}

.chapter__number {
  margin: 0 0 0.6em;
  font-family: var(--font-serif);
  font-size: clamp(20px, 2vw, 28px);
  font-style: italic;
}

.chapter__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(40px, 7vw, 112px);
  font-weight: 800;
  font-stretch: 112%;
  line-height: 0.95;
  letter-spacing: -0.02em;
}
```

- [ ] **Step 4: Mount the chapter**

<!-- file: src/App.tsx -->
```tsx
import { useEffect, useRef } from 'react'
import { ChapterStub } from './components/ChapterStub'
import { Hero } from './components/Hero/Hero'
import { Nav } from './components/Nav/Nav'
import { initSmoothScroll } from './lib/smoothScroll'

export default function App() {
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => initSmoothScroll(), [])

  return (
    <>
      <Nav ref={navRef} />
      <main>
        <Hero navRef={navRef} />
        <ChapterStub />
      </main>
    </>
  )
}
```

- [ ] **Step 5: Verify**

Run: `npm test && npm run build && npm run lint`
Expected: all succeed.

- [ ] **Step 6: Commit**

```bash
git add src/components/Hero/pupilDive.ts src/components/Hero/Hero.tsx src/components/ChapterStub.tsx src/components/ChapterStub.css src/App.tsx
git commit -m "Add scroll-scrubbed pupil dive and black chapter handoff"
```

---

### Task 6: Final verification and handoff

- [ ] **Step 1: Run the full check.** Run `npm test && npm run build && npm run lint`. All succeed.
- [ ] **Step 2: Check for template leftovers.** Run `grep -rn "vite.svg\|react.svg\|hero.png\|icons.svg\|App.css\|index.css" src index.html`. Expected: no matches.
- [ ] **Step 3: Check the gradient rule.** Run `grep -rn "gradient" src`. Expected: only the `.hero__layer--light` mask lines in `Hero.css`.
- [ ] **Step 4: Start the dev server** (`npm run dev`) so the user can review in their browser. Do not run an automated scan.
- [ ] **Step 5: Hand off.** Tell the user what to look at, and which values are tuning knobs:
  - `EYE_STROKE_EM` in `layout.ts`
  - `LASH_LENGTH_RATIO` in `drawEye.ts`
  - `.word__slot` width and margin in `Hero.css`
  - the tagline offset
  - the timeline positions in `introTimeline.ts`
  - `end: '+=150%'` in `pupilDive.ts`
