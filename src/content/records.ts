import geopsicsCover from '../assets/images/artigo-geopsics.jpg'
import roboticaCover from '../assets/images/artigo-robotica.jpg'
import aebImage from '../assets/images/certificado-aeb-python.jpg'
import oba2024Image from '../assets/images/certificado-oba-2024.jpg'
import obliImage from '../assets/images/certificado-obli.jpg'
import oncImage from '../assets/images/certificado-onc.jpg'
import type { Article, Certificate } from './types'

// Artigos trazidos do outro portfólio. Estão só em exibição (capa da primeira página,
// em baixa resolução): sem `externalUrl` nem `body`, a linha não vira link.
// Para publicar um texto no leitor interno do site, acrescente `body` (blocos: p, h2, quote, code, list).
export const articles: Article[] = [
  {
    slug: 'geopsics-svr',
    title: 'Virtual Environment and 3D Simulation for the Visualization of Analytic Geometry and Physics',
    venue: 'SVR',
    cover: geopsicsCover,
  },
  {
    slug: 'robotics-dashboards',
    title: 'Robotics Teaching with Interactive Dashboards: A Visual Machine Learning Methodology for Engineering',
    venue: 'LatinoWare 2026 — em avaliação',
    cover: roboticaCover,
  },
]

// Mais recente primeiro. ONC e OBLI vieram do PDF "certificados" (páginas 5 e 6); o da AEB, de "Python AEB.pdf".
// O CPF que aparecia impresso nos certificados da AEB e da OBLI foi coberto nas imagens antes de
// entrarem no site — faça o mesmo com os próximos.
export const certificates: Certificate[] = [
  {
    title: 'Programação de Algoritmos em Python',
    issuer: 'Agência Espacial Brasileira (AEB)',
    date: '2026-09',
    image: aebImage,
  },
  {
    title: 'Olimpíada Nacional de Ciências 2025 — Medalha de ouro',
    issuer: 'ONC · MCTI e Universidade Federal do Piauí',
    date: '2025-09',
    credentialId: '1UEKA7FR',
    verifyUrl: 'https://certificados.onciencias.org',
    image: oncImage,
  },
  {
    title: 'Olimpíada Brasileira de Língua Inglesa (OBLI 2025.1) — Bronze',
    issuer: 'Seleta Educação',
    date: '2025-06',
    image: obliImage,
  },
  // OBA: duas participações (2024 e 2025) numa entrada só. `count: 2` mostra o certificado
  // empilhado, com a marca "2×". A imagem é a do certificado de 2024.
  {
    title: 'Olimpíada Brasileira de Astronomia e Astronáutica (OBA)',
    issuer: 'Sociedade Astronômica Brasileira e Agência Espacial Brasileira',
    date: '2024 e 2025',
    count: 2,
    image: oba2024Image,
  },
]
