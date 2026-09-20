import { ProjectCover } from '../components/ProjectCover'
import { SectionHead } from '../components/SectionHead'
import { projects } from '../content/projects'
import type { Project } from '../content/types'
import './Projects.css'

export function Projects() {
  return (
    <section id="projetos" className="section projects" aria-labelledby="projetos-title">
      <div className="container">
        <SectionHead titleId="projetos-title" title="Projetos" lead="Soluções reais para problemas reais." />

        {/* Vitrine: imagem, categoria, título e descrição — sem tecnologias nem links.
            O primeiro projeto aparece em destaque; os demais, em duas colunas.
            Cada célula é conduzida pela rolagem: a moldura abre, a capa se traça, o texto entra. */}
        <ol className="projects__grid">
          {projects.map((project, i) => (
            <li
              key={project.slug}
              className="projects__cell"
              // Em destaque: o primeiro — e o último, quando sobraria sozinho numa linha de duas colunas.
              data-featured={i === 0 || (i === projects.length - 1 && projects.length % 2 === 0) || undefined}
              data-flip={i !== 0 || undefined}
              data-scrub
              data-scrub-start="0.96"
              data-scrub-end="0.4"
            >
              <ProjectCard project={project} index={i} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <article className="project" aria-labelledby={`${project.slug}-title`}>
      <figure className="project__media">
        {/* A imagem é um pouco mais alta que a moldura e desliza dentro dela: parallax. */}
        <div className="project__parallax" data-parallax="0.035">
          {project.image ? (
            <img src={project.image} alt={project.imageAlt ?? ''} loading="lazy" decoding="async" />
          ) : (
            <ProjectCover index={index} />
          )}
        </div>
      </figure>

      <div className="project__body">
        <p className="project__category">{project.category}</p>
        <h3 id={`${project.slug}-title`} className="project__title">
          {project.title}
        </h3>
        <p className="project__description">{project.description}</p>


      </div>
    </article>
  )
}
