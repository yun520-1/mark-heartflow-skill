# HeartFlow v11.23.3 Upgrade Notes (2026-05-09)

## Version String Locations — 3 Places

When bumping the version in `src/core/heartflow.py`, the version appears in **3 separate locations** — not just `__version__`. Always grep first:

```bash
grep -n "v10\.2\." src/core/heartflow.py
```

Locations:
1. Module docstring (line ~3): `HeartFlow v10.2.X - The AI That Truly Thinks`
2. `__version__` variable (line ~36): `__version__ = "10.2.X"`
3. CLI print in `if __name__ == "__main__"` (line ~1494): `print("HeartFlow v10.2.X ...")`

Missing any one will leave the old version in that context.

---

## "MAIN ORCHESTRATOR" Appears 5 Times

`search_files` for "MAIN ORCHESTRATOR" returns 5 matches (including section header lines). The actual insertion point (before the `MentalHealthEngine` class) is at line ~1002 — but `replace_all` is dangerous here.

**Fix**: Use `search_files` with `context=2` to find the unique surrounding context. The correct insertion point is between `EntropyEngine` class end and `MentalHealthEngine` class start. Match on the exact comment block:

```
"# ============================================================\n# MAIN ORCHESTRATOR\n# ============================================================\nclass MentalHealthEngine:"
```

---

## DreamEngine Integration Pattern

When adding a new engine to `HeartFlow` orchestrator:

1. Add `DreamResult` dataclass in the DATA MODELS section (before TGBResult)
2. Insert the engine class before `# MAIN ORCHESTRATOR`
3. In `HeartFlow.__init__`, add: `self.dream = DreamEngine()`
4. In `HeartFlow.process()`, call `self.dream.store_experience()` in a new step
5. Update `__version__` in **3 places**
6. Update the exported symbols in `src/core/__init__.py`
7. Run `python3 src/core/heartflow.py` to verify tests pass

---

## HN Algolia API — Most Reliable for Cron

For web search in headless/cron environments, HN Algolia API is more reliable than Baidu/Bing:
```
https://hn.algolia.com/api/v1/search?query=QUERY&tags=story&hitsPerPage=10
```
Returns JSON with `title`, `url`, `points`, `num_comments`, `author`, `created_at`. Per the cn-web-search skill docs: "HN Algolia API is designed as a pure programming interface, never goes down."

---

## What Was Added in v10.2.4

- **New class**: `DreamEngine` — 3-phase memory consolidation (decay → bind → synthesis)
- **New dataclass**: `DreamResult` — dream narrative, tone, memory snapshot
- **Integration**: `HeartFlow.process()` now stores every input as an experience
- **References**: formative-memory (HN: jarimustonen/formative-memory), Recursive Agent Optimization (ArXiv 2026-05-07)
- **Commit**: `c3b5976e` (git push disabled)
