/* Ponto de entrada: liga o conteúdo, os efeitos da página e o robô de fundo.

   Os arquivos são scripts clássicos que se registram em `window.Portfolio`, na ordem
   declarada no index.html. É o que permite abrir o site direto do disco, com duplo
   clique, sem precisar de servidor — módulos ES seriam bloqueados por file://.

   A ordem aqui importa: o conteúdo é montado antes de qualquer medida ser tirada. */

(function (P) {
  'use strict';

  P.modal.init();
  P.sections.render(P.CONTENT);

  P.geometry.observe();
  P.scroll.init();

  P.backdrop.init();
  P.reveal.init();
  P.parallax.init();
  P.chrome.init();
  P.robot.scene.init();
})(window.Portfolio = window.Portfolio || {});
