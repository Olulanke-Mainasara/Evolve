/** Headline and lede as two grid children, marked for revealText(). */
export function ChapterText({ id, headline, lede }: { id?: string; headline: string; lede: string }) {
  return (
    <>
      <h2 id={id} className="chapter-text__headline" data-reveal="headline">
        {headline}
      </h2>
      <p className="chapter-text__lede" data-reveal="lede">
        {lede}
      </p>
    </>
  )
}
