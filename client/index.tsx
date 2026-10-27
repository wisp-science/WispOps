import type { Context } from '@deepseek-ai/cordis'
import { OpsPage } from './page'
import type { PageProps } from './contracts'

// Narrow adapters for the documented DSH slots and authenticated Connection APIs.
interface ClientHost {
  inject(services: string[], callback: (scope: ClientHost) => void): unknown
  effect(callback: () => (() => void)): unknown
  sidebarRightTabs: { register(definition: Record<string, unknown>): () => void }
  slots: {
    inject(name: string, callback: () => unknown): unknown
    register(options: Record<string, unknown>, component: unknown): () => void
  }
  connection: { rpc: { call(channel: string, endpoint: string, payload: unknown): Promise<{ ok: boolean; value?: any; error?: { message: string } }> } }
}
export const inject = ['slots', 'connection']
export function ServerIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6"/></svg>
}
export function apply(context: Context) {
  const ctx = context as unknown as ClientHost
  const api: PageProps['api'] = async request => {
    const result = await ctx.connection.rpc.call('/api', 'wispOps/manage', { args: { request } })
    if (!result.ok) throw new Error(result.error?.message ?? '连接失败，请重试。')
    if (!result.value?.ok) throw new Error(result.value?.error ?? '操作失败，请重试。')
    return result.value.value
  }
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'wisp-ops', inject: () => ({ api }) }, OpsPage))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: 'wisp-ops', order: 25, label: '服务器运维' }, ServerIcon))
  ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({ name: 'plugins.bundle.config', key: 'dsh-wisp-ops', inject: () => ({ api }) }, OpsPage))
  ctx.inject(['sidebarRightTabs'], scope => {
    scope.effect(() => scope.sidebarRightTabs.register({
      id: 'dsh-wisp-ops', kind: 'wisp-ops', title: () => '服务器运维',
      guide: [{ id: 'manage', order: 40, title: () => '服务器运维', description: () => '管理服务器、密码库和例行任务', icon: ServerIcon }],
    }))
    scope.slots.inject('sidebar.right.pane.tab', () => scope.slots.register({
      name: 'sidebar.right.pane.tab', key: 'dsh-wisp-ops',
      inject: (sessionId: string) => ({ api, sidebar: true, defaultSessionId: sessionId }),
    }, OpsPage))
  })
}
