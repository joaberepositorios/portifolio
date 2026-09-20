import { copyFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

/**
 * The production build is ONE self-contained HTML file: scripts, styles, fonts,
 * icons and the 3D simulation are all inlined. It opens with a double-click
 * (file://) — no server — and can be uploaded to any host as-is.
 * A copy is placed at the project root as Portfolio.html.
 */
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: 'copy-standalone-page',
      apply: 'build',
      closeBundle() {
        copyFileSync('dist/index.html', 'Portfolio.html')
      },
    },
  ],
  base: './',
  build: { chunkSizeWarningLimit: 2000 },
})
