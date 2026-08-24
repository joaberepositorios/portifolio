# Portfólio

Site estático de página única — sem framework, sem build, sem dependência em runtime.
O fundo é um **Unitree Go2 renderizado em WebGL** que **se desmonta conforme a página desce**:
a malha e as cores vêm do URDF oficial, e cada grupo de material do modelo é uma peça
independente na vista explodida.

## Como o código está organizado

Cada arquivo é um script clássico que se registra em `window.Portfolio` e é carregado com
`defer`, na ordem declarada no `index.html`. Nada de bundler: **basta abrir o `index.html`**,
inclusive por duplo clique — módulos ES seriam bloqueados por `file://`.

```
index.html
curr.html           currículo: editável na página e exportável em uma folha A4
css/
  tokens.css        variáveis de cor, forma, tipografia e ritmo — a única fonte desses valores
  base.css          reset, tipografia e peças reutilizadas (chips, botões, revelação)
  layout.css        menu, seções, abertura e o véu escuro do topo
  components.css    linha do tempo, projetos, artigos, competências e modal
js/
  content.js        todo o conteúdo editável do site
  main.js           ponto de entrada: monta o conteúdo e liga os efeitos
  core/
    dom.js          construção de DOM sem concatenar HTML
    ease.js         clamp, smoothstep, amortecimento e ruído determinístico
    ticker.js       um único requestAnimationFrame para o site inteiro
    geometry.js     medidas da página em cache, refeitas fora do laço de animação
    scroll.js       estado de rolagem compartilhado e deslize amortecido
  ui/
    sections.js     monta experiências, projetos, artigos, competências e currículo
    backdrop.js     campo de bolas e bolinhas azuis à deriva, em canvas 2D
    badges.js       selo de cada tecnologia: logo, cor de fundo e contraste
    tech-icons.js   logos oficiais (GERADO por tools/gera-icones.mjs)
    reveal.js       revelação dos blocos ao entrar em tela
    modal.js        vídeo e PDF dentro do site, com foco preso e rolagem travada
    chrome.js       véu escuro, órbitas e trilho da linha do tempo
  robot/
    index.js        cena: câmera, laço de desenho e a coreografia ligada à rolagem
    rig.js          esqueleto e marcha, direto do URDF
    explode.js      a desmontagem: quem sai, quando, para onde e girando quanto
    guides.js       as linhas tracejadas que ligam cada peça ao encaixe
    gl.js           contexto, programas e envio das malhas para a GPU
    math.js         matrizes 4x4 com pool de rascunho (o laço não aloca)
    shaders.js      GLSL da superfície e das guias
  model/go2-mesh.js malhas geradas por tools/dae2web.py (1,1 MB)
tools/
  dae2web.py        conversor Collada -> pacote binário das malhas
  gera-icones.mjs   baixa os logos das tecnologias e grava js/ui/tech-icons.js
```

Três princípios de sustentação:

- **Uma exceção na rolagem, só na descida.** Na abertura, um gesto para baixo leva a página
  inteira até as Experiências acadêmicas. É o único salto automático do site — **a volta é rolagem
  comum**, como todo o resto. Um gesto para cima cancela o salto no meio do caminho, e a
  trava se solta assim que a página chega perto do destino (senão o último pixel de
  amortecimento engoliria o gesto seguinte).
- **Rolagem livre, lenta e fluida.** A roda empurra um alvo e a página persegue esse alvo
  com amortecimento exponencial (τ 0,26; cada volta vale 0,78 da distância). τ é o que
  separa lento de arrastado: alto demais e a página parece presa ao gesto anterior.
- **Sem borrão de movimento e sem filtro.** Não há `filter` em lugar nenhum: desfocar
  camadas de tela cheia por composição era o item que mais travava a página. Não há paradas
  obrigatórias — houve uma versão com elas, e travava a página enquanto o dedo continuasse
  na roda. Uma rolagem vinda de fora (barra, teclado, âncora) cancela o deslize, e a
  distinção entre "fomos nós" e "foi de fora" é por **posição**, não por marcador: os
  eventos de rolagem são agrupados pelo navegador e um booleano seria consumido pelo
  primeiro deles, cancelando a própria animação no meio.
