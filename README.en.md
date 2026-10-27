[中文](./README.md) · **English**

# WispOps (dsh-wisp-ops)

Multi-host server operations for DeepSeek Harness, with a Desktop/Web management panel, an independent encrypted credential vault, and recurring tasks linked to servers. It also covers fleet inspection, disk diagnosis, security triage, and commands over OpenSSH. Change, sudo, and destructive actions are authorized per host. WispTerm is optional; passwords are passed directly to SSH and never returned to the page or model.

## Management panel (0.2)

After upgrading, rebuild and restart Harness. Open **服务器运维** (Server operations) from the right sidebar’s Start page to manage servers beside the conversation. The left sidebar and WispOps plugin details also open the full panel. Recurring tasks opened in the right sidebar default to the current conversation for reports.

- **Servers:** view the inventory, add hosts and inspect credentials and tasks. Create credentials directly from the SSH or sudo row with the host and purpose preselected, or associate existing entries through Manage bindings.
- **Vault:** select one or more servers and SSH / sudo purposes when creating a credential; saving also applies those associations. Cards show each host and purpose and can be searched by host. Editing can change associations while preserving the password when left blank. New SSH associations switch the host to password authentication; the form previews replacements and authentication changes. Sudo-only associations preserve SSH authentication and permissions. Usernames are metadata; connections use the host configuration. A credential cannot be deleted while a server references it.
- **Recurring tasks:** select one or several servers, choose a playbook, report instruction, schedule and timezone, then save. Select the receiving session and enable scheduling. The task also appears in Harness's native Automation tasks page. Stop scheduling before editing or deleting a task.

Panel data is stored atomically in `dataDir/managed.json`; the existing YAML and its comments remain intact. YAML tasks remain editable in their source. Panel tasks bind exact host names, and duplicate enable requests do not create duplicate schedules within one session. Without the Schedule service, definitions can still be saved and run through `/ops-run`. Harness must remain running for delivery. Management endpoints are owner-only and are not model tools. Combined credential and association saves validate both file revisions and restore the previous encrypted entry if the association write fails. The two file replacements are not crash-atomic; refresh and check associations if the process stops between them.

The panel uses a compact overview and adapts to its pane width: a single column in the sidebar and two columns in a wide panel. Task cards group the playbook, hosts, schedule and actions, with expandable inspection rules.

## Automatic inspection rules (0.3)

In the task editor, select hosts and a playbook, then click **自动生成巡查规则** (Generate inspection rules). The local rule generator fills a unique name, title, reporting instructions and a daily 08:30 schedule in the configured timezone. It uses stored capability probes, the latest successful inspection and configured thresholds, adding GPU, scheduler and container checks only when observed. Missing or stale observations are disclosed. Existing task identities and schedules are preserved when regenerating.

Generation uses cached records by default. An optional read-only SSH probe refreshes capabilities; failures return a draft with warnings. New-file scans use confirmed shared data mounts or fall back to `/var/log`. Drafts do not save, schedule or authorize sudo automatically. This generation step does not call an LLM; Harness still writes the report when a task runs.

## Tools and commands

| Model tool | Purpose |
|---|---|
| `ops_hosts` | Inventory, policy, grants, login blocks; `probe=true` detects OS, GPUs, scheduler, privilege, docker |
| `ops_inspect` | Read-only fleet inspection: load, CPU, memory, disks, inodes, failed units, top processes, GPUs, Slurm, OOM and kernel errors, NTP, pending reboot. Thresholds produce findings, and growth is compared with the previous run |
| `ops_disk` | Disk-full diagnosis: largest directories and their growth, large and recently grown files, open-file holders, files in running Slurm job directories, deleted-but-open space, common caches. A second run on the same path verifies a cleanup |
| `ops_exec` | Fleet command with risk classification (read / change / destructive, plus sudo); identical output is folded |
| `ops_files` | Recent-file analysis with sequencing/bioinformatics knowledge. It covers raw data, alignments, variants, pipeline work directories, intermediates and caches. It also finds files superseded by a sibling and judges whether pipeline runs finished, then builds a cleanup plan that excludes open files and running jobs |
| `ops_security` | Security triage: SSH brute force and logins, floods, listening services, miners, suspicious executables, mining/C2 outbound connections, persistence changes |
| `ops_task` | Run a predefined per-server task (playbook `inspect`, `disk`, `new-files`, `security`, or `custom`) and get its data, the user's instruction, and the previous run |
| `ops_history` | Operation audit log and inspection history |

