import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  as?: 'div' | 'li'
  delay?: number
  className?: string
  /** Marca o item como destaque (data-featured), usado pela grade de projetos. */
  featured?: boolean
}

/** Fades content in once, the first time it enters the viewport. */
export function Reveal({ children, as: Tag = 'div', delay = 0, className = '', featured }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-in')
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${className}`.trim()}
      data-featured={featured || undefined}
      style={delay ? ({ '--delay': `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  )
}
