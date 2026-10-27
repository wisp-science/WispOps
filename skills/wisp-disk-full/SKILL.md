---
name: wisp-disk-full
description: Handle "this server's disk is (almost) full" end to end with WispOps — find where the space went and what grew, decide what is safe to free, get approval, clean up, and verify the space came back.
---

# Disk full on a managed server

1. **Confirm and scope.** `ops_inspect targets=<host>` (or the whole group) shows which mounts are over threshold and how fast they grew since the last inspection. Note inode usage too: a full inode table looks like a full disk.
2. **Diagnose the filesystem.** `ops_disk host=<host> path=<mount> sudo=true` (sudo sees every directory and every process). Read, in this order:
   - *Deleted but still open* — space pinned by processes. Deleting more files will not help; the holder must be restarted/reloaded (`systemctl reload` or `kill -HUP` for loggers) or the fd truncated (`: > /proc/<pid>/fd/<n>`) after confirming.
   - *Large files modified recently* — the growth source. Find the writer (holders column) and why it writes (debug logging? runaway job? core dumps?).
   - *Largest directories* and their growth since the previous diagnosis.
   - *Common reclaimable locations* — journal, package caches, docker, conda/pip.
3. **For data directories** (/data, /home, scratch) also run `ops_files host=<host> paths=<dir> days=7` and follow the `wisp-omics-cleanup` skill for sequencing/analysis files.
4. **Plan.** Present a table: item, size, why it is safe, the exact command, risk (change/destructive/sudo), what you will check before and after. Never include files whose verdict is IN USE or inside a running job directory; for other users' data propose contacting the owner instead of deleting.
5. **Execute** each step with `ops_exec` and a `reason`. Prefer, in order: vacuum/clean commands (`journalctl --vacuum-size=1G`, `apt-get clean`, `conda clean --all -y`), compression, moving to another filesystem, deletion. Delete by explicit path lists, never by broad globs.
6. **Verify.** Run `ops_disk` again on the same path: the report shows "Since previous diagnosis: used −X". Re-run `ops_inspect` to confirm the alert cleared. Report freed space per step and anything left for owners.
7. **Prevent recurrence.** Suggest logrotate rules, journal limits (`SystemMaxUse=` in journald.conf), quotas, or a scheduled `new-files` task.
