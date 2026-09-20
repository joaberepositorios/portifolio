/**
 * Animações conduzidas pela rolagem.
 *
 * Cada elemento com `data-scrub` recebe a variável CSS `--p`, que vai de 0 a 1
 * enquanto ele atravessa uma faixa da tela; o CSS decide o que fazer com ela
 * (desenhar um traço, abrir uma cortina, montar letras…). Rolar para cima desfaz.
 *
 *   data-scrub                 → participa
 *   data-scrub-start="0.92"    → --p = 0 quando o topo do elemento está a 92% da altura da tela
 *   data-scrub-end="0.45"      → --p = 1 quando o topo chega a 45%
 *   data-scrub-touch="step"    → em telas de toque, --p só vale 0 ou 1 (vira 1 quando o elemento
 *                                entra na tela) e o CSS anima com `transition`. No celular a rolagem
 *                                roda na GPU; uma transição também, enquanto escrever --p a cada
 *                                quadro ocupa a thread principal — pesado demais com imagens grandes.
 *
 * O valor é suavizado (persegue o alvo a cada quadro), o que dá a sensação fluida.
 * As posições são medidas fora da rolagem (ver `measure.ts`): a cada quadro só há contas
 * e escritas, nenhuma leitura de layout.
 * Todo o CSS usa `var(--p, 1)`: sem JavaScript, ou com "movimento reduzido", tudo
 * aparece pronto.
 */
import { measureBox, onLayoutChange, scrollTop } from './measure'

export function initScrub(): () => void {
  const elements = [...document.querySelectorAll<HTMLElement>('[data-scrub]')]

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const el of elements) el.style.setProperty('--p', '1')
    return () => {}
  }

  const touch = !matchMedia('(hover: hover) and (pointer: fine)').matches

  const items = elements.map((el) => ({
    el,
    step: touch && el.dataset.scrubTouch === 'step',
    start: Number(el.dataset.scrubStart ?? 0.92),
    end: Number(el.dataset.scrubEnd ?? 0.45),
    top: 0,
    current: 0,
    target: 0,
  }))
  for (const { el } of items) el.style.setProperty('--p', '0')

  let raf = 0

  let vh = window.innerHeight

  const aim = () => {
    const scroll = scrollTop()
    for (const item of items) {
      const top = item.top - scroll
      item.target = Math.min(Math.max((item.start * vh - top) / ((item.start - item.end) * vh), 0), 1)
    }
  }

  const tick = () => {
    raf = 0
    aim()
    let moving = false
    for (const item of items) {
      if (item.step) {
        // Liga pouco depois de entrar na tela; só desliga quando volta a sair por baixo.
        const next = item.target > 0.12 ? 1 : item.target === 0 ? 0 : item.current
        if (next !== item.current) {
          item.current = next
          item.el.style.setProperty('--p', String(next))
        }
        continue
      }
      const delta = item.target - item.current
      if (Math.abs(delta) < 0.0015) {
        if (item.current !== item.target) {
          item.current = item.target
          item.el.style.setProperty('--p', item.current.toFixed(4))
        }
        continue
      }
      item.current += delta * 0.14
      item.el.style.setProperty('--p', item.current.toFixed(4))
      moving = true
    }
    if (moving) raf = requestAnimationFrame(tick)
  }

  const request = () => {
    if (!raf) raf = requestAnimationFrame(tick)
  }

  const stopMeasuring = onLayoutChange(() => {
    vh = window.innerHeight
    for (const item of items) item.top = measureBox(item.el).top
    request()
  })
  for (const item of items) item.top = measureBox(item.el).top

  window.addEventListener('scroll', request, { passive: true })
  request()

  return () => {
    cancelAnimationFrame(raf)
    stopMeasuring()
    window.removeEventListener('scroll', request)
    for (const { el } of items) el.style.removeProperty('--p')
  }
}
