import {
  almondCoverScale,
  coverAnchored,
  diveEndScale,
  fitToSlot,
  fitWordFontSize,
  spotlightClearScale,
  spotlightRing,
  type Almond,
  type PhotoTransform,
  type Size,
  type SpotlightRing,
} from "./geometry";
import { PHOTO } from "./photo";

/** Eye stroke width as a fraction of the word's font size, close to the letter stems. */
const EYE_STROKE_EM = 0.001;
const ASSET_TIMEOUT_MS = 4000;

export interface HeroParts {
  hero: HTMLElement;
  stage: HTMLElement;
  baseLayer: HTMLElement;
  lightLayer: HTMLElement;
  reveal: HTMLElement;
  revealLayer: HTMLElement;
  photo: HTMLImageElement;
  dim: HTMLElement;
  eye: SVGSVGElement;
  eyeLight: SVGSVGElement;
  pupilCover: HTMLElement;
  voidCover: HTMLElement;
  tagline: HTMLElement;
  cue: HTMLElement;
  slot: HTMLElement;
}

export interface HeroGeometry {
  viewport: Size;
  /** The O slot in stage pixels; also the pupil's screen position. */
  almond: Almond;
  strokeWidth: number;
  fit: PhotoTransform;
  cover: PhotoTransform;
  clipCoverScale: number;
  /** Dimming ring placed for the cover transform. */
  spotlight: SpotlightRing;
  /** Dive scale past which the dimming ring is entirely off screen. */
  spotlightClearScale: number;
  pupilRadius: number;
  diveScale: number;
}

export function collectParts(hero: HTMLElement): HeroParts {
  const part = <T extends Element = HTMLElement>(name: string): T => {
    const element = hero.querySelector<T>(`[data-part="${name}"]`);
    if (!element) throw new Error(`Hero is missing [data-part="${name}"]`);
    return element;
  };

  return {
    hero,
    stage: part("stage"),
    baseLayer: part("base-layer"),
    lightLayer: part("light-layer"),
    reveal: part("reveal"),
    revealLayer: part("reveal-layer"),
    photo: part<HTMLImageElement>("photo"),
    dim: part("dim"),
    eye: part<SVGSVGElement>("eye"),
    eyeLight: part<SVGSVGElement>("eye-light"),
    pupilCover: part("pupil-cover"),
    voidCover: part("void"),
    tagline: part("tagline"),
    cue: part("cue"),
    slot: part("slot"),
  };
}

/** Layout offsets ignore transforms, so this is safe while the stage is scaled by the dive. */
function offsetWithin(
  element: HTMLElement,
  ancestor: HTMLElement,
): { left: number; top: number } {
  let left = 0;
  let top = 0;
  let node: HTMLElement | null = element;
  while (node && node !== ancestor) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { left, top };
}

/** Sizes the word to the viewport (via --word-size) and derives every hero measurement. */
export function measureHero(parts: HeroParts): HeroGeometry {
  const { hero, stage, baseLayer, slot } = parts;
  const word = slot.parentElement as HTMLElement;

  hero.style.setProperty("--word-size", "100px");
  const fontSize = fitWordFontSize(
    { width: stage.clientWidth, height: baseLayer.clientHeight },
    word.offsetWidth,
    slot.offsetHeight,
  );
  hero.style.setProperty("--word-size", `${fontSize}px`);

  const viewport = { width: stage.clientWidth, height: stage.clientHeight };
  const offset = offsetWithin(slot, stage);
  const almond: Almond = {
    cx: offset.left + slot.offsetWidth / 2,
    cy: offset.top + slot.offsetHeight / 2,
    width: slot.offsetWidth,
    height: slot.offsetHeight,
    rotation: PHOTO.tilt,
  };
  const center = { x: almond.cx, y: almond.cy };
  const cover = coverAnchored(viewport, center, PHOTO);
  const spotlight = spotlightRing(viewport, PHOTO, cover);
  const pupilRadius = PHOTO.pupil.r * cover.scale;

  return {
    viewport,
    almond,
    strokeWidth: fontSize * EYE_STROKE_EM,
    fit: fitToSlot(almond, PHOTO),
    cover,
    clipCoverScale: almondCoverScale(viewport, almond),
    spotlight,
    spotlightClearScale: spotlightClearScale(viewport, center, spotlight),
    pupilRadius,
    diveScale: diveEndScale(viewport, center, pupilRadius),
  };
}

export function setPhotoTransform(
  photo: HTMLImageElement,
  t: PhotoTransform,
): void {
  photo.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.scale})`;
}

export function setSpotlight(dim: HTMLElement, ring: SpotlightRing): void {
  Object.assign(dim.style, {
    width: `${ring.width}px`,
    height: `${ring.height}px`,
    borderWidth: `${ring.border}px`,
    filter: `blur(${ring.blur}px)`,
    transform: `translate3d(${ring.left}px, ${ring.top}px, 0) rotate(${ring.rotation}deg)`,
  });
}

/** End state of the intro: photo covering the hero, no clip, pupil cover sized for the dive. */
export function applyRevealedState(parts: HeroParts, geo: HeroGeometry): void {
  setPhotoTransform(parts.photo, geo.cover);
  setSpotlight(parts.dim, geo.spotlight);
  parts.reveal.style.clipPath = "none";
  // The photo covers the base word from here on; hiding it keeps a second copy of the text out of the dive's redraws.
  parts.baseLayer.style.visibility = "hidden";
  const r = geo.pupilRadius;
  parts.pupilCover.style.width = `${r * 2}px`;
  parts.pupilCover.style.height = `${r * 2}px`;
  parts.pupilCover.style.transform = `translate3d(${geo.almond.cx - r}px, ${geo.almond.cy - r}px, 0)`;
}

/** Waits for both fonts and the photo decode, giving up after 4s. */
export async function waitForAssets(
  photo: HTMLImageElement,
): Promise<{ photoOk: boolean }> {
  const fonts = Promise.all([
    document.fonts.load('900 100px "Archivo Variable"'),
    document.fonts.load('400 16px "IBM Plex Mono"'),
  ]).catch(() => undefined);
  const decoded = photo.decode().then(
    () => true,
    () => false,
  );
  const timeout = new Promise<"timeout">((resolve) =>
    setTimeout(() => resolve("timeout"), ASSET_TIMEOUT_MS),
  );

  const result = await Promise.race([Promise.all([fonts, decoded]), timeout]);
  if (result === "timeout")
    return { photoOk: photo.complete && photo.naturalWidth > 0 };
  return { photoOk: result[1] };
}
