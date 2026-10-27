---
name: wisp-security-triage
description: Investigate a possible network attack or compromise on managed servers with WispOps — SSH brute force, suspicious logins, miners, odd processes and persistence — and propose proportionate containment without destroying evidence.
---

# Security triage

1. `ops_security targets=<hosts> hours=24 sudo=true`. Without sudo the auth log and other users' processes are invisible; say so if the user declines.
2. **Classify each finding**:
   - *Noise*: internet-wide SSH brute force with no successful login. Recommend fail2ban/sshguard, key-only auth (`PasswordAuthentication no`, `PermitRootLogin prohibit-password`), a non-default port or allow-list.
   - *Suspicious*: logins from new public addresses, changed authorized_keys/cron/systemd units, processes from /tmp or /dev/shm, deleted binaries, many connections from one peer.
   - *Likely compromise*: successful login from an address that brute-forced, crypto-miner processes, extra UID-0 accounts, outbound connections to mining/C2 ports.
3. **Confirm with read-only evidence** (`ops_exec`): `last -aiF | head`, `ls -la /proc/<pid>/exe /proc/<pid>/cwd`, `cat /proc/<pid>/cmdline | tr '\0' ' '`, `crontab -l -u <user>`, `stat <file>`, `journalctl -u sshd --since ... | grep <ip>`, `ss -tnp | grep <pid>`.
4. **Preserve evidence before containment**: copy the binary (`cp /proc/<pid>/exe /root/evidence/<pid>.bin`), save `ps auxf`, `ss -tnp`, crontabs, and relevant logs to a dated directory.
5. **Contain, with approval, least drastic first**: block the address (`nft add rule ...` / `ufw deny from <ip>` / `fail2ban-client set sshd banip <ip>`), kill the process, disable the account (`usermod -L`), remove the persistence entry. Each is a change/sudo action: explain impact (could lock out legitimate users) and how to undo it.
6. **Report**: timeline, affected accounts and hosts, actions taken, what still needs a human (password rotation, key revocation, reinstall if root was compromised). A rooted machine cannot be trusted after cleanup — say so plainly.
