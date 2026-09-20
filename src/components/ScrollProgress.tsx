import { useEffect, useRef, useState } from 'react'
import { SECTION_IDS } from '../content/site'
import { scrollTop } from '../lib/measure'
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
  // Altura rolável da página: medida fora da rolagem (`scrollHeight` a cada quadro força o layout).
  const maxRef = useRef(0)

  // Onde cada seção começa, como fração da rolagem total.
  useEffect(() => {
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      maxRef.current = max
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
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const page = document.documentElement
    return onScrollFrame(() => {
      const max = maxRef.current
      const progress = max > 0 ? Math.min(Math.max(scrollTop() / max, 0), 1) : 0
      root.style.setProperty('--progress', progress.toFixed(4))
      const pageEnd = progress > 0.985 ? 'true' : 'false'
      if (page.dataset.pageEnd !== pageEnd) page.dataset.pageEnd = pageEnd
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
