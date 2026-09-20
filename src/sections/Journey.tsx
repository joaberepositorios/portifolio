import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { SectionHead } from '../components/SectionHead'
import { journey } from '../content/journey'
import type { Milestone } from '../content/types'
import { useMediaQuery, useReducedMotion } from '../hooks/useMediaQuery'
import './Journey.css'

interface Point {
  x: number
  y: number
}

const CURVE_HEIGHT = 120
const NODE_INSET = 7
/** Repouso extra no primeiro lugar, em frações da altura da tela. */
const LEAD = 0.3

/** Um nó por lugar, a um "passo" de distância do anterior, subindo e descendo suavemente. */
function nodes(count: number, step: number): Point[] {
  return Array.from({ length: count }, (_, i) => ({
    x: i * step + NODE_INSET,
    y: i % 2 === 0 ? 74 : 38,
  }))
}

/** Curva suave que passa pelos pontos, entrando e saindo de cada um na horizontal. */
function curve(points: Point[]): string {
  return points.reduce((d, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = points[i - 1]
    const mid = (prev.x + p.x) / 2
    return `${d} C ${mid} ${prev.y}, ${mid} ${p.y}, ${p.x} ${p.y}`
  }, '')
}

/**
 * Telas largas: a seção fica presa na tela e a rolagem percorre os lugares, um por vez — o
 * caminho desliza sob um ponto fixo, a linha se desenha até o lugar atual e o cartão dele acende.
 * Cada lugar é uma parada (ver `data-scrub-steps` em lib/scrub.ts), então a lista pode crescer.
 *
 * Telas estreitas, janelas baixas ou "movimento reduzido": linha do tempo vertical, sem prender.
 */
export function Journey() {
  const { milestones, lead } = journey
  const count = milestones.length
  const roomy = useMediaQuery('(min-width: 900px) and (min-height: 620px)')
  const reducedMotion = useReducedMotion()
  const pinned = roomy && !reducedMotion && count > 1

  const railRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const resize = new ResizeObserver(() => setWidth(rail.clientWidth))
    resize.observe(rail)
    return () => resize.disconnect()
  }, [])

  // O lugar atual não fica colado à margem: entra um quarto da largura para dentro, mais ao centro.
  const offset = Math.round(width * 0.24)
  // Distância entre um lugar e o seguinte: o próximo já aparece, apagado, à direita.
  const step = Math.round(Math.min(Math.max(width * 0.56, 440), 680))
  // A linha chega de fora da tela, pela esquerda.
  const leadIn = offset + 480
  const points = pinned && width ? nodes(count, step) : []
  const first = points[0]
  const last = points[points.length - 1]

  // Limiar da linha do tempo vertical: em que ponto do progresso cada etapa acende (teto 0,8).
  const reach = (i: number) => ((i + 0.5) / (count + 1)) * 0.8

  return (
    <section id="jornada" className="section journey" aria-labelledby="jornada-title" data-pin={pinned || undefined}>
      <div
        className="journey__pin"
        data-scrub
        data-scrub-start="0.88"
        data-scrub-end="0.4"
        data-scrub-span={pinned ? 'pin' : undefined}
        data-scrub-steps={pinned ? count : undefined}
        // O primeiro lugar ganha um trecho extra de repouso (o mesmo valor entra na altura, no CSS).
        data-scrub-lead={pinned ? LEAD : undefined}
        style={{ '--n': count, '--lead': LEAD, '--step': `${step}px`, '--offset': `${offset}px` } as CSSProperties}
      >
        <div className="journey__sticky">
          <div className="container">
            <SectionHead titleId="jornada-title" title="Trabalho" lead={lead} />

            <div ref={railRef} className="journey__rail">
              <div className="journey__track">
                {first && last && (
                  <div className="journey__curve" aria-hidden="true">
                    <svg width={last.x + NODE_INSET} height={CURVE_HEIGHT}>
                      {/* De onde a linha vem, o caminho todo (apagado), o trecho já percorrido e o que vem depois. */}
                      <path d={curve([{ x: -leadIn, y: first.y + 26 }, first])} className="journey__line journey__line--lead" />
                      <path d={curve(points)} className="journey__line journey__line--ghost" />
                      <path d={curve(points)} pathLength={1} className="journey__line" />
                      <path d={curve([last, { x: last.x + step * 0.7, y: last.y - 24 }])} className="journey__line journey__line--ahead" />
                      {points.map((p, i) => (
                        <g key={i} className="journey__node" style={{ '--i': i } as CSSProperties}>
                          <line x1={p.x} y1={p.y} x2={p.x} y2={CURVE_HEIGHT} />
                          <circle cx={p.x} cy={p.y} r="4.5" />
                        </g>
                      ))}
                    </svg>
                    {/* O ponto que viaja sobre a curva (na tela ele fica parado: é o caminho que desliza). */}
                    <span className="journey__traveller" style={{ offsetPath: `path('${curve(points)}')` }} />
                  </div>
                )}

                <ol className="journey__list">
                  {milestones.map((milestone, i) => (
                    <li key={i} className="journey__item" style={{ '--i': i, '--t': reach(i).toFixed(3) } as CSSProperties}>
                      <Place milestone={milestone} />
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Um traço por lugar: mostra quantos são e em qual se está. */}
            {pinned && (
              <div className="journey__pager" aria-hidden="true">
                {milestones.map((_, i) => (
                  <span key={i} style={{ '--i': i } as CSSProperties} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Place({ milestone }: { milestone: Milestone }) {
  return (
    <>
      <div className="journey__logo">
        {milestone.logo ? (
          <img src={milestone.logo} alt="" decoding="async" />
        ) : (
          <span className="journey__wordmark">{milestone.wordmark ?? milestone.period}</span>
        )}
      </div>
      {/* A sigla só aparece quando acrescenta algo ao título. */}
      {milestone.period !== milestone.title && <p className="journey__period">{milestone.period}</p>}
      <h3 className="journey__title">{milestone.title}</h3>
      <p className="journey__org">{milestone.organization}</p>
      {milestone.summary && <p className="journey__summary">{milestone.summary}</p>}
    </>
  )
}
