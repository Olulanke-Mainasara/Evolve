import type { Photo as PhotoData } from '../../content/chapters'
import { photoSources } from '../../content/images'

interface PhotoProps {
  photo: PhotoData
  /** The <img> sizes attribute: how wide the photo renders at each breakpoint. */
  sizes: string
  className?: string
  loading?: 'lazy' | 'eager'
  showCaption?: boolean
}

export function Photo({ photo, sizes, className, loading = 'lazy', showCaption = true }: PhotoProps) {
  const sources = photoSources(photo.file)

  return (
    <figure className={className ? `photo ${className}` : 'photo'}>
      <picture>
        <source type="image/avif" srcSet={sources.avif} sizes={sizes} />
        <source type="image/webp" srcSet={sources.webp} sizes={sizes} />
        <img
          className="photo__img"
          src={sources.fallback}
          width={sources.width}
          height={sources.height}
          // Never stretched past its native resolution.
          style={{ maxWidth: sources.width }}
          alt={photo.alt}
          loading={loading}
          decoding="async"
        />
      </picture>
      {showCaption && photo.caption && <figcaption className="photo__caption">{photo.caption}</figcaption>}
    </figure>
  )
}
