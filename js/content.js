/* Conteúdo editável do portfólio — é o único arquivo que precisa ser tocado
   para atualizar o site.

   video: { src: "assets/video/arquivo.mp4" }  ou  { youtubeId: "ID" }  ou  { link: "https://..." }
   pdf:   "assets/pdf/arquivo.pdf" — abre no modal do site, sem download. */

window.Portfolio = window.Portfolio || {};

window.Portfolio.CONTENT = {
  nome: 'Joabe Alves',
  /* retrato da abertura: aponte para um arquivo em assets/img/ (recorte quadrado,
     ~600 px de lado). Deixe vazio e nada é desenhado — nunca sobra moldura vazia. */
  foto: '',
  lead: 'Este portifólio porta minhas experiências acadêmicas e profissionais, segue abaixo em sequências minhas habilidades desenvolvidas durante meu percurso profissional e demonstrações de eficiência produtiva.',
  sobre: 'Graduando na Universidade Federal de Uberlândia (UFU) e pesquisador no GRVA — Grupo de Realidade Virtual e Aumentada.',

  /* Redes da abertura. Cole o endereço completo (https://...) — o ícone só vira
     link quando há endereço; vazio, ele fica apagado, marcando o lugar. */
  redes: {
    linkedin: '',
    github: '',
    instagram: '',
    youtube: ''
  },

  /* O currículo é a própria página `curr.html` — editável, e com botão de exportar
     em uma folha A4. `arquivo` só é usado se você preferir apontar para um PDF. */
  cv: {
    pagina: 'curr.html',
    arquivo: '',
    nota: 'Versão consolidada, leitura direta no navegador.'
  },

  /* Experiências acadêmicas: a instituição é o tópico maior e cada lugar onde
     você trabalhou é uma frente, com uma linha de descrição e tópicos curtos.
     Para acrescentar outra, some um item em `frentes`. */
  timeline: [
    {
      periodo: 'UFU',
      titulo: 'Universidade Federal de Uberlândia',
      papel: 'Onde trabalho e pesquiso',
      frentes: [
        {
          titulo: 'GRVA — Grupo de Realidade Virtual e Aumentada',
          papel: 'Pesquisa e desenvolvimento · desde 2026',
          descricao: 'Treinamento de robótica com aprendizado de máquina, dentro do grupo de realidade virtual e aumentada da UFU.',
          topicos: [
            'Treinamento de agentes de robótica com aprendizado de máquina',
            'Python e bibliotecas de IA aplicadas a simulação',
            'Apoio a novos integrantes e documentação técnica'
          ]
        },
        {
          titulo: '[Segundo lugar onde você trabalhou]',
          papel: '[Função · período]',
          descricao: '[Uma linha dizendo o que era o lugar e o que você fazia lá.]',
          topicos: [
            '[O que você entregou ou construiu]',
            '[Ferramenta ou tecnologia principal]',
            '[Resultado, publicação ou aprendizado]'
          ]
        },
        {
          titulo: '[Terceiro lugar onde você trabalhou]',
          papel: '[Função · período]',
          descricao: '[Uma linha dizendo o que era o lugar e o que você fazia lá.]',
          topicos: [
            '[O que você entregou ou construiu]',
            '[Ferramenta ou tecnologia principal]',
            '[Resultado, publicação ou aprendizado]'
          ]
        }
      ]
    }
  ],

  projetos: [
    {
      titulo: 'Projeto 1',
      video: { src: 'assets/video/projeto-1.mp4' },
      objetivo: 'Objetivo do projeto.',
      stack: ['C++', 'OpenGL', 'Unity']
    },
    {
      titulo: 'Projeto 2',
      video: { src: 'assets/video/projeto-2.mp4' },
      objetivo: 'Objetivo do projeto.',
      stack: ['Python', 'ROS', 'OpenCV']
    },
    {
      titulo: 'Projeto 3',
      video: { src: 'assets/video/projeto-3.mp4' },
      objetivo: 'Objetivo do projeto.',
      stack: ['JavaScript', 'WebGL', 'Three.js']
    }
  ],

  /* Artigos: cada um vira um cartão com a capa do PDF. `autoria` é a sua função
     no texto (autor principal, coautor, orientando…) e `evento` é onde saiu.
     `capa` é opcional — uma imagem em assets/img/; sem ela, o próprio PDF é
     usado como prévia e, sem o arquivo, fica o acabamento de página em branco. */
  artigos: [
    {
      titulo: 'Título do artigo',
      autoria: 'Autor principal',
      lingua: 'Português',
      categoria: 'Realidade Virtual',
      evento: 'Evento / periódico de publicação',
      ano: '',
      descricao: 'Resumo curto do artigo.',
      capa: '',
      pdf: 'assets/pdf/artigo-1.pdf'
    },
    {
      titulo: 'Paper title',
      autoria: 'Coautor',
      lingua: 'Inglês',
      categoria: 'Computação Gráfica',
      evento: 'Conference name',
      ano: '',
      descricao: 'Short abstract.',
      capa: '',
      pdf: 'assets/pdf/artigo-2.pdf'
    }
  ],

  /* Três frentes. Linguagens e softwares aparecem com o logo oficial da marca
     (`ui/tech-icons.js`); as competências profissionais não têm logo e nem
     deveriam ter — vão como texto, marcadas por um traço. */
  competencias: [
    { grupo: 'Linguagens', itens: ['HTML', 'CSS', 'Python', 'C', 'Haskell', 'JavaScript'] },
    { grupo: 'Softwares', itens: ['VS Code', 'Adobe Illustrator', 'IntelliJ IDEA', 'Sony Vegas', 'GitHub'] },
    {
      grupo: 'Profissionais',
      tipo: 'texto',
      itens: ['Organização', 'Gestão de pessoas', 'Comunicação', 'Eficiência produtiva']
    }
  ]
};
