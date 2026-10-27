# 权限与密码库

[← 返回 README](../README.md)

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
