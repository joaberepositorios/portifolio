import type { SiteContent } from './types'

// Conteúdo trazido do outro portfólio ("Pessoais Projetos/Portifóilio/js/content.js").
export const site: SiteContent = {
  name: 'Joabe Alves',
  tagline: 'Engenharia de Computação com Inteligência Artificial',
  // A abertura mostra só o nome e esta frase. Para voltar a ter uma linha pequena acima do nome
  // ou um parágrafo de apresentação, acrescente `eyebrow: '…'` e/ou `intro: '…'`.

  // Ainda falta: o seu número, em formato internacional. Ex.: '+55 34 91234-5678'
  whatsappNumber: '[INSERT WHATSAPP NUMBER]',
  whatsappMessage: 'Olá, Joabe! Vi seu portfólio e gostaria de conversar.',

  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/joabe-alves-pereira/' },
    { label: 'GitHub', href: 'https://github.com/joaberepositorios' },
    { label: 'Instagram', href: 'https://www.instagram.com/joabeengc/' },
    { label: 'E-mail', href: 'mailto:joabepereira.adm@gmail.com' },
  ],
}

export function whatsappHref(): string {
  const digits = site.whatsappNumber.replace(/\D/g, '')
  const text = site.whatsappMessage ? `?text=${encodeURIComponent(site.whatsappMessage)}` : ''
  if (!digits && import.meta.env.DEV) console.warn('[portfolio] Defina whatsappNumber em src/content/site.ts')
  return `https://wa.me/${digits}${text}`
}

/** As cinco — e apenas cinco — seções, em ordem. */
export const SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'projetos', label: 'Projetos' },
  { id: 'jornada', label: 'Jornada' },
  { id: 'artigos', label: 'Artigos & Certificados' },
  { id: 'skills', label: 'Skills' },
] as const

export const SECTION_IDS = SECTIONS.map((s) => s.id)
