import { techIcons } from './techIcons'
import type { Skill } from './types'

// As mesmas competências do outro portfólio — aqui, só os ícones (sem níveis nem porcentagens).
// Os ícones vêm de ./techIcons.ts. Para outras tecnologias, use o pacote simple-icons:
//   import { siDocker } from 'simple-icons'   →   { name: 'Docker', icon: siDocker }
export const skills: Skill[] = [
  { name: 'HTML', icon: techIcons.html },
  { name: 'CSS', icon: techIcons.css },
  { name: 'Python', icon: techIcons.python },
  { name: 'C', icon: techIcons.c },
  { name: 'Haskell', icon: techIcons.haskell },
  { name: 'JavaScript', icon: techIcons.javascript },
  { name: 'VS Code', icon: techIcons.vscode },
  { name: 'Adobe Illustrator', icon: techIcons.illustrator },
  { name: 'IntelliJ IDEA', icon: techIcons.intellij },
  { name: 'Sony Vegas', icon: techIcons.vegas },
  { name: 'GitHub', icon: techIcons.github },
]
