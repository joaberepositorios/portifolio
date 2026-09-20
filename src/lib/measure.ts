/**
 * Posições medidas uma vez, fora da rolagem.
 *
 * Ler `getBoundingClientRect()` a cada quadro, no meio de escritas de estilo, obriga o
 * navegador a recalcular a página várias vezes por quadro — no celular, isso é um engasgo.
 * Aqui a posição de cada elemento no documento é guardada e só refeita quando o layout muda;
 * durante a rolagem basta subtrair `scrollY`.
 */

/**
 * `window.scrollY` também força o recálculo quando há estilos pendentes. Este valor é lido uma
 * vez, no próprio evento de rolagem (antes de qualquer escrita do quadro), e reaproveitado por todos.
 */
let scroll = -1
const readScroll = () => {
  scroll = window.scrollY
}
window.addEventListener('scroll', readScroll, { passive: true, capture: true })
window.addEventListener('resize', readScroll)

export function scrollTop(): number {
  if (scroll < 0) readScroll()
  return scroll
}

export interface Box {
  /** Distância do topo do elemento ao topo do documento, ignorando `transform`. */
  top: number
  height: number
}

export function measureBox(el: HTMLElement): Box {
  let top = 0
  for (let node: HTMLElement | null = el; node; node = node.offsetParent as HTMLElement | null) top += node.offsetTop
  return { top, height: el.offsetHeight }
}

/** Chama `callback` quando o layout da página pode ter mudado (tamanho, fontes, imagens). */
export function onLayoutChange(callback: () => void): () => void {
  let raf = 0
  const request = () => {
    if (!raf) {
      raf = requestAnimationFrame(() => {
        raf = 0
        callback()
      })
    }
  }

  const observer = new ResizeObserver(request)
  observer.observe(document.body)
  window.addEventListener('resize', request)
  window.addEventListener('load', request)
  void document.fonts?.ready.then(request)

  return () => {
    cancelAnimationFrame(raf)
    observer.disconnect()
    window.removeEventListener('resize', request)
    window.removeEventListener('load', request)
  }
}
