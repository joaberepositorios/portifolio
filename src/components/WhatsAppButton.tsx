import { siWhatsapp } from 'simple-icons'
import { whatsappHref } from '../content/site'
import './WhatsAppButton.css'

/** A única ação de contato do site. */
export function WhatsAppButton() {
  return (
    <a
      className="whatsapp"
      href={whatsappHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale comigo pelo WhatsApp (abre em nova aba)"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <path fill="currentColor" d={siWhatsapp.path} />
      </svg>
    </a>
  )
}
