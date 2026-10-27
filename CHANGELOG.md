# Changelog

## Unreleased

- Refuse every tool access to the data directory, inventory file and WispTerm store, not only writes: read-only shell commands such as `cat`, `base64` or `tar` that name them, or `vault.key` / `vault.json`, are denied, and any tool argument pointing into them is denied regardless of the tool's name. On Linux the vault key is a 0600 file the model's own user could read.
- Classify truncation by redirection (`: > file`, `cat /dev/null > file`, `cp /dev/null file`), `rsync --delete`, `tar --remove-files`, moves into `/tmp`, `/var/tmp`, `/dev/shm` or `/dev/null`, `pkill` / `killall`, `kill -9` and recursive `chmod` / `chown` / `chgrp` as destructive instead of change.
- Add `retention`: inspection history keeps `inspectionRecords` rows per host (default 1000) and monthly audit partitions older than `auditMonths` (default 12) are deleted; bounded JSON Lines files are replaced through a rename.
- Tasks and templates can declare read-only `commands` that the built-in collector runs on every target before the report, so a `custom` task no longer depends on the model collecting evidence. Commands are validated as read-only with the `ops_exec` classifier at save and load time, checked against the deny list, and a non-zero exit counts as `commandFailed`. `ops_template_draft` accepts them; `{{key}}` placeholders are inserted as one quoted shell word.
- Notifications gain `notifyOnChange` (deliver only when the problem counts differ from the previous run) and `quietHours` (a local window, possibly across midnight, with no external delivery); both are editable in the task form.
- Show the last run on enabled task cards and flag daily, weekly and interval tasks as "missed run" when the latest slot passed 30 minutes ago with no run recorded; cron schedules are not evaluated.
- Import hosts from `~/.ssh/config` (and its `Include` files; `sshConfigFile` sets the path) through a new owner-only `sshConfigHosts` / `importSshConfigHosts` pair: literal `Host` aliases join the `ssh-config` group and connect through their alias. Adding or importing servers probes them immediately, server details show the probed capabilities with a "Probe now" button (`probeHosts` action).
- Add an **Audit log** tab backed by an owner-only `auditLog` action: the same records `ops_history kind=operations` returns, filtered by server and window, with retention shown.
- Rewrite the English README to mirror the Chinese one.

## 0.9.1 — 2026-10-27

- Use the sudo credential’s username to select its SSH account independently of the normal login account; preserve existing logins when the username matches or is blank, show the account in the panel, and distinguish SSH authentication failures in sudo tests. The account must allow SSH login and have sudo permission.
- Keep password validation and elevated execution under the same parent shell, fixing sudo failures on servers that scope non-TTY credential timestamps to the parent process.

## 0.9.0 — 2026-10-27

- Restyle task authorization and notifications as compact settings rows with accessible switches, selectable channel chips, a clear unconfigured state, and a responsive save footer. Hide notification preferences when no channels are configured and disable them until a channel is selected.
- Keep task linking from server details scoped to that server: remove the server picker, name the server in the dialog, and use it for both rule generation and saving. Task library and recurring-task entry points still support multiple servers.
- Edit and delete servers added in the panel from the server details through new owner-only `editHost` and `deleteHost` actions. The name stays fixed; deleting removes the server's credential links and permission overrides and is refused while a task names the server. YAML and WispTerm servers show where they are managed instead.
- Delete a credential that is still linked to servers: after confirmation, each linked server's SSH login falls back to the SSH key and sudo to no stored password, in the same save as the vault removal.
- Generate a task template in chat: **Generate in chat** in the new-template dialog sends what you have filled in to the current conversation. The agent submits a draft through the new `ops_template_draft` tool, which writes only a review queue (`dataDir/template-drafts.json`). Drafts appear under **Drafts to review** in the task library and reach the library only when you save the prefilled form; the panel picks a new draft up automatically for 15 minutes.
- Show readable ssh errors on Windows: OpenSSH's octal-escaped bytes and messages in the system code page (such as GBK "不知道这样的主机。") are decoded instead of shown as `\262\273…`.
- Keep LF line endings in every checkout through `.gitattributes`, so building on Windows reproduces the tracked `lib/` exactly.

## 0.8.1 — 2026-10-27

