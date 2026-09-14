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
