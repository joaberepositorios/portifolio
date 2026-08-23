/* Baixa os logos oficiais e grava js/ui/tech-icons.js — uma vez, no desenvolvimento.
   O site não busca nada em runtime: o que sobra é um arquivo local com os caminhos. */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'c:/Users/joabe/OneDrive/Área de Trabalho/Pessoais Projetos/Portifóilio';
const SI = 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons';
const SI_V11 = 'https://cdn.jsdelivr.net/npm/simple-icons@11/icons';

/* chave usada em content.js -> [slug do simple-icons, cor de reserva] */
const ICONS = [
  ['c/c++', 'cplusplus'],
  ['c++', 'cplusplus'],
  ['c', 'c'],
  ['python', 'python'],
  ['haskell', 'haskell'],
  ['javascript', 'javascript'],
  ['typescript', 'typescript'],
  ['html', 'html5'],
  ['html5', 'html5'],
  ['css', 'css3'],
  ['css3', 'css3'],
  ['php', 'php'],
  ['swift', 'swift'],
  ['java', 'openjdk'],
  ['rust', 'rust'],
  ['opengl', 'opengl'],
  ['unity', 'unity'],
  ['unreal engine', 'unrealengine'],
  ['godot', 'godotengine'],
  ['three.js', 'threedotjs'],
  ['blender', 'blender'],
  ['ros', 'ros'],
  ['opencv', 'opencv'],
  ['git', 'git'],
  ['github', 'github'],
  ['linux', 'linux'],
  ['docker', 'docker'],
  ['latex', 'latex'],
  ['cmake', 'cmake'],
  ['qt', 'qt'],
  ['react', 'react'],
  ['node.js', 'nodedotjs'],
  ['numpy', 'numpy'],
  ['pytorch', 'pytorch'],
  /* softwares */
  ['adobe illustrator', 'adobeillustrator'],
  ['illustrator', 'adobeillustrator'],
  ['intellij idea', 'intellijidea'],
  ['intellij', 'intellijidea'],
  ['sony vegas', 'vegas'],
  ['vegas', 'vegas']
];

/* Marcas que o simple-icons não distribui (questão de marca registrada) vêm do
   devicon, também livre. O VS Code saiu do simple-icons pelo mesmo motivo. */
const EXTRA = [
  ['c#', {
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-plain.svg',
    hex: '68217A'
  }],
  /* O VS Code saiu do simple-icons na v12 (marca registrada). A versão v11 ainda
     está publicada e é a certa aqui: caminho único, desenhado para uma cor só. O
     devicon tem o mesmo logo, mas em camadas com máscara — achatado num caminho
     só ele vira um borrão, e foi exatamente o que aconteceu na primeira tentativa. */
  ['vs code', { url: `${SI_V11}/visualstudiocode.svg`, hex: '007ACC' }],
  ['vscode', { url: `${SI_V11}/visualstudiocode.svg`, hex: '007ACC' }],
  ['visual studio code', { url: `${SI_V11}/visualstudiocode.svg`, hex: '007ACC' }]
];

/* Alguns logos são wordmarks: o desenho ocupa uma faixa fina no meio de um
   viewBox quadrado e, num selo de 26px, some. A caixa real de cada um foi medida
   no navegador (`getBBox`) e o viewBox é apertado para ela — o selo então sabe
   que é um logo largo e se alarga em vez de encolher o texto. */
const RECORTES = {
  'sony vegas': '0 9.1 24 5.79',
  vegas: '0 9.1 24 5.79',
  opengl: '0 7.03 24 9.95'
};

const get = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
};

/* O selo pinta um caminho só, numa cor só. Arte em camadas (máscara, gradiente,
   vários caminhos coloridos) não sobrevive a isso: achatada, vira um borrão. Então
   ela é recusada aqui em vez de virar um logo errado no site. */
const parse = (svg) => {
  const box = (svg.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 24 24';
  const caminhos = [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);

  if (/<mask|<linearGradient|<radialGradient|<image/i.test(svg)) {
    throw new Error('arte em camadas — precisa de uma versão monocromática');
  }
  if (caminhos.length > 1) {
    throw new Error(`${caminhos.length} caminhos — precisa de uma versão monocromática`);
  }
  if (!caminhos[0]) throw new Error('sem caminho');
  return { box, d: caminhos[0] };
};

console.log('cores…');
const data = JSON.parse(await get('https://cdn.jsdelivr.net/npm/simple-icons@13/_data/simple-icons.json'));
const list = Array.isArray(data) ? data : data.icons;
const hexBySlug = new Map();
for (const icon of list) {
  const slug = (icon.slug || icon.title || '')
    .toLowerCase().replace(/\+/g, 'plus').replace(/\./g, 'dot').replace(/[^a-z0-9]/g, '');
  hexBySlug.set(slug, icon.hex);
  if (icon.slug) hexBySlug.set(icon.slug, icon.hex);
}

const out = {};
for (const [chave, slug] of ICONS) {
  try {
    const svg = await get(`${SI}/${slug}.svg`);
    const { box, d } = parse(svg);
    const hex = hexBySlug.get(slug) || '1D3A6B';
    out[chave] = { slug, box: RECORTES[chave] || box, hex: `#${hex}`, d };
    process.stdout.write(`  ${chave} (${slug}) #${hex}\n`);
  } catch (e) {
    console.log(`  FALHOU ${chave} (${slug}): ${e.message}`);
  }
}
for (const [chave, spec] of EXTRA) {
  const { box, d } = parse(await get(spec.url));
  out[chave] = { slug: chave, box: RECORTES[chave] || box, hex: `#${spec.hex}`, d };
  console.log(`  ${chave} (avulso) #${spec.hex}`);
}

const entries = Object.entries(out)
  .map(([k, v]) => `    ${JSON.stringify(k)}: { box: ${JSON.stringify(v.box)}, hex: ${JSON.stringify(v.hex)}, d: ${JSON.stringify(v.d)} }`)
  .join(',\n');

const file = `/* Logos das tecnologias — GERADO, não editar à mão.

   Fonte: Simple Icons (CC0) e, para o C# (fora do Simple Icons por questão de
   marca), o devicon (MIT). Os caminhos ficam aqui dentro de propósito: o site não
   busca nada em runtime, continua abrindo do disco e não quebra sem rede.

   Para regerar ou acrescentar tecnologias:
     node tools/gera-icones.mjs
*/

(function (P) {
  'use strict';

  const ICONS = {
${entries}
  };

  P.techIcons = ICONS;
})(window.Portfolio = window.Portfolio || {});
`;

fs.writeFileSync(path.join(ROOT, 'js/ui/tech-icons.js'), file, 'utf8');
console.log(`\n${Object.keys(out).length} ícones gravados em js/ui/tech-icons.js (${(file.length / 1024).toFixed(0)} KB)`);
