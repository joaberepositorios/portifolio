/* Modal de leitura: o vídeo abre dentro do site, sem download.
   Enquanto está aberto, a rolagem fica travada e o foco não escapa do painel. */

(function (P) {
  'use strict';

  const { qs, el, fill } = P.dom;
  const { lock } = P.scroll;

  const FOCUSABLE = 'a[href], button, iframe, video, [tabindex]:not([tabindex="-1"])';

  let root;
  let panel;
  let title;
  let body;
  let lastFocused = null;

  function init() {
    root = qs('#modal');
    panel = qs('.modal__panel', root);
    title = qs('#modalTitle');
    body = qs('#modalBody');

    root.addEventListener('click', (event) => {
      if (event.target.closest('[data-close]')) close();
    });

    addEventListener('keydown', (event) => {
      if (!isOpen()) return;
      if (event.key === 'Escape') close();
      else if (event.key === 'Tab') trapFocus(event);
    });
  }

  const isOpen = () => root.classList.contains('is-open');

  function open(label, content) {
    lastFocused = document.activeElement;
    title.textContent = label;
    fill(body, content);
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    lock(true);
    qs('.modal__close', root).focus();
  }

  function close() {
    if (!isOpen()) return;
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    /* limpar o corpo interrompe a mídia que estava tocando */
    fill(body, null);
    lock(false);
    if (lastFocused) lastFocused.focus();
  }

  function openVideo(video, label) {
    if (video.youtubeId) {
      const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?autoplay=1&rel=0`;
      open(label, el('iframe', { src, allow: 'autoplay; encrypted-media; fullscreen', allowFullscreen: true, title: label }));
    } else if (video.src) {
      open(label, el('video', { src: video.src, controls: true, autoplay: true, playsInline: true }));
    } else if (video.link) {
      /* link externo é o único caso que sai do site */
      window.open(video.link, '_blank', 'noopener');
    }
  }

  function trapFocus(event) {
    const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter((node) => node.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  P.modal = { init, isOpen, close, openVideo };
})(window.Portfolio = window.Portfolio || {});