The model cannot invoke these human-only commands:

| Command | Purpose |
|---|---|
| `/ops-allow <change\|sudo\|destructive\|all> <selector> [30m]` | Grant a capability on hosts for a limited time |
| `/ops-revoke [id\|all]` | Revoke grants |
| `/ops-grants` | Show active grants and paused logins |
| `/ops-unblock <host\|all>` | Resume logins to a host paused after an authentication failure |
| `/ops-inspect [selector]` | Run an inspection without the model |
| `/ops-tasks`, `/ops-schedule <task\|all>`, `/ops-unschedule`, `/ops-run <task>` | Per-server tasks. Scheduling goes through the DSH Schedule service (Web profile); a due task wakes the session and the agent writes the report |

## Permission model

Capabilities and their defaults: `read` is always allowed; `change`, `sudo`, and `destructive` default to `ask`.

Precedence is host policy, then the strictest of the host's groups, then `defaultPolicy`. A `deny` is absolute: neither approvals nor grants override it.

Without a grant, an `ask` goes through the DSH approval UI for that one call. The prompt shows the hosts, the capabilities needed, the command, and the model's stated reason.

Invariants:
- Every tool call needs a single-use voucher issued by the gate. If the gate did not run, nothing executes.
- Deny-listed commands are refused by a monotonic `ctx.tools.guard`.
- A local `bash` call that runs `ssh`/`scp`/`rsync` to an inventory host is refused, and local `sudo` asks.
- After an authentication failure, logins to that host pause for 15 minutes, so retries do not look like brute force.

## Passwords

The default `secrets.provider: local` uses WispOps's own `dataDir/vault.json`, encrypted with XChaCha20-Poly1305, random nonces and entry names as authenticated data. The key belongs to the independent **WispOps Password Store** macOS Keychain service, Windows user-scoped DPAPI, or an owner-only `vault.key` file on Linux. Data files use mode `0600`, with atomic writes and revision checks. Linux protection depends on filesystem permissions; someone who can read both key and ciphertext can decrypt the vault. Backups and migrations must preserve the corresponding key as well as the encrypted file; macOS keys are associated with the data directory and Windows keys with the original OS user.

Explicit `local:<entry name>` references use this vault regardless of the configured legacy provider. Optional `secrets.provider: wispterm` reads WispTerm's existing store for unprefixed references without writing to it. Entries with automation access disabled are refused. Passwords are never shown in edit forms; leaving the password blank preserves it. Names, usernames and notes are ordinary metadata and must not contain secrets.

Hosts reference entries in two ways:
- `sudoSecret` names the sudo password. The remote side reads the password with `read`, pipes it into `sudo -S -v`, then runs the script through `sudo -n`.
- `auth: password` plus `loginSecret` enables password login through a one-shot askpass (OpenSSH 8.4 or later).

Passwords never appear in SSH process arguments, model tool results, or the operations audit log, and any echo of one is redacted.

## Tasks and skills

Define per-server tasks under `tasks:` in the inventory; see [examples/inventory.yml](./examples/inventory.yml). Each task takes a `daily`, `weekdays`, `cron`, or `everyMinutes` schedule. Setting `sudo: true` on a task pre-authorizes sudo for its read-only collector only.

Six bundled skills ship with the plugin: `wisp-disk-full`, `wisp-omics-cleanup`, `wisp-security-triage`, `wisp-daily-report`, `wisp-safe-change`, and `wisp-hpc-gpu`.

The agent cannot edit the inventory, the data directory, or the WispTerm store, through either file tools or bash.

## Install

```bash
dsh plugin --profile web add github:wisp-science/WispOps
```

Restart Harness and add servers in the management panel, or create `~/.dsh-wisp-ops/inventory.yml`; see [examples/inventory.yml](./examples/inventory.yml). For a local linked installation, run `npm run build` and restart Harness to load the new browser entry. Configuration keys are listed in the Chinese README and in `src/config.ts`.

## Limits

- Target hosts are assumed to be GNU/Linux.
- A timed-out remote command may still be running.
- The management panel currently uses Chinese labels. YAML-owned tasks are edited in YAML. A scheduled task must be stopped before its definition can be edited in the panel.
- A dedicated `ops_change` workflow (backup, change, verify, roll back) is not implemented.

MIT licensed.
