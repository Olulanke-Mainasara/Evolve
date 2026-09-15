import type { Chapter } from '../../content/chapters'

/** The 1px rule and label row (number, place, period) at the top of every chapter. */
export function ChapterHeader({ chapter }: { chapter: Pick<Chapter, 'number' | 'place' | 'period'> }) {
  return (
    <div className="chapter-header">
      <span className="chapter-header__rule" data-reveal="rule" />
      <p className="chapter-header__labels" data-reveal="labels">
        <span>{chapter.number}</span>
        <span>{chapter.place}</span>
        <span>{chapter.period}</span>
      </p>
    </div>
  )
}
