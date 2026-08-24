/* Estado de rolagem compartilhado e rolagem amortecida.

   `scroll` é lido por todos os efeitos da página (véu escuro, trilho, robô) e é
   atualizado uma única vez por quadro, antes dos demais assinantes.

   A rolagem é livre: a roda empurra um alvo, e a página persegue esse alvo com
   amortecimento exponencial. Nada de paradas obrigatórias — o deslize é contínuo e
   vale o mesmo em qualquer taxa de quadros.

   Uma exceção, só na descida: **na abertura**, um gesto para baixo leva a página
   inteira até as Experiências acadêmicas de uma vez. É o único salto automático do site — a
   volta é rolagem comum, como o resto. Um gesto para cima no meio do caminho cancela
   e devolve o controle na hora.

   No toque e com movimento reduzido, quem rola é o navegador. */

(function (P) {
  'use strict';

  const { qs } = P.dom;
  const { onFrame, prefersReducedMotion } = P.ticker;
  const { page, watch, invalidate } = P.geometry;
  const { clamp, damp } = P.ease;

  const scroll = { y: 0, progress: 0 };

  const smooth = !prefersReducedMotion && !matchMedia('(hover: none)').matches;

  /* τ do deslize e quanto de página cada volta da roda vale.
     τ é o que separa "fluido" de "arrastado": alto demais e a página parece
     presa ao gesto anterior. Aqui ele responde no primeiro quadro e assenta em
     pouco mais de meio segundo, sem perder a suavidade. */
  const TAU = 0.26;
  const SPEED = 0.78;

  /* respiro no topo do salto automático da abertura */
  /* Folga do topo ao pousar numa seção: a barra fixa cobre os primeiros ~52px,
     e o título tem de sobrar embaixo dela, não atrás. */
  const OFFSET = 76;

  let target = 0;
  let current = 0;
  let animating = false;
  let locked = false;
  /* o salto da abertura em curso: enquanto ele acontece, a roda para baixo é
     ignorada (senão o gesto seguinte atropelaria a viagem) */
  let saltando = false;
  let abertura = null;
  let destino = null;

  /** Trava a rolagem enquanto uma camada modal está aberta. */
  function lock(on) {
    locked = on;
    document.body.classList.toggle('is-locked', on);
  }

  function scrollToY(to) {
    target = clamp(to, 0, page.max);
    if (!smooth) {
      scrollTo({ top: target, behavior: 'smooth' });
      return;
    }
    if (!animating) {
      animating = true;
      current = scrollY;
    }
  }

  function scrollToElement(element, offset = OFFSET) {
    invalidate();
    scrollToY(element.getBoundingClientRect().top + scrollY - offset);
  }

  /** Ainda estamos na abertura? (com folga: ela é a primeira tela cheia) */
  function naAbertura() {
    return abertura ? scrollY < abertura.height * 0.62 : false;
  }

  function saltar(para) {
    saltando = true;
    scrollToY(para);
  }

  function init() {
    current = target = scrollY;

    const intro = qs('#intro');
    const curriculo = qs('#curriculo');
    if (intro && curriculo) {
      abertura = watch(intro);
      destino = watch(curriculo);
    }

    onFrame((dt) => {
      if (animating) {
        current += (target - current) * damp(dt, TAU);
        if (Math.abs(target - current) < 0.4) {
          current = target;
          animating = false;
          saltando = false;
        }
        scrollTo(0, current);
      }
      scroll.y = scrollY;
      scroll.progress = page.max > 0 ? clamp(scroll.y / page.max) : 0;
    });

    /* Rolagem vinda de fora (barra, teclado, toque, salto programático) cancela o
       deslize e reassume o controle. Distinguir "fomos nós" por posição e não por
       marcador: os eventos de rolagem são agrupados pelo navegador, e um marcador
       booleano é consumido pelo primeiro deles — o segundo cancelaria a própria
       animação no meio. Nossa rolagem sempre cai exatamente em `current`. */
    addEventListener(
      'scroll',
      () => {
        if (animating && Math.abs(scrollY - current) < 2) return;
        animating = false;
        saltando = false;
        current = target = scrollY;
      },
      { passive: true }
    );

    if (smooth) {
      addEventListener(
        'wheel',
        (event) => {
          if (event.ctrlKey || locked) return;
          event.preventDefault();

          /* O salto protege a viagem, não a cauda: assim que a página chega perto
             do destino, a roda volta a valer — senão o último pixel de amortecimento
             engoliria o gesto seguinte. */
          if (saltando && (!animating || Math.abs(target - current) < 24)) saltando = false;

          if (saltando) {
            /* gesto para cima cancela o salto; para baixo, é ignorado */
            if (event.deltaY < 0) {
              saltando = false;
              animating = false;
              current = target = scrollY;
            } else {
              return;
            }
          } else if (event.deltaY > 0 && destino && naAbertura()) {
            /* a exceção: da abertura às Experiências acadêmicas, de uma vez só */
            saltar(destino.top - OFFSET);
            return;
          }

          /* deltaMode: 0 = pixels, 1 = linhas, 2 = páginas */
          const unit = event.deltaMode === 1 ? 33 : event.deltaMode === 2 ? page.viewport : 1;
          target = clamp((animating ? target : scrollY) + event.deltaY * unit * SPEED, 0, page.max);

          if (!animating) {
            animating = true;
            current = scrollY;
          }
        },
        { passive: false }
      );
    }
  }

  P.scroll = { scroll, lock, scrollToY, scrollToElement, init };
})(window.Portfolio = window.Portfolio || {});
