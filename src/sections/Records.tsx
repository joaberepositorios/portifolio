import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Reveal } from '../components/Reveal'
import { SectionHead } from '../components/SectionHead'
import { articles, certificates } from '../content/records'
import type { Article, Certificate } from '../content/types'
import { articleHref } from '../hooks/useArticleRoute'
import { formatDate, formatMonth } from '../lib/format'
import { lockScroll } from '../lib/scroll'
import './Records.css'

export function Records({ onOpenArticle }: { onOpenArticle: (slug: string) => void }) {
  const hasCertificates = certificates.length > 0
  const [viewing, setViewing] = useState<Certificate | null>(null)

  return (
    <section id="artigos" className="section records" aria-labelledby="artigos-title">
      <div className="container">
        <SectionHead
          titleId="artigos-title"
          title="Artigos & Certificados"
          lead="O que escrevi sobre o trabalho, e a formação por trás dele."
        />

        {/* Layout em "L": os artigos flutuam à esquerda e os certificados correm em volta —
            descem pela direita e, quando os artigos acabam, passam a ocupar também o espaço de baixo. */}
        <div className="records__flow" data-single={!hasCertificates || undefined}>
          <Reveal className="records__articles">
            <h3 className="records__heading">Artigos</h3>
            <ol className="records__list">
              {articles.map((article) => (
                <li key={article.slug} data-scrub data-scrub-start="0.97" data-scrub-end="0.72">
                  <ArticleRow article={article} onOpen={onOpenArticle} />
                </li>
              ))}
            </ol>
          </Reveal>

          {/* A coluna só aparece quando há certificados cadastrados em content/records.ts. */}
          {hasCertificates && (
            <>
              <h3 className="records__heading records__heading--certificates">Certificados</h3>
              <ol className="records__list records__certificates">
                {certificates.map((certificate, i) => (
                  <li key={i} data-scrub data-scrub-start="0.97" data-scrub-end="0.72">
                    <CertificateRow certificate={certificate} onView={() => setViewing(certificate)} />
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>

      <CertificateViewer certificate={viewing} onClose={() => setViewing(null)} />
    </section>
  )
}

function ArticleRow({ article, onOpen }: { article: Article; onOpen: (slug: string) => void }) {
  const external = Boolean(article.externalUrl)
  const readable = Boolean(article.body?.length)

  const meta = [article.venue, article.date && formatDate(article.date), article.readingMinutes && `${article.readingMinutes} min de leitura`]
    .filter(Boolean)
    .join(' · ')

  const content: ReactNode = (
    <>
      {article.cover && (
        <span className="record__cover">
          <img src={article.cover} alt="" loading="lazy" decoding="async" />
        </span>
      )}
      <span className="record__main">
        {meta && <span className="record__meta">{meta}</span>}
        <span className="record__title">{article.title}</span>
        {article.description && <span className="record__text">{article.description}</span>}
      </span>
    </>
  )

  // Só em exibição: sem link externo e sem texto para o leitor interno.
  if (!external && !readable) {
    return (
      <div className="record" data-cover={Boolean(article.cover) || undefined}>
        {content}
      </div>
    )
  }

  const handleClick = (event: MouseEvent) => {
    // Links externos e cliques modificados (nova aba…) ficam por conta do navegador.
    if (external || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    onOpen(article.slug)
  }

  return (
    <a
      className="record record--link"
      data-cover={Boolean(article.cover) || undefined}
      href={article.externalUrl ?? articleHref(article.slug)}
      onClick={handleClick}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {content}
      <span className="record__arrow arrow" aria-hidden="true">
        {external ? '↗' : '→'}
      </span>
      {external && <span className="visually-hidden"> (abre em nova aba)</span>}
    </a>
  )
}

function CertificateRow({ certificate, onView }: { certificate: Certificate; onView: () => void }) {
  const stacked = (certificate.count ?? 1) > 1
  const isoDate = /^\d{4}-\d{2}$/.test(certificate.date)

  return (
    <div className="record" data-cover={Boolean(certificate.image) || undefined} data-landscape>
      {certificate.image && (
        <span className="record__stack" data-stacked={stacked || undefined}>
          {/* A mesma imagem, repetida atrás: o certificado foi obtido mais de uma vez. */}
          {stacked && (
            <span className="record__cover record__cover--behind" aria-hidden="true">
              <img src={certificate.image} alt="" loading="lazy" decoding="async" />
            </span>
          )}
          <button type="button" className="record__cover record__cover--button" onClick={onView}>
            <img src={certificate.image} alt="" loading="lazy" decoding="async" />
            <span className="visually-hidden">Ampliar o certificado: {certificate.title}</span>
          </button>
          {stacked && (
            <span className="record__count" aria-hidden="true">
              {certificate.count}×
            </span>
          )}
        </span>
      )}
      <span className="record__main">
        <span className="record__meta">
          {isoDate ? <time dateTime={certificate.date}>{formatMonth(certificate.date)}</time> : certificate.date}
          {stacked && <span className="visually-hidden"> — obtido {certificate.count} vezes</span>}
        </span>
        <span className="record__title record__title--small">{certificate.title}</span>
        <span className="record__text">{certificate.issuer}</span>
        {certificate.verifyUrl && (
          <a className="record__verify more" href={certificate.verifyUrl} target="_blank" rel="noopener noreferrer">
            Verificar{certificate.credentialId ? ` · código ${certificate.credentialId}` : ''}
            <span className="arrow" aria-hidden="true">
              ↗
            </span>
            <span className="visually-hidden"> (abre em nova aba)</span>
          </a>
        )}
      </span>
    </div>
  )
}

/** Ampliação do certificado num <dialog> nativo: Esc fecha, o foco volta sozinho ao botão. */
function CertificateViewer({ certificate, onClose }: { certificate: Certificate | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog || !certificate) return
    dialog.showModal()
    const unlock = lockScroll()
    return () => {
      unlock()
      dialog.close()
    }
  }, [certificate])

  return (
    <dialog
      ref={ref}
      className="viewer"
      aria-label={certificate ? `Certificado: ${certificate.title}` : undefined}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      data-lenis-prevent
    >
      {certificate?.image && (
        <figure>
          <img src={certificate.image} alt={`Certificado: ${certificate.title}`} />
          <figcaption>
            <span>
              {certificate.title}
              {(certificate.count ?? 1) > 1 ? ` · ${certificate.count}× (${certificate.date})` : ''}
            </span>
            <button type="button" className="viewer__close" onClick={onClose}>
              Fechar
            </button>
          </figcaption>
        </figure>
      )}
    </dialog>
  )
}
