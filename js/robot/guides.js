/* Guias de montagem: o traço pontilhado que liga cada peça solta ao encaixe de onde
   saiu — o mesmo recurso de um desenho técnico em vista explodida.

   Tudo cabe em um único buffer dinâmico e uma chamada de desenho: são no máximo
   algumas centenas de vértices por quadro. */

(function (P) {
  'use strict';

  P.robot = P.robot || {};

  const { createProgram } = P.robot.gl;
  const { GUIDE_VS, GUIDE_FS } = P.robot.shaders;

  const DASHES = 6;        /* traços por guia */
  const DUTY = 0.55;       /* fração preenchida de cada traço */
  const MAX_VERTICES = 1024;
  const STRIDE = 4;        /* x, y, z, opacidade */

  /* azul do site, um passo mais claro: legível tanto sobre a abertura escura
     quanto sobre o papel */
  const COLOR = [0.30, 0.48, 0.82];

  function createGuides(gl) {
    const program = createProgram(gl, GUIDE_VS, GUIDE_FS);
    if (!program) return { draw() {} };

    const uniforms = {
      proj: gl.getUniformLocation(program, 'uProj'),
      view: gl.getUniformLocation(program, 'uView'),
      model: gl.getUniformLocation(program, 'uModel'),
      color: gl.getUniformLocation(program, 'uColor'),
      alpha: gl.getUniformLocation(program, 'uAlpha')
    };

    const data = new Float32Array(MAX_VERTICES * STRIDE);
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);

    const position = gl.getAttribLocation(program, 'aPos');
    const fade = gl.getAttribLocation(program, 'aFade');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, STRIDE * 4, 0);
    gl.enableVertexAttribArray(fade);
    gl.vertexAttribPointer(fade, 1, gl.FLOAT, false, STRIDE * 4, 12);
    gl.bindVertexArray(null);

    function draw(pieces, camera) {
      const vertices = fillBuffer(pieces, data);
      if (!vertices) return;

      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, vertices * STRIDE);

      gl.useProgram(program);
      gl.uniformMatrix4fv(uniforms.proj, false, camera.proj);
      gl.uniformMatrix4fv(uniforms.view, false, camera.view);
      gl.uniformMatrix4fv(uniforms.model, false, camera.model);
      gl.uniform3fv(uniforms.color, COLOR);
      gl.uniform1f(uniforms.alpha, camera.alpha);

      /* as guias não escrevem profundidade: passam por trás das peças sem recortá-las */
      gl.depthMask(false);
      gl.drawArrays(gl.LINES, 0, vertices);
      gl.depthMask(true);
      gl.bindVertexArray(null);
    }

    return { draw };
  }

  function fillBuffer(pieces, data) {
    let at = 0;

    for (const piece of pieces) {
      if (piece.amount <= 0.02) continue;
      if (at + DASHES * 2 > MAX_VERTICES) break;

      /* aparece assim que a peça se solta e suaviza quando ela já está no lugar final */
      const fade = Math.min(1, piece.amount * 2.4) * (1 - 0.3 * piece.amount);

      for (let d = 0; d < DASHES; d++) {
        const t0 = d / DASHES;
        const t1 = (d + DUTY) / DASHES;
        at = push(data, at, piece, t0, fade);
        at = push(data, at, piece, t1, fade);
      }
    }

    return at;
  }

  function push(data, at, piece, t, fade) {
    const offset = at * STRIDE;
    for (let i = 0; i < 3; i++) {
      data[offset + i] = piece.rest[i] + (piece.moved[i] - piece.rest[i]) * t;
    }
    data[offset + 3] = fade;
    return at + 1;
  }

  P.robot.guides = { createGuides };
})(window.Portfolio = window.Portfolio || {});
