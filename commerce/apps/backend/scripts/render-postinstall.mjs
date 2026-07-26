/**
 * Render's live buildCommand only runs `yarn install` (dashboard not synced to render.yaml).
 * On Render, build Medusa during install so `.medusa/server` exists before start:prod.
 */
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.env.RENDER !== 'true') {
  process.exit(0)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const serverDir = join(root, '.medusa', 'server')

console.log('[render-postinstall] medusa build…')
execSync('yarn medusa build', { cwd: root, stdio: 'inherit', env: process.env })

if (!existsSync(serverDir)) {
  console.error('[render-postinstall] missing .medusa/server after build')
  process.exit(1)
}

console.log('[render-postinstall] npm install --omit=dev in .medusa/server…')
execSync('npm install --omit=dev', { cwd: serverDir, stdio: 'inherit', env: process.env })
console.log('[render-postinstall] done')
