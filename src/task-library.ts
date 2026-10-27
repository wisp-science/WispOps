/** Reusable task definitions are independent from hosts and live schedules. */
import { join } from 'node:path'
import { Task } from './config.ts'
import type { Config } from './config.ts'
import { Inventory } from './inventory.ts'
import { LocalState } from './local-state.ts'
import { renderTemplate } from './task-template-content.ts'
import type { TaskTemplate, TemplateParameter } from './task-template-content.ts'

const parameter = (key: string, label: string, hint: string, required = true, defaultValue?: string): TemplateParameter => ({ key, label, hint, required, ...(defaultValue === undefined ? {} : { defaultValue }) })
export function builtinTemplates(config: Pick<Config, 'thresholds' | 'timeZone'>): TaskTemplate[] {
  const make = (id: string, title: string, category: string, description: string, playbook: TaskTemplate['definition']['playbook'], instruction: string, extra: Partial<TaskTemplate['definition']> = {}, parameters: TemplateParameter[] = []): TaskTemplate => ({
    id: `builtin.${id}`, title, category, description, parameters,
    definition: { playbook, instruction, schedule: { daily: '08:30', timeZone: config.timeZone }, ...extra },
  })
  return [
    make('health', '服务器健康巡检', '基础运维', '负载、内存、磁盘、inode、失败服务和内核异常。', 'inspect', `分析已采集的健康数据，检查负载、内存、磁盘、inode、失败服务、OOM 和内核错误。磁盘使用率达到 ${config.thresholds.diskWarnPct}% 告警、${config.thresholds.diskCritPct}% 紧急；inode 达到 ${config.thresholds.inodeWarnPct}% 告警。结合每核负载和任务情况判断，不把一次高负载直接当成故障。`),
    make('disk', '磁盘空间诊断', '基础运维', '定位大目录、增长来源及已删除但仍占用的文件。', 'disk', '分析所选目录的容量和 inode、主要占用、近期增长及已删除仍被进程占用的文件。区分日志、缓存、原始数据和分析结果，给出带依据的清理候选，不执行删除。', { paths: ['/'] }),
    make('new-files', '新增文件分析', '数据管理', '按目录、属主和文件类型统计新增数据与空间增长。', 'new-files', '分析指定目录在任务设定天数内新增或修改的文件，按目录、属主、类型和体积汇总。区分测序原始数据、分析结果、可再生中间文件和日志；用途未知时标记待确认。', { paths: ['/var/log'], days: 1 }),
    make('security', '安全排查', '安全', '检查认证异常、监听端口、进程和持久化迹象。', 'security', '分析任务设定回溯窗口内的认证、登录、监听端口、异常进程、外连和持久化证据。区分失败认证、正常连接和成功登录；单凭扫描或失败登录不能判定入侵。不展示密码、令牌或私钥。', { hours: 24 }),
    make('services', '关键服务可用性', '应用服务', '检查指定服务是否运行、是否异常退出及近期错误。', 'custom', '关注服务名称：{{services}}。通过只读 ops_exec 检查这些服务的 systemd 状态、进程和有界的近期错误日志；区分未安装、主动停止、管理方式不同和意外失败。不能仅凭 systemd inactive 判定实际服务不可用；必要时交叉检查监听端口。', {}, [parameter('services', '服务名称', '例如 nginx、postgresql；多个名称用逗号分隔。')]),
    make('web', '网站与证书检查', '应用服务', '检查网页连通性、HTTP 状态及 TLS 证书到期时间。', 'custom', '需要检查的网址：{{urls}}。从关联服务器发起有超时限制的只读 HTTP HEAD/必要的 GET 请求，检查状态码、响应耗时与 TLS 证书有效期。禁止提交表单或调用会改变数据的接口，不跟随到未指定主机的重定向。证书不足 30 天提示关注，不足 7 天标记紧急；权限不足或无法验证时说明原因，不自动续签。', {}, [parameter('urls', '检查网址', '填写 http(s) URL；每行一个，不要包含口令、令牌或有写入作用的接口。')]),
    make('containers', '容器运行状态', '应用服务', '查看容器退出、重启次数和健康检查失败。', 'custom', '关注的容器：{{containers}}。仅在 Docker 可用且当前用户有权限时，通过只读 ops_exec 检查容器状态、重启次数、healthcheck 和有界错误日志。区分一次性已完成容器和长期服务异常；不要读取容器环境变量中的秘密，不自动重启、拉取镜像或清理容器。', {}, [parameter('containers', '关注容器', '可填写容器名称；留空检查已有容器。', false, '所有已有容器')]),
    make('backups', '备份时效检查', '数据管理', '检查备份是否按期产出、大小是否异常及失败记录。', 'custom', '备份位置：{{locations}}；预期产出频率：{{cadence}}。只读检查最新备份的时间、大小和可见的作业失败记录，先确认时区和预期频率再判断延迟。不要读取备份内容或访问凭据，不执行备份或恢复。文件存在只说明产物存在，不能据此宣称备份可恢复或完整性已验证。', {}, [parameter('locations', '备份目录或作业名称', '提供本机绝对路径或已知备份服务/作业名称。'), parameter('cadence', '预期备份频率', '例如每天一次、每周日一次。', true, '每天一次')]),
    make('logs', '日志异常汇总', '应用服务', '汇总近期错误类型、发生次数与首次/最后出现时间。', 'custom', '日志范围：{{logs}}。通过只读 ops_exec 读取最近 24 小时的有界日志片段，汇总 error、fatal、OOM、超时和异常堆栈的类型、计数以及首次/最后出现时间。优先使用 journal 时间过滤；单个文件最多读取末尾 2000 行，不递归扫描整盘。采样计数不可宣称是完整统计；遮蔽密码、令牌及请求中的敏感信息。', {}, [parameter('logs', '日志路径或服务名称', '例如 /var/log/nginx/error.log，或 nginx.service。')]),
    make('gpu-jobs', 'GPU 与作业队列', '计算集群', '查看 GPU 资源、温度及 Slurm 等调度器队列。', 'custom', `先用 ops_inspect 获取资源数据；仅对已确认存在的 GPU 和调度器补充轻量只读 ops_exec。检查 GPU 利用率、显存、占用进程与温度（达到 ${config.thresholds.gpuTempWarnC}°C 提示），GPU 空闲本身不是故障。若有 Slurm/PBS/SGE/LSF，查看节点不可用原因和排队作业；区分资源等待与故障，不提交、取消作业或启动计算程序。无对应硬件或调度器时明确不适用。`),
  ]
}

