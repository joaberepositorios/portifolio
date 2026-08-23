/* Medidas da página em cache.

   Ler `getBoundingClientRect` dentro do laço de animação força o navegador a
   recalcular o layout a cada quadro. Aqui as medidas são tiradas fora do laço —
   ao carregar, ao redimensionar e quando o conteúdo muda de altura — e os laços
   só consultam números já prontos. */

(function (P) {
  'use strict';

  const boxes = new Map();
  let queued = false;

  const page = { height: 0, viewport: 0, max: 0 };

  /** Passa a acompanhar um elemento; devolve a caixa (atualizada no lugar). */
  function watch(element) {
    let box = boxes.get(element);
    if (!box) {
      box = { top: 0, height: 0, bottom: 0 };
      boxes.set(element, box);
      measure(element, box);
    }
    return box;
  }

  function measure(element, box) {
    const rect = element.getBoundingClientRect();
    box.top = rect.top + scrollY;
    box.height = rect.height;
    box.bottom = box.top + rect.height;
  }

  function remeasure() {
    page.viewport = innerHeight;
    page.height = document.documentElement.scrollHeight;
    page.max = Math.max(0, page.height - page.viewport);
    for (const [element, box] of boxes) measure(element, box);
  }

  /** Agrupa várias solicitações no mesmo quadro. */
  function invalidate() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      remeasure();
    });
  }

  function observe() {
    remeasure();
    addEventListener('resize', invalidate, { passive: true });
    addEventListener('load', invalidate);
    if (document.fonts) document.fonts.ready.then(invalidate);
    if ('ResizeObserver' in window) new ResizeObserver(invalidate).observe(document.body);
  }

  P.geometry = { page, watch, remeasure, invalidate, observe };
})(window.Portfolio = window.Portfolio || {});
