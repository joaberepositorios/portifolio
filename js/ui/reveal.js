/* Revelação dos blocos ao entrar em tela.
   Um IntersectionObserver por elemento, sem consulta de layout no laço de animação. */

(function (P) {
  'use strict';

  const { qsa } = P.dom;

  /* Duração da entrada (transform 1s) mais a folga do atraso: passado isso o
     elemento é marcado como assentado e o transform deixa de ser animado, para o
     parallax responder no mesmo quadro. */
  const SETTLE = 1100;

  function show(element) {
    const delay = Number(element.dataset.revealDelay) || 0;
    element.style.setProperty('--d', `${delay}ms`);
    element.classList.add('is-in');
    setTimeout(() => element.classList.add('is-settled'), SETTLE + delay);
  }

  function init() {
    const targets = qsa('[data-reveal]');

    if (!('IntersectionObserver' in window)) {
      targets.forEach(show);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    targets.forEach((element) => observer.observe(element));

    /* rede de segurança: se algo já estiver em tela quando a página terminar de carregar,
       não fica invisível esperando um cruzamento que não vai acontecer */
    addEventListener('load', () => {
      for (const element of qsa('[data-reveal]:not(.is-in)')) {
        const rect = element.getBoundingClientRect();
        if (rect.top < innerHeight * 0.96 && rect.bottom > 0) show(element);
      }
    });
  }

  P.reveal = { init };
})(window.Portfolio = window.Portfolio || {});
