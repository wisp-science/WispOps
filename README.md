**中文** · [English](./README.en.md)

# WispOps（dsh-wisp-ops）

> DeepSeek Harness 的**多主机服务器运维**插件：可视化服务器管理、独立加密密码库、关联服务器的例行任务，以及机群巡检、磁盘诊断、安全排查和批量命令。变更 / sudo / 破坏性操作逐主机授权；密码由插件直接交给 SSH，不返回给页面或模型。**无需安装 WispTerm。**

## 0.2 管理面板

安装或升级后重启 Harness，在会话右侧栏的“开始”页点击 **服务器运维**，即可在对话旁管理。也可以从左侧 **服务器运维** 或插件详情进入完整面板。右侧面板创建例行任务时，默认使用当前会话接收报告：

1. **服务器**：显示已有 YAML / 配置清单与面板新增的服务器，支持搜索、分组、连接信息、凭据状态及关联任务。点击“添加服务器”录入地址、用户名和端口。
2. **密码库**：新增或编辑独立加密凭据。用户名和备注用于识别凭据，连接用户名仍以服务器配置为准。编辑时密码留空保留原密码；可禁用自动化使用；仍有服务器关联的凭据不能删除。
3. **管理关联**：在服务器详情中分别选择 SSH 登录和 sudo 凭据；同一凭据可供多个服务器使用。SSH 密钥登录和免密 sudo 不需要密码库条目。
4. **例行任务**：从服务器详情创建任务会自动选中该服务器，也可在任务表单勾选多台服务器；设置检查内容、报告要求、每天 / 每周 / 固定间隔 / Cron 和时区。
5. **启用调度**：保存任务后选择接收报告的会话并点击“启用调度”。任务也会出现在 Harness 原生“自动化任务”中。可以停用再编辑或删除；重复启用不会在同一会话创建重复调度。DSH 必须保持运行。

面板新增的服务器、凭据关联和任务保存在 `dataDir/managed.json`，原 YAML 文件及注释不会被改写。YAML 定义的任务在面板中可查看、启用和停用，编辑仍在原配置中进行。面板创建的任务绑定保存时选定的具体服务器，不会因为后来新增分组成员而扩大范围。没有调度服务时仍能保存任务，使用 `/ops-run <任务名>` 手动运行。

管理 API 只向宿主所有者开放，不注册成模型工具。保存会检查文件版本，拒绝用旧页面覆盖新数据。

## 自动生成巡查规则（0.3）

创建或编辑例行任务时，选择服务器和检查内容，点击 **自动生成巡查规则**，即可自动填写任务名称、标题、检查项、报告要求和默认每日 08:30 的计划（使用插件时区）。可选择健康巡检、安全排查、磁盘诊断、新增文件或综合检查；生成后可以直接保存，也可修改。

生成依据是已保存的系统能力探测、最近成功巡检以及当前告警阈值。检测到 GPU、Slurm/其他调度器或 Docker 时加入相应检查；历史磁盘压力列为复查项，并标明记录时间。资料缺失或超过 7 天时明确提示，不把旧数据当作当前状态。这是本地规则生成器，不调用大模型；任务实际执行后的报告仍由 Harness 模型撰写。

默认不连接服务器。勾选“先连接所选服务器做只读探测”可更新系统、GPU、调度器和容器信息；探测失败时仍返回草稿并说明原因。新增文件扫描优先使用已确认的共有数据挂载点，没有依据时默认 `/var/log`，可以调整路径。生成不会保存任务、启用调度或自动授权 sudo；草稿仍走原有保存和启用流程。编辑已有任务时保留任务标识和运行计划。

## 它和其他方案的关系

