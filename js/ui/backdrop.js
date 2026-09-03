/* Fundo: linhas tecnológicas à deriva e, na abertura, um campo de estrelas.

   São dois canvas 2D, um **atrás** do conteúdo e outro **à frente** dele: sem nada
   passando por cima do texto, todo o movimento aconteceria atrás e a página ficaria
   achatada.

   Três decisões existem por desempenho, e são o que mantém isso barato:

   1. **Caminhos prontos.** Cada traço é um `Path2D` montado uma vez; o quadro só
      translada e pinta. Refazer `arcTo` a cada quadro custava caro à toa.
   2. **30 quadros por segundo.** O campo é lento; repintar a 60 não muda nada na
      tela e dobra o custo de preenchimento de dois canvas de tela cheia.
   3. **Resolução contida.** Formas suaves não precisam de 2× de densidade.

   Nenhum filtro de CSS entra aqui: desfocar camadas de tela cheia por composição é
   caro, e foi o que já travou esta página uma vez.

   **A abertura, sem degradê.** O escuro é cor chapada. A profundidade vem de duas
   coisas simples: as linhas, que deslizam em velocidades diferentes conforme a
   distância, e um campo de estrelas pequenas atrás delas — as mais fracas quase
   paradas, as mais fortes acompanhando a rolagem. O ponteiro desloca o campo alguns
   pixels, o suficiente para o fundo não parecer colado no vidro.

   As estrelas só existem enquanto o véu escuro existe: no papel elas nem entram no
   laço. São 90 pontos de 1 a 2 pixels, com a cor reaproveitada em faixas de brilho
   para não montar 90 strings de `rgba()` por quadro. */

