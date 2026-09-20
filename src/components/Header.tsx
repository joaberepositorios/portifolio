import { useEffect, useRef, useState } from 'react'
import { SECTIONS, SECTION_IDS, site } from '../content/site'
import { useActiveSection } from '../hooks/useActiveSection'
import { scrollTop } from '../lib/measure'
import { onScrollFrame } from '../lib/scroll'
import './Header.css'

export function Header() {
  const active = useActiveSection(SECTION_IDS)
  const [open, setOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    return onScrollFrame(() => {
      const scrolled = scrollTop() > 8 ? 'true' : 'false'
      if (header.dataset.scrolled !== scrolled) header.dataset.scrolled = scrolled
    })
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onClickAway = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onClickAway)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onClickAway)
    }
  }, [open])

  return (
    <header ref={headerRef} className="header" data-open={open}>
      <div className="container header__inner">
        <a href="#home" className="header__brand" onClick={() => setOpen(false)}>
          {site.name}
        </a>

        <nav id="site-nav" className="header__nav" aria-label="Seções">
          <ul>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="header__link"
                  aria-current={s.id === active ? 'true' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__tools">
          <button
            type="button"
            className="header__menu"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Fechar' : 'Menu'}
          </button>
        </div>
      </div>
    </header>
  )
}
