/* Funções de curva compartilhadas pela página e pelo robô. */

(function (P) {
  'use strict';

  const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

  const lerp = (a, b, t) => a + (b - a) * t;

  /** Interpolação suave entre dois limites (a mesma curva do GLSL). */
  function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6));
    return t * t * (3 - 2 * t);
  }

  /**
   * Fator de amortecimento exponencial em tempo real.
   * `valor += (alvo - valor) * damp(dt, tau)` dá a mesma sensação em 60, 120 ou 144 Hz.
   */
  const damp = (dt, tau) => 1 - Math.exp(-dt / tau);

  /**
   * Curva da abertura escura, em telas roladas (0 = topo).
   * É a mesma para o véu do CSS e para a arena em WebGL: assim o cenário só existe
   * enquanto há fundo escuro para sustentá-lo.
   */
  function opening(screens) {
    const t = clamp((screens - 0.10) / 0.5);
    return 1 - t * t * (3 - 2 * t);
  }

  /** Gerador pseudoaleatório determinístico (mulberry32) — mesma cena a cada carga. */
  function seeded(seed) {
    return function next() {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  P.ease = { clamp, lerp, smoothstep, damp, opening, seeded };
})(window.Portfolio = window.Portfolio || {});
