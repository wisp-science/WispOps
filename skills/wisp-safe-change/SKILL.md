---
name: wisp-safe-change
description: Make a change on managed servers (install software, edit configuration, restart services, update packages) with WispOps safely — capture state, back up, apply, verify, and roll back on failure.
---

# Change → verify → roll back

1. **Before**: record state read-only — `systemctl status <svc> --no-pager`, `systemctl is-active`, version (`<prog> --version`, `dpkg -l <pkg>`/`rpm -q`), listening ports, a health check (`curl -fsS localhost:<port>/health`).
2. **Plan managed file changes** with `ops_change`: supply one host, every existing regular file in `files`, the apply `command`, `verify`, a clear `reason`, and `afterRollback` to reload and check the restored service. The tool enforces backups and restoration on failure. For changes outside that scope, **back up** every file you will touch, on the host: `cp -a <file> <file>.bak.$(date +%Y%m%d%H%M%S)`. For directories, `tar -czf /var/backups/<name>-<ts>.tgz <dir>`.
3. **Validate before applying** when a validator exists: `nginx -t`, `sshd -t`, `apachectl configtest`, `visudo -cf`, `named-checkconf`, `promtool check config`, `systemd-analyze verify`.
4. **Apply** with `ops_change` for existing regular files; use `ops_exec` for other explicitly planned operations (sudo=true, a clear reason). Change one host first (canary), then the rest of the group.
5. **Verify**: service active, health check passes, logs clean (`journalctl -u <svc> --since -5min -p warning`), ports listening. For SSH/firewall changes, verify you can still open a new connection before closing anything.
6. **Roll back** if verification fails: restore the backup, restart/reload, verify again, and report what failed with the evidence.
7. **Report**: per host — before/after state, what changed, verification result, where the backup is.

An interrupted connection has an unknown outcome. Inspect before retrying. File restoration cannot undo package installs, databases, new files or other unlisted side effects.
