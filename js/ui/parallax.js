/* Parallax por camadas.

   Cada elemento com `data-parallax="fator"` desliza em relação ao centro da tela:
   quanto maior o fator, mais a camada se atrasa em relação à rolagem. O valor sai
   como a variável `--py`, que o CSS soma ao deslocamento da revelação — assim os
   dois efeitos convivem no mesmo transform, sem um apagar o outro.

   Como as medidas vêm do cache de `core/geometry.js`, o laço não consulta layout. */

(function (P) {
  'use strict';

  const { qsa } = P.dom;
  const { onFrame, prefersReducedMotion } = P.ticker;
  const { scroll } = P.scroll;
  const { page, watch } = P.geometry;

  /* Limite de deslocamento. Camadas de conteúdo andam pouco, porque o parallax
     move a pintura mas não o espaço: passar disso encosta no vizinho. Elementos
     puramente decorativos (`data-parallax-free`) podem ir bem mais longe, já que
     estão fora do fluxo. */
  const MAX = 80;
  const MAX_FREE = 260;

  function init() {
    if (prefersReducedMotion) return;

    const layers = qsa('[data-parallax]').map((element) => ({
      element,
      box: watch(element),
      factor: parseFloat(element.dataset.parallax) || 0.06,
      limite: element.dataset.parallaxFree !== undefined ? MAX_FREE : MAX,
      last: null
    }));

    if (!layers.length) return;

    onFrame(() => {
      const middle = scroll.y + page.viewport / 2;

      for (const layer of layers) {
        const center = layer.box.top + layer.box.height / 2;

        /* fora de vista não há o que atualizar */
        if (Math.abs(center - middle) > page.viewport * 1.6 + layer.box.height) continue;

        const shift = clampShift((middle - center) * layer.factor, layer.limite);
        if (layer.last !== null && Math.abs(shift - layer.last) < 0.25) continue;

        layer.last = shift;
        layer.element.style.setProperty('--py', `${shift.toFixed(1)}px`);
      }
    });
  }

  function clampShift(value, limite) {
    return value < -limite ? -limite : value > limite ? limite : value;
  }

  P.parallax = { init };
})(window.Portfolio = window.Portfolio || {});
