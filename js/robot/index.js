/* Cena do robô: câmera, laço de desenho e a coreografia ligada à rolagem.

   O robô vive uma seção só: as Experiências acadêmicas. Ele entra com ela, levanta de
   agachado e trota na faixa livre à direita; no meio da seção começa a desmontagem
   — as peças saem em cascata das extremidades para o centro, o casco sobe por
   último, a câmera recua e gira para mostrar a vista explodida inteira, com as guias
   ligando cada peça ao encaixe; e ele se dissolve antes de a seção acabar. Antes e
   depois disso nada é desenhado.

   Tudo é função pura da rolagem: subir a página remonta o robô, peça por peça. */

(function (P) {
  'use strict';

  P.robot = P.robot || {};

  const { qs } = P.dom;
  const { onFrame, prefersReducedMotion } = P.ticker;
  const { scroll } = P.scroll;
  const { page, watch } = P.geometry;
  const { clamp, damp, lerp, smoothstep } = P.ease;
  const { chain, lookAt, mat4, multiply, normalMatrix, perspective,
    resetScratch, rotationX, rotationY, translation } = P.robot.math;
  const { createContext, createProgram, decodeBase64, uploadMeshes } = P.robot.gl;
  const { SURFACE_FS, SURFACE_VS } = P.robot.shaders;
  const { bodyPose, gait, poseFrames, restBody, restJoints } = P.robot.rig;
  const { buildPieces, updatePieces } = P.robot.explode;
  const { createGuides } = P.robot.guides;

  const MESH_URL = 'js/model/go2-mesh.js';
  const MIN_WIDTH = 360;          /* abaixo disso o pacote de malhas não compensa */
  const LARGURA_CELULAR = 760;    /* daqui para baixo ele é fundo, não protagonista */
  const CELULAR_RESOLUCAO = 0.5;  /* metade dos pixels: é daí que vem o amaciamento */
  const CELULAR_ALPHA = 0.5;      /* e metade da presença, para o texto mandar */
  const EYE = [0, 0.3, 2.02];
  const FOV = 0.42;               /* lente longa (24°): perspectiva de foto de produto */
  /* Teto do buffer de render, com supersampling incluso. Não é firula: passar disso
     já fez placa integrada perder o contexto — e a tela some sem erro nenhum. */
  const MAX_PIXELS = 2.4e6;

  /* O robô é o item mais caro da página: 28 chamadas de desenho e 68 mil triângulos.
     A 30 quadros por segundo ele continua fluido — é um elemento de fundo, com
     movimento lento — e o custo cai pela metade. */
  const PASSO = 1 / 30;

  /* Vigia de desempenho: não dá para saber de antemão em que placa o site vai rodar.
     Se os quadros ficam longos por tempo suficiente, o robô encolhe; se mesmo assim
     não melhora, ele sai de cena. Um fundo limpo é melhor do que a página inteira
     engasgando — e a decisão se paga sozinha, porque ele é 90% do custo de quadro. */
  const QUADRO_RUIM = 0.045;   /* ~22 quadros por segundo */
  const PACIENCIA = 100;       /* quadros ruins seguidos antes de reagir */

  /* trechos da passagem pelo currículo, em fração da janela de vida do robô */
  const RISE_TO = 0.14;        /* levanta de agachado ao entrar */
  /* A travessia é um arco: ele entra montado e trotando, se desmonta até o auge no
     meio da seção e volta a se montar na aproximação de Projetos — sai de cena
     inteiro, trotando, e não como um monte de peças soltas. Nenhum platô longo de
     "já desmontado": em qualquer ponto visível ele está montando ou desmontando. */
  const EXPLODE_FROM = 0.16;
  const EXPLODE_PEAK = 0.56;
  const EXPLODE_BACK = 0.86;   /* aqui já está inteiro de novo */
  const VANISH_FROM = 0.88;

  function init() {
    const canvas = qs('#bg');
    if (!canvas || !supported()) return;

    loadMesh()
      .then((pack) => start(canvas, pack))
      .catch(() => {});
  }

  /** Sem WebGL2, em telas estreitas ou com economia de dados o fundo fica limpo. */
  function supported() {
    if (innerWidth < MIN_WIDTH) return false;
    if (navigator.connection && navigator.connection.saveData) return false;
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  }

  /* O pacote é um script clássico que publica dois globais; aqui ele é lido,
     convertido e removido de `window` em seguida. */
  function loadMesh() {
    return new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = MESH_URL;
      tag.async = true;
      tag.onerror = reject;
      tag.onload = () => {
        const manifest = window.GO2_MESH;
        const data = window.GO2_DATA;
        delete window.GO2_MESH;
        delete window.GO2_DATA;
        if (!manifest || !data) reject(new Error('pacote de malhas incompleto'));
        else resolve({ manifest, buffer: decodeBase64(data) });
      };
      document.head.appendChild(tag);
    });
  }

  function start(canvas, pack) {
    /* Tudo o que vive no contexto fica junto e é **reconstruível**: se a GPU
       derrubar o contexto (memória curta, driver reiniciando), programas, buffers
       e VAOs morrem com ele. Guardar o pacote de malhas e refazer tudo é o que faz
       o robô voltar — antes ele simplesmente sumia para sempre. */
    let gl = null;
    let program = null;
    let U = null;
    let pieces = null;
    let guides = null;
    let vivo = false;

    function construir() {
      gl = createContext(canvas);
      if (!gl) return false;

      program = createProgram(gl, SURFACE_VS, SURFACE_FS);
      if (!program) return false;

      U = {
        proj: gl.getUniformLocation(program, 'uProj'),
        view: gl.getUniformLocation(program, 'uView'),
        model: gl.getUniformLocation(program, 'uModel'),
        nrm: gl.getUniformLocation(program, 'uNrm'),
        qmin: gl.getUniformLocation(program, 'uQMin'),
        qscale: gl.getUniformLocation(program, 'uQScale'),
        color: gl.getUniformLocation(program, 'uColor'),
        eye: gl.getUniformLocation(program, 'uEye'),
        alpha: gl.getUniformLocation(program, 'uAlpha')
      };

      const meshes = uploadMeshes(gl, program, pack.manifest, pack.buffer);
      pieces = buildPieces(meshes, poseFrames(restJoints(), restBody()));
      guides = createGuides(gl);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);

      resize();
      return true;
    }

    const proj = mat4();
    const view = mat4();
    const root = mat4();
    const model = mat4();
    const normals = new Float32Array(9);
    const frames = {};
    const joints = [];

    /* a janela de vida sai da própria seção do currículo, e nunca invade Projetos */
    const section = watch(qs('#curriculo'));
    const anchor = watch(qs('#projetos'));
    const reduce = prefersReducedMotion;

    /* o ponteiro gira o robô de leve: só em quem tem mouse e não pediu menos
       movimento — no toque isso não existe */
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    if (!reduce && matchMedia('(hover: hover)').matches) {
      addEventListener('pointermove', (event) => {
        pointer.tx = (event.clientX / innerWidth) * 2 - 1;
        pointer.ty = (event.clientY / innerHeight) * 2 - 1;
      }, { passive: true });
    }
    let width = 0;
    let height = 0;
    let eased = scroll.y;
    let time = 0;

    let quality = 1;   /* cai pela metade se o contexto já se perdeu uma vez */

    function resize() {
      if (!gl) return;
      /* limite real da GPU: nem todo aparelho aceita um alvo de render grande */
      const maxSide = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 4096;
      /* supersampling: renderiza acima da resolução da tela e deixa o navegador
         reduzir — junto com o MSAA, é o que tira o serrilhado das bordas do robô.
         O fator é generoso, mas limitado por área e pelo tamanho máximo da GPU. */
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const wanted = (dpr < 1.5 ? 1.9 : 1.3) * quality;
      width = canvas.clientWidth;
      height = canvas.clientHeight;

      const area = Math.max(width * height * dpr * dpr, 1);
      /* no celular o quadro é desenhado em menos pixels e esticado pela tela:
         é isso que dá o aspecto macio, sem filtro nenhum */
      const macio = width < LARGURA_CELULAR ? CELULAR_RESOLUCAO : 1;
      const scale = macio * Math.max(1, Math.min(
        wanted,
        Math.sqrt(MAX_PIXELS / area),
        maxSide / Math.max(width * dpr, 1),
        maxSide / Math.max(height * dpr, 1)
      ));

      canvas.width = Math.round(width * dpr * scale);
      canvas.height = Math.round(height * dpr * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    /* Perda de contexto: para de desenhar, pede a restauração e **reconstrói** tudo
       quando ela vem — em qualidade menor, para não cair de novo pelo mesmo motivo. */
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      vivo = false;
      quality = 0.6;
    });
    canvas.addEventListener('webglcontextrestored', () => {
      vivo = construir();
    });

    addEventListener('resize', resize, { passive: true });

    vivo = construir();
    if (!vivo) return;

    let acumulado = PASSO;
    let ruins = 0;
    let bons = 0;
    let degrau = 0;
    let pausado = false;

    onFrame((dt) => {
      if (!vivo) return;

      /* Medir vem antes de tudo: é o custo real do quadro na máquina de quem vê.
         A conta é assimétrica de propósito — um quadro bom apaga dois ruins, então
         um engasgo isolado não derruba a qualidade. */
      if (dt > QUADRO_RUIM) {
        ruins += 1;
        bons = 0;
      } else {
        ruins = Math.max(0, ruins - 2);
        bons += 1;
      }

      if (pausado) {
        /* pausado por desempenho: volta sozinho se a máquina se recuperar */
        if (bons > PACIENCIA * 3) {
          pausado = false;
          bons = 0;
          resize();
        }
        return;
      }

      if (ruins > PACIENCIA) {
        ruins = 0;
        degrau += 1;
        if (degrau === 1) {
          quality = 0.6;
          resize();
        } else {
          /* desistiu: some com o robô e devolve o quadro à página */
          pausado = true;
          canvas.style.opacity = '0';
          return;
        }
      }

      time += dt;
      acumulado += dt;
      if (acumulado < PASSO) return;
      const passo = acumulado;
      acumulado = 0;

      resetScratch();

      /* Janela de vida: abre quando o topo do currículo chega a ~1/3 da tela e
         fecha antes de Projetos. Fora dela nada é desenhado. */
      const start = section.top - page.viewport * 0.35;
      const end = Math.min(section.bottom - page.viewport * 0.3, anchor.top - page.viewport * 0.3);
      const span = Math.max(end - start, 1);

      /* O portão sai da rolagem REAL, sem amortecimento. Era isso que deixava o
         robô furar a janela numa rolagem rápida: o valor amortecido ainda estava
         dentro da seção quando a tela já mostrava outra. */
      const gate = clamp((scroll.y - start) / span);
      const arrive = smoothstep(0, 0.08, gate);
      const vanish = 1 - smoothstep(VANISH_FROM, 1, gate);

      /* salto grande (âncora, recarregar no meio da página): assume a posição */
      if (Math.abs(scroll.y - eased) > page.viewport * 0.9) eased = scroll.y;
      eased += (scroll.y - eased) * damp(passo, 0.32);
      /* e o amortecido nunca escapa da janela, mesmo enquanto persegue a rolagem */
      eased = clamp(eased, start, end);

      /* `p` é a travessia da seção: dele saem a marcha, a desmontagem e a câmera */
      const p = clamp((eased - start) / span);
      const explode = p < EXPLODE_PEAK
        ? smoothstep(EXPLODE_FROM, EXPLODE_PEAK, p)
        : 1 - smoothstep(EXPLODE_PEAK, EXPLODE_BACK, p);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const wide = width >= 900;
      const aspect = width / Math.max(height, 1);

      /* presença de fundo: discreta o bastante para o texto por cima continuar
         sendo o assunto, com um empurrão quando a desmontagem começa */
      const fundo = width < LARGURA_CELULAR ? CELULAR_ALPHA : 1;
      const alpha = (0.44 + 0.18 * explode) * arrive * vanish * fundo;
      canvas.style.opacity = alpha.toFixed(3);
      if (alpha <= 0.003) return;

      perspective(FOV, aspect, 0.1, 24, proj);
      proj[8] = wide ? lerp(-0.46, -0.45, explode) : lerp(0.1, 0.04, explode);
      proj[9] = 0.34 + 0.06 * explode;
      lookAt(EYE, [0, -0.02, 0], [0, 1, 0], view);

      /* o ponteiro entra amortecido, para não colar no cursor */
      pointer.x += (pointer.tx - pointer.x) * damp(passo, 0.5);
      pointer.y += (pointer.ty - pointer.y) * damp(passo, 0.5);

      const breath = reduce ? 0 : Math.sin(time * 0.22);
      const look = Math.sin(p * Math.PI * 2) * 0.13 * (1 - explode);
      /* no celular ele recua mais: cabe inteiro na tela estreita e fica sendo
         fundo, e não um bicho recortado atravessando o texto */
      const celular = width < LARGURA_CELULAR;
      const distance = 3.72 + (wide ? 0 : 0.75) + (celular ? 1.15 : 0)
        - 0.3 * smoothstep(0.05, 0.6, p) + 1.9 * explode;
      const yaw = -0.86 + look + 0.62 * explode + breath * 0.04 + pointer.x * 0.16;
      const pitch = 0.13 + 0.1 * explode + breath * 0.012 - pointer.y * 0.05;

      /* raiz: distância da câmera, orientação e conversão z-up (URDF) -> y-up (GL) */
      chain(
        root,
        translation(0, 0.14 + 0.22 * explode, 2.02 - distance),
        rotationX(pitch),
        rotationY(yaw),
        rotationX(-Math.PI / 2)
      );

      /* ele chega agachado e levanta enquanto entra em cena */
      const boot = reduce ? 1 : smoothstep(0, RISE_TO, p);
      const body = bodyPose(p, reduce ? 0 : time, explode, boot);
      poseFrames(gait(body, joints), body, frames);
      updatePieces(pieces, frames, explode, reduce ? 0 : time);

      gl.enable(gl.CULL_FACE);
      gl.useProgram(program);
      gl.uniformMatrix4fv(U.proj, false, proj);
      gl.uniformMatrix4fv(U.view, false, view);
      gl.uniform3fv(U.eye, EYE);
      gl.uniform1f(U.alpha, 1);
      /* a luz segue a sala: escura na abertura, papel depois — a mesma curva do véu */

      for (const piece of pieces) {
        multiply(root, piece.matrix, model);
        normalMatrix(model, normals);
        gl.uniformMatrix4fv(U.model, false, model);
        gl.uniformMatrix3fv(U.nrm, false, normals);

        /* uma peça pode carregar mais de um grupo de material — o casco leva a
           inscrição junto, com a mesma matriz */
        for (const group of piece.groups) {
          gl.uniform3fv(U.color, group.color);
          gl.uniform3fv(U.qmin, group.min);
          gl.uniform3fv(U.qscale, group.scale);
          gl.bindVertexArray(group.vao);
          gl.drawElements(gl.TRIANGLES, group.count, group.type, 0);
        }
      }
      gl.bindVertexArray(null);

      gl.disable(gl.CULL_FACE);
      guides.draw(pieces, { proj, view, model: root, alpha: Math.min(1, 1.5 * explode) });
    });
  }

  P.robot.scene = { init };
})(window.Portfolio = window.Portfolio || {});
