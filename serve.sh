#!/usr/bin/env bash
set -euo pipefail

if [[ ! -x './bin/caddy' ]]; then
  platform="$(uname -s)"
  variant="$(uname -m)"
  if [[ "$platform" == 'Darwin' ]]; then
    if [[ "$variant" == 'x86_64' ]]; then
      src_url='https://github.com/caddyserver/caddy/releases/download/v2.6.4/caddy_2.6.4_mac_amd64.tar.gz'
    else
      src_url='https://github.com/caddyserver/caddy/releases/download/v2.6.4/caddy_2.6.4_mac_arm64.tar.gz'
    fi
  else
    if [[ "$variant" == 'x86_64' ]]; then
      src_url='https://github.com/caddyserver/caddy/releases/download/v2.6.4/caddy_2.6.4_linux_amd64.tar.gz'
    else
      src_url='https://github.com/caddyserver/caddy/releases/download/v2.6.4/caddy_2.6.4_linux_arm64.tar.gz'
    fi
  fi
  echo "Loading caddy from $src_url"
  mkdir -p bin
  curl --silent --show-error --fail --location --output bin/caddy.tar.gz "$src_url"
  tar -xzf bin/caddy.tar.gz -C bin
  rm bin/caddy.tar.gz
  chmod +x bin/caddy
fi

./bin/caddy run --config Caddyfile
