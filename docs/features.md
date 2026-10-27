# 功能与技能

[← 返回 README](../README.md)

## 功能

- **主机清单**：YAML 文件（改完下一次调用即生效），支持分组、标签、`ProxyJump`、`IdentityFile`、密码登录主机；可选导入 WispTerm 的 SSH 主机。选择器：`web-01`、`@gpu`、`tag:env=prod`、`gpu-*`、`all !@prod`。
- **巡检 `ops_inspect`**：一次往返采集负载、CPU、内存/swap、磁盘与 inode、失败的 systemd 单元、Top 进程、NVIDIA GPU 及其进程、Slurm 节点/作业状态、24h 内 OOM 与内核错误、NTP、待重启。按阈值给出 critical/warning，和上次巡检对比磁盘增长，结果写入历史。
- **磁盘诊断 `ops_disk`**（第一版验收场景）：最大目录（含相对上次诊断的增长）、最大文件和最近增长的大文件；判断文件**是否仍被进程打开**、**是否位于运行中 Slurm 作业的工作目录**；统计“已删除但仍被占用”的空间及持有进程；检查 journal、docker、apt/dnf、conda/pip、HuggingFace 缓存、轮转日志。每个文件都有结论（in-use / job-directory / rotated-log / core-dump / recently-written / review）。清理后对同一路径再跑一次，即可核对释放了多少空间。
- **批量命令 `ops_exec`**：并发执行，相同输出自动折叠；每条命令先做风险分级（只读 / 变更 / 破坏性，外加 sudo）。
- **近期新增文件分析 `ops_files`**：最近 N 天新增或修改的文件总量、落在哪些目录（与上次扫描对比增长）、属于谁；内置**测序与生信规则库**，能识别原始 FASTQ/BCL/POD5、SAM/BAM/CRAM、VCF/gVCF、修剪后 reads、SRA、Nextflow `work/`、Snakemake `.snakemake`、STAR 临时目录、Cell Ranger 阶段目录、分析对象、日志、缓存，给每类文件标出保留级别（原始数据 / 结果 / 可再生中间文件 / 可压缩转换 / 缓存 / 临时 / 需问责任人）。它还能识别被同目录文件取代的冗余文件：同名 SAM 已有 BAM、`sorted.bam` 已有下游的 `markdup.bam`、BAM 已有 CRAM、`.sra` 已有 FASTQ、未压缩文件已有 `.gz`。根据 `.nextflow.log` 和 `outs/` 判断流程是否已完成；仍被进程打开或位于运行中作业目录的文件一律排除。最后按可回收空间排序，生成带“先做什么检查”的清理计划。
- **网络攻击排查 `ops_security`**：SSH 暴力破解来源、成功登录（同时标记暴力破解后又登录成功的地址）、连接洪泛与 SYN flood、监听端口、疑似挖矿进程、运行已删除程序或从 `/tmp`、`/dev/shm` 启动的进程、连向常见矿池/C2 端口的外连、多余的 UID 0 账户、近期改动的 authorized_keys/cron/systemd 单元、sshd 弱配置、fail2ban 状态。
- **能力探测 `ops_hosts probe=true`**：系统、架构、核数、GPU 数、调度器（slurm/pbs/sge/lsf）、权限（root / 免密 sudo / 需密码 sudo / 无）、docker 可用性。
- **历史 `ops_history`**：操作审计（每条远程命令的风险、授权来源、结果）和巡检历史。

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

## 验收场景：“这台服务器磁盘快满了”

1. `ops_inspect` → `gpu-01 [CRIT] / 95% used`，并提示 `/data grew 85% → 95%`。
2. `ops_disk host=gpu-01 path=/ sudo=true`（需要 sudo 授权）→ 输出最大目录及增长、正在增长的 `train.log`（被 `python[4242 alice]` 打开，结论是 IN USE）、`/data/projects/bob` 位于运行中的作业 1001 目录、8G 已删除但被 `rsyslogd` 占用的空间、3.9G journal、conda 包缓存。
3. 模型给出方案：`journalctl --vacuum-size=500M`（破坏性 + sudo，需要审批）、`conda clean --all`（变更）、对 rsyslogd 执行 `systemctl kill -s HUP rsyslog` 释放已删除文件、在用的日志和作业目录不碰，交给 alice/bob 处理。
4. 你逐条批准，或者先 `/ops-allow sudo gpu-01 20m`。
5. 再跑一次 `ops_disk` → `Since previous diagnosis: used -12.4G (95% → 89%)`，确认清理生效。

## 它和其他方案的关系

| | 官方 SSH provider（`packages/ssh`） | [dsh-ssh-ops](https://github.com/caoyiwei850/dsh-ssh-ops) | **WispOps** |
|---|---|---|---|
| 形态 | 把一个会话的文件/进程世界整体搬到**一台**远程主机 | 单台服务器的交互式终端、SFTP、数据库面板（Web UI） | **一群**服务器的巡检、诊断、批量操作，Desktop / Web 管理面板，CLI 可使用工具及命令 |
| 多主机 | 一个 profile 一台 | 批量需在面板里人工勾选 | 清单、分组、标签、选择器，并发执行 |
| 权限 | 沙箱 + 审批策略 | 高危黑名单 + 会话审批 | 逐主机 change/sudo/destructive 策略 + 限时授权 + 单次审批 |

三者可以并存：WispOps 的工具都以 `ops_` 开头，不和其他插件冲突。

## 已知限制与路线图

- 目标主机按 GNU/Linux 处理（使用 `find -printf`、`/proc`、`stat -c`）；BSD/macOS 目标上部分诊断项会缺失；Windows 目标不支持。
- 超时后本地 ssh 会被结束，但远端命令可能仍在运行，结果里会提示。
- 汇报投递到 DSH 会话里（在 Web 端查看），暂不推送到企业微信、钉钉、邮件等外部渠道。
- 新增文件按修改时间判断，因为 Linux 的 find 通常拿不到文件的创建时间。
- 尚未完成：`ops_change`（自动备份 → 变更 → 验证 → 失败回滚，目前由 `wisp-safe-change` 技能约束模型手动执行）、Web 面板（机群总览、巡检趋势图）、PBS/LSF 的作业目录识别、容器内磁盘归因、外部通知渠道。
