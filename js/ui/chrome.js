/* Cromo da página: véu escuro da abertura e trilho da linha do tempo.
   Não há barra de menu — a navegação é a própria rolagem; o que sobra aqui são os
   efeitos de fundo, todos no mesmo laço e lendo só medidas em cache. */

(function (P) {
  'use strict';

  const { qs, qsa } = P.dom;
  const { onFrame } = P.ticker;
  const { scroll, scrollToElement } = P.scroll;
  const { page, watch } = P.geometry;
  const { clamp, opening } = P.ease;
  const { prefersReducedMotion } = P.ticker;

  /* quanto o nome anda contra o fundo, em pixels — pouco de propósito: é para
     sentir espaço, não para chamar atenção */
  const CONTRA = 3;

  function init() {
    const barra = qs('.menubar');
    const railFill = qs('.timeline__fill');
    const timeline = watch(qs('#timeline'));

    const cabeca = qs('.hero__texto');
    const ponteiro = seguirPonteiro();

    bindAnchors();
    marcarSecaoAtual();

    onFrame(() => {
      marcarBarra(barra);
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

  /* A barra do topo ganha uma faixa opaca assim que a página sai do lugar: na
     abertura ela flutua sobre o campo de estrelas, e no resto precisa de base. */
  let presa = null;

  function marcarBarra(barra) {
    if (!barra) return;
    const deve = scroll.y > 24;
    if (deve === presa) return;
    presa = deve;
    barra.classList.toggle('is-preso', deve);
  }

  let ultimoTrilho = -1;

  function paintRail(fill, box) {
    if (!fill || !box.height) return;
    const seen = clamp((scroll.y + page.viewport * 0.72 - box.top) / box.height);
    if (Math.abs(seen - ultimoTrilho) < 0.002) return;
    ultimoTrilho = seen;
    fill.style.height = `${(seen * 100).toFixed(2)}%`;
  }



  /* Qual seção está sendo lida: a barra acende o item correspondente.
     Um IntersectionObserver resolve isso por evento — nada entra no laço de
     quadro, que é onde o custo aparece. A janela cortada em cima e embaixo faz
     a troca acontecer quando a seção ocupa a faixa central da tela, não quando
     encosta a borda. */
  function marcarSecaoAtual() {
    const links = qsa('.menubar a[href^="#"]');
    if (!links.length) return;

    const porId = new Map(links.map((link) => [link.getAttribute('href').slice(1), link]));
    const alvos = [...porId.keys()].map((id) => qs(`#${id}`)).filter(Boolean);
    const visiveis = new Set();

    const observer = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        if (entrada.isIntersecting) visiveis.add(entrada.target.id);
        else visiveis.delete(entrada.target.id);
      }

      /* mais de uma seção pode cruzar a faixa: vale a primeira na ordem da página */
      let atual = null;
      for (const id of porId.keys()) {
        if (visiveis.has(id)) { atual = id; break; }
      }

      for (const [id, link] of porId) link.classList.toggle('is-current', id === atual);
    }, { rootMargin: '-45% 0px -45% 0px' });

    for (const alvo of alvos) observer.observe(alvo);
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
