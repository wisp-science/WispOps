import { describe, expect, it } from 'vitest'
import { classifyCommand } from '../src/risk.ts'

const level = (command: string) => classifyCommand(command).level

describe('classifyCommand', () => {
  it.each([
    'df -h',
    'du -xh -d1 /var 2>/dev/null | sort -rh | head -20',
    'journalctl -u nginx --since "1 hour ago" --no-pager | tail -n 50',
    'systemctl status nginx',
    'systemctl --failed',
    'ps aux --sort=-%mem | head',
    'nvidia-smi --query-gpu=index,utilization.gpu --format=csv',
    'docker ps -a',
    'docker system df',
    'find /var/log -type f -size +100M -mtime -1',
    'sinfo -N; squeue -u alice',
    'cat /etc/os-release && uname -a',
    'lsof +L1 2>&1 | head',
    'grep -c error /var/log/syslog',
    'timeout 10 du -sh /home/*',
    'awk \'{print $1}\' /proc/loadavg',
    'curl -s http://localhost:8080/health',
    'for f in /var/log/*.log; do wc -l "$f"; done',
    'command -v nvidia-smi',
  ])('read: %s', command => {
    expect(level(command)).toBe('read')
  })

  it.each([
    'systemctl restart nginx',
    'apt-get install -y htop',
    'echo "vm.swappiness=10" > /etc/sysctl.d/99.conf',
    'sed -i s/foo/bar/ /etc/app.conf',
    'kill 1234',
    'docker restart web',
    'mv /var/log/big.log /data/',
    'some-unknown-tool --flag',
    'find /tmp -name x -exec chmod 600 {} +',
    'awk \'{print > "out.txt"}\' in',
    'curl -o /tmp/x http://example.com/x',
    'sh -c "ls"',
    'tee /etc/motd',
    'scontrol update nodename=n1 state=resume',
    'sysctl -w vm.drop_caches=3',
  ])('change: %s', command => {
    expect(level(command)).toBe('change')
  })

  it.each([
    'rm -rf /data/tmp/*',
    'find /var/log -name "*.gz" -mtime +30 -delete',
    'find . -type f -exec rm {} \\;',
    'ls *.log | xargs rm',
    'journalctl --vacuum-size=500M',
    'docker image prune -a',
    'docker system prune',
    'reboot',
    'sudo shutdown -h now',
    'dd if=/dev/zero of=/dev/sdb bs=1M',
    'mkfs.ext4 /dev/sdb1',
    'truncate -s 0 /var/log/huge.log',
    'apt-get autoremove -y',
    'python3 -c "import shutil; shutil.rmtree(\'/data/x\')"',
    'bash -c \'rm -f /tmp/a\'',
    'git reset --hard HEAD~1',
    ': > /var/log/syslog',
    '> /var/log/nginx/access.log',
    'cat /dev/null > /var/log/syslog',
    'cp /dev/null /var/log/auth.log',
    'rsync -a --delete /src/ /dst/',
    'tar --remove-files -cf /backup/a.tar /data/a',
    'mv /data/project /tmp/',
    'pkill -9 -f python',
    'killall java',
    'kill -9 1234',
    'chmod -R 000 /data/shared',
    'chown -R alice:alice /home/alice',
  ])('destructive: %s', command => {
    expect(level(command)).toBe('destructive')
  })

  it('flags privilege escalation', () => {
    expect(classifyCommand('sudo du -sh /root').elevates).toBe(true)
    expect(classifyCommand('sudo du -sh /root').level).toBe('read')
    expect(classifyCommand('sudo -u postgres psql').elevates).toBe(true)
    expect(classifyCommand('su -').level).toBe('change')
    expect(classifyCommand('df -h').elevates).toBe(false)
  })

  it('keeps ordinary writes at change rather than destructive', () => {
    for (const command of ['grep error log > /tmp/out.txt', 'echo "x" > /etc/motd', 'mv /var/log/big.log /data/', 'kill 1234', 'chmod 600 /etc/app.conf', 'rsync -a /src/ /dst/', 'tar -cf a.tar dir']) {
      expect(classifyCommand(command).level, command).toBe('change')
    }
    expect(classifyCommand('cmd 2>/dev/null | head').level).toBe('change')
    expect(classifyCommand('du -sh /data 2>/dev/null').level).toBe('read')
  })

  it('accepts deployment-configured read programs', () => {
    expect(classifyCommand('ncdu -o- /', new Set(['ncdu'])).level).toBe('read')
  })
})
