# 发布到 npm

[← 返回 README](../README.md)

包名是 `dsh-wisp-ops`，发布到 `https://registry.npmjs.org/`，访问级别为 `public`。发布包包含预构建的 `lib/`、语言文件、技能、文档和插件配置；安装者不需要编译。

## 当前发布状态

[0.10.0 已发布到 npm](https://www.npmjs.com/package/dsh-wisp-ops/v/0.10.0)，`latest` 指向 `0.10.0`，使用的是同版本 GitHub Release 的归档。无需再次执行首次发布。

当前仓库的 `.github/workflows/release.yml` 在推送 `v*` 标签后检查类型、测试和构建产物，再创建 GitHub Release；**npm 自动发布尚未启用**。后续需提交 npm 发布任务并在 npm 绑定可信发布者，才能通过标签自动发布到两个平台。

检查线上版本：

```bash
npm view dsh-wisp-ops version dist-tags --registry=https://registry.npmjs.org
```

## 后续手动发版

需要有权发布该包的 npm 账号，并完成 npm 要求的交互登录和双重验证。使用支持当前登录流程的 npm CLI；在交互终端中发布，按提示在浏览器使用安全密钥验证。

下面以 `0.10.1` 为例；如果该版本已存在，改用下一个未发布版本：

1. 更新 `package.json` 和 `package-lock.json`：

   ```bash
   npm version 0.10.1 --no-git-tag-version
   ```

2. 将 `CHANGELOG.md` 的 Unreleased 内容移到 `## 0.10.1 — YYYY-MM-DD`，填写实际发版日期，保留空的 Unreleased 节。
3. 安装依赖并完成检查：

   ```bash
   npm ci
   npm run typecheck
   npm test
   npm run build
   npm pack --dry-run --ignore-scripts
   ```

4. 审查并提交版本、源码、文档及全部 `lib/` 变化（含新增和删除），再运行 `npm run check:generated`，确认构建与已提交文件一致。
5. 创建标签并推送提交和该标签：

   ```bash
   git tag v0.10.1
   git push origin main
   git push origin v0.10.1
   ```

6. 在 GitHub Actions 的 **Release** 中确认任务成功，再下载该次 Release 的归档并发布同一份包：

   ```bash
   mkdir -p artifacts/packages
   gh release download v0.10.1 --repo wisp-science/WispOps \
     --pattern dsh-wisp-ops-0.10.1.tgz --dir artifacts/packages --clobber
   npm login --registry=https://registry.npmjs.org
   npm whoami --registry=https://registry.npmjs.org
   npm publish ./artifacts/packages/dsh-wisp-ops-0.10.1.tgz \
     --ignore-scripts --access public --tag latest --registry=https://registry.npmjs.org
   ```

   已登录且凭据有效时，可以跳过 `npm login`。这里直接发布已经检查过的 Release 归档，因此跳过构建脚本；本地发布不加 `--provenance`。

稳定版使用 `latest`。带 `-rc`、`-beta` 等后缀的预发布版必须使用 `--tag next`，并将命令中的版本号替换为完整的预发布版本。

## 确认发布结果

以注册表中的实际版本为准：

```bash
npm view dsh-wisp-ops@0.10.1 version dist-tags dist.integrity --json \
  --prefer-online --registry=https://registry.npmjs.org
```

确认版本、对应的 dist-tag 和归档完整性一致。网站显示可能滞后，可以打开具体版本页面。首次发布时若暂时显示 `0.0.0-stage` 占位版本，先检查 **Staged Packages** 和注册表状态；确有待审核项时，审核后完成 npm 要求的验证。

如果收到“不能覆盖已发布版本”，先查询该版本，不要立即换版本号重发。已经发布的包名与版本号组合不可覆盖，即使删除也不能复用，参见 [npm publish 文档](https://docs.npmjs.com/cli/v11/commands/npm-publish/)。

## 启用 GitHub 可信发布

先在 `.github/workflows/release.yml` 加入 npm 发布任务并提交到 GitHub：在检查和构建成功后，发布与 GitHub Release 相同的归档；npm 任务使用 GitHub 托管 runner、支持 OIDC 的 npm CLI，以及 `contents: read` 和 `id-token: write` 权限。稳定版与预发布版分别传入 `--tag latest` 和 `--tag next`。

再由 npm 包维护者在 **Settings → Trusted publishing** 中选择 **GitHub Actions**，绑定以下内容：

| 字段 | 填写内容 |
|---|---|
| Organization or user | `wisp-science` |
| Repository | `WispOps` |
| Workflow filename | `release.yml`，只填文件名 |
| Environment name | 未使用 GitHub environment 时留空 |
| Allowed actions | 启用 **Allow npm publish**，允许直接发布 |

这些值区分大小写。OIDC 不需要配置 `NPM_TOKEN` 或 `NODE_AUTH_TOKEN` secret；提交工作流本身不会创建 npm 账号侧的绑定。规则见 [npm Trusted publishing 官方文档](https://docs.npmjs.com/trusted-publishers/)。

配置生效后，推送版本标签即可触发检查和发布，通常无需每次到浏览器进行手动发布验证。此时跳过上面手动上传 npm 的步骤，避免对同一版本重复发布。

## 只更新文档

文档修订可以直接提交并推送到 `main`，保留当前版本号和已有标签，不创建新 Release，也不执行 `npm publish`。GitHub 文档会更新，已经发布的 npm 归档仍保持原样。

## 本地打包

需要保存本地包时使用：

```bash
mkdir -p artifacts/packages
npm pack --pack-destination artifacts/packages
```

本地归档统一放在 `artifacts/packages/`，`.tgz` 文件已被 Git 忽略。`--ignore-scripts` 仅用于发布已经检查过的归档，不能代替发版检查。
