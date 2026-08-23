/* Shaders da cena.

   Superfície: material fosco, sem lóbulo especular. Três luzes de estúdio — chave
   morna, preenchimento frio e um contraluz —, difusa com wrap e tonemap ACES, com as
   cores difusas que vieram dos próprios materiais do URDF.

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
  uniform float uRoom;    /* 1 = sala escura da abertura, 0 = papel claro */
  out vec4 outColor;

  vec3 aces(vec3 x){
    return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
  }

  /* difusa com wrap: a luz contorna a peça em vez de cair a pique, que é o que dá
     ao material o aspecto de plástico fosco / pó de alumínio */
  float wrapped(vec3 N, vec3 L, float w){
    return max(0.0, (dot(N, L) + w) / (1.0 + w));
  }

  /* ruído de meio nível, para quebrar as faixas que aparecem nos degradês largos
     de uma superfície fosca (as normais chegam em Int8, o que ajuda a bandar) */
  float dither(vec2 p){
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main(){
    vec3 N = normalize(vN);
    vec3 V = normalize(uEye - vW);
    vec3 L1 = normalize(vec3(-0.50, 0.85, 0.55));   /* chave */
    vec3 L2 = normalize(vec3( 0.85, 0.12, -0.28));  /* preenchimento */
    vec3 L3 = normalize(vec3( 0.10, -0.35, -0.92)); /* contraluz */

    /* o ambiente é a cor da sala em que o robô está, e a sala muda ao longo da
       página: quase preta na abertura, papel azulado depois. Sem isso ele fica um
       vulto branco recortado contra o escuro. */
    float sky = 0.5 + 0.5 * N.y;
    vec3 ambPaper = mix(vec3(0.042, 0.050, 0.072), vec3(0.305, 0.335, 0.385), sky);
    vec3 ambRoom = mix(vec3(0.012, 0.020, 0.040), vec3(0.075, 0.105, 0.165), sky);
    vec3 amb = mix(ambPaper, ambRoom, uRoom);

    vec3 key  = vec3(1.00, 0.985, 0.960) * wrapped(N, L1, 0.45) * 0.74;
    vec3 fillL = vec3(0.62, 0.74, 1.00) * wrapped(N, L2, 0.60) * 0.34;
    vec3 rimL = vec3(0.58, 0.72, 1.00) * wrapped(N, L3, 0.30) * 0.22;

    /* nada de lóbulo especular: o material é fosco. Só um contorno tênue,
       largo o bastante para não virar brilho — e ele puxa para o azul da sala. */
    float edge = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    /* o robô não é branco de estúdio: o albedo do URDF é rebaixado e puxado para o
       azul — mais ainda dentro da sala escura, onde ele precisa perder brilho para
       pertencer ao fundo em vez de recortar contra ele */
    vec3 tint = mix(vec3(0.80, 0.86, 0.99), vec3(0.60, 0.71, 0.96), uRoom);
    vec3 albedo = uColor * tint * mix(0.88, 0.76, uRoom);

    float rim = edge * mix(0.5, 1.15, uRoom);
    vec3 col = albedo * (amb + key + fillL + rimL) + vec3(0.10, 0.16, 0.26) * rim;
    vec3 mapped = pow(aces(col * mix(0.88, 0.62, uRoom)), vec3(1.0 / 2.2));
    mapped += (dither(gl_FragCoord.xy) - 0.5) / 255.0;
    outColor = vec4(mapped, uAlpha);
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
