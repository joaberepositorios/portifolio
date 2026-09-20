import { useEffect } from 'react'
import { ArticleReader } from './components/ArticleReader'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { ScrollProgress } from './components/ScrollProgress'
import { WhatsAppButton } from './components/WhatsAppButton'
import { useArticleRoute } from './hooks/useArticleRoute'
import { initParallax } from './lib/parallax'
import { initSmoothScroll } from './lib/scroll'
import { initScrub } from './lib/scrub'
import { Home } from './sections/Home'
import { Journey } from './sections/Journey'
import { Projects } from './sections/Projects'
import { Records } from './sections/Records'
import { Skills } from './sections/Skills'

export default function App() {
  const reader = useArticleRoute()

  useEffect(() => initSmoothScroll(), [])
  useEffect(() => initParallax(), [])
  useEffect(() => initScrub(), [])

  return (
    <>
      <div id="page">
        <a className="skip-link" href="#main">
          Pular para o conteúdo
        </a>
        <Header />
        <ScrollProgress />
        <main id="main">
          <Home />
          <Journey />
          <Projects />
          <Records onOpenArticle={reader.open} />
          <Skills />
        </main>
        <Footer />
        <WhatsAppButton />
      </div>

      {reader.slug && (
        <ArticleReader slug={reader.slug} onClose={reader.close} onNavigate={(slug) => reader.open(slug, true)} />
      )}
    </>
  )
}
