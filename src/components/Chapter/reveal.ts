import { gsap, SplitText } from '../../lib/gsap'

interface RevealOptions {
  reduce: boolean
  start?: string
}

/**
 * Scroll-in reveal for the [data-reveal] parts inside `scope`: the header rule draws, labels
 * fade, headline lines rise out of a mask, the lede fades up. Only transforms and opacity move.
 */
export function revealText(scope: HTMLElement, trigger: Element, { reduce, start = 'top 70%' }: RevealOptions): void {
  const scrollTrigger = () => ({ trigger, start, toggleActions: 'play none none reverse' })
  const find = (name: string) => gsap.utils.toArray<HTMLElement>(`[data-reveal="${name}"]`, scope)
  const rules = find('rule')
  const labels = find('labels')
  const headlines = find('headline')
  const ledes = find('lede')

  if (reduce) {
    const parts = [...rules, ...labels, ...headlines, ...ledes]
    if (parts.length) gsap.from(parts, { autoAlpha: 0, duration: 0.6, ease: 'power1.out', scrollTrigger: scrollTrigger() })
    return
  }

  if (rules.length) gsap.from(rules, { scaleX: 0, duration: 1.1, ease: 'power3.inOut', scrollTrigger: scrollTrigger() })
  if (labels.length) {
    gsap.from(labels, { autoAlpha: 0, duration: 0.6, delay: 0.35, ease: 'power1.out', scrollTrigger: scrollTrigger() })
  }
  for (const headline of headlines) {
    // autoSplit re-splits when fonts load or the width changes; the returned tween is rebuilt with it.
    SplitText.create(headline, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'reveal-line',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.08,
          delay: 0.15,
          scrollTrigger: scrollTrigger(),
        }),
    })
  }
  if (ledes.length) {
    gsap.from(ledes, { autoAlpha: 0, y: 16, duration: 0.8, delay: 0.5, ease: 'power2.out', scrollTrigger: scrollTrigger() })
  }
}
