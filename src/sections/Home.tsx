import { SimStage } from '../components/sim/SimStage'
import { site } from '../content/site'
import './Home.css'

export function Home() {
  return (
    <section id="home" className="home" aria-labelledby="home-name">
      <figure className="home__figure" data-parallax="0.2" data-parallax-from="top">
        <SimStage />
      </figure>

      <div className="container home__inner">
        <div className="home__copy" data-parallax="-0.12" data-parallax-from="top" data-parallax-fade>
          {site.eyebrow && <p className="home__eyebrow">{site.eyebrow}</p>}
          <h1 id="home-name" className="home__name">
            {site.name}
          </h1>
          <p className="home__tagline">{site.tagline}</p>
          {site.intro && <p className="home__intro">{site.intro}</p>}
          <a href="#projetos" className="home__cta">
            Ver projetos
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
