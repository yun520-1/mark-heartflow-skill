# HeartFlow Repository Structure / 仓库结构导航

This file defines what should remain visible at the repository root and what should be treated as archive material.
The goal is to keep the GitHub home page readable without losing history.

## Keep visible at the root

- `README.md`
- `README.zh.md`
- `SKILL.md`
- `INSTALL_FOR_AI.md`
- `CAPABILITY.md`
- `CORE_IDENTITY.md`
- `CHANGELOG.md`
- `README_LANGS.md`
- `languages/`
- `docs/`
- `internal/`
- `upgrades/`
- `src/`
- `scripts/`
- `tests/`
- `package.json`
- `VERSION`

## Archive candidates

Treat these as archive material unless a current tool explicitly depends on them:

- root-level language mirrors outside `languages/`
- `VERSION.txt`
- `package-lock.json`
- historical upgrade reports
- duplicated README variants
- one-off version snapshots
- generated sync/report JSON files
- legacy install/troubleshooting drafts
- report-style markdown files from older versions

## Repository policy

- keep the current capability spec visible
- keep the current language index visible
- keep historical records, but move them out of the main visual path when possible
- do not delete upgrade history unless the user explicitly asks for deletion
- prefer archival moves over destructive removal

## Next cleanup candidates

The following areas are likely to contain redundant or historical files:

- `docs/`
- `internal/`
- `upgrades/`
- root-level legacy markdown files

This file is only a navigation and cleanup policy note.
