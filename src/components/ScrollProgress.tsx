import { useEffect, useRef, useState } from 'react'
import { SECTION_IDS } from '../content/site'
import { onScrollFrame } from '../lib/scroll'
import './ScrollProgress.css'

/**
 * Indicador de progresso: uma linha fina sob o cabeçalho cresce conforme a página
 * rola, com um marco para cada uma das cinco seções.
 * Também avisa quando a página chega ao fim (o botão do WhatsApp pulsa).
 */
export function ScrollProgress() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [marks, setMarks] = useState<number[]>([])

  // Onde cada seção começa, como fração da rolagem total.
  useEffect(() => {
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max <= 0) return
      setMarks(
        SECTION_IDS.map((id) => {
          const el = document.getElementById(id)
          return el ? Math.min(Math.max((el.offsetTop - 96) / max, 0), 1) : 0
        }),
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    return onScrollFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0
      root.style.setProperty('--progress', progress.toFixed(4))
      document.documentElement.dataset.pageEnd = progress > 0.985 ? 'true' : 'false'
    })
  }, [])

  return (
    <div ref={rootRef} className="progress" aria-hidden="true">
      <div className="progress__track">
        <div className="progress__fill" />
        {marks.map((m, i) => (
          <span key={i} className="progress__mark" style={{ left: `${m * 100}%` }} />
        ))}
      </div>
    </div>
  )
}
