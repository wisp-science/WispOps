import { rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// A clean build lets CI also detect obsolete tracked output files.
await rm(new URL('../lib/', import.meta.url), { recursive: true, force: true })
execFileSync(process.execPath, [fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url)), '-p', 'tsconfig.json'], { stdio: 'inherit' })
await import('./build-client.mjs')
