# HeartFlow Changelog

All notable changes to HeartFlow will be documented in this file.

## [v0.16.1] - 2026-05-28

### Added
- **Pitfalls chapter** in SKILL.md documenting known limitations
- **References chapter** in SKILL.md with research sources
- **Documentation improvements** on emotion detection and crisis detection limitations

### Changed
- **SKILL.md metadata** updated to v0.16.1
- **Line count claim corrected** from ~3300 to ~1030 lines

### Security
- Code audit completed: 56/56 tests passing
- No critical security issues found

## [v0.16.0] - 2026-05-17

### Added
- **Complete rebuild** of HeartFlow core
- **Three-tier memory system** (CORE/LEARNED/EPHEMERAL)
- **Psychology engine** for intent/emotion/needs/defenses detection
- **Self-evolution loop** based on Reflexion pattern
- **Dream consolidation** for memory optimization
- **Zero npm dependencies** architecture

### Public API
- `start()` / `stop()` lifecycle management
- `healthCheck()` system health
- `analyzePsychology()` psychological perception
- `classify()` broad category classification
- `getMemoryStats()` / `getMindSpace()` introspection
- `dreamNow()` memory consolidation
- `remember()` / `search()` memory operations
- `recordOutcome()` / `retrieveLessons()` self-evolution
