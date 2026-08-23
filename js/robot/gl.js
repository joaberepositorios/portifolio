/* Camada fina sobre o WebGL2: contexto, programas e envio das malhas para a GPU. */

(function (P) {
  'use strict';

  P.robot = P.robot || {};

  function createContext(canvas) {
    return canvas.getContext('webgl2', {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: 'low-power'
    });
  }

  function createProgram(gl, vertexSource, fragmentSource) {
    const program = gl.createProgram();

    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertexSource],
      [gl.FRAGMENT_SHADER, fragmentSource]
    ]) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('[robot] shader:', gl.getShaderInfoLog(shader));
        return null;
      }
      gl.attachShader(program, shader);
      gl.deleteShader(shader);
    }

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[robot] programa:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  /** Decodifica o blob base64 do pacote de malhas. */
  function decodeBase64(text) {
    const binary = atob(text);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  /**
   * Sobe cada grupo de material do pacote como um VAO próprio.
   * As posições vêm quantizadas em Int16 e são reconstruídas no shader como
   * `(aPos + 32767) * scale + min` — daí o centro da peça sair de `min + 32767 * scale`.
   */
  function uploadMeshes(gl, program, manifest, buffer) {
    const attribs = {
      position: gl.getAttribLocation(program, 'aPos'),
      normal: gl.getAttribLocation(program, 'aNrm')
    };
    const links = {};

    for (const [name, groups] of Object.entries(manifest.links)) {
      links[name] = groups.map((group) => {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        bindAttribute(gl, attribs.position, new Int16Array(buffer, group.p, group.count * 3), gl.SHORT, false);
        bindAttribute(gl, attribs.normal, new Int8Array(buffer, group.n, group.count * 3), gl.BYTE, true);

        const wide = group.it === 4;
        const indices = wide ? new Uint32Array(buffer, group.i, group.idx) : new Uint16Array(buffer, group.i, group.idx);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null);

        return {
          vao,
          count: group.idx,
          type: wide ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
          color: group.color,
          min: group.min,
          scale: group.scale,
          center: group.min.map((v, i) => v + 32767 * group.scale[i])
        };
      });
    }

    return links;
  }

  function bindAttribute(gl, location, data, type, normalized) {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 3, type, normalized, 0, 0);
  }

  P.robot.gl = { createContext, createProgram, decodeBase64, uploadMeshes };
})(window.Portfolio = window.Portfolio || {});
