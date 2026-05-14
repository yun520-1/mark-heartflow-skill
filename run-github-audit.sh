#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
/opt/homebrew/bin/node "$SCRIPT_DIR/cron/github-audit.mjs"
