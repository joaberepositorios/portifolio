# Portfólio de engenharia

Site pessoal de cinco seções. Vite + React + TypeScript, CSS puro.
O conteúdo (nome, jornada, projetos com capturas de tela, artigos, skills e links) veio
do outro portfólio, em `Pessoais Projetos/Portifóilio`; edite em `src/content/`.
Os certificados (AEB — Programação de Algoritmos em Python; ONC 2025 — ouro; OBLI 2025.1 — bronze; OBA 2024 e 2025) saíram dos PDFs `Python AEB` e `certificados`. A OBA (2024 e 2025) é uma entrada só, com o certificado empilhado e a marca "2×" (`count: 2`). Ainda falta o **número do WhatsApp**.

## Como abrir — sem servidor

**Dê dois cliques em `Portfolio.html`.** É um arquivo único e autossuficiente
(~1,4 MB): código, estilos, fontes, ícones e a simulação 3D estão embutidos.
Funciona direto do disco, offline, e pode ser enviado a qualquer hospedagem.

`Portfolio.html` é gerado — não edite à mão. Depois de mudar algo em `src/`:

```bash
npm install       # só na primeira vez
npm run build     # gera de novo o Portfolio.html
```

(`npm run dev` dá recarregamento automático enquanto você edita — opcional.
O `index.html` da raiz é só o molde do código-fonte, não o site.)

## Desenho

Baseado na referência visual fornecida, na versão clara: **fundo branco**, tinta
azul-marinho, títulos em serifa (Source Serif 4) e texto em Geist. O hero traz uma
**simulação 3D rodando ao vivo** (three.js, `src/components/sim/`), no traço
branco-e-azul do site: um quadrúpede nas proporções do Unitree Go2 anda em trote
por um ambiente virtual em grade que some numa névoa branca.

- **Marcha de verdade:** trote com cinemática inversa — as patas de apoio ficam
  cravadas no chão, as em balanço descrevem um arco até a próxima pegada.
- **LiDAR:** um feixe gira em torno do robô e acende uma nuvem de pontos nas
  faces dos obstáculos voltadas para ele; os pontos esmaecem depois.
- O chão fica limpo: só a grade, os anéis de alcance e o feixe do LiDAR.
- O ponteiro gira levemente a câmera. A simulação **pausa fora da tela** e com a
  aba oculta; com `prefers-reduced-motion` mostra um único quadro parado; sem
  WebGL, cai para um desenho SVG da mesma cena (`HeroScene.tsx`).

É honesto dizer o que ela não é: o modelo é **procedural** (caixas e cilindros),
não o CAD da Unitree, e não há física — é cinemática. Os parâmetros (velocidade,
período do trote, alcance do LiDAR, trajetória) ficam no topo de `simulation.ts`. Tipografia contida
(o maior texto é o nome, ~64 px no desktop), uma cor de destaque discreta e
fora do hero, animações mínimas (rolagem suave, fade curto na entrada, a curva
da jornada se desenha uma vez). `prefers-reduced-motion` desliga as animações. As variáveis
ficam no topo de `src/styles/global.css`.

**Parallax** (`src/lib/parallax.ts`): o hero se separa em camadas ao rolar (a
simulação fica para trás, o texto sobe mais rápido e esmaece), os títulos de
seção passam um pouco à frente do conteúdo, e as imagens dos projetos deslizam
dentro das molduras. Qualquer elemento entra com `data-parallax="0.1"`.
Desligado com `prefers-reduced-motion`.

**Animações conduzidas pela rolagem** (`src/lib/scrub.ts`): quem rola "opera" a
página. Cada elemento com `data-scrub` recebe uma variável CSS `--p` (0→1)
enquanto atravessa a tela, e o CSS decide o que fazer com ela; rolar para cima desfaz.

- **Linha de progresso** (`ScrollProgress`): uma linha fina sob o cabeçalho cresce conforme a
  página rola, com um marco para cada seção. No fim da página, o botão do WhatsApp pulsa duas vezes.
- **Hero:** a rolagem ergue a câmera da simulação até a vista aérea.
- **Títulos** se montam letra a letra.
- **Jornada:** a rolagem desenha a curva; um ponto viaja sobre ela e cada etapa
  acende quando ele chega (no celular, a linha vertical cresce).
- **Projetos:** a moldura abre como uma cortina e o texto entra em cascata. No celular a mesma
  entrada acontece de uma vez, por transição (`data-scrub-touch="step"`), para a rolagem ficar lisa.
- **Artigos & certificados:** cada linha é riscada da esquerda para a direita.
- **Skills:** os ícones chegam espalhados e girando, e se encaixam na grade.

Com `prefers-reduced-motion`, `--p` vale 1 desde o início: tudo aparece pronto.

**Fluidez no celular.** Durante a rolagem o código não lê o layout: as posições são medidas
fora dela (`src/lib/measure.ts`) e `scrollY` é lido uma vez por quadro. As imagens dos projetos
são decodificadas de antemão, com o navegador ocioso, e no toque nada usa `clip-path` animado
(ele repinta a imagem a cada quadro) — só `opacity` e `transform`, que rodam na GPU.

