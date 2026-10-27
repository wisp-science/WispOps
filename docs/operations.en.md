# Notifications, safe changes, sync and updates

[中文](./operations.md) · [README](../README.en.md)

## Notifications

Declare channels in the plugin configuration. Keep webhook URLs and signing secrets in the environment inherited by Harness:

```yaml
notifications:
  team: { kind: wecom, urlEnv: WISPOPS_WECOM_URL }
  ding: { kind: dingtalk, urlEnv: WISPOPS_DING_URL, secretEnv: WISPOPS_DING_SECRET }
  feishu: { kind: feishu, urlEnv: WISPOPS_FEISHU_URL, secretEnv: WISPOPS_FEISHU_SECRET }
  email: { kind: webhook, urlEnv: WISPOPS_EMAIL_GATEWAY_URL, secretEnv: WISPOPS_EMAIL_GATEWAY_TOKEN }
```

Choose channels in the task form or set `notify: [team, email]` and `notifyOnlyProblems: true` on a YAML task. Problems-only mode sends warnings, critical findings, unreachable hosts and incomplete collection. Without that flag, every run is sent. Generic webhooks receive `{"title":"WispOps","markdown":"…"}` and an optional Bearer token from `secretEnv`; use an email gateway for email delivery. SMTP is not built in.

Delivery follows durable task recording. Messages contain a bounded collector summary, before the model writes its final report. Custom tasks still require agent collection and are explicitly marked incomplete. Requests require HTTPS, reject redirects, expire after 10 seconds and are not retried automatically. Delivery failures do not discard the inspection. The latest 90 delivery results are recorded under `dataDir/notifications/`. URLs, signatures and provider response bodies are not included in results. Configuring delivery authorizes disclosure of host names, paths and diagnostic summaries to that destination.

