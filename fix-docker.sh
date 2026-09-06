#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this script with sudo: sudo ./fix-docker.sh" >&2
  exit 1
fi

target_user=${SUDO_USER:-}
if [[ -z ${target_user} || ${target_user} == root ]]; then
  echo "SUDO_USER is unavailable; run this as your normal user with sudo." >&2
  exit 1
fi

if ! id "${target_user}" >/dev/null 2>&1; then
  echo "User does not exist: ${target_user}" >&2
  exit 1
fi

if ! getent group docker >/dev/null 2>&1; then
  groupadd --system docker
fi
usermod --append --groups docker "${target_user}"

if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files docker.socket >/dev/null 2>&1; then
  install -d -m 0755 /etc/systemd/system/docker.socket.d
  install -m 0644 /dev/stdin /etc/systemd/system/docker.socket.d/override.conf <<'EOF'
[Socket]
SocketGroup=docker
SocketMode=0660
EOF
  systemctl daemon-reload
  systemctl restart docker.socket
fi

if [[ -S /var/run/docker.sock ]]; then
  chown root:docker /var/run/docker.sock
  chmod 0660 /var/run/docker.sock
else
  echo "Docker socket was not created; start Docker, then rerun this script." >&2
  exit 1
fi

echo "Docker socket permissions repaired for ${target_user}."
echo "Open a new login shell (or run: newgrp docker), then verify with: docker info"