## As cinco seções

1. **Home** — o nome (em caixa alta), a frase "Engenharia de Computação com Inteligência Artificial", o botão "Ver projetos" e a simulação do robô. (`eyebrow` e `intro` são opcionais em `site.ts`.)
2. **Projetos** — uma vitrine: imagem, categoria, título e descrição (sem tecnologias nem links). O primeiro projeto em destaque, os demais em duas colunas. Sem imagem, uma capa desenhada (painel escuro) é exibida.
3. **Trabalho** (a jornada profissional; `src/sections/Journey.tsx`) — uma linha curva atravessa a seção e cada etapa pende de um nó;
   o trecho pontilhado no fim aponta para o que vem depois. No celular vira uma
   linha do tempo vertical.
4. **Artigos & Certificados** — em "L": os artigos à esquerda; os certificados descem pela direita e, quando os artigos acabam, ocupam também o espaço de baixo. Artigos abrem no leitor interno
   (`#/article/<slug>`, Esc/Voltar fecha) ou no site original (`externalUrl`).
5. **Skills** — só os ícones, nas cores das marcas, em grade. O nome aparece ao
   passar o mouse, no foco do teclado ou no toque.

Um único botão circular verde do WhatsApp (46 px) fica fixo no canto inferior direito.

## Editando o conteúdo

| Arquivo | Conteúdo |
| --- | --- |
| `src/content/site.ts` | Nome, sobrelinha, frase, apresentação, **número do WhatsApp**, links do rodapé |
| `src/content/journey.ts` | Etapas da jornada (3 a 5 funciona melhor) |
| `src/content/projects.ts` | Projetos (a categoria aparece como rótulo acima do título) |
| `src/content/records.ts` | Artigos (com capa; viram link se tiverem `externalUrl` ou `body`) e certificados (a coluna só aparece quando há algum) |
| `src/content/skills.ts` | Skills (só ícones) |
| `src/content/techIcons.ts` | Ícones gerados a partir do outro portfólio — não editar à mão |

**WhatsApp:** defina `whatsappNumber` em `site.ts` no formato internacional, ex.
`'+55 31 91234-5678'`. Até lá, o botão abre o WhatsApp sem destinatário.

**Imagens** (projetos): coloque em `src/assets/images/`, faça `import` no
arquivo de conteúdo e mantenha cada uma abaixo de ~300 KB — elas são embutidas
no HTML único.

**Ícones:** as skills usam `techIcons` (extraídos do outro portfólio, que já tinha VS Code,
Illustrator e Vegas). Para outras tecnologias: `import { siDocker } from 'simple-icons'`
→ `{ name: 'Docker', icon: siDocker }`.

**Imagens do outro portfólio:** as capturas dos projetos foram copiadas para
`src/assets/images/` redimensionadas para 1400 px e recomprimidas (de ~700 KB para
~240 KB no total), porque são embutidas no arquivo único. As capas dos artigos vieram como estavam.

## Privacidade — certificados

Vários certificados trazem **CPF impresso**. Antes de colocar a imagem de um certificado no
site, cubra o CPF — os da AEB e da OBLI foram cobertos (as imagens em `src/assets/images/`
já estão sem ele). Os PDFs originais não são embutidos no site e estão no `.gitignore`
(`*.pdf`), para não irem parar num repositório público por engano; o ideal é guardá-los fora
da pasta do projeto.

## Publicar

O site está no ar em **https://joaberepositorios.github.io/portifolio/** (GitHub Pages).

```
npm run deploy
```

Esse comando compila o projeto e envia o resultado (um único `index.html`) para o
branch `gh-pages`, que é o que o GitHub Pages serve. Em cerca de um minuto o endereço
mostra a versão nova.

- `main` guarda o código-fonte; `gh-pages` é só saída gerada (recriado a cada publicação).
- Publicar não envia o código: depois de editar, faça também `git commit` e `git push`.
- O portfólio anterior está guardado no branch `portfolio-antigo`
  (e na tag `portfolio-antigo-2026-09-20`).

Para outra hospedagem estática (Netlify Drop, Cloudflare Pages, Vercel), envie o
`Portfolio.html` renomeado para `index.html`.

## O que foi testado

O `Portfolio.html` gerado, aberto do disco (`file://`) com a rede desligada, no
Chrome headless em 360, 390, 820, 1366, 1440 e 1920 px: sem rolagem horizontal,
sem erros no console; fontes carregam; a simulação roda, pausa fora da tela,
respeita movimento reduzido e cai para o SVG sem WebGL; âncoras do menu param logo abaixo
do cabeçalho; parallax; curva da jornada; leitor de artigos (foco entra, página de trás fica inerte, Esc fecha,
foco volta); menu mobile.

Não testado: aparelhos iOS/Android reais, leitores de tela, Safari/Firefox.