- **Um laço só.** `core/ticker.js` mantém um único `requestAnimationFrame`; rolagem, menu,
  véu, trilho e robô são assinantes dele. Todo amortecimento é por tempo real
  (`1 - exp(-dt/τ)`), então a sensação é a mesma em 60, 120 ou 144 Hz e nada acelera
  quando a taxa cai.
- **Nada de layout dentro do laço.** As medidas ficam em `core/geometry.js` e são refeitas
  ao carregar, ao redimensionar e quando o conteúdo muda de altura (`ResizeObserver`).
  O laço só lê números prontos.
- **Conteúdo entra como texto.** `core/dom.js` cria nós de DOM; nenhuma string de HTML é
  montada com dados, então não há o que escapar à mão.
- **Um namespace só.** Cada arquivo é um IIFE que lê o que precisa de `window.Portfolio` e
  devolve sua parte no fim (`P.chrome = { init }`). Nada vaza para o escopo global.

## Desenho

- **Projetos em grade de três.** Cartões compactos, três por linha: mostra o conjunto de
  uma vez e economiza a altura que o formato anterior gastava com um projeto por tela.
- **Artigos na mesma leitura dos projetos.** Uma grade de cartões: a capa mostra a
  primeira página do PDF, e embaixo vêm título, sua função de escrita e onde o texto saiu.
  Clicar na capa (ou no botão) abre o arquivo num modal rolável, sem baixar nada.
- **A prévia só é montada quando o cartão chega à tela.** Instanciar o leitor de PDF é
  caro; três deles no carregamento custariam a rolagem. E ela é um `object`, não um
  `iframe`, de propósito: sem o arquivo o navegador desenha o conteúdo de reserva — uma
  página em branco no cartão, um recado com o caminho no modal — em vez de um retângulo
  quebrado.
- **Sem caixa branca com sombra fora dos cartões.** O que separa os blocos são réguas de
  1px, espaço e tipografia. A navegação continua sendo a rolagem — a barra do topo é atalho,
  não moldura: sem fundo próprio no escuro, sem sombra, sem borda em volta. As competências
  viraram linhas e o currículo virou uma faixa de fecho.
- **Tipografia de instrumento.** Corpo curto (13,5–14,5 px), entrelinha larga e peso leve
  — 300 no título grande, 400 no resto. Números, rótulos e ações vão em monoespaçada do
  sistema (`ui-monospace`), sem baixar fonte nenhuma: é o que dá o ar técnico sem pesar
  no carregamento.
- **Paleta própria.** Papel azulado e claro (`#eef2fa`), tinta grafite (`#0d1220`) e **um
  acento só: azul escuro** (`#1d3a6b`). O papel é claro de propósito: a leitura acontece
  sobre ele, e tudo o que é decoração fica abaixo em valor — inclusive o campo de bolinhas,
  que perde quase metade da força sobre o papel e só brilha sobre a abertura escura. Sobre o escuro da abertura entra o mesmo azul um passo
  mais claro (`#5b8ade`) — sem isso não há contraste de leitura. Onde faziam falta dois
  níveis (as etiquetas dos artigos, por exemplo), a diferença é de tom, não de cor: azul
  e grafite.
- **Fundo de linhas tecnológicas.** `ui/backdrop.js` desenha traços de circuito — polilinhas
  com dobras em ângulo reto, nó na ponta e um tracejado correndo por cima, como sinal
  passando. Nada de formas circulares soltas. Cada traço tem profundidade própria, que rege
  velocidade em relação à rolagem, comprimento, opacidade e em que plano ele vive; e o campo
  se repete sem emenda (cada corpo reentra pela borda oposta enquanto está fora de tela).
- **A cor segue a mesma curva `opening()` do véu** — azul claro sobre a abertura escura,
  azul escuro sobre o papel. Com `prefers-reduced-motion` o campo é pintado uma vez e fica
  parado.
- **Parallax por camadas.** `ui/parallax.js` desloca cada camada em relação ao centro da
  tela conforme o fator em `data-parallax` (título da seção 0,05; mídia do projeto 0,085
  contra o texto em −0,05; rótulos 0,03; número de fundo 0,26).
