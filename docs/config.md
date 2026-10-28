# 配置与 YAML 任务

[← 返回 README](../README.md)

## 配置

在 profile 的 `cordis.patch.yml` 里覆盖 `wisp-ops` 这一行。patch 会整体替换 `config`，需要的键要写全：

```yaml
- id: wisp-ops
  config:
    inventoryFile: ~/.dsh-wisp-ops/inventory.yml
    defaultPolicy: { change: ask, sudo: ask, destructive: ask }
    secrets: { provider: local, importWisptermHosts: false }
    grants: { defaultTtlMinutes: 30, maxTtlMinutes: 480, allowDestructive: false }
    bashGuard: { tools: [bash], sudo: ask, inventorySsh: deny }
    thresholds: { diskWarnPct: 80, diskCritPct: 90 }
```

| 键 | 默认 | 说明 |
|---|---|---|
| `inventoryFile` | `~/.dsh-wisp-ops/inventory.yml` | 文件不存在时清单为空；修改后自动重载 |
| `sshConfigFile` | `~/.ssh/config` | 面板“从 ssh_config 导入”读取的 OpenSSH 客户端配置（含 `Include`） |
| `hosts` / `groups` | 空 | 也可以直接内联在配置里 |
| `defaultPolicy` | 全部 `ask` | 没有主机/分组设置时使用 |
| `denyPatterns` | 见源码 | 正则，任何情况下都拒绝 |
| `extraReadPrograms` | `[]` | 额外视为只读的程序 |
| `ssh.binary` | `ssh` | 系统 OpenSSH |
| `ssh.controlPersistSec` | 60（Windows 为 0） | ControlMaster 复用连接；Win32-OpenSSH 不支持 |
| `ssh.concurrency` | 8 | 机群并发数 |
| `ssh.loadProfile` | true | 在子 shell 里加载 `/etc/profile`、`~/.profile` 取 PATH（输出丢弃，profile 里有 exit/exec 也不受影响） |
| `ssh.extraPath` | `/usr/local/bin`、`/usr/sbin`、`/usr/local/cuda/bin`、`/opt/slurm/bin` 等 | 非登录 shell 里找不到 `nvidia-smi` / `sinfo` 时会用到 |
| `ssh.authFailureBlockMinutes` | 15 | 认证失败后暂停登录的时长 |
| `limits.*` | 60s / 30min / 64KiB / 64 台 | 默认与最大超时、单流输出上限、单次最多主机数 |
| `change.backupRoot` | `/var/tmp` | 每台主机上 `ops_change` 备份目录 `wispops-change.*` 的位置 |
| `change.backupRetentionDays` | 14 | 备份保留天数，下一次 `ops_change` 开始时清理超期备份；0 为永久保留 |
| `secrets.provider` | `local` | 内置独立密码库；可选 `wispterm` 兼容旧引用或 `none` 禁用无前缀凭据 |
| `thresholds.*` | 见源码 | 巡检阈值 |
| `retention.inspectionRecords` | 1000 | 每台服务器保留的巡检记录条数，写入新记录时裁剪最旧的 |
| `retention.auditMonths` | 12 | 保留的审计月份数（含当月），超出的 `audit/YYYY-MM.jsonl` 在写入时自动删除；0 为永久保留。旧的单文件 `audit.jsonl` 不受影响 |
| `dataDir` | `~/.dsh-wisp-ops` | 审计日志、巡检历史、磁盘快照、探测结果、面板数据及独立密码库 |

## 按服务器的定时任务

不同的服务器可以配置不同的任务，写在清单的 `tasks:` 下（完整示例见 [examples/inventory.yml](../examples/inventory.yml)）：

```yaml
tasks:
  - name: a-mcp-morning          # 服务器 A：每天早上汇报 MCP 调度情况
    targets: server-a
    playbook: custom
    instruction: 观察 MCP 服务的调度情况（任务排队、失败、超时、资源占用），每天早上给我汇报
    schedule: { daily: "08:30", timeZone: Asia/Shanghai }
  - name: b-new-files            # 服务器 B：新增文件分析
    targets: server-b
    playbook: new-files
    paths: [/data, /home]
    days: 1
    sudo: true
    schedule: { daily: "09:00" }
  - name: c-security             # 服务器 C：检查是否存在网络攻击（工作日）
    targets: server-c
    playbook: security
    sudo: true
    schedule: { daily: "08:00", weekdays: [1, 2, 3, 4, 5] }
```

