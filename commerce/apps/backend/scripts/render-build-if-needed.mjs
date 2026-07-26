/**
 * On Render, the dashboard build command is often install-only.
 * When RENDER=true, compile Medusa during yarn install (build phase)
 * so start only migrates + serves and stays within free-tier RAM.
 *
 * Skips locally and when .medusa/server already exists (e.g. full buildCommand).
 */
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const serverDir = join(backendRoot, '.medusa', 'server')
const serverPkg = join(serverDir, 'package.json')

if (process.env.RENDER !== 'true') {
  process.exit(0)
}

if (existsSync(serverPkg)) {
  console.log('[render-build] .medusa/server already present — skip')
  process.exit(0)
}

console.log('[render-build] Running medusa build during Render build phase…')
execSync('yarn build', { cwd: backendRoot, stdio: 'inherit', env: process.env })

if (!existsSync(serverPkg)) {
  console.error('[render-build] medusa build did not produce .medusa/server')
  process.exit(1)
}

console.log('[render-build] Installing production deps in .medusa/server…')
execSync('npm install --omit=dev', {
  cwd: serverDir,
  stdio: 'inherit',
  env: process.env,
})

console.log('[render-build] Done')
