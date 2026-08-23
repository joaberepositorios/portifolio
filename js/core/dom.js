/* Construção de DOM sem concatenar HTML: o conteúdo entra sempre como texto,
   então nada precisa ser escapado à mão. */

(function (P) {
  'use strict';

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /**
   * el('div.classe', { attr: valor }, [filhos | texto])
   * O seletor aceita tag, .classes e #id — na mesma forma usada no CSS.
   */
  function el(selector, attrs = null, children = null) {
    const [head, ...classes] = selector.split('.');
    const [tag, id] = head.split('#');
    const node = document.createElement(tag || 'div');

    if (id) node.id = id;
    if (classes.length) node.className = classes.join(' ');

    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        if (value == null || value === false) continue;
        if (key === 'text') node.textContent = value;
        else if (key === 'dataset') Object.assign(node.dataset, value);
        else if (key in node && key !== 'list') node[key] = value;
        else node.setAttribute(key, value === true ? 'true' : value);
      }
    }

    append(node, children);
    return node;
  }

  function append(node, children) {
    if (children == null) return node;
    for (const child of [].concat(children)) {
      if (child == null || child === false) continue;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  /** Substitui o conteúdo de um contêiner por uma lista de nós, em um único reflow. */
  function fill(node, children) {
    const frag = document.createDocumentFragment();
    append(frag, children);
    node.replaceChildren(frag);
    return node;
  }

  const tag = (text, variant) => el(`span.tag${variant ? '.tag--' + variant : ''}`, { text });

  const list = (items, itemClass = '') =>
    el('ul', null, items.map((item) => el(`li${itemClass}`, { text: item })));

  /** Ícone do sprite declarado no index.html. SVG exige createElementNS. */
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function icon(name, className = 'icon') {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
  }

  /** SVG com caminho próprio (os logos das tecnologias vêm assim). */
  function glyph(box, d, className = 'glyph') {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('viewBox', box);
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'currentColor');
    svg.append(path);
    return svg;
  }

  /** Seta dos links de ação — dois retângulos, sem imagem. */
  const arrow = () => el('span.action__arrow', { 'aria-hidden': true });

  P.dom = { qs, qsa, el, append, fill, tag, list, icon, glyph, arrow };
})(window.Portfolio = window.Portfolio || {});
