# Changelog

## Unreleased

- Make the credential dialog's password section clearer: a show/hide toggle, a list of the selected servers and accounts the password will be used for, a warning when those servers log in as different users, a combined note for servers switching from SSH keys to the password, and a hint that the username field is a note only.

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
