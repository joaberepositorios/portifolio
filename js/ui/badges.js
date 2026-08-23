/* Selos das competências.

   Cada tecnologia aparece com o **logo oficial** — os caminhos vêm de
   `ui/tech-icons.js`, gerado uma vez por `tools/gera-icones.mjs` e guardado no
   próprio repositório: nada é buscado em runtime, e o site continua abrindo do
   disco e funcionando sem rede.

   O selo é um quadrado na cor da marca com o logo por cima. A cor do logo (claro
   ou escuro) sai da luminância da própria marca, então o amarelo do JavaScript
   recebe traço escuro e o preto do Java recebe traço claro, sem tabela manual.
   Marcas quase brancas (Unity) invertem: quadrado escuro, logo claro.

   Tecnologia sem logo na tabela não fica sem nada: vira um selo de iniciais. */

(function (P) {
  'use strict';

  const ICONS = P.techIcons || {};

  const INK = '#12161f';
  const LIGHT = '#ffffff';

  /** Luminância relativa (WCAG) a partir de um hex #rrggbb. */
  function luminance(hex) {
    const channel = (value) => {
      const c = value / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const n = parseInt(hex.slice(1), 16);
    return (
      0.2126 * channel((n >> 16) & 255) +
      0.7152 * channel((n >> 8) & 255) +
      0.0722 * channel(n & 255)
    );
  }

  /** Sigla de reserva: iniciais das palavras, no máximo três letras. */
  function initials(name) {
    const letters = name
      .replace(/[^\p{L}\p{N}+#. ]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0]);

    return (letters.join('') || name.slice(0, 2)).slice(0, 3).toUpperCase();
  }

  /** Proporção do desenho, lida do viewBox já recortado. */
  function razao(box) {
    const [, , w, h] = String(box).split(/\s+/).map(Number);
    return h > 0 ? w / h : 1;
  }

  /**
   * Selo de uma tecnologia.
   * Com logo:  { tipo: 'logo', box, d, fundo, traco, razao }
   * Sem logo:  { tipo: 'sigla', sigla }
   *
   * `razao` acima de 2 é wordmark (o VEGAS, por exemplo): espremido num quadrado
   * de 26px ele viraria um borrão, então o selo se alarga e mantém o logo legível.
   */
  function of(name) {
    const icon = ICONS[String(name).trim().toLowerCase()];
    if (!icon) return { tipo: 'sigla', sigla: initials(name) };

    const light = luminance(icon.hex);
    const proporcao = razao(icon.box);

    /* marca quase branca desapareceria no papel: o quadrado vira tinta */
    const fundo = light > 0.82 ? INK : icon.hex;
    const traco = light > 0.82 ? LIGHT : light > 0.45 ? INK : LIGHT;

    return { tipo: 'logo', box: icon.box, d: icon.d, fundo, traco, razao: proporcao };
  }

  P.badges = { of };
})(window.Portfolio = window.Portfolio || {});
