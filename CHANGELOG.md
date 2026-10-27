# Changelog

## Unreleased

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
