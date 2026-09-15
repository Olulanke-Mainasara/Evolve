interface ChapterTextProps {
  id?: string
  headline: string
  lede: string
  /** Which parts revealText() animates on scroll-in; pinned chapters animate the rest in their timeline. */
  reveal?: 'all' | 'headline' | 'none'
}

/** Headline and lede as two grid children, marked for revealText(). */
export function ChapterText({ id, headline, lede, reveal = 'all' }: ChapterTextProps) {
  return (
    <>
      <h2 id={id} className="chapter-text__headline" data-reveal={reveal === 'none' ? undefined : 'headline'}>
        {headline}
      </h2>
      <p className="chapter-text__lede" data-reveal={reveal === 'all' ? 'lede' : undefined}>
        {lede}
      </p>
    </>
  )
}
