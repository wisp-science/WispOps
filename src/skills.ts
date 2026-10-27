/**
 * Bundled WispOps skills (disk full, omics cleanup, security triage, daily
 * reports, safe changes, GPU/Slurm), registered with the DSH skill registry
 * when one is composed.
 * @module dsh-wisp-ops/skills
 */

import { readdirSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import { BUNDLED_SKILL_RANK } from '@deepseek-ai/dsh-skill'
import type { SkillCandidate, SkillProvider } from '@deepseek-ai/dsh-skill'
import { parse as parseYaml } from 'yaml'

/** Packaged skills directory, next to lib/ and src/. */
export const SKILL_ROOT = fileURLToPath(new URL('../skills/', import.meta.url))

export function parseSkill(raw: string, path: string): { name: string; description: string; content: string } {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(raw)
  if (frontmatter?.[1] === undefined) throw new Error(`dsh-wisp-ops: ${path} has no YAML frontmatter`)
  const meta = parseYaml(frontmatter[1]) as { name?: unknown; description?: unknown } | null
  if (typeof meta?.name !== 'string' || typeof meta.description !== 'string' || meta.description.length === 0) {
    throw new Error(`dsh-wisp-ops: ${path} needs a name and a description`)
  }
  return { name: meta.name, description: meta.description, content: raw.slice(frontmatter[0].length).trim() }
}

export function registerSkills(ctx: Context, root = SKILL_ROOT): void {
  const candidates: SkillCandidate[] = readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const directory = join(root, entry.name)
      const path = join(directory, 'SKILL.md')
      const { name, description } = parseSkill(readFileSync(path, 'utf8'), path)
      if (name !== entry.name) throw new Error(`dsh-wisp-ops: ${path} is named "${name}" but lives in ${entry.name}/`)
      return {
        name,
        description,
        invocation: { modelInvocable: true, userInvocable: true },
        provider: 'dsh-wisp-ops',
        source: 'bundled',
        rank: BUNDLED_SKILL_RANK,
        resourceBase: { kind: 'directory', path: directory.split(sep).join('/') },
        locator: path,
      }
    })
  const provider: SkillProvider = {
    name: 'dsh-wisp-ops',
    list: () => Promise.resolve(candidates),
    async get(candidate, options) {
      const { rank: _rank, locator, ...summary } = candidate
      const raw = await readFile(locator as string, { encoding: 'utf8', signal: options.signal })
      return { ...summary, content: parseSkill(raw, locator as string).content }
    },
  }
  ctx.skills.registerProvider(() => provider)
}
