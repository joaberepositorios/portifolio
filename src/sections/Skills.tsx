import type { CSSProperties } from 'react'
import { SectionHead } from '../components/SectionHead'
import { skills } from '../content/skills'
import type { Skill } from '../content/types'
import './Skills.css'

const luminance = (hex: string) => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Cor da marca — trocada pela cor do texto quando sumiria no fundo branco. */
function brandColor(skill: Skill): string {
  const hex = (skill.icon?.hex ?? '').replace('#', '')
  return hex.length === 6 && luminance(hex) <= 0.62 ? `#${hex}` : 'var(--text)'
}

const hash = (n: number, salt: number) => {
  const s = Math.sin(n * 91.7 + salt * 47.3) * 43758.5453
  return s - Math.floor(s)
}

/**
 * De onde cada ícone vem antes de se encaixar na grade: um deslocamento, um giro e um
 * atraso próprios (fixos por índice, para a animação ser sempre a mesma).
 */
function scatter(i: number): CSSProperties {
  return {
    '--dx': `${Math.round((hash(i, 1) - 0.5) * 340)}px`,
    '--dy': `${Math.round(90 + hash(i, 2) * 220)}px`,
    '--rot': `${Math.round((hash(i, 3) - 0.5) * 220)}deg`,
    '--s': (hash(i, 4) * 0.45).toFixed(3),
  } as CSSProperties
}

export function Skills() {
  return (
    <section id="skills" className="section skills" aria-labelledby="skills-title">
      <div className="container">
        <SectionHead titleId="skills-title" title="Skills" lead="Tecnologias e ferramentas que fazem parte do meu dia a dia." />

        {/* Só os ícones. Eles chegam espalhados e se encaixam na grade conforme a rolagem. */}
        <ul className="skills__grid" data-scrub data-scrub-start="0.98" data-scrub-end="0.5">
          {skills.map((skill, i) => (
            <li
              key={skill.name}
              className="skill"
              tabIndex={0}
              aria-label={skill.name}
              style={{ '--brand': brandColor(skill), ...scatter(i) } as CSSProperties}
            >
              <span className="skill__piece">
                {skill.icon ? (
                  <svg className="skill__icon" viewBox={skill.icon.viewBox ?? '0 0 24 24'} aria-hidden="true">
                    <path d={skill.icon.path} fill="currentColor" />
                  </svg>
                ) : (
                  <span className="skill__icon skill__monogram" aria-hidden="true">
                    {skill.monogram ?? skill.name.slice(0, 2)}
                  </span>
                )}
              </span>
              <span className="skill__name" aria-hidden="true">
                {skill.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
