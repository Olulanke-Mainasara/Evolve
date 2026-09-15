/**
 * Splits `text` into exactly `count` lines at word boundaries, keeping the longest line as short
 * as possible (ties go to the most even split). Character counts stand in for rendered width.
 */
export function closingLines(text: string, count: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length <= count) return words

  let best: string[] = []
  let bestScore = [Infinity, Infinity]

  const search = (start: number, lines: string[]) => {
    const remaining = count - lines.length
    if (remaining === 1) {
      const candidate = [...lines, words.slice(start).join(' ')]
      const lengths = candidate.map((line) => line.length)
      const mean = lengths.reduce((sum, n) => sum + n, 0) / lengths.length
      const score = [Math.max(...lengths), lengths.reduce((sum, n) => sum + (n - mean) ** 2, 0)]
      if (score[0] < bestScore[0] || (score[0] === bestScore[0] && score[1] < bestScore[1])) {
        best = candidate
        bestScore = score
      }
      return
    }
    for (let end = start + 1; end <= words.length - (remaining - 1); end++) {
      search(end, [...lines, words.slice(start, end).join(' ')])
    }
  }

  search(0, [])
  return best
}
