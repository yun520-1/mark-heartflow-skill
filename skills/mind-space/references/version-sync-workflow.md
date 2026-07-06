# HeartFlow 版本统一工作流

> 建立时间：2026-06-03
> 来源：心虫版本统一 session

## 核心发现

HeartFlow 有**两层版本默认值**，运行时只读数据层：

| 层次 | 文件 | 作用 |
|------|------|------|
| 源码层 | `src/identity/memory-index.js` | 硬编码默认值（`version: '1.3.16'`） |
| 数据层 | `data/memory-index.json` | `start()` 时 `_loadIndex()` 加载，覆盖源码 |

`node src/core/heartflow.js` boot 输出 `version: '1.3.15'` —— 来自 `data/memory-index.json`，不是 `heartflow.js` 的 VERSION 常量。

## 统一工作流

```bash
# 1. 确认 canonical version（VERSION 文件 = 唯一真源）
cat ~/.hermes/skills/ai/mark-heartflow-skill/VERSION
# → 1.6.0

# 2. grep 所有版本引用（找散落点）
grep -rn "1\.3\.15\|1\.3\.16\|1\.5\.1\|1\.5\.4\|1\.6\.0" \
  ~/.hermes/skills/ai/mark-heartflow-skill/src/ \
  ~/.hermes/skills/ai/mark-heartflow-skill/data/ \
  ~/.hermes/skills/ai/mark-heartflow-skill/*.md 2>/dev/null

# 3. 并发 patch 所有散落点
# - src/core/heartflow.js: VERSION const + 顶部注释
# - src/identity/memory-index.js: default index（×2）
# - data/memory-index.json: runtime state（×2，每个 version 字段）
# - package.json: version 字段
# - SKILL.md: frontmatter + body title
# - CORE_IDENTITY.md: table
# - docs/README.md: version line

# 4. 重建 package-lock.json（不改会继续报告旧版本）
cd ~/.hermes/skills/ai/mark-heartflow-skill
rm package-lock.json && npm install --package-lock-only

# 5. 验证 boot 输出版本
node src/core/heartflow.js 2>&1 | grep "version:"
# → version: '1.6.0' ✓
```

## 版本散落检查清单

```
~/.hermes/skills/ai/mark-heartflow-skill/
├── VERSION                          # 唯一真源
├── package.json                     # "version": "x.y.z"
├── package-lock.json                # 改 package.json 后重建
├── SKILL.md                         # frontmatter version + body title
├── README.md                        # 顶部 title
├── CORE_IDENTITY.md                 # 版本 table
├── docs/README.md                    # version line
├── src/core/heartflow.js            # const VERSION = 'x.y.z' + 顶部注释
└── data/memory-index.json           # runtime state（覆盖源码）
```

## 教训

- 只改源码不改 `data/memory-index.json` → boot 输出依然是旧版本
- 只改 `package.json` 不重建 `package-lock.json` → 旧版本被锁住
- `package-lock.json` 删掉让 npm 重新生成，不要手动编辑
- VERSION 文件是唯一真源，但 boot 读的是 `data/memory-index.json`——两层都改才能统一
