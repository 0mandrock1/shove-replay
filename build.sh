#!/usr/bin/env bash
# Build the SHOVE replay viewer: refresh upstream, reconstruct frames, deploy.
#
# The upstream game (github.com/robss2020/claude-fable-5-having-fun) carries no
# licence — it is cloned at build time into ./upstream/ (gitignored) and is never
# committed here. frames.json is a derived artefact and is also gitignored.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

UPSTREAM_URL="https://github.com/robss2020/claude-fable-5-having-fun"
DEPLOY="/var/www/html/tools-landing/shove-replay"

echo "==> refreshing upstream clone"
if [ -d upstream/.git ]; then
  git -C upstream fetch --depth 1 origin >/dev/null 2>&1 || true
  git -C upstream reset --hard origin/HEAD >/dev/null 2>&1 || git -C upstream pull --ff-only || true
else
  rm -rf upstream
  git clone --depth 1 "$UPSTREAM_URL" upstream
fi

echo "==> reconstructing frames.json"
python3 replay.py

echo "==> checking i18n coverage"
if command -v node >/dev/null 2>&1; then
  node check-i18n.js
else
  echo "    (node not found — skipping i18n check)"
fi

echo "==> deploying to $DEPLOY"
mkdir -p "$DEPLOY"
cp -f index.html app.js i18n.js style.css frames.json "$DEPLOY/"
chown -R www-data:www-data "$DEPLOY"

echo "==> done. live at https://tools.mandrock.me/shove-replay/"
