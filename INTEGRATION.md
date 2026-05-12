# HeartFlow v0.13.10 集成追踪

> 目标：v0.13.1 = v0.13.0（当前架构）+ 全部 v11.43.2 功能
> 日期：2026-05-11
> 状态：进行中

---

## 架构关系

```
v11.43.2（庞大模块化，167个文件）
    ↓ 精简重构
v0.12.50（单文件内核 876行，丢失大量功能）
    ↓ 新增架构
v0.13.0（当前，新增 AgentRuntime/Storage/CLI，但旧功能缺失）
    ↓ 本次集成
v0.13.1（v0.13.0 + 全部 v11.43.2 功能）
```

---

## v11.43.2 模块清单（共 167 个根文件 + 60 个子目录文件）

### 核心引擎（红色 = 丢失 ⚠️，绿色 = 已保留 ✅，黄色 = 已精简 ⚡）

| 模块 | 路径 | 行数 | v0.13.0状态 | 集成优先级 |
|------|------|------|-------------|-----------|
| **identity-engine.js** | 根 | 656 | ❌ 丢失（只有88行identity.js） | P0 |
| **context-manager.js** | 根 | 667 | ❌ 丢失 | P0 |
| **meaningful-memory.js** | 根 | 1241 | ❌ 丢失 | P0 |
| **learning-engine.js** | 根 | 691 | ❌ 丢失 | P0 |
| **memory-recall.js** | 根 | 377 | ⚡ 只有55行精简版 | P0 |
| **dream-loop.js** | 根 | 209 | ⚡ 只有103行精简版 | P0 |
| **emotion-engine.js** | 根 | 137 | ❌ 丢失 | P0 |
| **self-healing.js** | 根 | 142 | ❌ 丢失 | P1 |
| **experience-replay.js** | 根 | ~300 | ❌ 丢失 | P1 |
| **cognitive-engine.js** | 根 | ~300 | ❌ 丢失 | P1 |
| **cognitive-loop.js** | 根 | ~200 | ❌ 丢失 | P1 |
| **consciousness-depth-indicator.js** | 根 | ~200 | ❌ 丢失 | P1 |
| **knowledge-graph.js** | 根 | ~500 | ❌ 丢失 | P1 |
| **access-pattern-tracker.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **action-tracker.js** | 根 | ~150 | ❌ 丢失 | P2 |
| **adaptive-controller.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **auto-compaction-engine.js** | 根 | ~300 | ❌ 丢失 | P2 |
| **code-review-engine.js** | 根 | ~300 | ❌ 丢失 | P2 |
| **confidence-calibrator.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **cost-aware-decision.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **decision-engine.js** | 根 | ~300 | ❌ 丢失 | P2 |
| **debugging-engine.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **eval-engine.js** | 根 | ~300 | ❌ 丢失 | P2 |
| **execution-verifier.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **flow-predictor.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **guardian-system.js** | 根 | ~300 | ❌ 丢失 | P2 |
| **guardrail-engine.js** | 根 | ~300 | ❌ 丢失 | P2 |
| **importance-scorer.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **intent-layer.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **memory-action-bridge.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **memory-consolidation-engine.js** | 根 | ~500 | ❌ 丢失 | P2 |
| **memory-context-bridge.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **memory-lifecycle-manager.js** | 根 | ~300 | ❌ 丢失 | P2 |
| **memory-manager.js** | 根 | ~500 | ❌ 丢失 | P2 |
| **memory-priority-scorer.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **memory-router.js** | 根 | ~700 | ❌ 丢失 | P2 |
| **meta-engine.js** | 根 | ~500 | ❌ 丢失 | P2 |
| **modular-memory-router.js** | 根 | ~500 | ❌ 丢失 | P2 |
| **plan-and-solve.js** | 根 | ~300 | ❌ 丢失 | P2 |
| **priority-guardian.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **reasoning-integrator.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **recall-trigger.js** | 根 | ~150 | ❌ 丢失 | P2 |
| **reflection-loop.js** | 根 | ~300 | ❌ 丢失 | P2 |
| **skill-ecosystem.js** | 根 | ~500 | ❌ 丢失 | P2 |
| **skill-generator.js** | 根 | ~500 | ❌ 丢失 | P2 |
| **skill-lifecycle.js** | 根 | ~300 | ❌ 丢失 | P2 |
| **spontaneous-restraint.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **stability-guard.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **stateful-agent.js** | 根 | ~300 | ❌ 丢失 | P2 |
| **tree-of-thoughts.js** | 根 | ~300 | ❌ 丢失 | P2 |
| **uncertainty-quantifier.js** | 根 | ~200 | ❌ 丢失 | P2 |
| **unified-memory-api.js** | 根 | ~500 | ❌ 丢失 | P2 |
| **upgrade-and-push.js** | 根 | ~300 | ✅ 已保留 | 已集成 |
| **zettelkasten-links.js** | 根 | ~400 | ⚡ 精简版？ | P2 |
| **heartbeat-fallback.js** | 根 | ~100 | ❌ 丢失 | P3 |
| **session-persistence.js** | 根 | ~200 | ❌ 丢失 | P3 |
| **user-model.js** | 根 | ~200 | ❌ 丢失 | P3 |

---

### 子目录模块（已在 src/core/ 下）

