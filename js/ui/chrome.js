/* Cromo da página: véu escuro da abertura e trilho da linha do tempo.
   Não há barra de menu — a navegação é a própria rolagem; o que sobra aqui são os
   efeitos de fundo, todos no mesmo laço e lendo só medidas em cache. */

(function (P) {
  'use strict';

  const { qs, qsa } = P.dom;
  const { onFrame } = P.ticker;
  const { scroll, scrollToElement } = P.scroll;
  const { page, watch } = P.geometry;
  const { clamp, opening, smoothstep } = P.ease;
  const { prefersReducedMotion } = P.ticker;

  /* quanto o nome anda contra o fundo, em pixels — pouco de propósito: é para
     sentir espaço, não para chamar atenção */
  const CONTRA = 3;

  function init() {
    const root = document.documentElement;
    const veil = qs('#pageDark');
    const railFill = qs('.timeline__fill');
    const timeline = watch(qs('#timeline'));

    const cabeca = qs('.intro-head');
    const ponteiro = seguirPonteiro();

    bindAnchors();

    onFrame(() => {
      paintDark(root, veil, scroll.y / page.viewport);
      paintRail(railFill, timeline);
      paintCabeca(cabeca, ponteiro);
    });
  }

  /* Um ouvinte, dois números. Quem desenha é o laço que já roda. */
  function seguirPonteiro() {
    const estado = { x: 0, y: 0 };
    if (prefersReducedMotion) return estado;

    addEventListener('pointermove', (event) => {
      estado.x = (event.clientX / innerWidth) * 2 - 1;
      estado.y = (event.clientY / innerHeight) * 2 - 1;
    }, { passive: true });

    return estado;
  }

  /* O nome desliza ao contrário dos planos de fundo, e só enquanto o escuro
     existe. Escrever no DOM custa recálculo, então só escreve quando move. */
  let ultimoX = 0;
  let ultimoY = 0;

  function paintCabeca(cabeca, ponteiro) {
    if (!cabeca) return;
    const forca = -CONTRA * opening(scroll.y / page.viewport);
    const x = ponteiro.x * forca;
    const y = ponteiro.y * forca;
    if (Math.abs(x - ultimoX) < 0.12 && Math.abs(y - ultimoY) < 0.12) return;
    ultimoX = x;
    ultimoY = y;
    cabeca.style.setProperty('--hero-tx', `${x.toFixed(2)}px`);
    cabeca.style.setProperty('--hero-ty', `${y.toFixed(2)}px`);
  }

  /* Véu escuro: uma curva única alimenta três variáveis de CSS.
     --dark      opacidade do véu
     --dark-step curva mais fechada, para o menu trocar de cor sem passar por um
                 cinza sem contraste
     --hero-fade some com o conteúdo claro da abertura junto com o fundo que o sustenta */
  /* Escrever no DOM a cada quadro custa recálculo de estilo mesmo quando o valor
     não mudou — daí os guardas. Abaixo de meio milésimo ninguém vê diferença. */
  let ultimoEscuro = -1;

  function paintDark(root, veil, screens) {
    if (!veil) return;

    const dark = opening(screens);
    if (Math.abs(dark - ultimoEscuro) < 0.0015) return;
    ultimoEscuro = dark;

    veil.style.opacity = dark.toFixed(3);
    root.style.setProperty('--dark', dark.toFixed(3));
    root.style.setProperty('--dark-step', smoothstep(0.38, 0.62, dark).toFixed(3));
    root.style.setProperty('--hero-fade', smoothstep(0.45, 0.75, dark).toFixed(3));
  }

  let ultimoTrilho = -1;

  function paintRail(fill, box) {
    if (!fill || !box.height) return;
    const seen = clamp((scroll.y + page.viewport * 0.72 - box.top) / box.height);
    if (Math.abs(seen - ultimoTrilho) < 0.002) return;
    ultimoTrilho = seen;
    fill.style.height = `${(seen * 100).toFixed(2)}%`;
  }



  function bindAnchors() {
    for (const anchor of qsa('a[href^="#"]')) {
      anchor.addEventListener('click', (event) => {
        const target = qs(anchor.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        scrollToElement(target);
      });
    }
  }

  P.chrome = { init };
})(window.Portfolio = window.Portfolio || {});
