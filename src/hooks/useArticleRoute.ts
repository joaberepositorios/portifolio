import { useCallback, useEffect, useState } from 'react'

const PREFIX = '#/article/'

const slugFromHash = () => (location.hash.startsWith(PREFIX) ? decodeURIComponent(location.hash.slice(PREFIX.length)) : null)

export const articleHref = (slug: string) => `${PREFIX}${encodeURIComponent(slug)}`

/** Minimal hash routing: every article has a shareable URL, and Back closes the reader. */
export function useArticleRoute() {
  const [slug, setSlug] = useState<string | null>(slugFromHash)

  useEffect(() => {
    const sync = () => setSlug(slugFromHash())
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  const open = useCallback((next: string, replace = false) => {
    // `replace` is used when moving between articles, so Back always closes the reader.
    if (replace) history.replaceState(history.state, '', articleHref(next))
    else history.pushState({ reader: true }, '', articleHref(next))
    setSlug(next)
  }, [])

  const close = useCallback(() => {
    if (history.state?.reader) {
      history.back()
    } else {
      // Arrived by direct link: there is no entry to go back to.
      history.replaceState(null, '', '#artigos')
      setSlug(null)
      document.getElementById('artigos')?.scrollIntoView()
    }
  }, [])

  return { slug, open, close }
}