- Add a Test button beside Change / Link in each server's SSH login and sudo credential rows, with inline progress and results so saved credentials can be verified without reopening the binding dialog.

## 0.8.0 — 2026-10-27

- Tasks can run once from the panel: a "Run once" button sends the task prompt to the chosen open session immediately through the new owner-only `runTaskNow` action (the same path as `/ops-run`), and the task form offers a "Manual only" frequency that saves a task without a schedule.
- Add two task presets: "长时间运行任务警告" lists processes and scheduler jobs running longer than a threshold and separates normal long jobs from likely-stuck ones; "低内存警告" reports MemAvailable, swap, top memory consumers and recent OOM kills against configurable thresholds.
- Refresh the Updates panel with a version summary card, contextual status messages and actions, an accessible automatic-update switch, and responsive light/dark layouts.
- Restyle Device Sync with separate connection and encryption cards, grouped backup/restore actions, cloud snapshot empty states and a clearer import comparison; adapt both settings pages to narrow panes and dark mode.
- Fleet overview: clicking anywhere in a server row selects it for the trend and findings panel, not only the server name; each row shows the connection address, probed OS and linked task count; "Inspect now" (an owner-only `inspectNow` action) runs a read-only inspection of one server without sudo and records it in the inspection history, so never-inspected servers can be inspected from the panel.
- Edit a server's change / sudo / destructive permissions from the panel: each capability can be set to allow, ask or deny or left inherited; overrides are stored in `managed.json` through a new owner-only `setPolicy` action, apply to same-named YAML or WispTerm hosts, and are listed in sync previews.
- Separate passwords from server bindings in the management panel: the vault form only stores a credential (with a show/hide password toggle and a note-only username hint), and each server's SSH login and sudo rows link, change or clear one vault credential on their own.
- Add an owner-only `testBinding` action and "Test SSH login" / "Test sudo" buttons in the binding dialog that connect with the chosen credential and report the login identity, sudo availability or the failure reason without saving.

## 0.7.1 — 2026-10-27

- Add an uninstall-and-reinstall fallback with the official GitHub URL to update failure messages and installation documentation.

## 0.7.0 — 2026-10-27

- `ops_change` second stage: roll a plan out to a selector host by host and stop at the first host that does not verify; back up new files (deleted on failure) and directories (tar archive, replaced on failure) besides existing files; prune host backups after `change.backupRetentionDays` (default 14) and list recorded changes with their retained backups through `ops_history kind=changes`.
- Add a fleet overview tab to the management panel: an inspection status matrix per server and inline SVG trend lines for disk, memory and CPU, read from stored inspection history through a new owner-only `overview` action.

## 0.6.0 — 2026-10-27

- Add opt-in task notifications for WeCom, DingTalk, Feishu and generic HTTPS webhooks (including email gateways).
- Add `ops_change` for backed-up file changes with verification and automatic restore on failure.
- Add GitHub Actions for types, tests, build, package contents and tracked build consistency.
- Partition new audit logs by UTC month, query logs from the tail, and add `ops_history kind=trends`.
- Translate the management panel through DSH's locale service.
- Protect running PBS and LSF job directories in disk and recent-file diagnostics.
- Add encrypted WebDAV snapshots for cross-device vault, explicit SSH private keys, server and task synchronization.
- Add stable GitHub Release checks and opt-in automatic installation through the Harness plugin manager.
- Add a tag-based release workflow with package archives.

## 0.5.1 — 2026-10-26

- Ship prebuilt `lib/` for GitHub installation without a local build.
- Split the Chinese README into a short landing page and focused documentation.

## 0.5.0 — 2026-10-26

- Add a reusable task library with ten presets and parameterized server associations.
- Document installation through the Harness plugin page.

## 0.4.1 — 2026-10-26

- Make the management panel compact and responsive.

## 0.4.0 — 2026-10-26

- Save credential associations together with credentials.

## 0.3.0 — 2026-10-26

- Generate inspection rules from stored server observations.

## 0.2.1 — 2026-10-26

- Add server management to the conversation's right sidebar.

## 0.2.0 — 2026-10-26

- Add server management, an independent encrypted vault and recurring tasks.

## 0.1.0 — 2026-10-26

- Initial multi-host operations plugin with authorization, inspection, diagnostics and audit history.