- **Sem numeração e sem substituto.** Nada é contado — saíram os números das seções, dos
  artigos, dos projetos e das competências — e nada entrou no lugar: nem marca d'água, nem
  traço. Cada bloco começa direto no título. Quem carrega o parallax na parte clara passou
  a ser só o campo de bolas nos dois planos, mais os próprios blocos de conteúdo.
- **Profundidade em três planos.** O campo de bolas e bolinhas é desenhado em **dois
  canvas**: um atrás do conteúdo e outro **à frente dele**. Os corpos da frente são os mais
  próximos — grandes, quase transparentes e rápidos; os de trás, pequenos, nítidos e
  lentos. A profundidade de cada corpo rege velocidade, raio, opacidade e em que plano ele
  vive. Sem nada passando por cima do texto, todo o movimento aconteceria atrás e a página
  continuaria achatada. O valor sai como `--py` e o CSS **soma** ao
  deslocamento da revelação, então um efeito não apaga o outro. Terminada a entrada, o
  bloco é marcado como assentado e o transform deixa de ser animado — o parallax responde
  no mesmo quadro, sem arrasto.
- **A abertura não usa degradê.** O escuro é **cor chapada**. O que dá distância são
  duas coisas simples: as linhas, que deslizam em velocidades diferentes conforme a
  profundidade, e um campo de **estrelas pequenas** atrás delas — as fracas quase
  paradas, as fortes acompanhando a rolagem. Sem cintilação: piscar atrás do nome deixa
  a leitura inquieta.
- **O ponteiro desloca o campo alguns pixels**, o bastante para o fundo não parecer
  colado no vidro, e o nome anda 3px ao contrário. Um ouvinte de `pointermove` guardando
  dois números; quem desenha é o laço que já existia.
- **As estrelas são só da abertura.** Abaixo de 2% de véu elas nem entram no laço. São 90
  pontos de 1 a 2 pixels, com a cor reaproveitada em 24 faixas de brilho — sem isso
  seriam noventa strings de `rgba()` por repintura. Custo medido: indistinguível de zero.
- **Barra de seções, fixa no topo.** Quatro entradas de uma palavra — Experiências,
  Projetos, Artigos, Competências. Sem ícone e sem caixa: só a palavra.
  **A cor troca com o fundo, não em cima dele**: `color-mix` interpola branco e
  tinta pela variável `--dark-step`, a mesma curva que dissolve o véu escuro, então a barra
  clareia e escurece no mesmo movimento da página. A faixa de papel atrás dela só aparece
  no claro, onde o texto precisa de base para não disputar com o conteúdo que passa por
  baixo — no escuro ela é transparente e as estrelas continuam visíveis.
- **A entrada da seção que está sendo lida acende.** Um `IntersectionObserver` com a janela
  cortada em 45% em cima e embaixo resolve isso por evento: nada entra no laço de quadro,
  que é onde o custo apareceria.
- **Uma palavra cabe em qualquer tela.** Abaixo de 560px o que aperta é o espaço entre
  elas, não o texto: as quatro continuam numa linha só, sem transbordo horizontal.
- **A folga do topo subiu para 76px.** É o que faz o título da seção pousar embaixo da
  barra em vez de atrás dela. A última seção pousa mais abaixo porque a página acaba: o
  navegador limita a rolagem, e não há como levá-la ao topo sem inventar espaço vazio.
- **O currículo sai sempre em uma folha.** `curr.html` mede a si mesmo antes de imprimir:
  as regras do `@media print` são copiadas para uma classe temporária, a folha é medida na
  largura real do papel (188mm) e, se passar dos 271mm de altura útil, um `zoom` proporcional
  entra em cena. É `zoom` e não `transform` de propósito — a paginação enxerga zoom, e
  encolher com `transform` deixaria a segunda página em branco do mesmo jeito. Com o texto
  atual o fator é 1: o documento ocupa 72% da folha e sai no tamanho projetado.
