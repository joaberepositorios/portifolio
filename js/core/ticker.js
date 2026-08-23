/* Um único requestAnimationFrame para o site inteiro.
   Cada assinante recebe o passo de tempo real (dt, em segundos) e o carimbo do quadro —
   assim o movimento não depende da taxa de quadros e não há laços concorrentes. */

(function (P) {
  'use strict';

  const subscribers = new Set();
  let last = 0;
  let running = false;

  function frame(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
    last = now;

    for (const fn of subscribers) fn(dt, now);

    if (subscribers.size) requestAnimationFrame(frame);
    else running = false;
  }

  /** Registra um passo do laço; devolve a função que o cancela. */
  function onFrame(fn) {
    subscribers.add(fn);
    if (!running) {
      running = true;
      last = 0;
      requestAnimationFrame(frame);
    }
    return () => subscribers.delete(fn);
  }

  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  P.ticker = { onFrame, prefersReducedMotion };
})(window.Portfolio = window.Portfolio || {});
