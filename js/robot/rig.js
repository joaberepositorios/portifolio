/* Esqueleto do Unitree Go2, direto do URDF oficial (go2_description).

   Coordenadas do URDF: x para frente, y para a esquerda, z para cima.
   Quadris em (±0.1934, ±0.0465); coxa e canela de 0.213 m; eixo do quadril em X,
   coxa e joelho em Y. As malhas espelhadas e as rotações de visual de cada perna
   (FR roll π, RL pitch π, RR ambos) são respeitadas. */

(function (P) {
  'use strict';

  P.robot = P.robot || {};

  const { chain, mat4, multiply, rotationX, rotationY, translation, scratch } = P.robot.math;

  const HIP_X = 0.1934;
  const HIP_Y = 0.0465;
  const THIGH_Y = 0.0955;
  const SEGMENT = 0.213;

  /** Ângulos de repouso das juntas — a pose de pé usada como referência. */
  const REST = { hip: 0, thigh: 0.86, calf: -1.72 };

  const LEGS = [
    { id: 'FL', sx: 1, sy: 1, thigh: 'thigh', calf: 'calf', visual: mat4(new Float32Array(16)) },
    { id: 'FR', sx: 1, sy: -1, thigh: 'thigh_mirror', calf: 'calf_mirror', visual: rotationX(Math.PI, new Float32Array(16)) },
    { id: 'RL', sx: -1, sy: 1, thigh: 'thigh', calf: 'calf', visual: rotationY(Math.PI, new Float32Array(16)) },
    {
      id: 'RR', sx: -1, sy: -1, thigh: 'thigh_mirror', calf: 'calf_mirror',
      visual: multiply(rotationX(Math.PI), rotationY(Math.PI), new Float32Array(16))
    }
  ];

  /** As 13 instâncias de elo desenhadas: o corpo e três elos por perna. */
  const PARTS = [
    { node: 'base', kind: 'base', mesh: 'base', leg: -1, visual: null },
    ...LEGS.flatMap((leg, i) => [
      { node: `hip${i}`, kind: 'hip', mesh: 'hip', leg: i, visual: leg.visual },
      { node: `thigh${i}`, kind: 'thigh', mesh: leg.thigh, leg: i, visual: null },
      { node: `calf${i}`, kind: 'calf', mesh: leg.calf, leg: i, visual: null }
    ])
  ];

  /**
   * Postura do corpo ao longo da página: o robô sai de agachado para de pé,
   * abre a passada e assenta o passo. `hold` (0..1) trava a marcha durante a
   * desmontagem — pernas soltas não andam. `boot` (0..1) é o despertar no
   * carregamento: sem ele o robô já nasceria de pé, sem nada acontecendo na
   * primeira tela até alguém rolar.
   */
  function bodyPose(progress, time, hold = 0, boot = 1) {
    const wake = smooth(progress / 0.24) * boot;
    const settle = smooth((progress - 0.12) / 0.5);
    const stride = (0.45 * boot + 0.55 * wake - 0.2 * settle) * (1 - hold);
    const walk = progress * 3.4 + time * 0.42;

    return {
      walk,
      stride,
      lift: -0.075 * (1 - wake) - 0.025 * settle + 0.06 * hold,
      pitch: 0.11 * Math.sin(progress * Math.PI) - 0.05 * settle,
      roll: 0.05 * stride * Math.sin(walk),
      bob: 0.012 * stride * Math.sin(walk * 2)
    };
  }

  /** Trote diagonal: FL/RR em fase, FR/RL em oposição. */
  function gait(body, out = []) {
    for (let i = 0; i < LEGS.length; i++) {
      const phase = i === 0 || i === 3 ? 0 : Math.PI;
      const swing = Math.sin(body.walk + phase);
      out[i] = out[i] || {};
      out[i].hip = LEGS[i].sy * 0.03 * body.stride * Math.cos(body.walk + phase);
      out[i].thigh = REST.thigh + 0.2 * body.stride * swing;
      out[i].calf = REST.calf - 0.22 * body.stride * swing;
    }
    return out;
  }

  const restJoints = () => LEGS.map(() => ({ ...REST }));

  const restBody = () => ({ walk: 0, stride: 0, lift: 0, pitch: 0, roll: 0, bob: 0 });

  /**
   * Matrizes de cada elo em coordenadas do corpo.
   * `frames` é reaproveitado entre quadros; as matrizes internas vêm do pool de rascunho.
   */
  function poseFrames(joints, body, frames = {}) {
    frames.base = chain(
      frames.base || new Float32Array(16),
      translation(0, 0, body.bob + body.lift),
      rotationY(body.pitch),
      rotationX(body.roll)
    );

    for (let i = 0; i < LEGS.length; i++) {
      const leg = LEGS[i];
      const joint = joints[i];

      frames[`hip${i}`] = chain(
        frames[`hip${i}`] || new Float32Array(16),
        frames.base,
        translation(leg.sx * HIP_X, leg.sy * HIP_Y, 0),
        rotationX(joint.hip)
      );

      frames[`thigh${i}`] = chain(
        frames[`thigh${i}`] || new Float32Array(16),
        frames[`hip${i}`],
        translation(0, leg.sy * THIGH_Y, 0),
        rotationY(joint.thigh)
      );

      frames[`calf${i}`] = chain(
        frames[`calf${i}`] || new Float32Array(16),
        frames[`thigh${i}`],
        translation(0, 0, -SEGMENT),
        rotationY(joint.calf)
      );
    }

    return frames;
  }

  /** Matriz do elo já com a rotação de visual do URDF aplicada. */
  function linkMatrix(frames, part, out = scratch()) {
    if (part.visual) return multiply(frames[part.node], part.visual, out);
    out.set(frames[part.node]);
    return out;
  }

  const smooth = (t) => {
    const x = t < 0 ? 0 : t > 1 ? 1 : t;
    return x * x * (3 - 2 * x);
  };

  P.robot.rig = { HIP_X, HIP_Y, THIGH_Y, SEGMENT, REST, LEGS, PARTS,
    bodyPose, gait, restJoints, restBody, poseFrames, linkMatrix };
})(window.Portfolio = window.Portfolio || {});