(function (P) {
  'use strict';

  const { qs } = P.dom;
  const { onFrame, prefersReducedMotion } = P.ticker;
  const { scroll } = P.scroll;
  const { page } = P.geometry;
  const { lerp, clamp, opening, seeded } = P.ease;

  /* ---- campo 2D à deriva: o fundo de toda a página ---- */
  const TRACES_BACK = 12;
  const TRACES_FRONT = 3;

  /* ---- estrelas: só existem enquanto a abertura está escura ---- */
  const ESTRELAS = 90;
  const ESTRELA_PONTEIRO = 10;   /* deslocamento da estrela mais próxima, em pixels */
  const FAIXAS = 24;             /* níveis de brilho reaproveitados por quadro */

  const DPR_MAX = 1.35;
  const PASSO = 1 / 30;           /* segundos entre repinturas */

  const LIGHT = [91, 138, 222];   /* a cor das linhas e das estrelas */

  function init() {
    const back = layer(qs('#backdrop'));
    const front = layer(qs('#foreground'));
    if (!back || !front) return;

    const random = seeded(0x5eed);
    const bodies = build(random);
    const estrelas = montarEstrelas(random);
    const ponteiro = { x: 0, y: 0 };
    let time = 0;
    let acumulado = PASSO;

    function resize() {
      back.resize();
      front.resize();
      if (prefersReducedMotion) paint(back, front, bodies, estrelas, 0, 0, ponteiro);
    }

    addEventListener('resize', resize, { passive: true });
    resize();

    /* com movimento reduzido o campo fica parado: desenhado uma vez, sem laço */
    if (prefersReducedMotion) return;

    /* o ponteiro só guarda dois números; quem desenha é o laço que já existe */
    addEventListener('pointermove', (event) => {
      ponteiro.x = (event.clientX / innerWidth) * 2 - 1;
      ponteiro.y = (event.clientY / innerHeight) * 2 - 1;
    }, { passive: true });

    onFrame((dt) => {
      time += dt;
      acumulado += dt;
      if (acumulado < PASSO) return;
      acumulado = 0;

      paint(back, front, bodies, estrelas, time, scroll.y, ponteiro);
    });
  }

  /** Um canvas com seu contexto e o tamanho em pixels de CSS. */
  function layer(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;

    const self = {
      ctx,
      width: 0,
      height: 0,
      resize() {
        const dpr = Math.min(devicePixelRatio || 1, DPR_MAX);
        self.width = canvas.clientWidth;
        self.height = canvas.clientHeight;
        canvas.width = Math.round(self.width * dpr);
        canvas.height = Math.round(self.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    return self;
  }

  function build(random) {
    const bodies = [];

    const trace = (plano, escala, alpha, depth) => {
      const pernas = [
        lerp(60, 190, random()) * escala,
        lerp(40, 150, random()) * escala,
        lerp(30, 120, random()) * escala
      ];
      const horizontal = random() > 0.5;
      const giro = random() > 0.5 ? 1 : -1;

      return {
        plano,
        kind: 'trace',
        x: random(),
        y: random(),
        path: montarCaminho(pernas, horizontal, giro),
        fim: pontaFinal(pernas, horizontal, giro),
        no: random() > 0.35,
        depth,
        drift: lerp(8, 30, random()) * escala,
        speed: lerp(0.05, 0.18, random()),
        phase: random() * Math.PI * 2,
        corre: lerp(14, 40, random()),   /* velocidade do sinal no tracejado */
        alpha
      };
    };

    for (let i = 0; i < TRACES_BACK; i++) {
      bodies.push(trace('fundo', lerp(0.7, 1.25, random()), lerp(0.1, 0.22, random()), lerp(0.08, 0.4, random())));
    }
    for (let i = 0; i < TRACES_FRONT; i++) {
      bodies.push(trace('frente', lerp(1.4, 2.4, random()), lerp(0.05, 0.09, random()), lerp(0.6, 1.05, random())));
    }

    return bodies;
  }

  /** Traço de circuito em coordenadas locais, montado uma única vez. */
  function montarCaminho(pernas, horizontal, giro) {
    const [a, b, c] = pernas;
    const p1 = horizontal ? [a, 0] : [0, a];
    const p2 = horizontal ? [p1[0], p1[1] + b * giro] : [p1[0] + b * giro, p1[1]];
    const p3 = horizontal ? [p2[0] + c, p2[1]] : [p2[0], p2[1] + c];

    const path = new Path2D();
    path.moveTo(0, 0);
    path.arcTo(p1[0], p1[1], p2[0], p2[1], 10);
    path.arcTo(p2[0], p2[1], p3[0], p3[1], 10);
    path.lineTo(p3[0], p3[1]);
    return path;
  }

  function pontaFinal(pernas, horizontal, giro) {
    const [a, b, c] = pernas;
    return horizontal ? [a + c, b * giro] : [b * giro, a + c];
  }

  /* ---------- estrelas ----------
     Um ponto, um tamanho, um brilho e uma profundidade. A profundidade faz duas
     coisas: manda o quanto a estrela acompanha a rolagem e o quanto o ponteiro a
     desloca. Não há cintilação: ficaria inquieto atrás do nome. */
  function montarEstrelas(random) {
    const estrelas = [];

    for (let i = 0; i < ESTRELAS; i++) {
      const longe = random();
      estrelas.push({
        x: random(),
        y: random(),
        /* as de longe são menores, mais fracas e quase não se mexem */
        tamanho: longe > 0.93 ? 2 : 1,
        alpha: lerp(0.06, 0.22, longe),
        depth: lerp(0.03, 0.34, longe)
      });
    }

    return estrelas;
  }

  function pintarEstrelas(camada, estrelas, scrollY, ponteiro, tone, dark) {
    const { ctx, width, height } = camada;
    const alcance = height + 120;
    /* uma cor por faixa de brilho, montada só quando a faixa aparece: sem isso
       seriam noventa strings de rgba() a cada repintura */
    const cores = new Array(FAIXAS + 1);

    for (const estrela of estrelas) {
      const desvio = ponteiro ? ponteiro.x * estrela.depth * ESTRELA_PONTEIRO : 0;
      const x = estrela.x * width + desvio;
      const bruto = estrela.y * alcance - scrollY * estrela.depth;
      const y = ((bruto % alcance) + alcance) % alcance - 60;
      if (y < -10 || y > height + 10) continue;

      const faixa = Math.round(estrela.alpha * dark * FAIXAS);
      if (faixa < 1) continue;
      if (!cores[faixa]) cores[faixa] = rgba(tone, faixa / FAIXAS);

      ctx.fillStyle = cores[faixa];
      ctx.fillRect(x, y, estrela.tamanho, estrela.tamanho);
    }
  }

  function paint(back, front, bodies, estrelas, time, scrollY, ponteiro) {
    back.ctx.clearRect(0, 0, back.width, back.height);
    front.ctx.clearRect(0, 0, front.width, front.height);
    if (!back.width || !back.height) return;

    /* A página é escura do começo ao fim, então a linha tem uma cor só — o azul
       claro. O que a curva da abertura ainda decide é o campo de estrelas, que
       vive na primeira tela e se apaga conforme a leitura desce. */
    const dark = page.viewport ? opening(scrollY / page.viewport) : 1;
    const cor = (alpha) => rgba(LIGHT, alpha);
    /* O fundo é fundo: existe para dar profundidade, não para ser lido. Este
       fator é o volume dele — baixo o bastante para passar despercebido e alto
       o bastante para a página não ficar chapada. */
    const boost = 0.46;

    for (const ctx of [back.ctx, front.ctx]) {
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.setLineDash([]);
    }

    /* as estrelas são o fundo do fundo: entram antes das linhas, e só no escuro */
    if (dark > 0.02) pintarEstrelas(back, estrelas, scrollY, ponteiro, LIGHT, dark);

    /* passe 1: o traço em si */
    for (const body of bodies) {
      if (body.kind !== 'trace') continue;
      const alvo = posicao(body, back, front, time, scrollY, ponteiro);
      if (!alvo) continue;

      const { ctx, x, y } = alvo;
      ctx.lineWidth = 1;
      ctx.strokeStyle = cor(body.alpha * boost);
      ctx.save();
      ctx.translate(x, y);
      ctx.stroke(body.path);
      ctx.restore();

      if (body.no) fillCircle(ctx, x + body.fim[0], y + body.fim[1], 1.8, cor(body.alpha * boost * 2.0));
    }

    /* passe 2: o sinal correndo — o tracejado é configurado uma vez por camada */
    for (const ctx of [back.ctx, front.ctx]) {
      ctx.setLineDash([16, 150]);
      ctx.lineDashOffset = -time * 26;
    }
    for (const body of bodies) {
      if (body.kind !== 'trace' || body.alpha < 0.08) continue;
      const alvo = posicao(body, back, front, time, scrollY, ponteiro);
      if (!alvo) continue;

      const { ctx, x, y } = alvo;
      ctx.strokeStyle = cor(body.alpha * boost * 1.7);
      ctx.save();
      ctx.translate(x, y);
      ctx.stroke(body.path);
      ctx.restore();
    }
    for (const ctx of [back.ctx, front.ctx]) ctx.setLineDash([]);
  }

  /** Onde o corpo está neste quadro, e em que camada — ou nada, se está fora. */
  function posicao(body, back, front, time, scrollY, ponteiro) {
    const alvo = body.plano === 'frente' ? front : back;
    const alcance = 320;
    const span = alvo.height + alcance;
    const wander = Math.sin(time * body.speed + body.phase);

    const x = body.x * alvo.width + wander * body.drift;
    const raw = body.y * span - scrollY * body.depth;
    const y = ((raw % span) + span) % span - alcance / 2;

    if (y < -alcance || y > alvo.height + alcance) return null;
    return { ctx: alvo.ctx, x, y };
  }

  function fillCircle(ctx, x, y, radius, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const rgba = (tone, alpha) => `rgba(${tone[0]},${tone[1]},${tone[2]},${alpha.toFixed(3)})`;

  P.backdrop = { init };
})(window.Portfolio = window.Portfolio || {});
