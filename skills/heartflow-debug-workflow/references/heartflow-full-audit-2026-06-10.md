# HeartFlow 全量审计记录（2026-06-10）

## 触发场景

用户说"心虫版本错误，非常多的错误，全部巡查一次"。

## 发现的问题

### 1. 多引擎版本分裂（5个引擎文件共存）

| 引擎文件 | 版本 | 被使用？ |
|---------|------|---------|
| `src/core/heartflow-engine.js` | v2.2.0 → 改为 v9.2.2 → 改回 v2.2.0 | ✅ CLI 和 API 实际使用 |
| `src/core/heartflow-v8.js` | v8.0.0 | ❌ 未被入口文件引用 |
| `src/core/heartflow-v8-core.js` | v8.1.0 | ❌ 但被 `autonomous-decision-engine.js` 继承 |
| `src/core/heartflow-complete.js` | v8.1.0 | ❌ 继承 AutonomousDecisionEngine |
| `src/v9/heartflow-engine-v9.js` | v9.0.1 | ⚪ API 服务器可选加载 |

**继承链（非死代码，但未活跃）：**
```
heartflow-v8-core (v8.1.0)
  └─ autonomous-decision-engine (v8.1.0) ← 被 heartflow-v8 和 heartflow-complete 继承
       ├─ heartflow-v8 (v8.0.0)
       └─ heartflow-complete (v8.1.0)
```

**结论：** 仓库版本号 9.2.2 是人为跳跃的假版本。统一回归为 v8.1.0（v8-core 的真实版本号）。heartflow-engine.js 是心流引擎子模块，保持其子版本 v2.2.0。

### 2. 语法错误

| 文件 | 错误 | 修复 |
|------|------|------|
| `src/core/associative-engine/word-by-word-generator.js:46` | `await` 不在 `async` 函数里 | `generateResponse()` 前加 `async` |
| `src/core/self/meaning-permanent.js` | 纯 JSON 但后缀 `.js`，报 `Unexpected token ':'` | 改为 `.json` |

**修复后：** 97 个 JS 文件全部通过 `node --check`。

### 3. SKILL.md 与实际代码脱节

**虚假宣传（11处标记为 [已禁用] / [待实现]）：**
- `src/core/self-diagnostic.js` — 不存在
- PHQ-9/GAD-7 心理健康评估模块 — 无专用实现
- 熵减计算模块 — 无专用实现
- 成语/英文字典 — 目录空壳
- 三层做梦定时调度 — 无调度器
- Python 包导入路径 `mark-heartflow.scripts.*` — 无 `__init__.py`

**未记录（约40+模块）：**
- `associative-engine/` 联想引擎（6文件）
- `self-evolution/` 自我进化（4文件）
- `consciousness/` 意识系统（3文件）
- `autonomy/` 自主决策（5文件）
- `ethics/` 伦理系统（3文件）
- `agents/` 多Agent（6文件）
- `self/` 自我核心（6文件）
- `theory/` 理论（5文件）
- 约20个独立引擎模块

### 4. 网络不通时的 Git 策略

HTTPS 和 SSH 都超时（GitHub 完全不可达）。正确做法：
1. **commit 先行** — 所有修复落地本地 commit
2. **不阻塞** — 告诉用户 commit 已就绪
3. **恢复 remote URL 到 HTTPS**
4. **后续会话再推送**

## 修复 commit 记录

- `a1039a3` — 修复语法错误/版本号对齐/SKILL.md虚假声明标记
- `befee8b` — 版本号统一回归 v8.1.0

## 关键教训

1. 心虫可能有多个引擎版本共存，必须先确认 CLI 实际引用哪个
2. `node --check` 是快速发现语法错误的最佳工具
3. SKILL.md 和 `src/core/` 必须做双向对比审计
4. JSON 文件后缀 .js 是常见陷阱
5. 网络不通不是失败，commit 先行即可
