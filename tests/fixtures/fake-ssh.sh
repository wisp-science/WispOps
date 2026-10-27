#!/bin/sh
# Stand-in for OpenSSH: skips options up to `--`, takes the destination, and
# runs the remote command locally. Destinations starting with `down` or
# `locked` simulate an unreachable host and an authentication failure.
if [ "$1" = "-G" ]; then
  printf 'user %s\n' "${FAKE_SSH_USER:-fixture-user}"
  exit 0
fi
while [ $# -gt 0 ]; do
  if [ "$1" = "--" ]; then shift; break; fi
  shift
done
dest=$1; shift
[ -n "$FAKE_SSH_LOG" ] && echo "$dest" >> "$FAKE_SSH_LOG"
case "$dest" in
  down*) echo "ssh: connect to host $dest port 22: Connection refused" >&2; exit 255 ;;
  locked*) echo "alice@$dest: Permission denied (publickey,password)." >&2; exit 255 ;;
esac
PATH="$FAKE_BIN:$PATH"
export PATH FAKE_HOST="$dest"
exec sh -c "$1"
