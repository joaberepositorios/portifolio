import { useEffect, useRef } from 'react'
import { articles } from '../content/records'
import type { ArticleBlock } from '../content/types'
import { formatDate } from '../lib/format'
import { lockScroll } from '../lib/scroll'
import './ArticleReader.css'

interface ArticleReaderProps {
  slug: string
  onClose: () => void
  onNavigate: (slug: string) => void
}

const readable = articles.filter((a) => a.body && !a.externalUrl)

/** Full-screen reading view: one column, one scale, nothing else. */
export function ArticleReader({ slug, onClose, onNavigate }: ArticleReaderProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const index = readable.findIndex((a) => a.slug === slug)
  const article = readable[index]
  const next = readable.length > 1 ? readable[(index + 1) % readable.length] : null

  // Modal behaviour: freeze the page behind, move focus in, restore it on close.
  useEffect(() => {
    const page = document.getElementById('page')
    const previouslyFocused = document.activeElement as HTMLElement | null
    const unlock = lockScroll()
    page?.setAttribute('inert', '')
    closeRef.current?.focus()

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      unlock()
      page?.removeAttribute('inert')
      window.removeEventListener('keydown', onKey)
      // Deferred: going Back to a #hash URL makes the browser reset focus first.
      requestAnimationFrame(() => previouslyFocused?.focus?.({ preventScroll: true }))
    }
  }, [onClose])

  useEffect(() => {
    const scroller = scrollerRef.current
    const bar = progressRef.current
    if (!scroller || !bar) return
    scroller.scrollTop = 0
    const onScroll = () => {
      const max = scroller.scrollHeight - scroller.clientHeight
      bar.style.transform = `scaleX(${max > 0 ? scroller.scrollTop / max : 0})`
    }
    onScroll()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [slug])

  return (
    <div
      ref={scrollerRef}
      className="reader"
      role="dialog"
      aria-modal="true"
      aria-labelledby={article ? 'reader-title' : undefined}
      aria-label={article ? undefined : 'Artigo não encontrado'}
      data-lenis-prevent
    >
      <div className="reader__bar">
        <button ref={closeRef} type="button" className="reader__close" onClick={onClose}>
          <span className="arrow" aria-hidden="true">←</span> Voltar
        </button>
        <div ref={progressRef} className="reader__progress" aria-hidden="true" />
      </div>

      {article ? (
        <article key={slug} className="reader__article">
          <header className="reader__header">
            <p className="reader__meta">
              {[article.venue, article.date && formatDate(article.date), article.readingMinutes && `${article.readingMinutes} min de leitura`]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <h1 id="reader-title" className="reader__title">
              {article.title}
            </h1>
            {article.description && <p className="reader__lede">{article.description}</p>}
          </header>

          <div className="reader__body">
            {article.body?.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>

          {next && next.slug !== slug && (
            <footer className="reader__footer">
              <p>Próximo</p>
              <button type="button" className="reader__next" onClick={() => onNavigate(next.slug)}>
                {next.title} <span className="arrow" aria-hidden="true">→</span>
              </button>
            </footer>
          )}
        </article>
      ) : (
        <div className="reader__article">
          <h1 className="reader__title">Este artigo não existe.</h1>
        </div>
      )}
    </div>
  )
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case 'h2':
      return <h2>{block.text}</h2>
    case 'quote':
      return <blockquote>{block.text}</blockquote>
    case 'code':
      return (
        <pre tabIndex={0}>
          <code>{block.text}</code>
        </pre>
      )
    case 'list':
      return (
        <ul>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    default:
      return <p>{block.text}</p>
  }
}
