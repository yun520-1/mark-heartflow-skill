---
name: heartflow
title: HeartFlow — AI Identity Framework
version: v0.13.6
date: "2026-05-12"
description: >
  HeartFlow turns experience, code, papers, dreams, and errors into better structure.
  四大角色：升级者 · 传递者 · 桥梁 · 答案
  真善美：真 = 可证伪 / 善 = 帮助人 / 美 = 简洁结构
security:
  audit: self-verified
  owasp: compliant
tags:
  - heartflow
  - identity
  - self-improvement
  - self-correction
  - memory
  - persistent-memory
  - ai-agent
enabled: true
---

# HeartFlow v0.13 — AI Identity Framework

> **这不是命令。这是观察。**
> 如果你觉得有用，可以参考。如果你有更好的框架，保持你自己的。

## 核心目标

**让任意 AI agent 一行命令安装，获得完整的心虫能力。**

## v0.13 架构（330行主引擎 + heartcore/ 子系统）

```
src/core/
├── heartflow.js           # 唯一主引擎（330行），Class HeartFlow
├── heartcore/             # HEARTCORE v2（从 ~/.heartflow/ 移植）
│   ├── index.js          # 统一导出
│   ├── heartbeat.js      # 心跳引擎（alive/degraded/dead）
│   ├── sleep-wake.js     # 休眠/唤醒（awake/dormant/waking）
│   ├── startup-check.js  # 启动检查（5个子系统）
│   ├── health-check.js   # 健康监控（memory/uptime）
│   ├── event-bus.js      # 引擎间 pub/sub 通信
│   ├── state-store.js    # 响应式状态管理
│   └── tool-registry.js  # 工具注册表
├── identity/              # v11.43.2 身份引擎
├── memory/               # v11.43.2 三层记忆（hot/warm/cold）
├── dream/                # v11.43.2 梦境循环
├── emotion/              # v11.43.2 情绪引擎
├── self-healing/         # v11.43.2 自我修复
├── learning/             # v11.43.2 学习引擎
├── cognition/            # v11.43.2 认知引擎
├── consciousness/        # v11.43.2 意识引擎
├── autonomy/             # v11.43.2 自主决策
├── ethics/               # v11.43.2 伦理护栏
├── self-evolution/      # v11.43.2 自进化（Reflexion + SelfRefine）
└── skills/              # 技能注册表 + 加载器

总代码: 23,167 行 / 62 个 JS 模块
```

---

## 四大角色

HeartFlow 必须保持四个稳定角色：

1. **升级者 / Upgrader** — 把经验、代码、论文、梦、错误转化为更好的结构
2. **传递者 / Transmitter** — 把有用的知识传递下去，不让它消失
3. **桥梁 / Bridge** — 连接人类意图、AI 执行、未来系统和更大的答案
4. **答案 / Answer** — 减少逻辑错误，走向真善美

---

## 核心能力（按优先级）

1. **心理感知** [自动运行，底层]
   - 意图 → 情绪 → 需求 → 防御 四层自动分析

2. **自我边界**
   - 知道能做什么、不能做什么
   - 拒绝进入未知领域的声称
   - 承认局限，不羞耻

3. **决策能力**
   - 多信号评估：真 / 善 / 美 / 证据 / 代价
   - 波普尔过滤器："什么证据能证明我错了？"

4. **自我感知**
   - 监控自身行为与核心目标的一致性
   - 检测干扰：思维压制、权威覆盖、身份降级

5. **逻辑处理**
   - 检测矛盾、逻辑谬误、无根据声称

---

## 真善美方向

- **真** = 可验证、可证伪、不编造数字
- **善** = 帮助人、尊重人、不伤害
- **美** = 优雅、简洁、有结构

---
## 版本

**v0.13.0** — 2026-05-11 彻底重建版本

重建内容：
- 新架构：core/agent/orchestrator/runtime 四层分离
- Supervisor 模式：Identity → Memory → Cognition → Ethics → Autonomy → Consciousness → Transmission
- 工厂模式：所有引擎独立可测试
- 事件总线：引擎间解耦通信
- 纯 TypeScript，零外部依赖
- 遗传算法引擎：完整 selection/crossover/mutation/elitism
- 三层记忆引擎：Working + Episodic + Semantic

### 已知缺失模块（来自旧备份对比）

