# HeartFlow Repository Structure / 仓库结构导航

## Canonical root

`~/.hermes/skills/ai/heartflow/` is the canonical HeartFlow root for Hermes.
Do not treat legacy copies under `.agents/` or marketplace staging folders as the source of truth.

## Primary entry files

| File | Role |
|---|---|
| `SKILL.md` | Main machine-readable skill specification |
| `README.md` | GitHub / human-facing introduction |
| `CORE_IDENTITY.md` | HeartFlow identity anchor and seven directives |
| `AGENTS.md` | Local agent operating context |
| `VERSION` | Current public version |
| `CHANGELOG.md` | Historical upgrade record |
| `INSTALL_FOR_AI.md` | Installation and adoption notes |
| `languages/README_LANGS.md` | Language entry map |

## Core code areas

| Path | Role |
|---|---|
| `src/core/heartflow-engine.js` | Main HeartFlow engine entry |
| `src/core/identity-engine.js` | Identity, memory stream, reflection, self-reflection loop |
| `src/core/decision-verifier.js` | Decision verification |
| `src/core/execution-verifier.js` | Execution verification |
| `src/core/self-healing.js` | Self-healing / recovery logic |
| `src/core/stability-guard.js` | Stability guard |
| `src/core/skill-governance-integrator.js` | v11.9.4 core identity recall / skill governance / evidence ledger |

## Historical records

Historical upgrade notes, reports, and archived experiments should be preserved unless they contain secrets or are confirmed duplicate junk.
Prefer archiving or indexing over deletion.

## Compatibility / archive notes

- Historical duplicates may exist in `internal/archive/` or sibling legacy roots.
- Prefer canonical files under this root.
- Do not load duplicate same-name launch assets unless a compatibility path is explicitly required.
- Before deleting old files, search references and confirm they are not used by the startup chain, code map, reports, or documentation.

## Current version

Current public version: `v11.9.4`.
