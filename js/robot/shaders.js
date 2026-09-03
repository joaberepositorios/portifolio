/* Shaders da cena.

   Superfície: desenho chapado em três tons — luz, meia-luz e sombra — a partir de
   uma direção de luz só. É o acabamento mais simples que ainda descreve o volume:
   nada de lóbulo especular, nada de tonemap, nada de dither. A geometria é a
   mesma de sempre; o que mudou foi o quanto ela é sombreada.

   Guias: as linhas tracejadas que ligam cada peça solta ao lugar de onde saiu. */

(function (P) {
  'use strict';

  P.robot = P.robot || {};

  const SURFACE_VS = `#version 300 es
  in vec3 aPos;
  in vec3 aNrm;
  uniform mat4 uProj, uView, uModel;
  uniform mat3 uNrm;
  uniform vec3 uQMin, uQScale;
  out vec3 vN, vW;

  void main(){
    /* posições chegam quantizadas em Int16 e são reconstruídas aqui */
    vec3 p = (aPos + 32767.0) * uQScale + uQMin;
    vec4 world = uModel * vec4(p, 1.0);
    vW = world.xyz;
    vN = uNrm * aNrm;
    gl_Position = uProj * uView * world;
  }`;

  const SURFACE_FS = `#version 300 es
  precision highp float;
  in vec3 vN, vW;
  uniform vec3 uColor, uEye;
  uniform float uAlpha;
  out vec4 outColor;

  void main(){
    vec3 N = normalize(vN);
    vec3 V = normalize(uEye - vW);
    vec3 L = normalize(vec3(-0.42, 0.86, 0.46));

    /* Três tons e nada mais. A quantização é o desenho: em vez de um degradê
       contínuo, cada face cai num de três patamares, e o volume aparece pelo
       recorte entre eles — como num desenho técnico sombreado à mão. */
    float d = dot(N, L) * 0.5 + 0.5;
    float tom = d > 0.70 ? 1.0 : (d > 0.46 ? 0.82 : 0.63);

    /* Contorno: no escuro, sem ele a peça encosta no fundo e some. É largo de
       propósito — brilho fino viraria o especular que acabamos de tirar. */
    float borda = pow(1.0 - max(dot(N, V), 0.0), 2.6);

    vec3 base = uColor * vec3(0.92, 0.95, 1.02);
    vec3 col = base * tom + vec3(0.16, 0.25, 0.42) * borda * 0.55;

    outColor = vec4(col, uAlpha);
  }`;

  const GUIDE_VS = `#version 300 es
  in vec3 aPos;
  in float aFade;
  uniform mat4 uProj, uView, uModel;
  out float vFade;

  void main(){
    vFade = aFade;
    gl_Position = uProj * uView * uModel * vec4(aPos, 1.0);
  }`;

  const GUIDE_FS = `#version 300 es
  precision mediump float;
  in float vFade;
  uniform vec3 uColor;
  uniform float uAlpha;
  out vec4 outColor;

  void main(){
    outColor = vec4(uColor, vFade * uAlpha);
  }`;

  P.robot.shaders = { SURFACE_VS, SURFACE_FS, GUIDE_VS, GUIDE_FS };
})(window.Portfolio = window.Portfolio || {});
