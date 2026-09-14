import { lidPaths, type Almond } from './geometry'

export function drawEye(svg: SVGSVGElement, almond: Almond, openness: number, strokeWidth: number): void {
  const [upperLid, lowerLid] = svg.querySelectorAll('path')
  const { upper, lower } = lidPaths(almond, openness)
  upperLid?.setAttribute('d', upper)
  lowerLid?.setAttribute('d', lower)
  // Closed lids overlap exactly, so the lower one only appears once the eye starts opening.
  lowerLid?.style.setProperty('opacity', String(Math.min(1, openness * 4)))
  svg.style.strokeWidth = `${strokeWidth}px`
}
