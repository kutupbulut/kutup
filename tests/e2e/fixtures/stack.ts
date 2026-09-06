import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const KUTUP_ROOT = resolve(
  process.env.KUTUP_E2E_ROOT ?? fileURLToPath(new URL('../../..', import.meta.url)),
)
const KUTUP_DATA_DIR = resolve(
  process.env.KUTUP_E2E_DATA_DIR ?? resolve(KUTUP_ROOT, 'data'),
)

function compose(...args: string[]): string {
  return execFileSync('docker', ['compose', ...args], {
    cwd: KUTUP_ROOT,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

/**
 * Wipe postgres + seaweedfs to a clean bootstrap state. ~30 s; only call
 * from the top of a spec that needs a fully-fresh stack (e.g. first-login
 * regression). Bypass for specs that just need an authenticated admin.
 *
 * Idempotent: safe to call multiple times. Set KUTUP_E2E_DATA_DIR to a
 * disposable directory so a fresh-stack spec can never remove development
 * object-store data.
 */
export function wipeStack(): void {
  if (!process.env.KUTUP_E2E_DATA_DIR) {
    throw new Error(
      'wipeStack requires KUTUP_E2E_DATA_DIR to point at disposable test data',
    )
  }

  compose('down', '--volumes')
  execFileSync(
    'docker',
    [
      'run',
      '--rm',
      '--volume',
      `${KUTUP_DATA_DIR}:/d`,
      'alpine',
      'sh',
      '-c',
      'rm -rf /d/seaweedfs-master /d/seaweedfs-volume',
    ],
    { cwd: KUTUP_ROOT, stdio: 'inherit' },
  )
  compose('up', '--detach', '--wait')
}

/** Confirm the break-glass bootstrap admin was just created. */
export function expectFreshBootstrap(): void {
  const bootstrapLines = compose('logs', 'backend')
    .split('\n')
    .filter((line) => line.toLowerCase().includes('bootstrapadmin'))
  const latest = bootstrapLines.at(-1) ?? ''
  if (!latest.includes('admin account admin@kutup.local')) {
    throw new Error(`bootstrap admin not found in backend logs:\n${latest}`)
  }
}