| 目录 | 模块数 | v0.13.0状态 |
|------|--------|-------------|
| **agents/** | 6 | ✅ 完整保留 |
| **associative-engine/** | 10 | ⚠️ 未迁移 |
| **autonomy/** | 5 | ✅ 完整保留 |
| **consciousness/** | 3 | ✅ 完整保留 |
| **ethics/** | 3 | ✅ 完整保留 |
| **memory/** | 1 | ⚡ triality-memory 保留，但 recall/consolidator 精简 |
| **self-evolution/** | 4 | ✅ 完整保留 |
| **utils/** | 3 | ⚠️ 未迁移 |
| **papers/** | 2 | ✅ 保留 |
| **theory/** | 4 | ✅ 保留 |
| **upgrade-principle/** | 2 | ✅ 保留 |

---

## P0 核心缺失引擎详情

### 1. identity-engine.js (656行) → ❌ 丢失
**功能**：身份管理、核心指令执行、身份一致性检查
**来源**：`src/core/identity-engine.js`
**集成方案**：直接复制到 `src/core/identity/` 下，作为 IdentityEngine 类导出

### 2. context-manager.js (667行) → ❌ 丢失
**功能**：跨会话上下文管理、上下文压缩、上下文优先级
**来源**：`src/core/context-manager.js`
**集成方案**：新建 `src/core/context/` 目录，集成 ContextManager

### 3. meaningful-memory.js (1241行) → ❌ 丢失
**功能**：有意义的记忆提取、模式识别、经验总结
**来源**：`src/core/meaningful-memory.js`
**集成方案**：这是最大缺失模块，直接复制到 `src/core/memory/meaningful-memory.js`

### 4. learning-engine.js (691行) → ❌ 丢失
**功能**：从经验中学习、策略更新、奖励机制
**来源**：`src/core/learning-engine.js`
**集成方案**：新建 `src/core/learning/` 目录

### 5. memory-recall 精简问题 → ⚡
**来源**：`src/core/memory-recall.js`（377行） vs 当前 `src/core/memory/recall.js`（55行）
**问题**：当前 recall 只有 55 行，丢失了 322 行
**集成方案**：用 377 行完整版替换 55 行精简版

### 6. dream-loop 精简问题 → ⚡
**来源**：`src/core/dream-loop.js`（209行） vs 当前 `src/core/memory/dream.js`（103行）
**问题**：当前 dream 只有 103 行，丢失了 106 行
**集成方案**：用 209 行完整版替换 103 行精简版

### 7. emotion-engine.js (137行) → ❌ 丢失
**功能**：情绪检测、情绪响应、情绪记忆
**来源**：`src/core/emotion-engine.js`
**集成方案**：复制到 `src/core/emotion/` 下

### 8. self-healing.js (142行) → ❌ 丢失
**功能**：自我修复、错误恢复、自愈机制
**来源**：`src/core/self-healing.js`
**集成方案**：新建 `src/core/self-healing/` 目录

---

## P1 高优先级引擎

| 模块 | 行数 | 功能 |
|------|------|------|
| cognitive-engine.js | ~300 | 认知推理引擎 |
| cognitive-loop.js | ~200 | 认知循环 |
| consciousness-depth-indicator.js | ~200 | 意识深度指示 |
| knowledge-graph.js | ~500 | 知识图谱 |
| experience-replay.js | ~300 | 经验回放 |

---

## 集成策略

### 原则
1. **直接复制优先**：直接复制 v11.43.2 的模块到对应目录，不重写
2. **保持独立**：每个引擎独立文件，通过 heartflow.js 统一编排
3. **boot/shutdown 链**：heartflow.js 按序调用各引擎的 boot/shutdown
4. **不破坏现有功能**：当前 v0.13.0 的 AgentRuntime/Storage/CLI 保持不变

### 目录映射

```
src/core/identity-engine.js → src/core/identity/identity-engine.js
src/core/context-manager.js → src/core/context/context-manager.js
src/core/meaningful-memory.js → src/core/memory/meaningful-memory.js
src/core/learning-engine.js → src/core/learning/learning-engine.js
src/core/emotion-engine.js → src/core/emotion/emotion-engine.js
src/core/self-healing.js → src/core/self-healing/self-healing.js
src/core/dream-loop.js → src/core/dream/dream-loop.js（替换精简版）
src/core/memory-recall.js → src/core/memory/recall.js（替换精简版）
src/core/associative-engine/ → src/core/associative-engine/
src/core/utils/ → src/core/utils/
```

### Boot 顺序（目标）

```javascript
// heartflow.js boot 顺序
const engines = [
  'identity-engine',     // 身份
  'memory',              // 记忆（triality + recall + meaningful + consolidation）
  'learning-engine',     // 学习
  'cognition-engine',    // 认知
  'emotion-engine',      // 情绪
  'dream-loop',          // 梦
  'self-evolution',      // 自我进化
  'self-healing',        // 自愈
  'consciousness',        // 意识
  'autonomy',            // 自主
  'ethics',              // 伦理
  'knowledge-graph',     // 知识图谱
  'associative-engine',  // 联想
  'experience-replay',   // 经验回放
  'checkpoint',          // 存储
  'vector-store',        // 向量存储
  'agent-runtime',       // Agent运行
  'cli',                 // CLI
];
```

---

## 进度

- [ ] P0: identity-engine.js
- [ ] P0: context-manager.js
- [ ] P0: meaningful-memory.js
- [ ] P0: learning-engine.js
- [ ] P0: emotion-engine.js
- [ ] P0: self-healing.js
- [ ] P0: dream-loop.js（替换精简版）
- [ ] P0: memory-recall.js（替换精简版）
- [ ] P1: cognitive-engine + cognitive-loop
- [ ] P1: knowledge-graph
- [ ] P1: experience-replay
- [ ] P1: consciousness-depth-indicator
- [ ] P2: 其余 ~40 个模块
- [ ] P3: 低优先级模块
- [ ] 集成到 heartflow.js boot/shutdown
- [ ] 版本升级 v0.13.1
- [ ] 编译 + 测试 + 审计
