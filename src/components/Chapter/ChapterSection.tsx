import { useRef } from 'react'
import type { Chapter } from '../../content/chapters'
import { ChapterHeader } from './ChapterHeader'
import { ChapterText } from './ChapterText'
import { groundChange } from './chapterScroll'
import { Photo } from './Photo'
import { useChapter } from './useChapter'
import './Chapter.css'

/** Plain layout for any chapter that doesn't have its own component yet. */
export function ChapterSection({ chapter, index }: { chapter: Chapter; index: number }) {
  const ref = useRef<HTMLElement>(null)
  const titleId = `${chapter.id}-title`

  useChapter(ref, index, (section, reduce) => {
    const aftermath = section.querySelector('[data-beat="aftermath"]')
    if (aftermath) groundChange(aftermath, chapter.ground, 'theme', reduce)
  })

  return (
    <section ref={ref} className="chapter" data-ground={chapter.ground} aria-labelledby={titleId}>
      <div className="chapter__grid" data-beat="main">
        <ChapterHeader chapter={chapter} />
        <ChapterText id={titleId} headline={chapter.headline} lede={chapter.lede} />
      </div>

      {chapter.photos.length > 0 && (
        <div className="chapter__grid chapter__media">
          {chapter.photos.map((photo) => (
            <Photo key={photo.file} photo={photo} sizes="(max-width: 800px) 100vw, 50vw" />
          ))}
        </div>
      )}

      {chapter.exhibits && (
        <div className="chapter__grid chapter__media">
          {chapter.exhibits.map((exhibit) => (
            <article key={exhibit.title} className="chapter__exhibit">
              {exhibit.photo && <Photo photo={exhibit.photo} sizes="(max-width: 800px) 100vw, 33vw" />}
              <h3 className="chapter__exhibit-title">{exhibit.title}</h3>
              <p className="chapter__exhibit-text">{exhibit.text}</p>
            </article>
          ))}
        </div>
      )}

      {chapter.aftermath && (
        <div className="chapter__grid chapter__aftermath" data-beat="aftermath" data-ground="theme">
          <ChapterText headline={chapter.aftermath.headline} lede={chapter.aftermath.lede} />
        </div>
      )}

      {chapter.closing && <p className="chapter__closing">{chapter.closing}</p>}
    </section>
  )
}
