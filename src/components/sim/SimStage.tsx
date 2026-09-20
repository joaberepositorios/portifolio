import { useEffect, useRef, useState } from 'react'
import { scrollTop } from '../../lib/measure'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { HeroScene } from '../HeroScene'
import type { SimHandle } from './simulation'
import './SimStage.css'

type Status = 'loading' | 'ready' | 'failed'

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/**
 * Hospeda a simulação 3D do hero.
 * Sem WebGL, cai para o desenho SVG (HeroScene). A simulação pausa fora da tela
 * e com a aba oculta; com "movimento reduzido", mostra um único quadro parado.
 */
export function SimStage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<Status>('loading')
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return

    let handle: SimHandle | null = null
    let cancelled = false

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') handle?.setPointer((e.clientX / window.innerWidth) * 2 - 1)
    }
    const onScroll = () => handle?.setScroll(Math.min(Math.max(scrollTop() / (window.innerHeight * 0.8), 0), 1))
    const visibility = new IntersectionObserver(([entry]) => handle?.setVisible(entry.isIntersecting))

    import('./simulation')
      .then(({ createSimulation }) => {
        if (cancelled) return
        handle = createSimulation(canvas, {
          ink: cssVar('--text'),
          accent: cssVar('--accent'),
          reducedMotion,
        })
        window.addEventListener('pointermove', onPointer, { passive: true })
        window.addEventListener('scroll', onScroll, { passive: true })
        onScroll()
        visibility.observe(stage)
        setStatus('ready')
      })
      .catch((error) => {
        console.warn('[portfolio] 3D indisponível — exibindo o desenho estático.', error)
        if (!cancelled) setStatus('failed')
      })

    return () => {
      cancelled = true
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', onScroll)
      visibility.disconnect()
      handle?.dispose()
    }
  }, [reducedMotion])

  if (status === 'failed') return <HeroScene />

  return (
    <div ref={stageRef} className="sim" data-status={status}>
      <canvas
        ref={canvasRef}
        className="sim__canvas"
        role="img"
        aria-label="Simulação de um robô quadrúpede andando em trote por um ambiente virtual em grade, com varredura de LiDAR"
      />
    </div>
  )
}
