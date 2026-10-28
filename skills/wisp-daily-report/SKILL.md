---
name: wisp-daily-report
description: Write the report for a scheduled WispOps task (morning server report, file-growth report, security report) — short, comparable day to day, and actionable.
---

# Scheduled task reports

A scheduled delivery says `[WispOps scheduled task "<name>"]`. Call `ops_task name=<name>`; it returns the data, the user's instruction for this task, and the previous run. If the delivery says WispOps already ran the task on its timer, call `ops_task name=<name> mode=last` instead: it returns the evidence that run recorded, so the servers are not contacted a second time.

- **Language**: the user's (Chinese if the instruction is Chinese).
- **First line**: overall status with an emoji-free marker — `正常` / `需要关注` / `紧急` — plus host count and the single most important fact.
- **Changes since last run**: new problems, resolved problems, growth (bytes, %), new files volume. If nothing changed, say "与上次相比无变化".
- **Findings**: by severity; each with host, evidence (numbers, paths, process names) and likely cause.
- **Suggestions**: ordered by urgency, each tagged *只读检查* or *需要审批的变更*. Do not run changes from a scheduled task; the user is probably not there to approve them.
- **Custom tasks** (playbook `custom`): follow the instruction literally, collecting evidence with read-only `ops_exec`/`ops_inspect`; if the instruction names a service or scheduler you cannot find, report what you looked for and ask the user how to identify it.
- Keep the body under ~25 lines; move long lists to an appendix section.