| | 官方 SSH provider（`packages/ssh`） | [dsh-ssh-ops](https://github.com/caoyiwei850/dsh-ssh-ops) | **WispOps** |
|---|---|---|---|
| 形态 | 把一个会话的文件/进程世界整体搬到**一台**远程主机 | 单台服务器的交互式终端、SFTP、数据库面板（Web UI） | **一群**服务器的巡检、诊断、批量操作，Desktop / Web 管理面板，CLI 可使用工具及命令 |
| 多主机 | 一个 profile 一台 | 批量需在面板里人工勾选 | 清单、分组、标签、选择器，并发执行 |
| 权限 | 沙箱 + 审批策略 | 高危黑名单 + 会话审批 | 逐主机 change/sudo/destructive 策略 + 限时授权 + 单次审批 |

三者可以并存：WispOps 的工具都以 `ops_` 开头，不和其他插件冲突。

## 功能

- **主机清单**：YAML 文件（改完下一次调用即生效），支持分组、标签、`ProxyJump`、`IdentityFile`、密码登录主机；可选导入 WispTerm 的 SSH 主机。选择器：`web-01`、`@gpu`、`tag:env=prod`、`gpu-*`、`all !@prod`。
- **巡检 `ops_inspect`**：一次往返采集负载、CPU、内存/swap、磁盘与 inode、失败的 systemd 单元、Top 进程、NVIDIA GPU 及其进程、Slurm 节点/作业状态、24h 内 OOM 与内核错误、NTP、待重启。按阈值给出 critical/warning，和上次巡检对比磁盘增长，结果写入历史。
- **磁盘诊断 `ops_disk`**（第一版验收场景）：最大目录（含相对上次诊断的增长）、最大文件和最近增长的大文件；判断文件**是否仍被进程打开**、**是否位于运行中 Slurm 作业的工作目录**；统计“已删除但仍被占用”的空间及持有进程；检查 journal、docker、apt/dnf、conda/pip、HuggingFace 缓存、轮转日志。每个文件都有结论（in-use / job-directory / rotated-log / core-dump / recently-written / review）。清理后对同一路径再跑一次，即可核对释放了多少空间。
- **批量命令 `ops_exec`**：并发执行，相同输出自动折叠；每条命令先做风险分级（只读 / 变更 / 破坏性，外加 sudo）。
- **近期新增文件分析 `ops_files`**：最近 N 天新增或修改的文件总量、落在哪些目录（与上次扫描对比增长）、属于谁；内置**测序与生信规则库**，能识别原始 FASTQ/BCL/POD5、SAM/BAM/CRAM、VCF/gVCF、修剪后 reads、SRA、Nextflow `work/`、Snakemake `.snakemake`、STAR 临时目录、Cell Ranger 阶段目录、分析对象、日志、缓存，给每类文件标出保留级别（原始数据 / 结果 / 可再生中间文件 / 可压缩转换 / 缓存 / 临时 / 需问责任人）。它还能识别被同目录文件取代的冗余文件：同名 SAM 已有 BAM、`sorted.bam` 已有下游的 `markdup.bam`、BAM 已有 CRAM、`.sra` 已有 FASTQ、未压缩文件已有 `.gz`。根据 `.nextflow.log` 和 `outs/` 判断流程是否已完成；仍被进程打开或位于运行中作业目录的文件一律排除。最后按可回收空间排序，生成带“先做什么检查”的清理计划。
- **网络攻击排查 `ops_security`**：SSH 暴力破解来源、成功登录（同时标记暴力破解后又登录成功的地址）、连接洪泛与 SYN flood、监听端口、疑似挖矿进程、运行已删除程序或从 `/tmp`、`/dev/shm` 启动的进程、连向常见矿池/C2 端口的外连、多余的 UID 0 账户、近期改动的 authorized_keys/cron/systemd 单元、sshd 弱配置、fail2ban 状态。
- **能力探测 `ops_hosts probe=true`**：系统、架构、核数、GPU 数、调度器（slurm/pbs/sge/lsf）、权限（root / 免密 sudo / 需密码 sudo / 无）、docker 可用性。
- **历史 `ops_history`**：操作审计（每条远程命令的风险、授权来源、结果）和巡检历史。

## 按服务器的定时任务

不同的服务器可以配置不同的任务，写在清单的 `tasks:` 下（完整示例见 [examples/inventory.yml](./examples/inventory.yml)）：

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

- 预设 playbook：`inspect`（巡检）、`disk`（磁盘诊断）、`new-files`（新增文件分析）、`security`（攻击排查）、`custom`（按 `instruction` 用只读命令自行收集证据）。
- 调度：`daily`（可加 `weekdays` 变成每周）、`cron`、`everyMinutes`，时区默认取本机时区。
- 在 Web 会话里执行 `/ops-schedule all`，插件通过 DSH 官方调度服务创建提醒（DSH 的“自动化任务”页面里能看到）。到点后原会话被唤醒，agent 调用 `ops_task` 拿到数据、你的指令和上一次的结果，然后写汇报。DSH 需要保持运行。
- `/ops-run <任务>` 立即执行一次，`/ops-tasks` 查看任务，`/ops-unschedule` 取消调度。
- 每次运行都会保存，下一次汇报会说明“与上次相比的变化”。
- 无人值守时没人能点审批：任务里写 `sudo: true`，表示你预先授权这个任务的**只读**采集器使用 sudo（主机策略写了 `sudo: deny` 时仍然拒绝）。定时任务只采集和汇报，不做任何变更。

## 默认技能

插件自带 6 个技能，注册到 DSH 技能列表里，模型会按需加载，你也可以手动调用：

| 技能 | 内容 |
|---|---|
| `wisp-disk-full` | 磁盘写满的完整处理流程：定位、计划、审批、清理、核对 |
| `wisp-omics-cleanup` | 测序/生信存储清理：哪些绝不能删、哪些在验证后可删（含验证命令）、BAM→CRAM、FASTQ/VCF 压缩、缓存清理、如何与数据负责人沟通 |
| `wisp-security-triage` | 攻击排查：判断是噪声、可疑还是已失陷；先保全证据再处置；按从轻到重的顺序遏制 |
| `wisp-daily-report` | 定时汇报的写法：状态行、与上次对比、发现、建议（区分只读检查和需审批的变更） |
| `wisp-safe-change` | 安全变更：记录状态 → 备份 → 校验配置 → 金丝雀 → 验证 → 回滚 |
| `wisp-hpc-gpu` | GPU 与 Slurm：空占 GPU、drain/down 节点、排队原因、Xid 错误 |

## 权限模型（核心）

每个动作先分级，再逐主机、逐能力裁决：

| 能力 | 触发 | 默认 |
|---|---|---|
| read | 只读命令、内置巡检/诊断/探测 | 始终允许 |
| change | 任何非只读命令（重启服务、装包、改配置、写文件……） | ask |
| sudo | `sudo=true`，或命令里出现 sudo/su/doas | ask |
| destructive | 删除、格式化、重启/关机、prune、vacuum、卸载软件包…… | ask |

裁决顺序：**主机策略 > 所属分组中最严格的一个 > `defaultPolicy`**。

- `allow`：直接执行，审计记为 `policy`。
- `ask`：如果你用 `/ops-allow` 给过授权，审计记为 `grant`；否则通过 DSH 原生审批弹窗**询问这一次具体调用**（主机列表 + 所需能力 + 命令 + 模型给出的理由），批准只对这一次有效。
- `deny`：绝对拒绝，审批和授权都不能覆盖。

**由你来放行危险操作**（斜杠命令只有人能用，模型无法调用）：

```
/ops-allow sudo @gpu 2h          # 2 小时内允许在 gpu 组上使用 sudo
/ops-allow change web-01 30m     # 允许变更 web-01
/ops-allow all lab-*             # change + sudo（不含 destructive，破坏性操作必须单独点名）
/ops-allow destructive nas 10m   # 需在配置中开启 grants.allowDestructive
/ops-grants                      # 查看当前授权与被暂停登录的主机
/ops-revoke all                  # 撤销
/ops-unblock gpu-02              # 认证失败被暂停后恢复登录
/ops-inspect @gpu                # 不经过模型，直接巡检
/ops-tasks                       # 查看按服务器的任务
/ops-schedule all                # 把任务挂到 DSH 调度器（Web 会话）
/ops-run b-new-files             # 立即执行一个任务并让 agent 写汇报
/ops-unschedule all              # 取消调度
```

授权只属于当前会话，到期失效，插件重启后清空（失败时一律关闭）。

**安全不变量**：
- 模型只能按清单名指定主机，无法自己给出 SSH 目标；目标一律放在 `--` 之后，不会被解析成选项。
- 每次工具调用都必须带有审批门签发的一次性凭证，否则不执行。即使组合顺序出问题导致审批门没跑，也是拒绝执行。
- `denyPatterns`（默认包括 `rm -rf /`、fork 炸弹、`chmod 777 /`）用 `ctx.tools.guard` 做最终拦截，任何监听器都绕不过。
- 本地 `bash` 里 `ssh/scp/rsync` 到清单主机会被拒绝（引导改用 `ops_exec`）；本地 `sudo` 需要审批。
- 认证失败后对该主机暂停登录 15 分钟，避免反复登录被当成暴力破解封 IP；由你执行 `/ops-unblock` 恢复。
- 模型不能修改清单文件、数据目录和 WispTerm 密码库：DSH 的 `write`/`edit`/`str_replace_editor` 写入这些路径会被拒绝，bash 中非只读的命令只要涉及这些路径也会被拒绝。否则模型可以改清单给自己放开权限。
- DSH 的 `danger-full-access` 预设审批策略是 `never`，此时所有 ask 都会被拒绝；要在该模式下使用，请在清单里写 `allow` 或用 `/ops-allow`。

## 独立加密密码库

默认 `secrets.provider: local`，内置密码库采用与 WispTerm 相同的设计思路，但文件、密钥和生命周期完全独立：

- `dataDir/vault.json` 保存条目名称、用户名、备注、自动化使用开关及 XChaCha20-Poly1305 加密的密码；每次更新使用随机 24 字节 nonce，并将条目名称作为认证附加数据。
- macOS 使用独立的 **WispOps Password Store** 钥匙串项，账户按数据目录区分；Windows 使用当前用户 DPAPI 保护 `vault.key`；Linux 等其他系统使用权限为 `0600` 的独立 `vault.key`。Linux 的保护依赖文件权限，能读取密钥和密文的系统账户可解密。
- 密码库文件权限为 `0600`，目录为 `0700`；原子替换并检测并发修改。已有加密条目缺失密钥时拒绝生成替代密钥。
- 密码不回显；只有 SSH / sudo 执行路径解密使用，`agent: false` 的条目不能用于自动化。凭据名称、用户名和备注属于普通元数据，不要在这些字段填写密码。
- 主机配置可显式引用 `loginSecret: local:条目名` / `sudoSecret: local:条目名`。显式 `local:` 引用也适用于保留旧 `provider: none` 或 `provider: wispterm` 的安装。
- 备份和迁移需要同时保全密文与对应密钥。macOS 密钥与数据目录对应；Windows 密钥由原用户 DPAPI 保护，不能只复制 `vault.json` 到另一台机器便恢复使用。

## 可选的 WispTerm 兼容来源

只有显式设置 `secrets.provider: wispterm` 时，未带 `local:` 前缀的旧凭据引用才从 WispTerm 的 Password Store **只读**获取；不影响面板内置密码库，也不要求普通安装使用 WispTerm：

- 文件：macOS `~/Library/Application Support/wispterm/passwords`，Windows `%APPDATA%\wispterm\passwords`，Linux `~/.config/wispterm/passwords`。
- 密钥：macOS 登录钥匙串（服务 `WispTerm Password Store`，账户 `vault-key`），首次读取时系统会弹出钥匙串授权，点“始终允许”即可；Windows 用 DPAPI；Linux 读 `passwords.key`。插件**从不写入密码库，也不创建密钥**。
- 条目被标记为“不允许 agent 使用”（`agent:false`）时直接拒绝。
- 在主机上写 `sudoSecret: <条目名>`（sudo 密码）或 `auth: password` + `loginSecret: <条目名>`（SSH 密码登录，需 OpenSSH ≥ 8.4）。

sudo 的实现方式：远端先 `IFS= read -r p`，把密码管道给 `sudo -S -v` 做一次验证，然后用 `exec sudo -n -- sh -s` 执行脚本。密码只经过 `read` 内建命令和 sudo 自己的 stdin，不出现在进程参数里，也不会被当作脚本行执行（免密 sudo 时那一行会被 sudo 丢弃）；输出中如果出现密码原文会被替换为 `[REDACTED]`。注意：这依赖 sudo 的凭据缓存（默认开启）；如果服务器设置了 `timestamp_timeout=0`，请改用 NOPASSWD 规则。

导入 WispTerm 的 SSH 主机（`secrets.importWisptermHosts: true`）只读取主机名、地址、用户、端口、跳板机和密钥路径。WispTerm 这个文件里的 password 字段是明文，插件**从不解码**。密码登录的主机会默认使用和主机同名的密码库条目。

## 安装

```bash
dsh plugin --profile web add github:wisp-science/WispOps
```

从 Git 安装时，pnpm 会要求放行构建脚本，按提示在 profile 的 `pnpm-workspace.yaml` 中加入 `allowBuilds: { dsh-wisp-ops: true }` 后重试。本地开发可以直接执行 `dsh plugin --profile web add /path/to/WispOps`（需先 `npm install && npm run build`）。

重启 Harness 后可以直接在“服务器运维”面板添加服务器，也可以创建 `~/.dsh-wisp-ops/inventory.yml`，参考 [examples/inventory.yml](./examples/inventory.yml)。升级已有本地链接安装时先运行 `npm run build`，再重启 Harness 以加载新的浏览器入口。

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
| `secrets.provider` | `local` | 内置独立密码库；可选 `wispterm` 兼容旧引用或 `none` 禁用无前缀凭据 |
| `thresholds.*` | 见源码 | 巡检阈值 |
| `dataDir` | `~/.dsh-wisp-ops` | 审计日志、巡检历史、磁盘快照、探测结果、面板数据及独立密码库 |

## 验收场景：“这台服务器磁盘快满了”

1. `ops_inspect` → `gpu-01 [CRIT] / 95% used`，并提示 `/data grew 85% → 95%`。
2. `ops_disk host=gpu-01 path=/ sudo=true`（需要 sudo 授权）→ 输出最大目录及增长、正在增长的 `train.log`（被 `python[4242 alice]` 打开，结论是 IN USE）、`/data/projects/bob` 位于运行中的作业 1001 目录、8G 已删除但被 `rsyslogd` 占用的空间、3.9G journal、conda 包缓存。
3. 模型给出方案：`journalctl --vacuum-size=500M`（破坏性 + sudo，需要审批）、`conda clean --all`（变更）、对 rsyslogd 执行 `systemctl kill -s HUP rsyslog` 释放已删除文件、在用的日志和作业目录不碰，交给 alice/bob 处理。
4. 你逐条批准，或者先 `/ops-allow sudo gpu-01 20m`。
5. 再跑一次 `ops_disk` → `Since previous diagnosis: used -12.4G (95% → 89%)`，确认清理生效。

## 开发

```bash
npm install
npm test          # vitest：分级器、策略、审批门、SSH 执行（假 ssh / 假 sudo）、解析器、WispTerm 加解密互通、真实 DSH 工具管线
npm run typecheck
npm run build
```

`tests/fixtures/fake-ssh.sh` 会跳过 ssh 参数，在本机执行远程命令；`down*` / `locked*` 开头的目标分别模拟不可达和认证失败。

## 已知限制与路线图

- 目标主机按 GNU/Linux 处理（使用 `find -printf`、`/proc`、`stat -c`）；BSD/macOS 目标上部分诊断项会缺失；Windows 目标不支持。
- 超时后本地 ssh 会被结束，但远端命令可能仍在运行，结果里会提示。
- 汇报投递到 DSH 会话里（在 Web 端查看），暂不推送到企业微信、钉钉、邮件等外部渠道。
- 新增文件按修改时间判断，因为 Linux 的 find 通常拿不到文件的创建时间。
- 尚未完成：`ops_change`（自动备份 → 变更 → 验证 → 失败回滚，目前由 `wisp-safe-change` 技能约束模型手动执行）、Web 面板（机群总览、巡检趋势图）、PBS/LSF 的作业目录识别、容器内磁盘归因、外部通知渠道。

## License

MIT
