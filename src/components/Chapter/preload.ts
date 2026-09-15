import { ScrollTrigger } from '../../lib/gsap'

/**
 * Starts loading and decoding a section's lazy photos about a screen and a half before it
 * arrives, so a pinned reveal doesn't stall decoding a photo that was hidden until that moment.
 */
export function preloadPhotos(section: HTMLElement): void {
  const images = Array.from(section.querySelectorAll<HTMLImageElement>('img[loading="lazy"]'))
  if (!images.length) return
  ScrollTrigger.create({
    trigger: section,
    start: () => `top bottom+=${window.innerHeight * 1.5}`,
    once: true,
    onEnter: () => {
      for (const image of images) {
        image.loading = 'eager'
        image.decode().catch(() => {})
      }
    },
  })
}