- **A última seção exibe o próprio currículo.** Não um cartão falando dele: a folha
  aparece no centro da seção, grande o bastante para se ler, montada a partir de
  `curr.html?vitrine=1` — a mesma página, sem a barra de edição. **Uma ação só, abrir**:
  o documento se lê dentro do site, num modal rolável, e não há caminho de download na
  vitrine. A prévia só é criada quando chega à tela, e a redução é calculada em JS porque
  `scale()` exige número puro: `calc(620px / 794)` devolveria pixel e o navegador
  descartaria a regra sem avisar.
- **Duas divisórias no currículo, e só duas:** a horizontal que fecha o objetivo e a vertical
  que separa a coluna lateral. O resto do que separava blocos virou espaço.
- **Ícones.** Um sprite SVG no `index.html` (traço único, herdando a cor do texto) marca
  o play dos projetos, o selo de PDF na capa dos artigos e as quatro redes da abertura — a
  barra do topo não usa nenhum.
  As seções abrem direto no título: a faixa de ícone e régua que existia acima deles saiu.
- **Competências em três frentes.** *Linguagens*, *Softwares* e *Profissionais*. Grupo em
  cima, itens em sequência embaixo — cada tecnologia com o **logo oficial** num quadrado da
  cor da marca. As competências profissionais não têm logo e não ganham um inventado: vão
  como texto, com um traço curto no lugar do selo para a coluna continuar alinhada.
