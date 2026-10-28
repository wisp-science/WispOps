[中文](./README.md) · **English**

# WispOps (dsh-wisp-ops)

Multi-host server operations for DeepSeek Harness: server management, an independent encrypted credential vault, per-server recurring tasks, plus inspection, disk diagnosis, security triage and fleet commands. Changes, sudo and destructive actions are authorized host by host; passwords go only to SSH, never to the page or the model. WispTerm is not required.

## Install

Requires DeepSeek Harness `>=0.2.1-rc.3 <0.3.0`. The package is available on npm and can be installed with the Harness CLI:

```bash
dsh plugin --profile desktop add dsh-wisp-ops@0.10.0
```

On Windows, quit Harness completely, including its tray process, before switching from a GitHub installation to npm. Run the command from an external PowerShell window and reopen Harness afterwards. For `EPERM rename`, see the [recovery steps](./docs/install.md#windows-从-github-版切换到-npm-版) (Chinese).

You can also install the GitHub version through the plugin page (this method requires access to GitHub):

1. In Harness open **Plugins** → **＋ Add plugin** and paste `https://github.com/wisp-science/WispOps`.
2. **Install source**: pick the **China mainland mirror** on networks inside China, otherwise the **official npm registry**.
3. Click **Install** and confirm the plugin is enabled.
4. Quit Harness completely and reopen it.

Upgrading: GitHub installations can use **Updates** in the operations panel to check for and install the latest stable Release, or turn on automatic updates. Update npm installations through the Harness plugin manager or CLI; the panel updater currently supports only GitHub sources. Restart Harness afterwards. Local development links are never overwritten. Older versions can be uninstalled and reinstalled; nothing under `~/.dsh-wisp-ops/` is deleted.

Command-line installation, installing from a local checkout and common errors are covered in [docs/install.md](./docs/install.md) (Chinese).

## Getting started

Open **Server operations** in the left sidebar (or **Start** → **Server operations** in a session's right sidebar):

1. **Servers**: add an address, user name and port, or import hosts from `~/.ssh/config` in one step; capabilities are probed as soon as a server is saved. Remove unneeded WispTerm or configured servers from WispOps and restore them from **Removed**, keeping their source configuration intact.
2. **Vault**: create a credential with just a name and a password. Then link it to a server's SSH login and sudo separately in the server details, testing before you save. Key-based login and passwordless sudo need no credential.
3. **Task library**: pick a built-in template or write your own, click **Link servers**, and set what to check and when to run.
4. **Recurring tasks**: choose the session that receives reports, click **Run once** to see the result immediately, or **Enable schedule** to run on time. Harness must stay running; tasks that missed a slot are flagged on their card.
5. **Audit log**: review every remote command the model, the panel or a task ran, with its authorization and result.

You can also write `~/.dsh-wisp-ops/inventory.yml` by hand; see [examples/inventory.yml](./examples/inventory.yml).

## What it does

| Tool | Purpose |
|---|---|
| `ops_inspect` | Inspect load, memory, disks, systemd, GPUs, Slurm, OOM kills and more, with thresholds and a comparison to the previous run |
| `ops_disk` | Disk diagnosis: large directories and files, whether they are held open by processes or jobs, deleted-but-open space, caches of every kind |
| `ops_files` | Recently added files by directory and owner, recognizing sequencing and bioinformatics files and producing a cleanup plan |
| `ops_security` | Attack triage: SSH brute force, suspicious processes and connections, odd accounts, recently changed startup entries |
| `ops_change` | Backup, change, verify and restore on failure for files, new files and directories; rolls out host by host and stops at the first failure |
| `ops_exec` | Fleet commands run concurrently, risk-classified before they run |
| `ops_hosts` / `ops_history` | Capability probes; the audit log, inspection history and disk/memory trends (audit kept by month, inspections by count) |
| `ops_task` | Run a recurring task: the built-in collector plus the task's declared read-only commands, with the previous run for comparison |
| `ops_template_draft` | Submit a check-template draft for you to review and save in the panel; it cannot write the task library, link servers or enable schedules |

Six skills are bundled: disk full, omics storage cleanup, security triage, daily reports, safe changes, and GPU/Slurm. See [docs/features.md](./docs/features.md).

WeCom, DingTalk, Feishu and email-gateway webhooks are supported, with problems-only delivery, delivery only when the result changes, and quiet hours; the panel follows the Harness language. **Device sync** transfers encrypted credentials, task configuration and explicitly selected SSH private keys through Nutstore WebDAV. See [notifications, changes, sync and updates](./docs/operations.en.md).

## Permissions

Every command is classified as read / change / sudo / destructive and settled per host as allow, ask or deny, in the order **host policy > group > default**. By default read-only commands run immediately and everything else asks for approval each time. A server's permissions can be set to allow / ask / deny in its details, granted temporarily with `/ops-allow sudo @gpu 2h`, and revoked with `/ops-revoke all`. The model can neither read nor write the inventory, the data directory or the vault, including reading the key file through a read-only command.

The vault is encrypted with XChaCha20-Poly1305; its key lives in the macOS Keychain, Windows DPAPI or a file with mode `0600`. See [docs/security.md](./docs/security.md) (Chinese).

## Documentation

- [Installation and FAQ](./docs/install.md) (Chinese)
- [Management panel and task library](./docs/panel.md) (Chinese)
- [Features, skills and roadmap](./docs/features.md) (Chinese)
- [Permission model and vault](./docs/security.md) (Chinese)
- [Configuration and YAML tasks](./docs/config.md) (Chinese)
- [Notifications, safe changes, device sync and updates](./docs/operations.en.md)
- [Changelog](./CHANGELOG.md)
- [npm publishing setup and release process](./docs/publishing.md) (Chinese)

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```

`lib/` is tracked in Git so GitHub installations need no build. After changing `src/` or `client/`, run `npm run build` and commit `lib/` with the change. `tests/fixtures/fake-ssh.sh` stands in for remote commands on the local machine.

## Limits

- Targets are treated as GNU/Linux; Windows targets are not supported.
- External notifications carry the collector summary; a `custom` task without `commands` still needs the model to collect evidence, and never pretends to be a finished report.
- Scheduling depends on Harness staying open with the report session loaded; missed slots are not run automatically, the panel only flags likely missed runs (cron schedules are not evaluated).
- Managed changes restore only the listed paths; device sync is a manually triggered snapshot replacement; updates need a restart after installation.

## License

MIT
