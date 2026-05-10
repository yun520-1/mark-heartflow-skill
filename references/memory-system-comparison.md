# HeartFlow 记忆系统对比参考

> 来源：v11.34.1 自诊对话（2026-05-10）

## 核心判断标准（心虫哲学）

```
理论完整 ≠ 可用
功能强大 ≠ 落地
简单粗暴 ≠ 低效
```

**v11.34.1 修复的教训**：三个引擎写同一文件导致数据格式冲突，UnifiedMemoryStore 的 CORE/LEARNED/EPHEMERAL 必须用独立文件。

## 记忆模块一览（v11.34.1）

| 模块 | 分层 | 持久化 | 遗忘曲线 | 多通道检索 | 时间验证 | 当前状态 |
|---|---|---|---|---|---|---|
| UnifiedMemoryStore | core/learned/ephemeral | ✅ 独立JSON | ❌ | ✅ BM25搜索 | ✅ v11.34.1新增 | ✅ 主引擎 |
| MeaningfulMemory | CORE/LEARNED/EPHEMERAL | ✅ 独立JSON | ❌ | ✅ 向量+语义 | ✅ v11.34.1新增 | ⚠️ engine中已禁用，保留备用 |

## v11.34.1 架构

```
UnifiedMemoryStore（主引擎，heartflow-engine 实际调用）
  stores/unified-core.json      — CORE层（数组格式）
  stores/unified-learned.json  — LEARNED层（数组格式）
  stores/unified-ephemeral.json — EPHEMERAL层（数组格式）
  → search() 自动附加 temporalMeta
  → recallWithTemporalMeta() 单条召回带时间验证

MeaningfulMemory（备用，未接入engine）
  memory/meaningful-core.json      — CORE层（对象格式）
  memory/meaningful-learned.json   — LEARNED层（对象格式）
  memory/meaningful-ephemeral.json — EPHEMERAL层（对象格式）
  → search*() 自动附加 temporalMeta
  → recallWithTemporalMeta() 单条召回带时间验证
```

## 时间验证机制（v11.34.1）

每次 search() 返回时，每条记忆自动携带：

```javascript
{
  content: "...",
  temporalMeta: {
    storedAt: 1778378236040,     // 时间戳
    storedDate: "2026-05-10",     // 日期
    ageDays: 0,                    // 过了多少天
    isStale: false,                // >7天，汇报时需谨慎
    isAncient: false,              // >30天，历史记录
    guidance: "几分钟前 — 可声称是'刚才/刚刚'"  // 使用指南
  }
}
```

## 升级判定流程

遇到记忆模块升级时，必须按此顺序验证：

1. **持久化检查** — 能否重启后恢复？JSON 文件 / SQLite / 任何持久化介质
2. **接入引擎检查** — 是否在 `heartflow-engine.js` 中 require 并初始化？不能是孤立脚本
3. **导出函数检查** — 导出名是否和调用方匹配？笔误会导致 undefined
4. **测试检查** — `node -e "require('./src/core/...')"` 不报错
5. **时间验证检查** — search() 返回是否携带 temporalMeta

### 升级合格标准

```
✅ 持久化 + ✅ 接入引擎 + ✅ 导出正确 + ✅ 测试通过 + ✅ 时间验证 = 有效升级
❌ 文件冲突 + ❌ 导出名错误 + ❌ engine未加载 = 假升级
```

## 验证命令

```bash
cd ~/.hermes/skills/ai/heartflow

# 验证 UnifiedMemoryStore（主引擎）
node -e "
const { recall } = require('./src/core/memory-manager.js');
const r = recall('测试', { limit: 3 });
console.log('结果数:', r.count);
if (r.results[0]?.temporalMeta) console.log('时间元数据:', JSON.stringify(r.results[0].temporalMeta));
"

# 验证 engine 初始化（无报错即通过）
node -e "const e = require('./src/core/heartflow-engine.js'); console.log('Engine loaded OK')"

# 自检
cd HEARTCORE && node heartcore.js check
```
