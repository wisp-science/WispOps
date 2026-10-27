[中文](./README.md) · **English**

# WispOps (dsh-wisp-ops)

Multi-host server operations for DeepSeek Harness. It covers an inventory with groups, fleet health inspection with thresholds and trends, disk-full diagnosis, and fleet commands over the system OpenSSH client. Change, sudo, and destructive actions are authorized per host: by policy, by a time-boxed human grant, or by a one-shot approval of the exact call. Sudo and login passwords come from the WispTerm Password Store and never reach the model.

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

With `secrets.provider: wispterm`, the plugin reads WispTerm's Password Store read-only:
- Entries are encrypted with XChaCha20-Poly1305.
- The key comes from the macOS Keychain (`WispTerm Password Store` / `vault-key`), from Windows DPAPI, or from `passwords.key` on Linux.
- Entries marked not-for-agents are refused.

Hosts reference entries in two ways:
- `sudoSecret` names the sudo password. The remote side reads the password with `read`, pipes it into `sudo -S -v`, then runs the script through `sudo -n`.
- `auth: password` plus `loginSecret` enables password login through a one-shot askpass (OpenSSH 8.4 or later).

Passwords never appear in arguments, results, or the audit log, and any echo of one is redacted.

## Tasks and skills

Define per-server tasks under `tasks:` in the inventory; see [examples/inventory.yml](./examples/inventory.yml). Each task takes a `daily`, `weekdays`, `cron`, or `everyMinutes` schedule. Setting `sudo: true` on a task pre-authorizes sudo for its read-only collector only.

Six bundled skills ship with the plugin: `wisp-disk-full`, `wisp-omics-cleanup`, `wisp-security-triage`, `wisp-daily-report`, `wisp-safe-change`, and `wisp-hpc-gpu`.

The agent cannot edit the inventory, the data directory, or the WispTerm store, through either file tools or bash.

## Install

```bash
dsh plugin --profile web add github:wisp-science/WispOps
```

Then create `~/.dsh-wisp-ops/inventory.yml`; see [examples/inventory.yml](./examples/inventory.yml). Configuration keys are listed in the Chinese README and in `src/config.ts`.

## Limits

- Target hosts are assumed to be GNU/Linux.
- A timed-out remote command may still be running.
- Not built yet: `ops_change` (backup, change, verify, roll back), scheduled inspections, and a Web fleet panel.

MIT licensed.