- 预设 playbook：`inspect`（巡检）、`disk`（磁盘诊断）、`space`（目录空间占用，按 `paths` 逐层统计目录大小，面板中以方块图查看）、`new-files`（新增文件分析）、`security`（攻击排查）、`custom`（按 `instruction` 汇报；配合 `commands` 时由内置采集器执行命令，否则模型用只读工具自行收集证据）。
- `commands`：最多 20 条只读 shell 命令，在每台目标服务器上依次执行，输出随任务数据一起交给模型，并计入上次对比。加载时用与 `ops_exec` 相同的分类器校验，任何非只读、提权或命中 `denyPatterns` 的命令都会让清单加载失败；`sudo: true` 时命令也以 sudo 执行。退出码非 0 记为 `commandFailed`，与告警一样触发“仅异常投递”。

```yaml
  - name: a-services
    targets: server-a
    playbook: custom
    instruction: 检查 nginx 与 postgresql 是否正常，异常时指出证据
    commands:
      - systemctl is-active nginx postgresql
      - journalctl -u nginx -p err --since -24h --no-pager | tail -n 50
    schedule: { daily: "08:30" }
```
- `playbook: script` 运行面板“检查脚本”库里由你审阅保存的脚本（`script: <脚本标识>`）。脚本通过 stdin 以 `sh -s` 发送到每台目标服务器，不逐行做风险分类，只受 `denyPatterns` 约束；按退出码判定结果（0 正常、1 警告、2 严重、其他为脚本失败），stdout 第一行为摘要，可选 `WISPOPS-JSON: {"key": 数值}` 行记录指标。脚本保存在 `dataDir/check-scripts.json`。
- `report`：谁来写报告。`always`（默认）由 DSH 调度在到点时唤醒 agent 采集并汇报；`problems` 与 `never` 由 WispOps 自己的定时器运行任务、记录并通知，不消耗模型 token——`problems` 只在出现警告、严重、失败或不可达时把一条提示送入所选会话，agent 用 `ops_task mode=last` 读取已保存的证据再写报告；`never` 只记录和通知。这两种模式支持 `daily`/`weekdays`/`everyMinutes`，不支持 `cron`；没有 `commands` 的 `custom` 任务只能用 `always`。

```yaml
  - name: gpu-idle
    targets: "@gpu"
    playbook: script
    script: gpu-idle               # 面板“检查脚本”中的标识
    report: problems               # 正常运行不唤醒 agent
    schedule: { everyMinutes: 30 }
```
- 调度：`daily`（可加 `weekdays` 变成每周）、`cron`、`everyMinutes`，时区默认取本机时区。
- 在 Web 会话里执行 `/ops-schedule all`，插件通过 DSH 官方调度服务创建提醒（DSH 的“自动化任务”页面里能看到）。到点后原会话被唤醒，agent 调用 `ops_task` 拿到数据、你的指令和上一次的结果，然后写汇报。DSH 需要保持运行。
- `/ops-run <任务>` 立即执行一次，`/ops-tasks` 查看任务，`/ops-unschedule` 取消调度。
- 每次运行都会保存，下一次汇报会说明“与上次相比的变化”。
- 无人值守时没人能点审批：任务里写 `sudo: true`，表示你预先授权这个任务的**只读**采集器使用 sudo（主机策略写了 `sudo: deny` 时仍然拒绝）。定时任务只采集和汇报，不做任何变更。

## 通知配置

`notifications` 声明人工管理的命名渠道，任务通过 `notify` 选择；`notifyOnlyProblems` 仅在异常时投递，`notifyOnChange` 仅在问题数量与上次不同时投递（首次总会投递），`quietHours: { start: "22:00", end: "08:00", timeZone }` 在该本地时段内不投递（可跨午夜，时区默认取任务时区）。完整示例及密钥环境变量见[通知配置](./operations.md#外部通知)。
