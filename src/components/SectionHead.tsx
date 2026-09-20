import type { CSSProperties, ReactNode } from 'react'

interface SectionHeadProps {
  titleId: string
  title: string
  lead?: string
  /** Conteúdo alinhado à direita. */
  action?: ReactNode
}

/**
 * Título de seção que se monta letra a letra conforme a rolagem (ver lib/scrub.ts).
 * Leitores de tela recebem o título inteiro; as letras soltas são decorativas.
 */
export function SectionHead({ titleId, title, lead, action }: SectionHeadProps) {
  const total = title.replace(/\s/g, '').length
  let index = 0

  return (
    <div className="section__head" data-scrub data-scrub-start="0.95" data-scrub-end="0.55">
      <div data-parallax="-0.05">
        <h2 id={titleId} className="section__title" aria-label={title}>
          {title.split(' ').map((word, w) => (
            <span key={w} className="section__word" aria-hidden="true">
              {[...word].map((char) => {
                const start = (index++ / total) * 0.62
                return (
                  <span key={index} className="section__char" style={{ '--s': start.toFixed(3) } as CSSProperties}>
                    {char}
                  </span>
                )
              })}
            </span>
          ))}
        </h2>
        {lead && <p className="section__lead">{lead}</p>}
      </div>
      {action}
    </div>
  )
}
