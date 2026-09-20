const dayFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' })

/** "2026-01-15" → "15 de jan. de 2026" */
export const formatDate = (iso: string) => dayFormat.format(new Date(`${iso}T00:00:00Z`))

/** "2025-11" → "nov. de 2025"; qualquer outro texto ("2025", "2024 e 2025") fica como está. */
export const formatMonth = (value: string) =>
  /^\d{4}-\d{2}$/.test(value) ? monthFormat.format(new Date(`${value}-01T00:00:00Z`)) : value

export const pad2 = (n: number) => String(n).padStart(2, '0')