- **Os logos são locais.** `tools/gera-icones.mjs` baixa uma vez (Simple Icons, CC0; e
  devicon, MIT, para o C#) e grava os
  caminhos em `ui/tech-icons.js`. Em runtime **nada é buscado**: o site continua abrindo do
  disco e funcionando sem rede. Para acrescentar tecnologias, some o slug na lista do
  gerador e rode `node tools/gera-icones.mjs`.
- **Um caminho só, uma cor só.** O selo pinta um `path` monocromático, então arte em
  camadas não serve: o VS Code do devicon tem máscara e três formas coloridas e, achatado,
  virava um borrão azul. O gerador agora **recusa** SVG com máscara, gradiente ou mais de
  um caminho, e o VS Code vem do Simple Icons v11 — a última versão antes de a marca ser
  retirada, já desenhada para uma cor só.
- **Wordmark não vira quadradinho.** Logos largos e baixos (o VEGAS, do Sony Vegas)
  sumiriam espremidos em 26px. A caixa real deles foi medida no navegador e o `viewBox`
  vem apertado nela; quando a proporção passa de 2, o selo se alarga em retângulo e o
  logo continua legível.
- **Contraste automático.** A cor do logo (claro ou escuro) sai da luminância da própria
  marca, sem tabela manual: o amarelo do JavaScript recebe traço escuro, o preto do Java
  recebe traço claro. Marca quase branca (Unity) inverte — quadrado escuro, logo claro. E
  tecnologia sem logo na tabela vira um selo de iniciais em vez de um buraco.
- **A abertura ocupa a tela inteira por um motivo prático.** O véu escuro só se dissolve
  ao longo da primeira rolagem; qualquer conteúdo que subisse antes disso apareceria em
  tinta escura sobre fundo escuro. A tela cheia garante que a próxima seção só chegue
  quando o papel já clareou.
- **Sinal de que há mais abaixo.** A chamada de rolagem fica presa ao rodapé da abertura,
  com um traço que desce sem parar — é o que diz, sem texto, que a página continua. Ela
  desvanece junto com o véu.
## Desempenho

O robô é, de longe, o item mais caro da página: 28 chamadas de desenho e 68 mil triângulos
por quadro. Medindo o tempo de quadro com e sem ele, **ele responde por cerca de 90% do
custo**. O que o mantém sob controle:

- **Sem MSAA.** Multiplicar amostras por pixel é o item mais caro do desenho, e a
  suavização já vem do supersampling. Foi a maior economia isolada.
- **Alvo de render com teto de 2,4 MP**, mais o limite real da GPU (`MAX_RENDERBUFFER_SIZE`).
- **30 quadros por segundo** para o robô e para o fundo: os dois têm movimento lento, e a
  metade das repinturas não muda nada na tela.
- **Vigia adaptativo.** Não dá para saber em que placa o site vai rodar. Se os quadros ficam
  longos por tempo suficiente, o robô encolhe; insistindo, ele sai de cena — e volta sozinho
  se a máquina se recuperar. A conta é assimétrica (um quadro bom apaga dois ruins), então
  um engasgo isolado não derruba a qualidade.
- **Perda de contexto é reconstruída.** Programas, buffers e VAOs morrem com o contexto;
  o pacote de malhas fica guardado e tudo é refeito no `webglcontextrestored`. Antes o robô
  sumia para sempre — era isso que acontecia quando a GPU não aguentava o alvo de render.
- **Nada de `filter` em camada de tela cheia**, e escritas no DOM por quadro só quando o
  valor muda de verdade.
- **Caminhos prontos no fundo.** Cada traço de circuito é um `Path2D` montado uma vez; o
  quadro só translada e pinta.

## O robô

- **Geometria e materiais originais.** As malhas `base`, `hip`, `thigh`, `thigh_mirror`,
  `calf` e `calf_mirror` vêm dos `.dae` do
  [go2_description](https://github.com/unitreerobotics/unitree_ros/tree/master/robots/go2_description).
  As cores são as difusas dos próprios materiais — nada foi estilizado. `foot.dae` não é
  usado: a ponta preta da pata já faz parte de `calf.dae` (grupo *black foot end*), e é
  justamente ela que sai primeiro na desmontagem.
- **Cinemática do URDF.** Quadris em (±0,1934, ±0,0465), coxa e canela de 0,213 m, eixo do
  quadril em X, coxa e joelho em Y, malhas espelhadas e rotações de visual (`FR` roll π,
  `RL` pitch π, `RR` ambos) respeitadas. De pé, o quadril fica a 0,278 m do chão.
- **Acabamento fosco.** Sem lóbulo especular nenhum: a difusa é *wrapped* (a luz contorna
  a peça em vez de cair a pique), o ambiente tem dois tons — papel morno em cima, sombra
  fria embaixo — e resta apenas um contorno largo e tênue. É plástico fosco de robô, não
  plástico polido.
- **A luz é a da sala, e a sala muda.** Um valor só (`uRoom`, a curva `opening()` do véu)
  leva ambiente, tinta do albedo e exposição da abertura escura ao papel claro: lá o robô
  perde brilho e ganha azul para pertencer ao fundo; aqui volta a ser um objeto claro sobre
  papel. Sem isso ele virava um vulto branco recortado contra o escuro.
- **Chave, preenchimento e contraluz**, todos com wrap, os dois últimos francamente azuis.
  Um ruído de meio nível (dither) quebra as faixas que apareciam nos degradês largos, já
  que as normais chegam em `Int8`.
- **Por que não three.js.** Os ganhos reais da biblioteca (sombras, IBL, pós-processamento)
  custariam ~600 KB, quebrariam a abertura por duplo clique — o build ESM é bloqueado em
  `file://` — e exigiriam reescrever rig, desmontagem e guias por cima da cena dela. Com a
  malha já decimada em 68 mil triângulos e material fosco, o teto de qualidade aqui não
  está no motor: está na malha e na luz.
- **Enquadramento.** Vista de 3/4 de frente, lente longa de 24°, perspectiva discreta, de
  foto de produto. Iluminação de três pontos (chave, preenchimento e contraluz) e
  tonemap ACES.
- **Nitidez, com teto.** MSAA mais supersampling: o canvas é renderizado acima da
  resolução da tela (2,1× em telas 1×, 1,4× em alta densidade) e reduzido pelo navegador.
  O tamanho é limitado por **6,5 MP de área** e pelo `MAX_RENDERBUFFER_SIZE` da GPU — com
  MSAA cada pixel custa várias amostras em VRAM, e um alvo grande demais faz placa
  integrada **perder o contexto**, deixando a tela sem robô e sem erro. Se a perda
  acontecer mesmo assim, ela é absorvida (`webglcontextlost`) e a cena volta em qualidade
  mínima, em vez de sumir.
- **Custo controlado.** O pacote de malhas (1,1 MB, 68 mil triângulos) só é baixado quando
  há WebGL2, a tela tem pelo menos 760 px e o navegador não está em economia de dados.
  Fora disso o fundo simplesmente fica limpo.

### A desmontagem

Cada grupo de material vira uma peça própria — 28 no total: 4 patas, 4 canelas, 8 metades de
coxa, 8 de quadril, 3 módulos internos do corpo e o casco. A inscrição "Go2" é um grupo de
material à parte no pacote, mas **não é peça**: é pintura sobre o casco, então viaja como
grupo extra dele, com a mesma matriz. Tratá-la como peça fazia a letra descolar do corpo
durante a desmontagem. A desmontagem é **função pura da
rolagem**: subir a página remonta o robô, peça por peça, sem estado escondido.

- **Cascata das extremidades para o centro.** As patas soltam primeiro, depois canelas,
  coxas, quadris, os módulos internos e, por último, o casco, que sobe abrindo o corpo.
  Cada peça leva 38% do percurso para completar o caminho, com um atraso por perna, de modo
  que as quatro não saem em bloco.
- **A travessia é um arco.** Ele entra montado e trotando, se desmonta até o auge no meio
  da seção (56% da janela) e **volta a se montar na aproximação de Projetos**: sai de cena
  inteiro e trotando, não como um monte de peças soltas. Não há platô de "já desmontado" —
  em qualquer ponto visível ele está montando ou desmontando, então subir a página também
  nunca começa numa imagem parada.
  E a peça solta nunca fica imóvel — além de se afastar pelo eixo de encaixe, ela respira
  na distância, bamboleia de lado e gira devagar sem parar, tudo escalado pelo quanto ela
  já saiu (peça montada continua firme no lugar).
- **Direção de encaixe.** Ninguém sai numa direção qualquer: cada peça viaja pelo eixo em
  que estava montada — a pata para baixo e para fora, a coxa lateralmente, o módulo do
  corpo no sentido em que estava alojado — com um giro lento sobre o próprio centro.
- **Guias.** Um traço pontilhado azul liga cada peça solta ao ponto de onde saiu, como num
  desenho técnico. Tudo cabe em um buffer e uma chamada de desenho.
- **A marcha para.** Enquanto o robô está inteiro ele trota (trote diagonal, regido pelo
  tempo e pouco pela rolagem, para as pernas não chicotearem). Assim que a desmontagem
  começa, a passada se fecha: pernas soltas não andam.
- **A câmera acompanha.** A vista explodida ocupa mais espaço, então a câmera recua e gira
  devagar para mostrar o conjunto inteiro, e a peça mais distante fica a menos de 0,8 m do
  centro — dentro do quadro.
- **Uma seção só.** O robô pertence às **Experiências acadêmicas** e a mais nada: a janela de
  vida dele sai da caixa da própria seção — entra quando o topo dela chega a um terço da
  tela, e some antes de Projetos. O portão de visibilidade é calculado com a rolagem
  **real**, não com a amortecida, e o valor amortecido é preso à janela: sem isso, numa
  rolagem rápida ele ficava para trás e o robô aparecia fora da seção. Há um teste que
  varre a página inteira em passos de meia tela conferindo que isso não volta a acontecer. Na abertura e depois do currículo nada é desenhado (o
  laço nem chega a desenhar quando a opacidade zera). Ele chega agachado, levanta enquanto
  entra em cena, trota na faixa livre à direita — em telas largas o conteúdo do currículo
  ocupa a coluna da esquerda justamente para isso — e se desmonta ao longo da seção.
- **Ele repara em você.** Com mouse (e sem `prefers-reduced-motion`), o ponteiro gira o robô
  de leve — ±0,16 rad de guinada e ±0,05 de inclinação, amortecidos, para acompanhar o
  cursor sem colar nele. No toque isso não existe.

### Regerar o modelo

```
python tools/dae2web.py <pasta com os .dae> js/model/go2-mesh.js
```

O conversor lê o Collada, aplica as matrizes de nó, agrupa os triângulos por material,
decima por agrupamento em grade até a meta de cada elo, reconstrói as normais preservando
arestas vivas e grava posições `Int16` + normais `Int8` + índices `Uint32` em base64.
Índices de 16 bits quando cabem: de 197 mil triângulos originais para 68 mil, mantendo o
contorno. **O agrupamento por material é o que define as peças da desmontagem** — mudar os
grupos muda o que se solta.

## Abertura escura

A primeira tela nasce escura — um véu fixo em azul profundo com brilho velvet — e vai
clareando conforme a página desce. Três valores acompanham a mesma curva, escritos em
`--dark`, `--dark-step` e `--hero-fade`:

- o **véu** perde opacidade ao longo da primeira tela;
- o **menu** troca de cor com uma curva mais fechada, para não atravessar um cinza sem
  contraste;
- o **conteúdo da abertura** é claro sobre o escuro e **desvanece junto com o véu** em vez
  de trocar de cor — assim nunca fica ilegível no meio do caminho.

Navegadores sem `color-mix` caem no tema claro de sempre, sem véu.

## Editar conteúdo

Tudo em `js/content.js`:

- `nome`, `lead`, `sobre`.
- `redes` — LinkedIn, GitHub, Instagram e YouTube da abertura. Cole o endereço completo
  (`https://...`); o ícone só vira link quando há endereço. Vazio, ele aparece apagado,
  marcando o lugar sem fingir um link que não leva a nada.
- `foto` — retrato da abertura. Aponte para um arquivo em `assets/img/` (recorte quadrado,
  ~600 px de lado, fundo simples). Deixe vazio e nada é desenhado: nunca sobra uma moldura
  vazia se o arquivo não existir ou falhar ao carregar.
- `timeline` — **Experiências acadêmicas**, em dois níveis: a instituição é o tópico maior
  (`titulo`, `papel`) e cada lugar onde você trabalhou é uma `frente` dentro dela, com
  `titulo`, `papel` (função e período), `descricao` de uma linha e `topicos` — três a
  quatro frases curtas, não parágrafos. Para acrescentar outro lugar, some uma frente; para
  outra instituição, some um item na lista. A forma antiga, com `grupos`/`subtopicos` em
  colunas, continua sendo desenhada se você preferir voltar a ela.
- `projetos` — `video` (`src`, `youtubeId` ou `link`), `objetivo` e `stack`. Enquanto o
  arquivo não existe, a área fica com acabamento de placeholder em vez de quebrar.
- `artigos` — `titulo`, `autoria` (sua função no texto: autor principal, coautor…),
  `evento` (onde saiu), `lingua`, `categoria`, `ano`, `descricao` e `pdf`. A capa do
  cartão é a primeira página do próprio PDF; `capa` (imagem em `assets/img/`) substitui
  essa prévia quando você preferir uma arte.
- `competencias` — cada grupo tem `grupo` e `itens`. O nome do item é a chave do logo
  (`ui/tech-icons.js`), sem diferenciar maiúsculas: "VS Code", "Adobe Illustrator", "Sony
  Vegas". Marca nova pede o slug no gerador e um `node tools/gera-icones.mjs`. Grupo com
  `tipo: 'texto'` sai sem selo — é o caso das competências profissionais.
- `cv`.

PDFs e vídeos abrem em modal dentro do site, sem download.

## Acessibilidade

Atalho para o conteúdo, foco visível, mídia de projeto operável por teclado, modal com
`aria-modal`, foco preso enquanto aberto e devolvido ao elemento de origem ao fechar.
Com `prefers-reduced-motion` a rolagem volta a ser a do navegador, as revelações não
animam, o parallax nem é ligado e o robô para de respirar e de trotar.

## Cache

CSS e JS entram no HTML com um carimbo de versão (`?v=2`). Depois de editar, suba esse
número no `index.html` para os visitantes buscarem os arquivos novos — sem ele, o
navegador serve os antigos e a página parece não ter mudado. Em desenvolvimento, um
Ctrl+Shift+R resolve.

## Rodar

Abrir o `index.html` no navegador já funciona — inclusive com duplo clique, direto do disco:
conteúdo, robô, PDFs e vídeos carregam por `file://`.

Para desenvolver (ou publicar), um servidor estático qualquer serve:

```
python -m http.server 8000
```

## Créditos

Malhas do Go2 © Unitree Robotics, distribuídas em `unitree_ros` sob licença BSD 3-Clause.
