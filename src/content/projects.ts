import cubatao from '../assets/images/projeto-cubatao.jpg'
import geopsics from '../assets/images/projeto-geopsic.jpg'
import mujoco from '../assets/images/projeto-mujoco.jpg'
import onvoid from '../assets/images/projeto-onvoid.jpg'
import type { Project } from './types'

// Projetos e capturas de tela trazidos do outro portfólio.
// A seção é uma vitrine: imagem, categoria, título e descrição (sem tecnologias nem links).
// O primeiro da lista aparece em destaque; os demais formam uma grade de duas colunas
// (um total ímpar — 3, 5, 7… — fecha a grade sem sobras).
// Nova imagem: coloque em src/assets/images (~1400 px de largura, até ~300 KB), importe e use em `image`.
export const projects: Project[] = [
  {
    slug: 'dashboard-mujoco',
    title: 'Dashboard de aprendizado por reforço',
    category: 'Robótica · IA',
    description:
      'Painel interativo dos dados que o simulador exibe durante o treinamento de um robô: acertos, falhas e o andamento do aprendizado por reforço.',
    image: mujoco,
    imageAlt: 'Painel com telemetria de uma pata e o modelo 3D de um robô quadrúpede sobre uma grade',
  },
  {
    slug: 'geopsics',
    title: 'Geopsics — ambiente 3D de estudo',
    category: 'Educação · 3D',
    description:
      'Ambiente virtual em 3D para estudar geometria analítica e física mecânica no navegador: pontos, vetores, planos, cônicas e quádricas, com modo AR sobre marcador.',
    image: geopsics,
    imageAlt: 'Plano 3D em grade com eixos X, Y e Z e um painel para inserir elementos geométricos',
  },
  {
    slug: 'simulacao-cubatao-santos',
    title: 'Simulação de tráfego — Cubatão / Santos',
    category: 'Simulação',
    description:
      'Tráfego entre a Imigrantes e Santos em três cenários lado a lado: sem obras, com a terceira pista sem o COPI e com ela. Mostra congestionamento, nível de serviço HCM e volume por capacidade em tempo real.',
    image: cubatao,
    imageAlt: 'Mapa escuro da região de Cubatão com rotas e pontos de congestionamento destacados em vermelho',
  },
  {
    slug: 'onvoid',
    title: 'ONVOID — site institucional',
    category: 'Web',
    description: 'Landing page estática da ONVOID, com animações de rolagem, vídeo de fundo e gráficos vetoriais próprios.',
    image: onvoid,
    imageAlt: 'Página inicial da ONVOID: logotipo sobre um fundo escuro com órbitas e partículas',
  },
]
