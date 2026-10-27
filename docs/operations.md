# 通知、安全变更、同步与更新

[English](./operations.en.md) · [返回 README](../README.md)

## 外部通知

在插件配置中声明渠道，凭据放在启动 Harness 的环境变量中：

```yaml
notifications:
  team:
    kind: wecom
    urlEnv: WISPOPS_WECOM_URL
  ding:
    kind: dingtalk
    urlEnv: WISPOPS_DING_URL
    secretEnv: WISPOPS_DING_SECRET
  feishu:
    kind: feishu
    urlEnv: WISPOPS_FEISHU_URL
    secretEnv: WISPOPS_FEISHU_SECRET
  email:
    kind: webhook
    urlEnv: WISPOPS_EMAIL_GATEWAY_URL
    secretEnv: WISPOPS_EMAIL_GATEWAY_TOKEN
```

在面板任务编辑器勾选渠道，或在 YAML 任务中添加：

```yaml
notify: [team, email]
notifyOnlyProblems: true
notifyOnChange: true
quietHours: { start: "22:00", end: "08:00" }
```

`notifyOnlyProblems` 为 true 时只投递警告、严重问题、不可达、未完成的采集或退出码非 0 的任务命令；省略时每次投递。`notifyOnChange` 为 true 时，只有问题计数与上一次运行不同才投递（首次运行总会投递），同样的告警不会每天刷屏。`quietHours` 指定本地时间窗口（可跨午夜，时区默认取任务调度时区，再取插件时区），窗口内的投递记为 `skipped`，不会延后补发；报告仍会送到 DSH 会话。面板的任务编辑器提供这三项开关。通用 webhook 接收 `{"title":"WispOps","markdown":"…"}`，配置 `secretEnv` 时使用 Bearer token。它可连接邮件网关，但插件不提供 SMTP 服务。

通知在任务记录保存后发送，内容是采集器摘要，不是后续模型生成的完整报告。`custom` 仍需模型自行采集，因此摘要标记 `incomplete`，不代表已经检查通过。每个请求有 10 秒期限，不跟随重定向、不自动重试；失败保留在 `dataDir/notifications/<task>.jsonl`（最近 90 次）和任务结果中，巡检数据不会丢失。摘要按 UTF-8 字节截断，不包含 webhook 地址、签名或服务端响应内容。配置通知表示允许向该渠道发送主机名称、路径和诊断摘要。

