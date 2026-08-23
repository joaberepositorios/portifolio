/* Desmontagem.

   Cada grupo de material do pacote de malhas vira uma peça independente: as patas,
   as canelas, as coxas, os quadris, os módulos internos do corpo e o casco. Conforme
   a página desce, as peças saem em cascata — das extremidades para o centro —, cada
   uma pela direção em que estava encaixada, girando devagar sobre o próprio centro.
   O avanço é função pura da rolagem, então subir a página remonta o robô. */

(function (P) {
  'use strict';

  P.robot = P.robot || {};

  const { chain, copy, normalize, rotationAxis, transformPoint, translation } = P.robot.math;
  const { LEGS, PARTS, linkMatrix } = P.robot.rig;
  const { seeded, smoothstep } = P.ease;

  /** Fração do avanço que cada peça leva para percorrer todo o caminho. */
  const WINDOW = 0.38;

  /** Quando cada tipo de peça começa a sair e até onde vai (em metros). */
  const SCHEDULE = {
    foot: { delay: 0.0, span: 0.36 },
    calf: { delay: 0.09, span: 0.27 },
    thigh: { delay: 0.19, span: 0.26 },
    hip: { delay: 0.28, span: 0.22 },
    module: { delay: 0.37, span: 0.24 },
    shell: { delay: 0.5, span: 0.18 }
  };

  /** Direção de saída de cada elo da perna, no referencial do corpo. */
  const LEG_AXIS = {
    hip: [0.35, 1.0, 0.15],
    thigh: [0.28, 0.85, -0.35],
    calf: [0.16, 0.6, -0.95],
    foot: [0.1, 0.42, -1.2]
  };

  const isBlack = (color) => color[0] < 0.03 && color[1] < 0.03 && color[2] < 0.03;

  /**
   * Monta a lista de peças desenháveis a partir das malhas e da pose de repouso.
   * `restFrames` fixa as direções: elas são calculadas uma vez, com o robô de pé,
   * e não mudam com a marcha.
   */
  function buildPieces(meshes, restFrames) {
    const random = seeded(0x60a2);
    const pieces = [];

    for (const part of PARTS) {
      const groups = meshes[part.mesh] || [];
      const link = linkMatrix(restFrames, part, new Float32Array(16));

      groups.forEach((group, index) => {
        const kind = classify(part, group, index);

        /* A inscrição "Go2" é um grupo de material à parte, mas não é uma peça:
           é pintura sobre o casco. Ela entra como grupo extra da peça do casco,
           então divide a mesma matriz e nunca descola dele. */
        if (kind === 'decal') {
          const casco = pieces.find((piece) => piece.part === part && piece.kind === 'shell');
          if (casco) {
            casco.groups.push(group);
            return;
          }
        }

        const plan = SCHEDULE[kind === 'decal' ? 'shell' : kind];
        const center = transformPoint(link, group.center);
        const layer = kind === 'module' ? index - 1 : index;

        pieces.push({
          part,
          groups: [group],
          kind,
          origin: group.center,
          direction: direction(kind, part, center, random),
          span: plan.span + 0.06 * layer,
          delay: plan.delay + 0.035 * Math.max(part.leg, 0) + 0.03 * layer,
          axis: normalize([random() - 0.5, random() - 0.5, random() - 0.5]),
          spin: (random() - 0.5) * 1.1,
          floatAmp: 0.008 + random() * 0.006,
          floatSpeed: 0.5 + random() * 0.35,
          phase: random() * Math.PI * 2,

          /* estado do quadro, reaproveitado para não alocar no laço */
          amount: 0,
          matrix: new Float32Array(16),
          rest: [0, 0, 0],
          moved: [0, 0, 0]
        });
      });
    }

    return pieces;
  }

  function classify(part, group, index) {
    if (part.kind === 'base') {
      if (index === 0) return 'shell';
      /* preto no corpo é módulo de verdade (sensores, tampas); o resto é pintura */
      return isBlack(group.color) ? 'module' : 'decal';
    }
    if (part.kind === 'calf' && isBlack(group.color)) return 'foot';
    return part.kind;
  }

  function direction(kind, part, center, random) {
    const jitter = () => (random() - 0.5) * 0.1;

    if (kind === 'shell') return [0, 0, 1];
    if (kind === 'module') {
      return normalize([center[0] * 0.9 + jitter(), center[1] * 1.5 + jitter(), center[2] * 0.7 + 0.45]);
    }

    const leg = LEGS[part.leg];
    const axis = LEG_AXIS[kind];
    return normalize([axis[0] * leg.sx + jitter(), axis[1] * leg.sy + jitter(), axis[2] + jitter()]);
  }

  /**
   * Atualiza a matriz de cada peça para o quadro atual.
   * `progress` (0..1) é o avanço da desmontagem; `time` só anima a flutuação das
   * peças já soltas.
   */
  function updatePieces(pieces, frames, progress, time) {
    for (const piece of pieces) {
      const link = linkMatrix(frames, piece.part);
      const amount = smoothstep(piece.delay, piece.delay + WINDOW, progress);

      piece.amount = amount;
      transformPoint(link, piece.origin, piece.rest);

      if (amount <= 0.0005) {
        copy(link, piece.matrix);
        piece.moved[0] = piece.rest[0];
        piece.moved[1] = piece.rest[1];
        piece.moved[2] = piece.rest[2];
        continue;
      }

      /* peça solta respira: a distância e o giro oscilam de leve em torno do alvo */
      const wobble = Math.sin(time * piece.floatSpeed + piece.phase);
      const distance = piece.span * amount + piece.floatAmp * wobble * amount;
      const angle = piece.spin * amount + 0.05 * wobble * amount;

      for (let i = 0; i < 3; i++) piece.moved[i] = piece.rest[i] + piece.direction[i] * distance;

      chain(
        piece.matrix,
        translation(piece.moved[0], piece.moved[1], piece.moved[2]),
        rotationAxis(piece.axis, angle),
        translation(-piece.rest[0], -piece.rest[1], -piece.rest[2]),
        link
      );
    }
  }

  P.robot.explode = { buildPieces, updatePieces };
})(window.Portfolio = window.Portfolio || {});
