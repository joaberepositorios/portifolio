import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { SectionHead } from '../components/SectionHead'
import { journey } from '../content/journey'
import './Journey.css'

interface Point {
  x: number
  y: number
}

const CURVE_HEIGHT = 120
const LEAD_IN = 140

/** Um nó por etapa, no início de cada coluna, subindo e descendo suavemente. */
function nodes(count: number, width: number): Point[] {
  const column = width / count
  return Array.from({ length: count }, (_, i) => ({
    x: i * column + 7,
    y: (i % 2 === 0 ? 72 : 34) - i * 3,
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
 * Telas largas: a rolagem desenha uma linha curva através da seção; um ponto
 * viaja sobre ela e cada etapa acende quando ele chega ao seu nó.
 * Telas estreitas: a mesma lista vira uma linha do tempo vertical, que também
 * cresce com a rolagem.
 */
export function Journey() {
  const { milestones, lead } = journey
  const count = milestones.length
  const boxRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const resize = new ResizeObserver(() => setWidth(box.clientWidth))
    resize.observe(box)
    return () => resize.disconnect()
  }, [])

  const points = width ? nodes(count, width) : []
  const last = points[points.length - 1]
  const path = last ? curve([{ x: -LEAD_IN, y: points[0].y + 16 }, ...points]) : ''
  const ahead = last ? curve([last, { x: width + 40, y: last.y - 22 }]) : ''

  /**
   * Em que ponto do progresso (0–1) cada etapa começa a acender — aproximado pela posição
   * horizontal do nó. O teto é 0,8: a etapa leva ~0,11 de progresso para acender por completo,
   * então a última fica 100% visível bem antes do fim da rolagem (com 0,94 ela parava pela metade).
   */
  const reach = (i: number) => (last ? ((LEAD_IN + points[i].x) / (LEAD_IN + last.x)) * 0.8 : ((i + 0.5) / (count + 1)) * 0.8)

  return (
    <section id="jornada" className="section journey" aria-labelledby="jornada-title">
      <div className="container">
        <SectionHead titleId="jornada-title" title="Minha jornada" lead={lead} />

        <div className="journey__stage" data-scrub data-scrub-start="0.88" data-scrub-end="0.4">
          <div ref={boxRef} className="journey__curve" aria-hidden="true">
            {points.length > 0 && (
              <>
                <svg width={width} height={CURVE_HEIGHT} viewBox={`0 0 ${width} ${CURVE_HEIGHT}`}>
                  <path d={path} className="journey__line journey__line--ghost" />
                  <path d={path} pathLength={1} className="journey__line" />
                  <path d={ahead} className="journey__line journey__line--ahead" />
                  {points.map((p, i) => (
                    <g key={i} className="journey__node" style={{ '--t': reach(i).toFixed(3) } as CSSProperties}>
                      <line x1={p.x} y1={p.y} x2={p.x} y2={CURVE_HEIGHT} />
                      <circle cx={p.x} cy={p.y} r="4" />
                    </g>
                  ))}
                </svg>
                {/* O ponto que viaja sobre a curva. */}
                <span className="journey__traveller" style={{ offsetPath: `path('${path}')` }} />
              </>
            )}
          </div>

          <ol className="journey__list" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
            {milestones.map((milestone, i) => (
              <li key={i} className="journey__item" style={{ '--t': reach(i).toFixed(3) } as CSSProperties}>
                <p className="journey__period">{milestone.period}</p>
                <h3 className="journey__title">{milestone.title}</h3>
                <p className="journey__org">{milestone.organization}</p>
                {milestone.summary && <p className="journey__summary">{milestone.summary}</p>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
