import { tr } from './i18n'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { Api, CheckScript, Host, ScriptTest } from './contracts'

function Field({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return <label className="wo-field"><span>{title}</span>{children}{hint && <small>{hint}</small>}</label>
}

const SAMPLE = `#!/bin/sh
# One-line summary first, then evidence. Exit 0 ok, 1 warning, 2 critical.
load=$(cut -d' ' -f1 /proc/loadavg)
cores=$(nproc 2>/dev/null || echo 1)
echo "load $load on $cores cores"
uptime
echo "WISPOPS-JSON: {\\"load1\\": $load, \\"cores\\": $cores}"
awk -v l="$load" -v c="$cores" 'BEGIN { exit (l > c * 2) ? 2 : (l > c) ? 1 : 0 }'
`

/** `draft` reviews an agent's proposal as a new script; `hosts` lets the owner try the content on one server before saving. */
export function ScriptForm({ script, draft, hosts, api, busy, submit }: { script?: CheckScript; draft?: boolean; hosts: Host[]; api: Api; busy: boolean; submit: (value: Record<string, unknown>) => Promise<void> }) {
  const form = useRef<HTMLFormElement>(null)
  const [testHost, setTestHost] = useState(hosts[0]?.name ?? '')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<ScriptTest>()
  const [testError, setTestError] = useState('')
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  function values() {
    const f = new FormData(form.current!)
    return { id: String(f.get('id')), title: String(f.get('title')), description: String(f.get('description')), content: String(f.get('content')), timeoutSec: Number(f.get('timeoutSec')) }
  }
  async function test() {
    if (testing || busy || !testHost) return
    setTesting(true); setTestError(''); setResult(undefined)
    try {
      const value = values()
      const outcome = await api({ action: 'testScript', host: testHost, content: value.content, timeoutSec: value.timeoutSec }) as ScriptTest
      if (alive.current) setResult(outcome)
    } catch (e) { if (alive.current) setTestError(e instanceof Error ? e.message : tr("script.test.failed")) }
    finally { if (alive.current) setTesting(false) }
  }
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void submit(values())
  }
  const verdictTone = (verdict: string) => verdict === 'ok' ? 'good' : verdict === 'warn' ? 'warn' : verdict === 'crit' ? 'crit' : ''
  return <form ref={form} onSubmit={save}><fieldset className="wo-form-body" disabled={busy || testing}>
    <div className="wo-form-grid"><Field title={tr("script.id")} hint={tr("script.id.hint")}><input name="id" required pattern="[A-Za-z0-9][A-Za-z0-9._\-]*" maxLength={80} defaultValue={script?.id} readOnly={!!script && !draft}/></Field><Field title={tr("script.title")}><input name="title" required maxLength={120} defaultValue={script?.title}/></Field></div>
    <Field title={tr("short.description")} hint={tr("script.description.hint")}><input name="description" maxLength={1000} defaultValue={script?.description}/></Field>
    <Field title={tr("script.content")} hint={tr("script.contract.hint")}><textarea name="content" className="wo-mono wo-script-editor" required rows={12} spellCheck={false} defaultValue={script?.content ?? SAMPLE}/></Field>
    <details className="wo-template-preview"><summary>{tr("script.contract.title")}</summary><ul className="wo-contract"><li>{tr("script.contract.exit")}</li><li>{tr("script.contract.summary")}</li><li>{tr("script.contract.metrics")}</li><li>{tr("script.contract.trust")}</li></ul></details>
    <div className="wo-form-grid"><Field title={tr("script.timeout")} hint={tr("script.timeout.hint")}><input name="timeoutSec" type="number" min={5} max={3600} required defaultValue={script?.timeoutSec ?? 120}/></Field>
      <Field title={tr("script.test.on")}><div className="wo-script-test"><select value={testHost} onChange={e => setTestHost(e.target.value)} aria-label={tr("script.test.on")}>{!hosts.length && <option value="">{tr("add.a.server.first")}</option>}{hosts.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}</select><button type="button" disabled={!testHost} onClick={() => void test()}>{testing ? tr("script.testing") : tr("script.test")}</button></div></Field></div>
    {testError && <p role="alert" className="wo-alert">{testError}</p>}
    {result && <div className={`wo-script-result is-${verdictTone(result.verdict)}`} role="status">
      <div className="wo-script-result-head"><span className={`wo-badge ${verdictTone(result.verdict)}`}>{result.verdict}</span><strong>{result.summary}</strong><small>{result.host} · {tr("script.exit", { p0: result.exitCode ?? '?' })} · {result.durationMs} ms</small></div>
      {result.metrics && <small className="wo-mono">{Object.entries(result.metrics).map(([k, v]) => `${k}=${v}`).join('  ')}</small>}
      {result.evidence && <pre className="wo-command-list">{result.evidence}</pre>}
    </div>}
    <div className="wo-form-actions"><button className="wo-primary">{busy ? tr("saving") : tr("script.save")}</button></div>
  </fieldset></form>
}
