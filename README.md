**中文** · [English](./README.en.md)

# WispOps（dsh-wisp-ops）

DeepSeek Harness 的多主机服务器运维插件：服务器管理、独立加密密码库、按服务器的例行任务，以及巡检、磁盘诊断、安全排查和批量命令。变更、sudo、破坏性操作逐主机授权；密码只交给 SSH，不返回给页面或模型。不需要 WispTerm。

## 安装

需要 DeepSeek Harness `>=0.2.1-rc.3 <0.3.0`，并能访问 GitHub。

1. Harness 左侧 **插件** → **＋ 添加插件**，粘贴 `https://github.com/wisp-science/WispOps`。只填这个地址，不填 npm 包名。
2. **安装源**：国内网络选 **中国大陆镜像源**，其他选 **npm 官方源**。
3. 点击 **安装**，确认插件已启用。
4. 完全退出并重新打开 Harness。

升级：先在插件页卸载旧版（包括本地 `link:` 安装），再按上面重新安装。数据保存在 `~/.dsh-wisp-ops/`，卸载不会删除。

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
| `ops_exec` | 批量命令：并发执行，执行前做风险分级 |
| `ops_hosts` / `ops_history` | 能力探测；操作审计与巡检历史 |

另带 6 个技能：磁盘写满、生信存储清理、安全排查、定时汇报、安全变更、GPU/Slurm。详见 [docs/features.md](./docs/features.md)。

## 权限

每条命令分为 read / change / sudo / destructive，按 **主机策略 > 分组 > 默认** 裁决为 allow、ask 或 deny。默认只读直接执行，其余逐次审批；也可以用 `/ops-allow sudo @gpu 2h` 临时放行，`/ops-revoke all` 撤销。模型不能修改清单、数据目录和密码库。

密码库使用 XChaCha20-Poly1305 加密，密钥存放在 macOS 钥匙串、Windows DPAPI 或权限为 `0600` 的文件中。详见 [docs/security.md](./docs/security.md)。

## 文档

- [安装与常见问题](./docs/install.md)
- [管理面板与任务库](./docs/panel.md)
- [功能、技能与路线图](./docs/features.md)
- [权限模型与密码库](./docs/security.md)
- [配置与 YAML 任务](./docs/config.md)

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
- 报告只投递到 DSH 会话，暂不推送到企业微信、钉钉、邮件等外部渠道。

## License

MIT
