/* Álgebra mínima para a cena: matrizes 4x4 em ordem de coluna (a mesma do GLSL)
   e vetores como arrays simples.

   As matrizes de rascunho vêm de um pool reciclado a cada quadro: o laço de
   desenho não aloca memória, então não há coleta de lixo no meio da animação. */

(function (P) {
  'use strict';

  P.robot = P.robot || {};

  function mat4(out) {
    const m = out || new Float32Array(16);
    m[0] = m[5] = m[10] = m[15] = 1;
    m[1] = m[2] = m[3] = m[4] = m[6] = m[7] = m[8] = m[9] = m[11] = m[12] = m[13] = m[14] = 0;
    return m;
  }

  const pool = [];
  let cursor = 0;

  /** Matriz temporária, válida até o próximo `resetScratch()`. */
  function scratch() {
    if (cursor === pool.length) pool.push(new Float32Array(16));
    return mat4(pool[cursor++]);
  }

  function resetScratch() {
    cursor = 0;
  }

  /** out = a · b (out não pode ser a nem b) */
  function multiply(a, b, out = scratch()) {
    for (let c = 0; c < 4; c++) {
      const b0 = b[c * 4];
      const b1 = b[c * 4 + 1];
      const b2 = b[c * 4 + 2];
      const b3 = b[c * 4 + 3];
      for (let r = 0; r < 4; r++) {
        out[c * 4 + r] = a[r] * b0 + a[4 + r] * b1 + a[8 + r] * b2 + a[12 + r] * b3;
      }
    }
    return out;
  }

  /** out = m0 · m1 · … · mn */
  function chain(out, ...matrices) {
    let acc = matrices[0];
    for (let i = 1; i < matrices.length; i++) acc = multiply(acc, matrices[i], scratch());
    return copy(acc, out);
  }

  function copy(src, out = scratch()) {
    out.set(src);
    return out;
  }

  function translation(x, y, z, out = scratch()) {
    mat4(out);
    out[12] = x;
    out[13] = y;
    out[14] = z;
    return out;
  }

  function rotationX(a, out = scratch()) {
    const s = Math.sin(a);
    const c = Math.cos(a);
    mat4(out);
    out[5] = c; out[6] = s; out[9] = -s; out[10] = c;
    return out;
  }

  function rotationY(a, out = scratch()) {
    const s = Math.sin(a);
    const c = Math.cos(a);
    mat4(out);
    out[0] = c; out[2] = -s; out[8] = s; out[10] = c;
    return out;
  }

  /** Rotação de ângulo `a` em torno de um eixo unitário (Rodrigues). */
  function rotationAxis(axis, a, out = scratch()) {
    const [x, y, z] = axis;
    const s = Math.sin(a);
    const c = Math.cos(a);
    const t = 1 - c;
    mat4(out);
    out[0] = t * x * x + c;     out[1] = t * x * y + s * z; out[2] = t * x * z - s * y;
    out[4] = t * x * y - s * z; out[5] = t * y * y + c;     out[6] = t * y * z + s * x;
    out[8] = t * x * z + s * y; out[9] = t * y * z - s * x; out[10] = t * z * z + c;
    return out;
  }

  function perspective(fov, aspect, near, far, out = new Float32Array(16)) {
    const f = 1 / Math.tan(fov / 2);
    out.fill(0);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) / (near - far);
    out[11] = -1;
    out[14] = (2 * far * near) / (near - far);
    return out;
  }

  function lookAt(eye, at, up, out = new Float32Array(16)) {
    const z = normalize([eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]]);
    const x = normalize(cross(up, z));
    const y = cross(z, x);
    out.set([
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
      -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
      -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]), 1
    ]);
    return out;
  }

  /** Bloco 3x3 de rotação, para as normais (a escala do modelo é uniforme). */
  function normalMatrix(m, out) {
    out[0] = m[0]; out[1] = m[1]; out[2] = m[2];
    out[3] = m[4]; out[4] = m[5]; out[5] = m[6];
    out[6] = m[8]; out[7] = m[9]; out[8] = m[10];
    return out;
  }

  function transformPoint(m, p, out = [0, 0, 0]) {
    const [x, y, z] = p;
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    return out;
  }

  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];

  function normalize(v) {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  P.robot.math = { mat4, scratch, resetScratch, multiply, chain, copy, translation,
    rotationX, rotationY, rotationAxis, perspective, lookAt, normalMatrix,
    transformPoint, cross, normalize };
})(window.Portfolio = window.Portfolio || {});
