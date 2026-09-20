export interface SiteContent {
  name: string
  /** Linha logo abaixo do nome. */
  tagline: string
  /** Opcional: pequena linha acima do nome. */
  eyebrow?: string
  /** Opcional: parágrafo de apresentação. */
  intro?: string
  /** Formato internacional; só os dígitos são usados. Ex.: "+55 34 91234-5678" */
  whatsappNumber: string
  whatsappMessage?: string
  /** Links discretos no rodapé. Deixe vazio para omitir. */
  links: { label: string; href: string }[]
}

export interface Milestone {
  /** Rótulo curto acima do título: um período ou uma sigla. */
  period: string
  title: string
  organization: string
  summary?: string
  /** Logo da instituição (import de uma imagem, de preferência PNG/SVG com fundo transparente). */
  logo?: string
  /** Sem logo, este texto aparece no lugar dela (padrão: `period`). */
  wordmark?: string
}

export interface JourneyContent {
  lead: string
  /** Funciona melhor com 3 a 5 etapas. */
  milestones: Milestone[]
}

export interface Project {
  slug: string
  title: string
  /** Rótulo pequeno acima do título. */
  category: string
  description: string
  /** Imagem importada de src/assets/images. Sem ela, uma capa desenhada é exibida. */
  image?: string
  imageAlt?: string
}

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'code'; text: string }
  | { type: 'list'; items: string[] }

export interface Article {
  slug: string
  title: string
  /** Onde foi publicado/apresentado. Ex.: "SVR", "LatinoWare 2026 — em avaliação" */
  venue?: string
  description?: string
  /** Data ISO: "2026-01-15" */
  date?: string
  readingMinutes?: number
  /** Imagem da primeira página (importada de src/assets/images). */
  cover?: string
  /** Se o artigo está publicado em outro site (abre em nova aba). */
  externalUrl?: string
  /** Texto exibido no leitor interno. Sem `externalUrl` nem `body`, o artigo fica só em exibição. */
  body?: ArticleBlock[]
}

export interface Certificate {
  title: string
  issuer: string
  /** Ano-mês ISO ("2025-11"). Qualquer outro texto ("2025", "2024 e 2025") é exibido como está. */
  date: string
  /** Quantas vezes o certificado foi obtido. Com 2 ou mais, a miniatura aparece empilhada, com "2×". */
  count?: number
  /** Código de validação impresso no certificado. */
  credentialId?: string
  verifyUrl?: string
  /** Imagem do certificado (importada de src/assets/images). ATENÇÃO: cubra CPF e outros dados pessoais antes. */
  image?: string
}

export interface SkillIcon {
  path: string
  hex: string
  /** Padrão: "0 0 24 24". */
  viewBox?: string
}

export interface Skill {
  name: string
  /** De ./techIcons.ts, ou do pacote simple-icons (`import { siPython } from 'simple-icons'`). */
  icon?: SkillIcon
  /** Duas letras, exibidas apenas se não houver ícone. */
  monogram?: string
}
