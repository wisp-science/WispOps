**中文** · [English](./README.en.md)

# WispOps（dsh-wisp-ops）

DeepSeek Harness 的多主机服务器运维插件：服务器管理、独立加密密码库、按服务器的例行任务，以及巡检、磁盘诊断、安全排查和批量命令。变更、sudo、破坏性操作逐主机授权；密码只交给 SSH，不返回给页面或模型。不需要 WispTerm。

## 安装

需要 DeepSeek Harness `>=0.2.1-rc.3 <0.3.0`，并能访问 GitHub。

1. Harness 左侧 **插件** → **＋ 添加插件**，粘贴 `https://github.com/wisp-science/WispOps`。只填这个地址，不填 npm 包名。
2. **安装源**：国内网络选 **中国大陆镜像源**，其他选 **npm 官方源**。
3. 点击 **安装**，确认插件已启用。
4. 完全退出并重新打开 Harness。

升级：在运维面板的 **版本更新** 中检查并安装稳定 Release，也可开启自动更新；安装后重启 Harness。本地开发链接不会被覆盖。旧版可先卸载再重装，`~/.dsh-wisp-ops/` 数据不会删除。

命令行安装、本地源码安装和常见报错见 [docs/install.md](./docs/install.md)。

## 上手

打开左侧 **服务器运维**（或会话右侧栏 **开始** → **服务器运维**）：

1. **服务器**：添加地址、用户名和端口。
2. **密码库**：新建凭据，勾选关联的服务器和用途（SSH 登录 / sudo）。密钥登录、免密 sudo 可跳过。
3. **任务库**：选择内置模板或自建，点击 **关联服务器**，设置检查对象和运行时间。
4. **例行任务**：选择接收报告的会话，点击 **启用调度**。Harness 需保持运行。

也可以手写 `~/.dsh-wisp-ops/inventory.yml`，参考 [examples/inventory.yml](./examples/inventory.yml)。

## 能做什么

| 工具 | 用途 |
|---|---|
| `ops_inspect` | 巡检负载、内存、磁盘、systemd、GPU、Slurm、OOM 等，按阈值告警并与上次对比 |
| `ops_disk` | 磁盘诊断：大目录和大文件、是否被进程或作业占用、已删除仍占用的空间、各类缓存 |
| `ops_files` | 近期新增文件：按目录和属主统计，识别测序/生信文件并生成清理计划 |
| `ops_security` | 攻击排查：SSH 暴力破解、可疑进程与外连、异常账户、近期改动的启动项 |
| `ops_change` | 文件、新建文件和目录的备份、变更、验证和失败恢复；按组逐台滚动，首台失败即停 |
| `ops_exec` | 批量命令：并发执行，执行前做风险分级 |
| `ops_hosts` / `ops_history` | 能力探测；操作审计、巡检历史与磁盘/内存趋势 |

另带 6 个技能：磁盘写满、生信存储清理、安全排查、定时汇报、安全变更、GPU/Slurm。详见 [docs/features.md](./docs/features.md)。

支持企业微信、钉钉、飞书和邮件网关 webhook 通知；面板随 Harness 切换中英文。**设备同步** 可通过坚果云 WebDAV 传输加密凭据、任务配置和明确选定的 SSH 私钥。详见[通知、变更、同步与更新](./docs/operations.md)。

## 权限

每条命令分为 read / change / sudo / destructive，按 **主机策略 > 分组 > 默认** 裁决为 allow、ask 或 deny。默认只读直接执行，其余逐次审批；也可以用 `/ops-allow sudo @gpu 2h` 临时放行，`/ops-revoke all` 撤销。模型不能修改清单、数据目录和密码库。

密码库使用 XChaCha20-Poly1305 加密，密钥存放在 macOS 钥匙串、Windows DPAPI 或权限为 `0600` 的文件中。详见 [docs/security.md](./docs/security.md)。

## 文档

- [安装与常见问题](./docs/install.md)
- [管理面板与任务库](./docs/panel.md)
- [功能、技能与路线图](./docs/features.md)
- [权限模型与密码库](./docs/security.md)
- [配置与 YAML 任务](./docs/config.md)
- [通知、安全变更、设备同步与更新](./docs/operations.md)
- [版本记录](./CHANGELOG.md)

## 开发

```bash
npm install
npm test
npm run typecheck
npm run build
```

`lib/` 已纳入 Git，GitHub 安装直接使用。修改 `src/` 或 `client/` 后执行 `npm run build`，并把 `lib/` 一起提交。测试中的 `tests/fixtures/fake-ssh.sh` 在本机模拟远程命令。

## 限制

- 目标主机按 GNU/Linux 处理，不支持 Windows 目标。
- 外部通知发送采集摘要；`custom` 仍需模型继续采集，不会伪装成已完成报告。
- 安全变更恢复范围限于列出的路径；设备同步是人工触发的快照替换，更新安装后需重启。

## License

MIT
