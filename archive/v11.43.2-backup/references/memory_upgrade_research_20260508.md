# HeartFlow Memory Upgrade Research — 2026-05-08

## Core Goal
Upgrade HeartFlow memory system from "storage + retrieval" to "intelligent tiering + compression".

## GitHub Top Repos (2025)

| Repo | Stars | Core Architecture | Key Breakthrough |
|------|-------|-------------------|------------------|
| MemGPT (cpacker/MemGPT) | 14k+ | Hierarchical memory + recursive summarization | Core/non-core tier separation, virtual context management |
| Letta (letta-ai/letta) | 11k+ | Block storage + entity memory graphs | Context compression, block-level retrieval |
| Mem0 (mem0ai/Mem0) | 8k+ | Multi-signal fusion (semantic + BM25 + entity) | Already integrated in HeartFlow v11.21+ |

## MemGPT Architecture (primary upgrade source)
- Path: `memgpt/memory/`, `memgpt/persistence/`, `memgpt/agents/`
- Core pattern: Core memory (limited capacity, high weight) vs Non-core (evictable via summarization)
- Decision: relevance_score + access_count joint ranking

## Letta Architecture (secondary upgrade source)
- Path: `letta/services/block_manager.py`, `letta/services/memory_repo/`
- Core pattern: Block abstraction — large memories split into compressible units
- Trigger: when context nears limit, block-level summarization fires

## Mem0 Architecture (already integrated)
- Path: `mem0/memory/main.py`, `mem0/embeddings/`
- Multi-signal: semantic (0.4) + BM25 (0.3) + entity (0.3) weighted fusion
- Entity linking across memories
- Agent facts as first-class citizens (reinforcementCount)

## HeartFlow v11.23.2 Current State
- ✅ `mem0-memory.js` — Mem0 v3 multi-signal (semantic + BM25 + entity)
- ✅ `triality-memory.js` — 3D experience brain (temporal/semantic/relational)
- ✅ `meaningful-memory.js` — Three-layer semantics + forgetting curve
- ✅ `memory-lifecycle-manager.js` — Promotion/demotion/eviction
- ❌ Missing: MemGPT-style core/non-core tier eviction
- ❌ Missing: Letta-style block-level compression

## Planned Upgrade v11.24.0
```
1. MemGPT Core/Core二层分层 (lightweight)
   - Core memory: long-term, high weight, limited capacity
   - Non-core: compressible/evictable
   - Criterion: relevance_score + reinforcementCount joint ranking

2. Letta-style Block abstraction (lightweight)
   - Split large memories into independently compressible blocks
   - Trigger: context near limit → block-level summarization

3. Strengthen reinforcement mechanism
   - Agent-confirmed facts > user statements
   - Multi-confirmed memories resist forgetting
```

## Research Commands Used
```bash
# List repo structure (GitHub API)
curl -s --max-time 10 "https://api.github.com/repos/cpacker/MemGPT/contents/memgpt" | python3 -c "..."

# Get raw file content
curl -s --max-time 15 "https://raw.githubusercontent.com/mem0ai/Mem0/main/mem0/memory/main.py"

# Inspect Letta services
curl -s --max-time 10 "https://api.github.com/repos/letta-ai/letta/contents/letta/services"
```

## Notes
- GitHub API curl commands may time out; use `--max-time 10-15`
- python3 pipe from curl requires security scan approval (`tirith` or user approval)
- MemGPT main branch may not have `/memgpt/memory/__init__.py` — check `/memgpt` root first
- Letta `memory/` dir not found in API listing — check `letta/services/` instead for memory-related services
