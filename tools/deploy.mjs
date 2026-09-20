// Publica o site no GitHub Pages:  npm run deploy
//
// Compila o projeto e envia o resultado (um único index.html) para o branch `gh-pages`
// do repositório configurado como `origin`. O GitHub Pages serve esse branch em
//   https://joaberepositorios.github.io/portifolio/
// O código-fonte continua no branch `main`; este script não mexe nele.
//
// O branch `gh-pages` é só saída gerada — por isso é recriado a cada publicação (push forçado).
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const run = (cmd, args, options = {}) => execFileSync(cmd, args, { stdio: 'inherit', ...options })
const out = (cmd, args, options = {}) => execFileSync(cmd, args, { encoding: 'utf8', ...options }).trim()
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const remote = process.env.DEPLOY_REMOTE || out('git', ['remote', 'get-url', 'origin'])
console.log(`→ Compilando…`)
run(npm, ['run', 'build'], { shell: process.platform === 'win32' })

const work = mkdtempSync(join(tmpdir(), 'portfolio-deploy-'))
try {
  copyFileSync('dist/index.html', join(work, 'index.html'))
  // Sem Jekyll: o GitHub serve os arquivos como estão.
  writeFileSync(join(work, '.nojekyll'), '')

  const git = (...args) => run('git', args, { cwd: work })
  git('init', '--quiet', '--initial-branch=gh-pages')
  git('config', 'user.name', out('git', ['config', 'user.name']))
  git('config', 'user.email', out('git', ['config', 'user.email']))
  git('add', '-A')
  git('commit', '--quiet', '-m', `Publica o site (${new Date().toISOString().slice(0, 16).replace('T', ' ')})`)
  console.log(`→ Enviando para ${remote} (gh-pages)…`)
  git('push', '--force', remote, 'gh-pages')
  console.log('✓ Publicado. O GitHub leva cerca de um minuto para atualizar o endereço.')
} finally {
  rmSync(work, { recursive: true, force: true })
}
