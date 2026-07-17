# Formula Library Expansion Workflow

When user asks to "丰富公式库" or "expand formula library", follow this batch workflow.

## Steps

1. **Search Wikipedia** — use `execute_code` with `wikipedia` package (or curl fallback)
2. **Generate formulas** — use `execute_code` with `sympy` (or manual dict)
3. **Save to categorized JSON** — e.g. `formulas/formulas_engineering.json`
4. **Merge into main library** — use `terminal` + Node.js to merge + dedup
5. **Update metadata** — version, last_updated, total_formulas, categories
6. **Commit + push** — `git add -A && git commit -m "feat(formulas): ..." && git push origin main`

## Formula Representation Rules (mathjs compatible)

| ✅ Correct | ❌ Wrong | Reason |
|---|---|---|
| `exp(x)` | `e^{x}` | superscript not parseable |
| `R = ...` | `R(t) = ...` | function notation, treat as assignment |
| `P*V = n*R*T` | `P V = n R T` | implicit multiplication ambiguous |
| `Math.PI` | `π` | unicode symbol not parseable |

## Quality Rule

User explicitly said: "千万不要自己生成，自己生成质量太差了".

Only use:
- `sympy` verified formulas
- Manual sources (Wikipedia, handbooks, open APIs)
- GitHub raw JSON files

Never use random parameter template generation.

## Batch Download Pattern

```bash
# Use execute_code for stable batch runs
execute_code("""
import os
for repo in list_of_repos:
    os.system(f"cd /tmp && git clone --depth 1 https://modelscope.cn/datasets/{repo}.git")
""")
```

This is more stable than `terminal()` for multi-command sequences.
