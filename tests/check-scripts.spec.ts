import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addScriptDraft, deniedScriptLine, parseScriptResult, renderScriptOutcomes, scriptDigest, scriptStore, validateScript, worstVerdict } from '../src/check-scripts.ts'
import type { RunResult } from '../src/ssh.ts'

const run = (over: Partial<RunResult>): RunResult => ({ host: 'a', status: 'ok', exitCode: 0, stdout: '', stderr: '', truncated: false, durationMs: 1, ...over })

describe('check script library', () => {
  let dir: string
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'wisp-scripts-')) })
  afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  it('validates identifiers, sizes and timeouts, normalizes line endings and digests the content', () => {
    const script = validateScript({ id: 'gpu-idle', title: ' GPU idle ', description: 'x', content: 'echo ok\r\nexit 0\r\n' })
    expect(script).toMatchObject({ id: 'gpu-idle', title: 'GPU idle', content: 'echo ok\nexit 0\n', timeoutSec: 120, sha256: scriptDigest('echo ok\nexit 0\n') })
    expect(Number.isFinite(Date.parse(script.updatedAt))).toBe(true)
    for (const bad of [{ id: 'builtin.x', title: 't', content: 'x' }, { id: 'all', title: 't', content: 'x' }, { id: 'bad id', title: 't', content: 'x' }, { id: 'ok', title: '', content: 'x' }, { id: 'ok', title: 't', content: '   ' }, { id: 'ok', title: 't', content: 'a\0b' }, { id: 'ok', title: 't', content: 'x', timeoutSec: 1 }, { id: 'ok', title: 't', content: 'x', timeoutSec: 7200 }, { id: 'ok', title: 't', content: 'x'.repeat(70 * 1024) }]) {
      expect(() => validateScript(bad), JSON.stringify(bad).slice(0, 60)).toThrow()
    }
  })

  it('finds deny-listed lines inside a script', () => {
    expect(deniedScriptLine('df -h\ncat /etc/secret-file\n', [/secret-file/])).toEqual({ line: 'cat /etc/secret-file', source: 'secret-file' })
    expect(deniedScriptLine('df -h\n', [/secret-file/])).toBeUndefined()
  })

  it('stores scripts and drafts with unique ids, newest draft per id, bounded', async () => {
    const store = scriptStore(dir)
    await store.change((await store.read()).revision, state => ({ ...state, entries: [validateScript({ id: 's1', title: 'one', content: 'echo 1' })] }))
    expect((await store.read()).value.entries[0]?.id).toBe('s1')
    await expect(store.change((await store.read()).revision, state => ({ ...state, entries: [...state.entries, ...state.entries] }))).rejects.toThrow('重复')
    for (let i = 0; i < 12; i++) await addScriptDraft(dir, { id: `d${i % 11}`, title: 't', content: `echo ${i}` })
    const drafts = JSON.parse(await readFile(join(dir, 'check-script-drafts.json'), 'utf8')).entries as { script: { id: string; content: string } }[]
    expect(drafts.length).toBe(10)
    expect(drafts.at(-1)?.script).toMatchObject({ id: 'd0', content: 'echo 11' })
  })
})

describe('script output contract', () => {
  it('maps exit codes to verdicts and splits summary, evidence and metrics', () => {
    const ok = parseScriptResult(run({ stdout: '\n all good \nfree 80%\nWISPOPS-JSON: {"free_pct": 80, "bad": "x"}\n' }))
    expect(ok).toEqual({ host: 'a', verdict: 'ok', exitCode: 0, summary: 'all good', evidence: 'free 80%', metrics: { free_pct: 80 } })
    expect(parseScriptResult(run({ status: 'failed', exitCode: 1, stdout: 'disk 91%\n' }))).toMatchObject({ verdict: 'warn', summary: 'disk 91%', evidence: '' })
    expect(parseScriptResult(run({ status: 'failed', exitCode: 2, stdout: 'disk full\n/data 100%\n', stderr: 'warning: slow' }))).toMatchObject({ verdict: 'crit', summary: 'disk full', evidence: '/data 100%\n[stderr]\nwarning: slow' })
    expect(parseScriptResult(run({ status: 'failed', exitCode: 127, stderr: 'sh: nvidia-smi: not found' }))).toMatchObject({ verdict: 'failed', summary: 'sh: nvidia-smi: not found' })
    expect(parseScriptResult(run({ status: 'failed', exitCode: 1 }))).toMatchObject({ verdict: 'warn', summary: 'exit 1 (no output)' })
    expect(parseScriptResult(run({}))).toMatchObject({ verdict: 'ok', summary: 'ok (no output)' })
    expect(parseScriptResult(run({ status: 'unreachable', exitCode: null, stderr: 'ssh: connect refused' }))).toMatchObject({ verdict: 'unreachable', summary: 'unreachable: ssh: connect refused', exitCode: null })
    expect(parseScriptResult(run({ status: 'sudo-required', exitCode: 97 })).verdict).toBe('unreachable')
    // A malformed metrics line stays in the evidence instead of being lost.
    expect(parseScriptResult(run({ stdout: 'ok\nWISPOPS-JSON: {broken\n' })).evidence).toContain('WISPOPS-JSON: {broken')
  })

  it('bounds summaries and evidence, and notes capture truncation', () => {
    const out = parseScriptResult(run({ stdout: `${'s'.repeat(400)}\n${'e'.repeat(5000)}`, truncated: true }))
    expect(out.summary.length).toBeLessThan(320)
    expect(out.evidence).toContain('(truncated)')
    expect(out.evidence).toContain('capture limit')
  })

  it('renders summaries before evidence and ranks the worst verdict', () => {
    const outcomes = [parseScriptResult(run({ stdout: 'fine\n' })), parseScriptResult(run({ host: 'b', status: 'failed', exitCode: 1, stdout: 'load high\nload 12.0\n', ...{} }))]
    const text = renderScriptOutcomes({ id: 'load', title: 'Load', sha256: 'abcdef0123456789' }, outcomes)
    expect(text.indexOf('- a: ok — fine')).toBeLessThan(text.indexOf('### b (warn, exit 1)'))
    expect(text).toContain('- b: warn — load high')
    expect(text).toContain('load 12.0')
    expect(worstVerdict(outcomes)).toBe('warn')
    expect(worstVerdict([{ verdict: 'failed' }, { verdict: 'crit' }, { verdict: 'unreachable' }])).toBe('crit')
    expect(worstVerdict([{ verdict: 'failed' }, { verdict: 'unreachable' }])).toBe('unreachable')
    expect(worstVerdict([])).toBe('ok')
  })
})
