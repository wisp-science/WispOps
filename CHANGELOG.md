# Changelog

## Unreleased

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
