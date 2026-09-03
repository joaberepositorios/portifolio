/* Conteúdo editável do portfólio — é o único arquivo que precisa ser tocado
   para atualizar o site.

   video: { src: "assets/video/arquivo.mp4" }  ou  { youtubeId: "ID" }  ou  { link: "https://..." }
   pdf:   "assets/pdf/arquivo.pdf" — abre no modal do site, sem download. */

window.Portfolio = window.Portfolio || {};

window.Portfolio.CONTENT = {
  nome: 'Joabe Alves',
  /* retrato da abertura: aponte para um arquivo em assets/img/ (recorte quadrado,
     ~600 px de lado). Deixe vazio e nada é desenhado — nunca sobra moldura vazia. */
  foto: 'assets/img/retrato.jpg',
  lead: 'Este portifólio porta minhas experiências acadêmicas e profissionais, segue abaixo em sequências minhas habilidades desenvolvidas durante meu percurso profissional e demonstrações de eficiência produtiva.',
  sobre: 'Graduando na Universidade Federal de Uberlândia (UFU) e pesquisador no GRVA — Grupo de Realidade Virtual e Aumentada.',

  /* Redes da abertura. Cole o endereço completo (https://...) — o ícone só vira
     link quando há endereço; vazio, ele fica apagado, marcando o lugar. */
  redes: {
    linkedin: 'https://www.linkedin.com/in/joabe-alves-pereira/',
    github: 'https://github.com/joaberepositorios',
    instagram: 'https://www.instagram.com/joabeengc/'
  },

  /* Seção de contato. O botão monta a mensagem e abre o programa de e-mail de
     quem escreveu — sem servidor, sem cadastro, sem serviço de terceiro.
     Enquanto `email` estiver vazio o formulário avisa, em vez de fingir enviar. */
  contato: {
    email: 'joabepereira.adm@gmail.com',
    nota: 'Escreva por aqui: o botão abre seu programa de e-mail com a mensagem pronta.'
  },


  /* Experiências: um lugar por bloco. O rótulo curto fica em `periodo`, o nome
     completo em `titulo`, a função e o período em `papel`, e a frente carrega a
     descrição e os tópicos. Para acrescentar outro lugar, some um item. */
  timeline: [
    {
      periodo: 'UFU · GRVA',
      titulo: 'GRVA — Grupo de Realidade Virtual e Aumentada',
      papel: 'Pesquisa e desenvolvimento · desde 2026',
      frentes: [
        {
          descricao: 'Treinamento de robótica com aprendizado de máquina, dentro do grupo de realidade virtual e aumentada da UFU.',
          topicos: [
            'Treinamento de agentes de robótica com aprendizado de máquina',
            'Python e bibliotecas de IA aplicadas a simulação',
            'Apoio a novos integrantes e documentação técnica'
          ]
        }
      ]
    },
    {
      periodo: 'IBI',
      titulo: 'Instituto Brasileiro de Infraestrutura',
      papel: 'Projeto · abril de 2026 · São Paulo, SP',
      frentes: [
        {
          descricao: 'Simulação da terceira via para o transporte rodoviário passando por Cubatão e Santos, com escopo concluído em um mês.',
          topicos: [
            'Python para processar os dados do estudo',
            'Importação de mapas e de modelos em CSV',
            'Projeto apresentado na Câmara dos Deputados Federais de São Paulo'
          ]
        }
      ]
    },
    {
      periodo: 'LAB2COD',
      titulo: 'LAB2COD',
      papel: 'Processos e inovação para o setor público · Brasília',
      frentes: [
        {
          descricao: 'Auxílio na criação de sistemas para soluções, dentro de uma startup em desenvolvimento em Brasília.',
          topicos: [
            'Proposta de melhoria de um sistema de gestão pública',
            'Objetivo do projeto: conquistar fundos da ANEEL'
          ]
        }
      ]
    }
  ],

  /* Projetos: os repositórios do GitHub que têm Python ou JavaScript, mais a
     simulação feita no IBI (que não vive num repositório).

     `capa` é a aparência do projeto — uma imagem da tela dele, guardada em
     assets/img/. Sem capa, vale o `video`; sem os dois, fica o acabamento de
     espera. As capas foram tiradas dos próprios projetos rodando. */
  projetos: [
    {
      titulo: 'Dashboard de aprendizado por reforço',
      capa: 'assets/img/projeto-mujoco.jpg',
      objetivo: 'Painel interativo dos dados que o simulador exibe durante o treinamento de um robô: acertos, falhas e o andamento do aprendizado por reforço.',
      link: 'https://github.com/joaberepositorios/DASHBOARD-MUJOCO',
      stack: ['Python', 'JavaScript', 'CSS']
    },
    {
      titulo: 'Geopsics — ambiente 3D de estudo',
      capa: 'assets/img/projeto-geopsic.jpg',
      objetivo: 'Ambiente virtual em 3D para estudar geometria analítica e física mecânica no navegador: pontos, vetores, planos, cônicas e quádricas, com modo AR sobre marcador.',
      link: 'https://joaberepositorios.github.io/ARTIGO1-GEOPHYSICS/',
      stack: ['HTML', 'CSS', 'Three.js']
    },
    {
      titulo: 'ONVOID — site institucional',
      capa: 'assets/img/projeto-onvoid.jpg',
      objetivo: 'Landing page estática da ONVOID, com animações de rolagem, vídeo de fundo e gráficos vetoriais próprios.',
      link: 'https://github.com/joaberepositorios/onvoid-website',
      stack: ['JavaScript', 'HTML', 'CSS']
    },
    {
      titulo: 'Simulação de tráfego — Cubatão / Santos',
      capa: 'assets/img/projeto-cubatao.jpg',
      objetivo: 'Simulação do tráfego entre a Imigrantes e Santos, com três cenários lado a lado: sem obras, com a terceira pista sem o COPI e com ela. Mostra pontos de congestionamento, nível de serviço HCM e volume por capacidade em tempo real.',
      link: 'https://ibi-observatorio.github.io/SimulacaoCubataoSantos/',
      stack: ['HTML', 'JavaScript', 'Simulação']
    }
  ],

  /* Artigos: a capa é a primeira página do PDF, e o cartão diz duas coisas — o
     título e onde o trabalho saiu. O arquivo abre no modal, sem download.
     As versões em português dos dois estão em assets/pdf/, fora da vitrine. */
  artigos: [
    {
      titulo: 'Virtual Environment and 3D Simulation for the Visualization of Analytic Geometry and Physics',
      evento: 'SVR',
      capa: '',
      pdf: 'assets/pdf/geopsics-en.pdf'
    },
    {
      titulo: 'Robotics Teaching with Interactive Dashboards: A Visual Machine Learning Methodology for Engineering',
      evento: 'LatinoWare 2026 — em avaliação',
      capa: '',
      /* Sem arquivo de propósito: o trabalho está em avaliação às cegas, e
         hospedar a versão anônima numa página que identifica o autor derruba o
         anonimato. O PDF volta quando o resultado sair. */
      pdf: ''
    }
  ],

  /* Duas frentes: linguagens e softwares. Cada item traz a marca (o logo vem de
     `ui/tech-icons.js`) e o seu nível, de 0 a 100 — a autoavaliação é sua, e
     enquanto `nivel` for null o cartão diz "a definir" em vez de inventar um
     número. */
  competencias: [
    {
      grupo: 'Linguagens',
      itens: [
        { nome: 'HTML', nivel: 85 },
        { nome: 'CSS', nivel: 70 },
        { nome: 'Python', nivel: 30 },
        { nome: 'C', nivel: 30 },
        { nome: 'Haskell', nivel: 5 },
        { nome: 'JavaScript', nivel: 0 }
      ]
    },
    {
      grupo: 'Softwares',
      itens: [
        { nome: 'VS Code', nivel: null },
        { nome: 'Adobe Illustrator', nivel: 100 },
        { nome: 'IntelliJ IDEA', nivel: null },
        { nome: 'Sony Vegas', nivel: 100 },
        { nome: 'GitHub', nivel: null }
      ]
    }
  ]
};
