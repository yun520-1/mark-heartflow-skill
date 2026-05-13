#!/bin/bash
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
cd /Users/apple/.hermes/skills/ai/mark-heartflow-skill
node src/core/heartflow.js "$@"
