# HeartFlow SKILL.md 审计快照（2026-06-10）

## 发现摘要

心虫 `~/.hermes/skills/mark-heartflow` 存在严重的 SKILL.md 与实际代码脱节问题。

## 问题 1：5个引擎版本共存

| 文件 | 版本 | 被引用？ |
|------|------|---------|
| `src/core/heartflow-engine.js` | v2.2.0 | ✅ CLI + API 使用 |
| `src/core/heartflow-v8.js` | v8.0.0 | ❌ 死代码 |
| `src/core/heartflow-v8-core.js` | v8.1.0 | ❌ 死代码 |
| `src/core/heartflow-complete.js` | v8.1.0 | ❌ 死代码 |
| `src/v9/heartflow-engine-v9.js` | v9.0.1 | ⚪ API 可选加载 |

VERSION.txt = 9.2.2，但实际运行的引擎版本是 v2.2.0。版本号体系完全混乱。

## 问题 2：SKILL.md 虚假宣传

SKILL.md 声称存在但实际不存在的模块：
1. `src/core/self-diagnostic.js` — 不存在（仅有文档 references/self-diagnostic.md）
2. PHQ-9/GAD-7 心理健康评估模块 — 无专用 JS 实现
3. 熵减计算模块 — 无专用 JS 实现
4. 成语词典 `idiom-dictionary/` — 目录存在但无实际词典数据
5. 英文字典 `english-dict/` — 目录存在但无实际词典数据
6. `_time_context.json` — 不存在
7. Python 包路径 `mark-heartflow.scripts.*` — 无 `__init__.py`，不成立
8. 三层做梦定时调度 — 无调度器实现

## 问题 3：实际存在但 SKILL.md 未记录的子系统

| 子系统 | 文件数 | 说明 |
|--------|-------|------|
| `associative-engine/` | 6 | 联想引擎（词法关联、语义收敛、叙事检索、块检测、逐词生成） |
| `self-evolution/` | 4 | 自我进化核心、元学习、回滚管理、哥德尔引擎 |
| `consciousness/` | 3 | 全局工作空间、心智漫游、自我模型 |
| `autonomy/` | 5 | PDCA引擎、数字稳态、目标生成、时间规划、策略优化 |
| `ethics/` | 3 | 圣人守护、边界协商、价值内化 |
| `agents/` | 6 | 自我Agent、反思Agent、专注Agent、情绪Agent、管理器、基类 |
| `self/` | 6 | 意义永久记忆、自主学习、意图引擎、时间感知、精神心智 |
| `theory/` | 5 | SEP意向性、SEP自我意识、SEP感质、高级公式 |
| 独立模块 | ~20 | 真善美、认知引擎、认知循环、元引擎、语义锚点等 |

## 审计命令模板

```bash
# 版本号分布
for f in src/core/heartflow-engine.js src/core/heartflow-v8.js src/core/heartflow-v8-core.js src/core/heartflow-complete.js src/v9/heartflow-engine-v9.js; do
  [ -f "$f" ] && echo "$f → $(head -5 "$f" | grep -oE 'v?[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
done

# 引擎死代码检测
for f in heartflow-v8 heartflow-v8-core heartflow-complete; do
  echo "$f → $(grep -rl "$f" bin/ --include='*.js' 2>/dev/null | wc -l) 处引用"
done

# SKILL.md 声称 vs 实际文件
grep -oE '`[^`]+\.js`' SKILL.md | tr -d '`' | sort -u | while read f; do
  [ ! -f "$f" ] && [ ! -f "src/core/$f" ] && [ ! -f "src/$f" ] && echo "MISSING: $f"
done
```
