import { measureBox, onLayoutChange, scrollTop } from './measure'
import { onScrollFrame } from './scroll'

/**
 * Parallax leve, guiado pela rolagem. Qualquer elemento pode participar:
 *
 *   data-parallax="0.12"        → desloca conforme a distância do elemento ao centro da tela
 *                                 (positivo = "mais ao fundo": demora mais para passar;
 *                                  negativo = "mais à frente": passa mais rápido)
 *   data-parallax-from="top"    → desloca conforme o quanto a página rolou (para o hero)
 *   data-parallax-fade          → além de deslocar, esmaece ao sair (só com from="top")
 *
 * Um único listener por quadro cuida de todos. Elementos fora da tela são ignorados.
 * As posições são medidas fora da rolagem (ver `measure.ts`); a cada quadro só há escritas.
 * Desligado com "movimento reduzido".
 */
export function initParallax(): () => void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const items = [...document.querySelectorAll<HTMLElement>('[data-parallax]')].map((el) => ({
    el,
    speed: Number(el.dataset.parallax) || 0,
    fromTop: el.dataset.parallaxFrom === 'top',
    fade: el.hasAttribute('data-parallax-fade'),
    top: 0,
    height: 0,
    shift: NaN,
    opacity: NaN,
  }))
  for (const { el } of items) el.style.willChange = 'transform'

  let vh = window.innerHeight
  const measure = () => {
    vh = window.innerHeight
    for (const item of items) if (!item.fromTop) Object.assign(item, measureBox(item.el))
  }
  measure()

  // Só escreve quando o valor muda de fato (arredondado a décimos de pixel).
  const move = (item: (typeof items)[number], shift: number) => {
    const rounded = Math.round(shift * 10) / 10
    if (rounded === item.shift) return
    item.shift = rounded
    item.el.style.transform = `translate3d(0, ${rounded}px, 0)`
  }

  const update = () => {
    const scroll = scrollTop()
    for (const item of items) {
      if (item.fromTop) {
        const y = Math.min(scroll, vh * 1.2)
        move(item, y * item.speed)
        if (item.fade) {
          const opacity = Math.round(Math.max(0, 1 - y / (vh * 0.7)) * 100) / 100
          if (opacity !== item.opacity) {
            item.opacity = opacity
            item.el.style.opacity = String(opacity)
          }
        }
        continue
      }
      const top = item.top - scroll
      if (top > vh + 200 || top + item.height < -200) continue
      move(item, (top + item.height / 2 - vh / 2) * item.speed)
    }
  }

  const stop = onScrollFrame(update)
  const stopMeasuring = onLayoutChange(() => {
    measure()
    update()
  })

  return () => {
    stop()
    stopMeasuring()
    for (const { el } of items) {
      el.style.transform = ''
      el.style.opacity = ''
      el.style.willChange = ''
    }
  }
}