协议依据：[企业微信群机器人](https://developer.work.weixin.qq.com/document/path/91770)、[钉钉自定义机器人](https://open.dingtalk.com/document/robots/custom-robot-access)、[飞书自定义机器人](https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot)。

## 安全变更

`ops_change` 执行“备份 → 应用 → 验证 → 失败恢复”，每台主机是一个远端 shell 事务；给出选择器时按清单顺序逐台滚动，第一台未通过验证就停止，其余主机标记为 skipped：

```json
{
  "targets": "@web",
  "files": ["/etc/nginx/nginx.conf"],
  "newFiles": ["/etc/nginx/conf.d/ratelimit.conf"],
  "directories": ["/etc/nginx/sites-enabled"],
  "command": "sed -i 's/worker_processes 1;/worker_processes auto;/' /etc/nginx/nginx.conf && printf 'limit_req_zone ...;\n' > /etc/nginx/conf.d/ratelimit.conf && nginx -t && systemctl reload nginx",
  "verify": "nginx -t && systemctl is-active nginx",
  "afterRollback": "nginx -t && systemctl reload nginx && systemctl is-active nginx",
  "reason": "按 CPU 数量调整 nginx worker 并加入限流，逐台验证",
  "sudo": true
}
```

必须列出命令会触及的全部路径，每类最多 30 个：

| 参数 | 前置条件 | 备份 | 失败时 |
|---|---|---|---|
| `files` | 已有普通文件，拒绝符号链接 | `cp -a` 到 `$B/f<i>` | 原子替换回原内容 |
| `newFiles` | 尚不存在，父目录已存在 | 只记录在清单 | 删除（若变成目录则报告 rollback-failed） |
| `directories` | 已有目录，拒绝符号链接 | `tar` 到 `$B/d<i>.tar` | 解压到同级临时目录后整体替换 |

全部备份成功后才开始变更；备份目录内含 `manifest` 列出每条路径及类型。审批展示完整主机列表、路径、应用、验证和恢复后检查；三个脚本分别参与风险分级及 deny-list 检查，继续使用现有 voucher、主机策略与授权。完整计划写入操作审计，每台主机的结果另记入 `dataDir/changes/<主机>.jsonl`。

远端需要 GNU `timeout`，列出目录时还需要 `tar`。每阶段默认 15 秒，在总期限内预留恢复时间。应用或验证非零退出后，远端同一事务恢复备份，再运行 `afterRollback`；省略时只恢复路径。结果区分 `verified`、`rolled-back`、`rollback-failed`、`refused`（前置条件或备份失败，未做任何修改）和 `unknown`（连接中断）。

**滚动与金丝雀**：多台主机时串行执行，同一主机同时只允许一个变更；建议先对一台主机运行，再对分组运行。停止后未执行的主机需要你决定是否修复后重试，工具不会自动继续。

**备份保留**：备份保留在每台主机的 `change.backupRoot`（默认 `/var/tmp`）下的 `wispops-change.*`，结果和 `ops_history kind=changes` 给出路径。`change.backupRetentionDays`（默认 14，0 为永久保留）决定保留天数：每次 `ops_change` 开始时先用 `find -mtime` 删除该主机上超期的备份目录，再创建新备份；没有新的变更时不会清理，无权限删除的目录会跳过。`ops_history kind=changes` 列出每台主机记录的变更、路径、结果、备份目录以及是否仍在保留期内。

范围限于列出的路径；软件包、数据库、未列出的文件和其他外部副作用不会自动撤销。SSH 中断、SIGKILL、主机断电或独立进程继续运行时不能保证恢复完成，应先检查实际状态再重试；不要与其他工具同时修改这些路径。

## 审计与趋势

新审计条目保存在 `dataDir/audit/YYYY-MM.jsonl`，按 UTC 月分区。旧 `audit.jsonl` 保留并兼容查询，无需迁移。查询从文件末尾按块读取、达到数量上限后停止；月份用于跳过无关分区。`retention.auditMonths`（默认 12，含当月）决定保留的月份数，更早的月份文件在写入新条目时删除，0 为永久保留；旧的单文件 `audit.jsonl` 不会被清理。巡检历史每台服务器保留 `retention.inspectionRecords` 条（默认 1000），写入新记录时裁剪最旧的。面板的 **操作审计** 标签页按服务器和时间范围展示同一份审计（最多 500 条，命令截断到 400 字符），由只向宿主所有者开放的 `auditLog` 动作提供。

`ops_history kind="trends" targets="web-01" limit=10` 输出最近成功巡检的磁盘占用率、可用内存百分比序列和百分点变化；失败采样不被当作零值。这里提供文本趋势，尚无交互图表。

Slurm、PBS 和 LSF 作业目录共同参与 `ops_disk` 与 `ops_files` 的在用判断。PBS 从 `qstat -f` 提取工作目录，不返回完整 `Variable_List`；LSF 优先使用 `exec_cwd`，缺失时采用 `sub_cwd`。权限、缺少命令或调度器不可达仍会限制可见范围，每种调度器最多保留 500 个作业；没有发现作业不等于文件一定可删。

## 坚果云 WebDAV 设备同步

打开 **服务器运维 → 设备同步**。按[坚果云官方说明](https://help.jianguoyun.com/?p=2064)创建第三方应用密码，填写账号邮箱、应用密码和文件夹地址，默认 `https://dav.jianguoyun.com/dav/WispOps/`。其他支持 HTTPS、MKCOL、PROPFIND、GET、PUT 的 WebDAV 服务也可使用。

1. 在设备 A 输入独立同步口令（至少 12 个字符），点击 **上传新的加密快照**。
2. 在设备 B 填写相同的 WebDAV 连接信息及同步口令，点击 **读取云端快照**。
3. 选择版本并 **解密并预览导入**，核对主机、凭据、数量、同名凭据冲突、允许自动化的凭据、sudo 任务和权限设置。
4. 停用设备 B 的 WispOps 调度，点击 **确认替换本机数据**。导入后按需重新启用任务。

同步范围是独立密码库（包括禁止自动化的条目）、面板服务器及凭据关联、任务、自建模板。凭据关联和面板里设置的操作权限也会应用到 YAML 或 WispTerm 的同名服务器，预览中会逐项显示。YAML 文件、通知环境变量、SSH config、WispTerm 库、临时授权、审计历史、DSH 会话和实际调度不会同步。导入会替换整个本地密码库及面板配置，不做隐式合并；本地或云端在预览后变化会拒绝导入。

上传时可以明确勾选 SSH 私钥：只收集面板服务器 `identityFile` 字段指定的私钥，添加服务器时可填此路径。未显式指定的默认 SSH 密钥不会被扫描。导入后密钥写入 `dataDir/ssh-keys/` 的私有文件，并更新相应服务器的路径。YAML 中的服务器和密钥需在各设备单独配置。

同步包使用随机 salt、固定参数 scrypt（N=32768、r=8、p=1）和 XChaCha20-Poly1305 加密。WebDAV 只接收密文；系统钥匙串密钥不会上传。导入时使用目标设备自己的本地密码库密钥重新加密。应用密码和同步口令只用于当前页面请求，不持久保存；遗失同步口令无法恢复云端快照。

每次上传生成一个新文件，不覆盖其他设备的版本。导入前在 `dataDir/sync-backups/` 保存同一口令加密的本地备份；可将该文件保持原名上传到同一 WebDAV 目录后通过预览导入恢复。备份不能代替口令保管。多个本地文件的提交可对普通写入失败回退，但不是跨文件的断电原子事务；进程中断后应检查配置和凭据，必要时恢复备份。当前同步是人工触发的快照传输，不是后台双向合并。

## 检查更新与自动更新

打开 **版本更新**，点击 **检查更新**。只检查官方 `wisp-science/WispOps` 仓库最新的非预发布 GitHub Release，核对标签版本、包名和清单，并固定到该 Release 的提交 SHA。尚未发布 Release 时会显示无稳定版本；不会自动安装默认分支中的开发提交。

点击 **安装已核验的更新** 会通过 Harness 自带插件管理器安装。也可勾选 **自动安装稳定版本**：默认关闭，启用后在 Harness 运行期间约每 6 小时检查并安装，完成后等待你重启 Harness。安装器保留宿主的兼容性、依赖脚本审批和失败恢复行为，插件不自动批准安装脚本、不自动重启。面板保留失败或待重启状态。

仅支持官方 GitHub 来源的安装；本地 `link:`、开发仓库及其他来源不会被覆盖。开启 HMR 的 Harness 不支持这里对 Git 插件进行原位更新，请关闭 HMR 后重启再更新；缺少插件管理器时可检查版本，但需在插件页手动重装。宿主接口依据见 [Harness plugin-manager](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/boot/plugin-manager)。

如果页面显示 **检查或安装失败**，并提示 `Disable Harness HMR and restart before updating this GitHub plugin`，也可在 Harness **插件**页卸载 WispOps，再点击 **＋ 添加插件**，输入 `https://github.com/wisp-science/WispOps` 重新安装，完成后重启 Harness。

维护者发布时更新 package/lockfile 版本和 CHANGELOG、重新构建并提交 `lib/`，再推送匹配 `v<version>` 的标签。发布工作流通过检查后创建 GitHub Release 并附加 `.tgz`；不会发布 npm。日常 CI 会检查类型、测试、干净构建与已提交 `lib/` 的一致性。
