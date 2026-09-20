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
 * Desligado com "movimento reduzido".
 */
export function initParallax(): () => void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const items = [...document.querySelectorAll<HTMLElement>('[data-parallax]')].map((el) => ({
    el,
    speed: Number(el.dataset.parallax) || 0,
    fromTop: el.dataset.parallaxFrom === 'top',
    fade: el.hasAttribute('data-parallax-fade'),
    shift: 0,
  }))
  for (const { el } of items) el.style.willChange = 'transform'

  const stop = onScrollFrame(() => {
    const vh = window.innerHeight
    for (const item of items) {
      if (item.fromTop) {
        const y = Math.min(window.scrollY, vh * 1.2)
        item.el.style.transform = `translate3d(0, ${(y * item.speed).toFixed(1)}px, 0)`
        if (item.fade) item.el.style.opacity = String(Math.max(0, 1 - y / (vh * 0.7)))
        continue
      }
      // A posição "natural" do elemento é a atual menos o deslocamento que nós mesmos aplicamos.
      const rect = item.el.getBoundingClientRect()
      const top = rect.top - item.shift
      if (top > vh + 200 || top + rect.height < -200) continue
      item.shift = (top + rect.height / 2 - vh / 2) * item.speed
      item.el.style.transform = `translate3d(0, ${item.shift.toFixed(1)}px, 0)`
    }
  })

  return () => {
    stop()
    for (const { el } of items) {
      el.style.transform = ''
      el.style.opacity = ''
      el.style.willChange = ''
    }
  }
}
