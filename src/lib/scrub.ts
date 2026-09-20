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
 *
 * O valor é suavizado (persegue o alvo a cada quadro), o que dá a sensação fluida.
 * Todo o CSS usa `var(--p, 1)`: sem JavaScript, ou com "movimento reduzido", tudo
 * aparece pronto.
 */
export function initScrub(): () => void {
  const elements = [...document.querySelectorAll<HTMLElement>('[data-scrub]')]

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const el of elements) el.style.setProperty('--p', '1')
    return () => {}
  }

  const items = elements.map((el) => ({
    el,
    start: Number(el.dataset.scrubStart ?? 0.92),
    end: Number(el.dataset.scrubEnd ?? 0.45),
    current: 0,
    target: 0,
  }))
  for (const { el } of items) el.style.setProperty('--p', '0')

  let raf = 0

  const measure = () => {
    const vh = window.innerHeight
    for (const item of items) {
      const top = item.el.getBoundingClientRect().top
      item.target = Math.min(Math.max((item.start * vh - top) / ((item.start - item.end) * vh), 0), 1)
    }
  }

  const tick = () => {
    raf = 0
    measure()
    let moving = false
    for (const item of items) {
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

  window.addEventListener('scroll', request, { passive: true })
  window.addEventListener('resize', request)
  request()

  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('scroll', request)
    window.removeEventListener('resize', request)
    for (const { el } of items) el.style.removeProperty('--p')
  }
}