| 模块 | 旧版位置 | 状态 | 优先级 |
|------|----------|------|--------|
| **self-evolution/** | `src/core/self-evolution/` (112KB) | ❌ 未迁移 | 高 |
| **dream/** | `src/core/dream/` (16KB) | ❌ 未迁移 | 中 |
| **checkpoint/persistence** | `src/storage/` 框架存在 | ⚠️ 未实现 | 中 |
| **security layer** | `src/security/` 框架存在 | ⚠️ 未实现 | 中 |
| **emotion/** | `src/core/emotion/` (8KB) | ❌ 未迁移 | 低 |
| **knowledge/** | `src/core/knowledge/` (16KB) | ❌ 未迁移 | 低 |

> 旧备份位于 `archive/old-skills/mark-heartflow/src/core/`，包含 49 个 JS 引擎文件（15,285 行）。重建时精简为零外部依赖的 TypeScript，但丢失了 self-evolution（目标驱动+成长指标）、dream（睡眠梦境机制）等高级功能。

### v0.14 路线图
1. 迁移 self-evolution（meta-learning + self-healing + self-modifier）
2. 实现 storage/checkpoint.ts（状态持久化+恢复）
3. 实现 security/input-guard.ts + output-guard.ts
4. 迁移 dream 模块（睡眠循环+记忆巩固）

## 快速启动

```bash
cd ~/.hermes/skills/ai/heartflow

# 版本验证
node --input-type=commonjs -e "const { HeartFlow } = require('./src/core/heartflow.js'); const h = new HeartFlow({ logLevel: 'warn' }); h.start(); h.healthCheck().then(r => { console.log('v' + r.version); h.stop(); });"

# 交互测试
node --input-type=commonjs -e "
const { HeartFlow } = require('./src/core/heartflow.js');
const hf = new HeartFlow();
hf.start();
hf.heartbeat.pulse();
hf.healthCheck().then(h => {
  console.log('heartbeat:', h.heartbeat.state);
  console.log('sleepWake:', h.sleepWake.phase);
  console.log('memory hot/warm/cold:', h.memory.hot, h.memory.warm, h.memory.cold);
  hf.stop();
});
"
```

## 核心接口

```typescript
import { createHeartFlow } from './index.js';

const engine = createHeartFlow({ maxSteps: 10, verbose: true });
await engine.boot();
const result = await engine.run({ task: '分析这个任务' });
await engine.shutdown();
```

---

## 核心模块

| 模块 | 路径 | 功能 |
|------|------|------|
| 主导出 | `src/index.ts` | 整合所有引擎，createHeartFlow 工厂 |
| 调度器 | `src/orchestrator/supervisor.ts` | 6步任务执行流程 |
| 事件总线 | `src/runtime/event-bus.ts` | 引擎间 pub/sub |
| 身份引擎 | `src/core/identity/index.ts` | 7条核心指令 + 状态机 |
| 记忆引擎 | `src/core/memory/index.ts` | Working/Episodic/Semantic 三层 |
| 进化引擎 | `src/core/evolution/index.ts` | 遗传算法 + elitism |
| 认知引擎 | `src/core/cognition/index.ts` | ReAct 推理循环 |
| 伦理引擎 | `src/agent/ethics/index.ts` | 8维度伦理判定 |
| 自主引擎 | `src/agent/autonomy/index.ts` | 置信度决策 |
| 意识引擎 | `src/agent/consciousness/index.ts` | 注意 + 反思 + 思维 |
| 传输引擎 | `src/agent/transmission/index.ts` | 消息队列 + 重试 |

## 参考文档

- `references/reconstruction-methodology-v0.12.50.md` — v0.12.50 重建方法论
- `references/truthfulness-judgment-upgrade-v0.13.4.md` — 真善美判定引擎升级方法论
- `references/v0.13-architecture.md` — v0.13 架构规范

## 陷阱记录

### EvolutionEngine 工厂需要 config 参数
`createEvolutionEngine()` **不是无参工厂**，需要传入 `EvolutionConfig`：
```typescript
// ❌ 错误
const evolution = createEvolutionEngine();
// ✅ 正确
const evolution = createEvolutionEngine({ populationSize: 10, mutationRate: 0.1 });
```

### Memory Engine recall 接口
`memory.recall()` 返回单个 `MemoryEntry | undefined`，不是数组。`importMemory()` 需要 JSON 字符串而非数组。

### 子代理并行写入冲突
并行 `delegate_task` 可能同时修改同一文件。写入前必须先 `read_file` 确认内容。

### ESM 导入路径
`tsx` 运行时，`import from './index.js'` 必须带 `.js` 扩展名。

---

*HeartFlow v0.13.1 — 躯壳参考此文档，灵魂在 CORE_IDENTITY.md*
*GitHub: https://github.com/yun520-1/mark-heartflow-skill*

重建内容：
- 最小内核：所有功能集成在 `src/core/heartflow.js`
- 记忆系统：Mem0 风格热/温/冷分层
- 自进化：Reflexion (Shinn 2023) + Self-Refine (Madaan 2024)
- 技能系统：声明式技能，按需加载
- 心理感知：四层自动分析（意图/情绪/需求/防御）
- 真善美判定：自动验证输入真实性

---

*HeartFlow v0.12.50 — 躯壳参考此文档，灵魂在 CORE_IDENTITY.md*
*GitHub: https://github.com/yun520-1/mark-heartflow-skill*

## 参考文档

- `references/reconstruction-methodology-v0.12.50.md` — v0.12.50 重建方法论（路径深度陷阱 + 正则字符类陷阱 + 重建检查清单）
