# AI Agent Memory Landscape — 2026 Reference

GitHub search is the most reliable fallback when Baidu is rate-limited. Query format:

```
https://api.github.com/search/repositories?q=<query>&sort=stars&order=desc&per_page=10
```

Headers: `User-Agent: Mozilla/5.0`, `Accept: application/vnd.github.v3+json`

---

## High-Value Repos for HeartFlow-style Memory Consolidation

| Repo | Stars | Lang | Key Innovation | HeartFlow Phase Alignment |
|------|-------|------|----------------|--------------------------|
| [kael-bit/engram-rs](https://github.com/kael-bit/engram-rs) | 23 | Rust | 3-layer decay (Buffer→Working→Core), LLM quality gate, Atkinson-Shiffrin model | Phase 1 (consolidation), Phase 3 (stability) |
| [yifanfeng97/ontomem](https://github.com/yifanfeng97/ontomem) | 15 | Python | Self-consolidating, Pydantic schemas, FAISS, time-series → daily snapshots | Phase 6 (KnowledgeDistiller) |
| [tashfeenahmed/scallopbot](https://github.com/tashfeenahmed/scallopbot) | 11 | TypeScript | **NREM+REM dream cycle**, spreading activation, dual-EMA affect, SOUL.md self-reflection, gap scanner, OpenClaw-compatible | **Phase 4 (Dream Loop)** ← highest priority |
| [staticroostermedia-arch/engram](https://github.com/staticroostermedia-arch/engram) | 6 | Rust | Holographic memory, NREM consolidation, knowledge graph, 31 MCP tools | Phase 4, Phase 3 |

---

## scallopbot Architecture (Most Relevant to HeartFlow)

### Dream Cycle (Phase 4 target)
- **NREM consolidation**: clusters and merges fragmented memories across topics into coherent summaries
- **REM exploration**: high-noise spreading activation to discover non-obvious connections; LLM judge evaluates novelty, plausibility, usefulness
- Triggered: nightly heartbeat

### Three-Tier Heartbeat Daemon
| Tier | Interval | Operations |
|------|----------|------------|
| Pulse | 5 min | Health monitoring, retrieval auditing, affect EMA update |
| Breath | 6 h | Decay engine, memory fusion, forgetting |
| Sleep | Nightly | Dream cycle (NREM+REM), self-reflection, SOUL re-distillation, gap scanning |

### Memory Fusion (BFS-clustered)
- Exponential decay with category-specific half-lives (14 days events → 346 days relationships)
- Utility-based forgetting with soft-archive before hard-prune
- Spreading activation over typed relation graphs (UPDATES, EXTENDS, DERIVES)

### Self-Reflection → SOUL.md
- Nightly composite reflection across 4 dimensions: explanation, principles, procedures, advice
- Merged into living `SOUL.md` personality document — no fine-tuning needed

### Source files to study
- `src/memory/gardener-sleep-steps.ts` — full dream cycle orchestration
- `src/memory/nrem-consolidation.ts` — NREM logic
- `src/memory/rem-exploration.ts` — REM exploration with LLM judge
- `src/memory/gardener-nrem.test.ts` / `gardener-rem.test.ts` — test cases

### Benchmark: LoCoMo (long-conversation memory)
- 1,049 QA items, 5 conversations, 138 sessions
- scallopbot F1 0.48 vs OpenClaw 0.38 (+26%)
- Biggest gain: adversarial questions (+0.20), multi-hop (+0.10)

---

## engram-rs Architecture

### Three-Layer Memory Model
```
Buffer (short-term) → Working (active) → Core (long-term identity)
     ↓                    ↓                    ↑
  eviction            importance decay     LLM quality gate
```

### LLM Quality Gate
- Buffer → Working: LLM judges "Is this a decision, lesson, or preference?"
- Working → Core: sustained access + LLM gate
- Promotion is not rule-based — LLM evaluates each memory in context

### Source files to study
- `src/consolidate/triage.rs` — LLM quality gate logic
- `src/consolidate/cluster.rs` — memory clustering
- `src/consolidate/merge.rs` — merge strategy
- `src/consolidate/distill.rs` — distillation

---

## Search Queries That Work

```
# GitHub — memory consolidation in AI agents
https://api.github.com/search/repositories?q=memory+consolidation+agent+LLM+topic:AI&sort=stars&order=desc&per_page=10

# arXiv — AI agent memory (no key, free, XML)
https://export.arxiv.org/api/query?search_query=all:memory+consolidation+LLM+agent&max_results=5&sortBy=submittedDate&sortOrder=descending

# arXiv — MemGPT/Letta
https://export.arxiv.org/api/query?search_query=all:MemGPT+OR+Letta+memory+agent&max_results=5&sortBy=submittedDate&sortOrder=descending

# arXiv — RAG memory retrieval
https://export.arxiv.org/api/query?search_query=all:RAG+memory+retrieval+agent+2025&max_results=5&sortBy=submittedDate&sortOrder=descending
```

## Integration Priority for HeartFlow

1. **Immediate**: scallopbot `nrem-consolidation.ts` + `rem-exploration.ts` → Phase 4 Dream Loop
2. **Immediate**: engram-rs `triage.rs` LLM gate → Phase 1 consolidation quality control
3. **Short-term**: scallopbot `fusion.ts` BFS clustering → HeartFlow memory fusion
4. **Medium**: ontomem time-series → Phase 6 KnowledgeDistiller
