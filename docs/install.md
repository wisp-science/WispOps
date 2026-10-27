# 安装与常见问题

[← 返回 README](../README.md)

要求：DeepSeek Harness `0.2.1-rc.3` 及以上、`0.3.0` 以下；本机能访问 GitHub。**不需要** npm 上发布的包，**不需要** WispTerm，也**不需要**在本机构建（仓库已附带构建好的 `lib/`）。

## 方式一：在 Harness 插件页面安装（推荐）

1. 打开 DeepSeek Harness，点击左侧 **插件**。
2. 点击右上角 **＋ 添加插件**，在弹窗输入框中粘贴 GitHub 仓库地址：

   ```text
   https://github.com/wisp-science/WispOps
   ```

   只填这个地址。不要填 npm 包名，也不要把 npm 镜像地址填进这个输入框。
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

## 升级到新版本

新版可在运维面板的 **版本更新** 中检查稳定 Release、安装或开启自动更新，见[更新说明](./operations.md#检查更新与自动更新)。对于旧版或不支持原位更新的环境，仍可重装：

1. 在 **插件** 页面找到 WispOps，点击 **卸载**。之前从本地目录安装过的（`link:` 方式），同样要先卸载。
2. 按上面的方式一重新粘贴 GitHub 地址并安装。
3. 重启 Harness。

服务器清单、密码库和例行任务默认保存在 `~/.dsh-wisp-ops/`，卸载重装不会删除这个目录。

## 方式二：命令行安装

```bash
dsh plugin --profile desktop add github:wisp-science/WispOps
```

`desktop` 是桌面版的默认 profile；Web 版通常是 `web`。安装后重启 Harness。

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
| 更新时显示 **检查或安装失败**，并提示 `Disable Harness HMR and restart...` | 可在 **插件**页卸载 WispOps，再点击 **＋ 添加插件**，输入 `https://github.com/wisp-science/WispOps` 重新安装，完成后重启 Harness。 |
| `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`，提示 `dsh-wisp-ops` 需要执行构建脚本 | 0.5.0 及更早版本从 GitHub 安装时需要在本机构建。0.5.1 起已附带构建产物，不再触发此错误。请确认安装的是最新 GitHub 地址；若仍报错，先卸载旧版再装。 |
| 安装成功，但左侧没有 **服务器运维** | 没有重启 Harness，或插件处于停用状态。到插件页面启用后完全退出并重开。 |
| 下载依赖很慢或超时 | 在 **安装源** 中切换为另一个源后重试。 |
| 无法连接 `github.com` / `codeload.github.com` | 插件本身从 GitHub 下载，需要能访问 GitHub；可先 `git clone` 到本地，再按方式三安装。 |

## 安装后的第一步

可以先在 **任务库** 中选择或自建模板，再添加 **服务器**；两者准备好后点击 **关联服务器**。关联凭据及任务运行时间后，在 **例行任务** 中选择汇报会话并 **启用调度**，对应任务会出现在系统的 **自动化任务** 页面。

也可以不用面板，直接创建 `~/.dsh-wisp-ops/inventory.yml`，参考 [examples/inventory.yml](../examples/inventory.yml)。
