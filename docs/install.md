# 安装与常见问题

[← 返回 README](../README.md)

要求：DeepSeek Harness `0.2.1-rc.3` 及以上、`0.3.0` 以下。支持 npm 和 GitHub 两种来源；GitHub 安装方式需要本机能访问 GitHub。**不需要** WispTerm，也**不需要**在本机构建（npm 包和仓库均附带构建好的 `lib/`）。

## 方式一：npm 版（推荐）

从 npm 下载已打包的发行版本，安装更方便，无需访问 GitHub。在终端中安装最新稳定版：

```bash
dsh plugin --profile desktop add dsh-wisp-ops@latest
```

如需固定到某个版本，例如 `0.10.1`：

```bash
dsh plugin --profile desktop add dsh-wisp-ops@0.10.1
```

`desktop` 是桌面版的默认 profile；Web 版通常是 `web`。安装后重启 Harness，在插件列表确认 WispOps 已启用。可从左侧 **服务器运维**，或会话右侧栏 **开始** → **服务器运维** 打开管理面板。

Windows 更换安装来源前，请先完全退出 Harness（含托盘），再从外部 PowerShell 执行命令；详见下方的 [Windows 迁移步骤](#windows-从-github-版切换到-npm-版)。

## 方式二：GitHub 版

需要本机能访问 GitHub。通过 Harness 插件页面安装：

1. 打开 DeepSeek Harness，点击左侧 **插件**。
2. 点击右上角 **＋ 添加插件**，在弹窗输入框中粘贴 GitHub 仓库地址：

   ```text
   https://github.com/wisp-science/WispOps
   ```

   此方式填写仓库地址；npm 镜像地址应在下面的安装源中选择。
3. 在输入框右下方的 **安装源** 中选择：
   - 国内网络：**中国大陆镜像源**（`registry.npmmirror.com`）；
   - 其他网络：**npm 官方源**（`registry.npmjs.org`）；
   - 只有自己维护 npm 服务时才选 **自定义地址**。

   安装源只影响依赖（如 `yaml`、`@noble/ciphers`）从哪里下载；插件本身仍从 GitHub 获取。
4. 点击 **安装**，等待完成。回到插件列表，确认 **WispOps（dsh-wisp-ops）** 处于启用状态。
5. **完全退出并重新打开 Harness**（插件页面要重启后才会加载）。
6. 打开面板：
   - 左侧栏点击 **服务器运维**，进入完整管理面板；
   - 或在会话右侧栏的 **开始** 页点击 **服务器运维**，在对话旁使用。

也可通过命令行安装：

```bash
dsh plugin --profile desktop add github:wisp-science/WispOps
```

安装后重启 Harness。

## 升级到新版本

GitHub 版可在运维面板的 **版本更新** 中检查稳定 Release、安装或开启自动更新，见[更新说明](./operations.md#检查更新与自动更新)。面板内更新目前仅支持 GitHub 来源；npm 版重新执行 `dsh plugin --profile desktop add dsh-wisp-ops@latest`，或指定要安装的版本。对于旧版或不支持原位更新的环境，仍可重装：

1. 在 **插件** 页面找到 WispOps，点击 **卸载**。之前从本地目录安装过的（`link:` 方式），同样要先卸载。
2. 按上面的 npm 或 GitHub 安装方式重新安装。
3. 重启 Harness。

服务器清单、密码库和例行任务默认保存在 `~/.dsh-wisp-ops/`，卸载重装不会删除这个目录。

## Windows 从 GitHub 版切换到 npm 版

两个来源使用相同的包名和安装目录。若日志显示：

```text
ERR_PNPM_EPERM ... rename '...\dsh-wisp-ops_tmp_<pid>_<n>' -> '...\dsh-wisp-ops'
```

说明 pnpm 已进入替换插件目录的阶段，Windows 拒绝了重命名。运行中的 Harness、目录监视、同时进行的安装、失败安装残留和目录权限都可能影响这一步。前面的 peer dependency 警告不等于本次失败原因。仅凭这条日志不能确定持锁进程；Harness 上游也有[同类目录占用报告](https://github.com/deepseek-ai/deepseek-harness/discussions/6674)和[失败安装残留报告](https://github.com/deepseek-ai/deepseek-harness/discussions/7673)。

1. 保存工作并从托盘**完全退出 Harness**，结束其他安装操作；关闭只隐藏窗口时不会释放后台进程。
2. 打开外部 PowerShell，工作目录放在用户目录中，再安装：

   ```powershell
   Set-Location $env:USERPROFILE
   dsh plugin --profile desktop add dsh-wisp-ops@0.10.1
   ```

3. 成功后重新打开 Harness，确认 WispOps 启用、服务器和任务仍在。

如果完全退出后仍是同一个重命名错误，可以先将**该插件目录和对应的临时目录**移到备份位置，再重试。以下命令需要 `dsh` 已在 PATH 中；备份放在 profile 的 `node_modules` 之外：

```powershell
& {
    $ErrorActionPreference = 'Stop'
    Get-Command dsh -ErrorAction Stop | Out-Null
    Set-Location $env:USERPROFILE
    $wispModules = Join-Path $env:USERPROFILE '.dsh\profiles\desktop\node_modules'
    $wispBackup = Join-Path $env:USERPROFILE ('.dsh\install-backups\wisp-ops-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
    New-Item -ItemType Directory -Path $wispBackup | Out-Null
    Write-Host "插件目录备份位置：$wispBackup"
    Get-ChildItem -LiteralPath $wispModules -Directory -Force |
        Where-Object { $_.Name -eq 'dsh-wisp-ops' -or $_.Name -match '^dsh-wisp-ops_tmp_\d+_\d+$' } |
        ForEach-Object { Move-Item -LiteralPath $_.FullName -Destination $wispBackup -ErrorAction Stop }
    dsh plugin --profile desktop add dsh-wisp-ops@0.10.1
    if ($LASTEXITCODE -ne 0) {
        throw "安装未完成，请保留备份并检查新的错误：$wispBackup"
    }
}
```

如果 `Move-Item` 本身也报权限错误，先查找仍占用目录的进程或目录权限，停止重试安装。备份里的 `dsh-wisp-ops` 是移动前的目录；安装失败时保持 Harness 退出，检查新目录后再决定恢复，避免覆盖新的文件。不要把 `_tmp_*` 暂存目录当作已安装包直接改名使用。

上述操作只涉及插件程序目录，服务器、密码库、任务和审计的默认数据目录 `%USERPROFILE%\.dsh-wisp-ops` 保持原位。无需删除整个 profile、`node_modules` 或 pnpm 全局 store。

## 方式三：从本地源码安装（开发用）

```bash
git clone https://github.com/wisp-science/WispOps.git
cd WispOps
npm install && npm run build
dsh plugin --profile desktop add "$(pwd)"
```

本地安装是链接方式：之后修改源码需要重新执行 `npm run build` 并重启 Harness，才能看到新页面。

## 常见安装问题

| 现象 | 原因与处理 |
|---|---|
| Windows 从 GitHub 版改装 npm 版时报 `ERR_PNPM_EPERM ... rename ..._tmp_...` | 先完全退出 Harness，再从外部 PowerShell 安装；仍失败时按上面的 Windows 恢复步骤备份该插件目录后重试。 |
| 更新时显示 **检查或安装失败**，并提示 `Disable Harness HMR and restart...` | 可在 **插件**页卸载 WispOps，再点击 **＋ 添加插件**，输入 `https://github.com/wisp-science/WispOps` 重新安装，完成后重启 Harness。 |
| `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`，提示 `dsh-wisp-ops` 需要执行构建脚本 | 0.5.0 及更早版本从 GitHub 安装时需要在本机构建。0.5.1 起已附带构建产物，不再触发此错误。请确认安装的是最新 GitHub 地址；若仍报错，先卸载旧版再装。 |
| 安装成功，但左侧没有 **服务器运维** | 没有重启 Harness，或插件处于停用状态。到插件页面启用后完全退出并重开。 |
| 下载依赖很慢或超时 | 在 **安装源** 中切换为另一个源后重试。 |
| 无法连接 `github.com` / `codeload.github.com` | 插件本身从 GitHub 下载，需要能访问 GitHub；可先 `git clone` 到本地，再按方式三安装。 |

## 安装后的第一步

可以先在 **任务库** 中选择或自建模板，再添加 **服务器**；两者准备好后点击 **关联服务器**。关联凭据及任务运行时间后，在 **例行任务** 中选择汇报会话并 **启用调度**，对应任务会出现在系统的 **自动化任务** 页面。

也可以不用面板，直接创建 `~/.dsh-wisp-ops/inventory.yml`，参考 [examples/inventory.yml](../examples/inventory.yml)。
