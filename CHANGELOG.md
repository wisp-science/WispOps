# Changelog

## Unreleased

- Fleet overview: the 10/30/90 buttons, which only changed how many saved inspections the matrix showed, are replaced by **Auto inspect** (off, every 5/15/30 minutes or 1/3/6/12/24 hours). While Harness runs, the plugin inspects every server whose newest inspection is older than the interval, read-only without sudo, even with the panel closed; inspections from the panel, `ops_inspect` and tasks count, and a run already in flight is shared. The panel shows the next due time and rereads history every minute while it is on. The interval is per device (`dataDir/auto-inspect.json`) and is not synced; audit rows name the built-in script by its sha256 instead of repeating it. The matrix now always shows the latest 30 inspections.
- Inspections record network status: SSH login latency measured locally before profile loading, inbound and outbound traffic of device-backed interfaces over the one-second sample, established TCP connections and the TCP retransmit share. The matrix shows the latest login latency, trends gain login latency, traffic and connection sparklines, the selected inspection lists its network facts, and `ops_inspect` reports them. New thresholds `loginWarnMs` (3000) and `tcpRetransWarnPct` (5) raise `login-slow` and `tcp-retrans` warnings; 0 disables either.

## 0.12.0 — 2026-10-27

- Add a **Directory space** preset template (`playbook: space`) that finds which folders take the most space. Each run measures directories up to five levels below the scan paths with `du -x` (one filesystem, the 2000 largest of at least 1 MB), stores the scan per server, and reports the largest directories nested with growth since the previous scan. **Space map** on the task card and in server details opens a treemap of the latest scan: blocks sized by usage with the next level drawn inside, click to open a directory and use the path to go back up, free space shown as a hatched block at a mount point, and a list view. Unreadable directories, timeouts and dropped small directories are flagged; scans are read through a new owner-only `spaceUsage` action.
- Fleet overview: the button beside the 10/30/90 range is now **Inspect all**, which inspects every server read-only (four at a time) and shows progress such as "Inspecting 2/4…" and a per-state summary at the end; it previously only reread saved history, so nothing visibly happened. Each finished server updates the matrix immediately.
- "Inspect now" no longer blocks the rest of the panel: inspections bypass the management write queue, run in parallel across servers, and only disable the button of the server being inspected or queued. Repeated requests for one server join the run in flight. The page's Refresh button now also reloads the fleet matrix.

## 0.11.0 — 2026-10-27

- Check scripts: a panel library of owner-reviewed POSIX sh scripts that `playbook: script` tasks run on linked servers with `sh -s`, judged by a small output contract (exit 0/1/2, first stdout line as the summary, optional `WISPOPS-JSON` metrics). Scripts are tested on a server before saving, deny-list checked at save and run time, recorded with their sha256, and proposed by the agent only as drafts through `ops_script_draft`.
- Report modes: a task's `report` chooses who writes the report. `always` keeps the DSH schedule; `problems` and `never` run on a WispOps timer inside the plugin, so a green run records and notifies without any model tokens. `problems` queues a short prompt into the chosen session only when a run found warnings, failures or unreachable servers, and the agent reads the stored evidence with `ops_task mode=last` instead of collecting it again; a closed session keeps the escalation pending. Task cards show the latest verdict and summary, timer issues, and the next timer run.
- Split the task dialog into two steps with a progress header: task details (template, name, requirements, schedule, sudo and notifications) and linking servers, where the server list gets the full dialog width with a summary of the task being linked. A fresh custom task picks servers first because rule generation needs them; Back and Next move between steps and the final step saves.
- Separate npm and GitHub installation instructions in both READMEs and the installation guide; recommend npm, show latest and pinned-version commands, and clarify upgrades and Windows source migration.
- Configure public npm publishing to the official registry, with local pre-publish checks and a tag-triggered GitHub Actions trusted publisher. Publish the same verified archive as the GitHub Release, attach provenance, and send prereleases to `next` instead of `latest`; document first publication and npm account setup.
- Fit the management panel to narrow panes such as the session sidebar: tabs become wrapped pills, toolbar buttons fill their row, and the server list and server details show one at a time with a sticky back link instead of a clipped scrolling list. The server details heading is now translated.

## 0.10.1 — 2026-10-27

- Remove externally configured or WispTerm servers from WispOps without editing their source. Exclusions survive reloads and restarts, sync with a visible import preview, and can be restored from the server toolbar with saved credential links and permissions. Refuse removal while a task names the host or would lose its last target; ssh_config imports remain deletable and can be imported again.
- Set the public npm registry explicitly and add local pre-publish checks; keep package archives under ignored `artifacts/packages/`.
- Document npm installation, manual publication and Windows migration from GitHub, including exiting Harness before replacement and a targeted directory-backup procedure for `EPERM rename`; clarify that the panel updater currently supports GitHub installations only and npm automation still needs enabling.

## 0.10.0 — 2026-10-27

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
