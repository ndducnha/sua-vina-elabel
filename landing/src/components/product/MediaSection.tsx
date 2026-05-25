import {
  ExternalLinkIcon,
  FileTextIcon,
  ImageMediaIcon,
  VideoIcon,
} from '../common/ProductIcons'
import { getYoutubeId, groupMediaLinks } from '../../lib/product'
import type { ProductData } from '../../models/product'

interface MediaSectionProps {
  product: ProductData
  title: string
  imagesTitle: string
  videosTitle: string
  docsTitle: string
}

export function MediaSection({
  product,
  title,
  imagesTitle,
  videosTitle,
  docsTitle,
}: MediaSectionProps) {
  const { documents, images, videos } = groupMediaLinks(product.mediaLinks)

  if (product.mediaLinks.length === 0) {
    return null
  }

  return (
    <section className="border-t border-[#e0e0e0] px-5 py-[1.15rem] sm:px-6">
      <h2 className="mb-[0.85rem] text-[0.82rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">
        {title}
      </h2>

      {images.length > 0 ? (
        <div>
          <div className="mb-[0.8rem] flex items-center gap-2 text-[#1a1a2e]">
            <ImageMediaIcon />
            <h3 className="m-0 text-[0.9rem] font-semibold">{imagesTitle}</h3>
          </div>

          {images.map((image) => (
            <a
              className="mt-3 block overflow-hidden rounded-xl border border-[#e0e0e0] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(43,57,144,0.18)] hover:shadow-[0_8px_24px_rgba(18,28,80,0.08)] first:mt-0"
              href={image.url}
              key={image.url}
              rel="noreferrer"
              target="_blank"
            >
              <div className="overflow-hidden bg-[#f5f6fa]">
                <img
                  alt={image.title}
                  className="h-48 w-full object-cover transition duration-300 hover:scale-[1.04]"
                  loading="lazy"
                  src={image.url}
                />
              </div>
              <div className="px-4 py-3 text-[0.88rem] text-[#1a1a2e]">{image.title}</div>
            </a>
          ))}
        </div>
      ) : null}

      {videos.length > 0 ? (
        <div className="mt-[1.4rem]">
          <div className="mb-[0.8rem] flex items-center gap-2 text-[#1a1a2e]">
            <VideoIcon color="#e53935" />
            <h3 className="m-0 text-[0.9rem] font-semibold">{videosTitle}</h3>
          </div>

          {videos.map((video) => {
            const youtubeId = getYoutubeId(video.url)

            if (youtubeId) {
              return (
                <article
                  className="mt-3 overflow-hidden rounded-xl border border-[#e0e0e0] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(43,57,144,0.18)] hover:shadow-[0_8px_24px_rgba(18,28,80,0.08)] first:mt-0"
                  key={video.url}
                >
                  <div className="relative w-full bg-slate-900 pb-[56.25%]">
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full border-0"
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title={video.title}
                    />
                  </div>
                  <div className="px-4 py-3 text-[0.88rem] text-[#1a1a2e]">{video.title}</div>
                </article>
              )
            }

            return (
              <article
                className="mt-3 overflow-hidden rounded-xl border border-[#e0e0e0] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(43,57,144,0.18)] hover:shadow-[0_8px_24px_rgba(18,28,80,0.08)] first:mt-0"
                key={video.url}
              >
                <a
                  className="flex items-center gap-3 p-4"
                  href={video.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.8rem] bg-[rgba(229,57,53,0.1)] text-[#e53935]"
                  >
                    <VideoIcon size={24} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[0.95rem] font-semibold text-[#1a1a2e]">{video.title}</p>
                    <p className="mt-0.5 truncate text-[0.75rem] text-[#6b7280]">{video.url}</p>
                  </div>

                  <ExternalLinkIcon className="text-[#c9ced9]" />
                </a>
              </article>
            )
          })}
        </div>
      ) : null}

      {documents.length > 0 ? (
        <div className="mt-[1.4rem]">
          <div className="mb-[0.8rem] flex items-center gap-2 text-[#1a1a2e]">
            <FileTextIcon />
            <h3 className="m-0 text-[0.9rem] font-semibold">{docsTitle}</h3>
          </div>

          {documents.map((documentItem) => (
            <a
              className="mt-3 flex items-center gap-3 overflow-hidden rounded-xl border border-[#e0e0e0] bg-white p-[0.9rem] transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(43,57,144,0.18)] hover:shadow-[0_8px_24px_rgba(18,28,80,0.08)] first:mt-0"
              href={documentItem.url}
              key={documentItem.url}
              rel="noreferrer"
              target="_blank"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-[2.65rem] w-[2.65rem] shrink-0 items-center justify-center rounded-[0.7rem] bg-[#e8eaf6] text-[#2b3990]"
              >
                <FileTextIcon size={20} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="m-0 text-[0.95rem] font-semibold text-[#1a1a2e]">{documentItem.title}</p>
                <p className="mt-0.5 text-[0.76rem] text-[#6b7280]">PDF</p>
              </div>

              <ExternalLinkIcon className="text-[#c9ced9]" />
            </a>
          ))}
        </div>
      ) : null}
    </section>
  )
}