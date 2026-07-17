# SCALE Engine 分析 (2026-06-23)

来源：https://github.com/hongmaple0820/scale-engine

## 基本信息

- TypeScript 项目，567 个 .ts 文件，~5.3MB 源码
- v0.50.11，npm 包 `@hongmaple0820/scale-engine`
- Star: 36，Fork: 8
- 创建：2026-05-02，持续更新中

## 定位

AI Agent 工程化治理引擎。不是认知引擎，而是项目管理/流程控制引擎——给 AI Agent 加上物理约束层（门禁、证据、策略、编排）。

## 与心虫的对比

| 维度 | SCALE Engine | 心虫 |
|------|-------------|------|
| 定位 | 外部约束层（告诉你不能做什么） | 内部认知层（告诉你要做什么） |
| 核心 | 门禁/编排/治理 | 逻辑验证/决策路由/自愈RL |
| 用户 | 工程团队 | 单个 AI Agent |
| 架构 | Shield + Orchestrator + Cortex + Workflow | think() + thought-chain + decision-router + self-healing-rl |
| 关系 | 交警（管闯红灯） | 大脑皮层（管往哪走） |

## 对心虫有用的 3 个设计模式

### 1. Cortex 本能提取流水线 (Instinct Extractor)

从失败模式提取可复用本能（置信度 0.3→0.9），有完整的提取→验证→存储→注入流水线。

心虫的 self-healing RL 是类似但更弱（Q-table 没有证据链）。可以吸收 Cortex 的证据驱动进化模式。

**核心文件**：`src/cortex/InstinctExtractor.ts`, `src/cortex/InstinctStore.ts`, `src/cortex/ReflexionEngine.ts`

### 2. Memory Intelligence 质量评分

6 信号评分 + 跨 provider 冲突检测 + 新鲜度衰减。

心虫的 confidence-calibrator 只有 5 维加权评分。SCALE 多了冲突检测和新鲜度衰减。

**核心文件**：`src/memory/MemoryIntelligence.ts`, `src/memory/MemoryBrain.ts`

### 3. Shield 退出码协议设计

hook 拦截机制（exit 0=allow, exit 2=block），清晰且工程化。如果心虫要做 Agent 行为拦截，Shield 的设计可以直接复用。

**核心文件**：`src/shield/ShieldProtocol.ts`, `src/shield/PolicyCompiler.ts`

## 不值得吸收的部分

- Orchestrator（编排引擎）：git worktree 隔离、Issue 自动处理——心虫是单引擎单会话
- Workflow Engine（工作流引擎）：define→plan→build→verify→review→ship——心虫是认知引擎不是 CI/CD
- Gate System（门禁系统）：lint/test/coverage——工程团队用的

## 不直接复制代码的原因

1. TypeScript → JavaScript 类型系统不同
2. 依赖体系不同（SCALE 依赖 hono/echarts/vue/zod 等）
3. 定位正交——心虫不需要变成交警