export function validateTemplate(value: unknown): TaskTemplate {
  const raw = value as TaskTemplate
  if (!raw || typeof raw.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(raw.id) || raw.id.startsWith('builtin.') || raw.id === 'all') throw new Error('模板标识无效或使用了预设保留名称。')
  for (const key of ['title', 'description', 'category'] as const) if (typeof raw[key] !== 'string' || raw[key].length > 1000) throw new Error('模板信息不正确。')
  if (!raw.title.trim() || !raw.category.trim()) throw new Error('请填写模板标题和分类。')
  if (!raw.definition || 'targets' in raw.definition || 'sudo' in raw.definition) throw new Error('模板不保存服务器关联或 sudo 授权。')
  const parsed = Task({ ...raw.definition, name: 'template-validation', targets: 'template-validation' })
  // Reuse the same collector, schedule and path checks as concrete tasks.
  new Inventory([{ name: 'template-validation' }], {}, { change: 'ask', sudo: 'ask', destructive: 'ask' }, [parsed])
  if (parsed.schedule?.timeZone) {
    try { new Intl.DateTimeFormat('en', { timeZone: parsed.schedule.timeZone }) } catch { throw new Error('模板时区无效。') }
  }
  if (!parsed.instruction?.trim() || parsed.instruction.length > 30000) throw new Error('请填写巡查规则，最多 30000 字符。')
  if (!Array.isArray(raw.parameters) || raw.parameters.length > 20) throw new Error('模板参数格式不正确。')
  const seen = new Set<string>()
  const parameters = raw.parameters.map(p => {
    if (!p || !/^[A-Za-z][A-Za-z0-9_]*$/.test(p.key) || seen.has(p.key) || typeof p.label !== 'string' || !p.label.trim() || typeof p.hint !== 'string' || typeof p.required !== 'boolean' || (p.defaultValue !== undefined && (typeof p.defaultValue !== 'string' || p.defaultValue.length > 4000))) throw new Error('模板参数格式不正确或重复。')
    seen.add(p.key)
    return { key: p.key, label: p.label, hint: p.hint, required: p.required, ...(p.defaultValue === undefined ? {} : { defaultValue: p.defaultValue }) }
  })
  const { name: _name, targets: _targets, sudo: _sudo, template: _template, ...definition } = parsed
  const template: TaskTemplate = { id: raw.id, title: raw.title.trim(), description: raw.description, category: raw.category.trim(), definition: { ...definition, instruction: parsed.instruction }, parameters }
  renderTemplate(template, {}, false)
  return template
}

export function templateStore(dataDir: string) {
  return new LocalState<{ version: 1; entries: TaskTemplate[] }>(join(dataDir, 'task-templates.json'), () => ({ version: 1, entries: [] }), value => {
    const raw = value as { version: number; entries: unknown[] }
    if (raw?.version !== 1 || !Array.isArray(raw.entries)) throw new Error('Invalid task template library')
    const entries = raw.entries.map(validateTemplate)
    if (new Set(entries.map(t => t.id)).size !== entries.length) throw new Error('模板标识重复。')
    return { version: 1, entries }
  })
}