Provider references: [WeCom](https://developer.work.weixin.qq.com/document/path/91770), [DingTalk](https://open.dingtalk.com/document/robots/custom-robot-access), [Feishu](https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot).

## Managed changes

`ops_change` runs backup → apply → verify → restore on failure as one remote shell transaction per host. With a selector it rolls out host by host in inventory order and stops at the first host that does not verify; the remaining hosts are reported as skipped. Every path the command can touch must be listed, up to 30 per kind: `files` (existing regular files, copied with `cp -a`, restored atomically), `newFiles` (must not exist yet, deleted on failure) and `directories` (existing directories, archived with `tar`, replaced from the archive on failure). Symlinks are refused. `command`, `verify`, `reason` are required; `afterRollback`, `sudo` and a per-stage `timeoutMs` are optional.

The approval contains the complete plan with all hosts and paths. Every script is risk-classified and checked against deployment denials; vouchers, host policies and grants still apply. The approved plan is audited, and each host's outcome is recorded in `dataDir/changes/<host>.jsonl`. Outcomes are verified, rolled-back, rollback-failed, refused (a precondition or backup failed before anything changed) and unknown (connection lost).

Targets need GNU `timeout`, and `tar` when directories are listed; the default is 15 seconds per stage, with recovery time reserved within the total limit. Only one managed change runs on a host at a time; start with one canary host before a group. A stopped rollout does not resume by itself.

Backups stay under `change.backupRoot` (default `/var/tmp`) as `wispops-change.*` on each host, with a `manifest` of paths. `change.backupRetentionDays` (default 14; 0 keeps them forever) sets the retention: at the start of each `ops_change` the host's expired backup directories are pruned with `find -mtime` before the new backup is taken, so nothing is deleted while no change runs. `ops_history kind=changes` lists recorded changes per host with their paths, outcome, backup directory and whether it is still within retention.

This workflow does not reverse package installs, database writes or unlisted side effects. Connection loss, SIGKILL, power loss or detached processes can leave an unknown outcome: inspect before retrying, and avoid concurrent external edits.

## Audit and trends

New audit files live in `dataDir/audit/YYYY-MM.jsonl`, partitioned by UTC month. Legacy `audit.jsonl` remains queryable without migration. Queries scan backwards in fixed-size chunks and stop at the requested limit; month names skip irrelevant partitions. Old partitions are not automatically deleted.

`ops_history kind="trends" targets="web-01" limit=10` shows disk usage and available-memory percentage sequences and percentage-point changes. Failed inspections are excluded from trends rather than treated as zeros. This is text output, not an interactive chart.

Disk and recent-file diagnostics now recognize Slurm, PBS and LSF job directories. PBS uses `qstat -f` but filters out the full job environment before returning data. LSF prefers `exec_cwd`, falling back to `sub_cwd`. Each scheduler is limited to 500 visible jobs; missing commands, permissions and scheduler failures may hide active work. Absence of a job match is not proof that a file can be removed.

## Encrypted WebDAV device sync

Open **Server operations → Device sync**. Create an application password using the [Nutstore instructions](https://help.jianguoyun.com/?p=2064). Enter your account email, application password and a collection URL, normally `https://dav.jianguoyun.com/dav/WispOps/`. Other HTTPS WebDAV services supporting MKCOL, PROPFIND, GET and PUT can also be used.

1. On device A, enter an independent sync passphrase of at least 12 characters and upload a new encrypted snapshot.
2. On device B, enter the same connection details and passphrase, then list cloud snapshots.
3. Select a version and preview the import. Review names, counts, duplicate credential names, credentials enabled for automation, sudo tasks and host policy overrides.
4. Stop local WispOps schedules, then confirm replacement. Enable schedules explicitly afterwards.

Snapshots contain the entire independent vault, including credentials disabled for automation, panel-managed servers and bindings, tasks and custom templates. Bindings also apply to matching servers from YAML or WispTerm and are listed in the preview. They exclude YAML files, notification environment variables, SSH config, WispTerm, grants, audit logs, DSH sessions and live schedules. Import replaces local state rather than merging it; changes since preview are rejected.

Explicitly opt in to include SSH private keys referenced by panel-managed hosts' `identityFile` fields. Enter an explicit path when adding a server. Default SSH identities are never scanned. Imported keys are written privately under `dataDir/ssh-keys/`, and the hosts' paths are remapped. YAML-owned hosts and keys need separate configuration.

Snapshots use a random salt, fixed scrypt parameters (N=32768, r=8, p=1) and XChaCha20-Poly1305. Only ciphertext reaches WebDAV. OS vault keys never leave the device; credentials are re-encrypted under the destination device's own key. The application password and sync passphrase are not persisted. Losing the sync passphrase makes cloud snapshots unrecoverable.

Every upload has a unique filename, preserving other devices' versions. Before import, the previous local state is encrypted under the same passphrase in `dataDir/sync-backups/`. To recover, upload that file to the WebDAV collection under its original filename, then preview and import it. Multi-file writes recover from ordinary write failures but are not crash-atomic; inspect credentials and bindings after a process interruption. Sync is manually triggered snapshot transfer, not background bidirectional merging.

## Updates

Open **Updates** and select **Check for updates**. WispOps checks only the latest stable GitHub Release in the official `wisp-science/WispOps` repository, verifies its tag and package manifest and installs an exact commit SHA. No stable release is reported distinctly from a network failure. Development branch commits are never automatically installed.

Install a verified update manually, or enable automatic stable updates. Automatic updates default off, check about every six hours while Harness runs and wait for a user restart after installation. Installation uses the Harness plugin manager, retaining its compatibility checks, dependency-script approval and failure behavior. WispOps never approves install scripts or restarts Harness automatically.

Only official GitHub installations can update here. Local links, development checkouts and other sources are preserved. Disable HMR and restart first: the host installer refuses in-place replacement of an active Git plugin with HMR enabled. Without the plugin manager, checks still work but installation requires the Plugins page. See the [Harness plugin-manager contract](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/boot/plugin-manager).

If **Update check or installation failed** includes `Disable Harness HMR and restart before updating this GitHub plugin`, you can also uninstall WispOps from Harness's **Plugins** page, select **Add plugin**, enter `https://github.com/wisp-science/WispOps` to reinstall, and restart Harness.

Maintainers update package/lockfile versions and CHANGELOG, build and commit `lib/`, then push a matching `v<version>` tag. The release workflow verifies types, tests and generated files, then creates a GitHub Release with the package archive. It does not publish to npm. Regular CI performs the same checks and detects obsolete generated files through a clean build.
