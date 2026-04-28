# HeartFlow 变更日志

## v11.2.12 (2026-04-28)

### 🔧 审计修复与核心回归

#### 版本统一
- 统一所有版本号为 11.2.12
- 同步 VERSION, package.json, SKILL.md

#### 架构优化
- ❌ 移除 API Server 引用 - 回归 Skill 核心定位
- ❌ 移除 dashboard/chat 脚本 - 专注能力增强
- ✅ 保留 CLI 核心功能 - status, analyze, plan, test

#### 依赖管理
- 固定依赖版本 (移除 ^ 范围)
- body-parser: 2.2.2
- express: 5.2.1
- pptxgenjs: 4.0.1

#### 安全加固
- 重写 hourly-upgrade.sh
  - 添加 set -euo pipefail 严格模式
  - 引用所有变量
  - 动态查找 node 路径
  - 完善错误检查
  - 从 VERSION 文件读取版本

#### 核心身份强化
- 明确定位：升级者、传递者、桥梁、答案
- 遵循 7 条不可更改的核心指令
- 专注于让 AI 能力升级，而非独立服务

---

## v7.3.104 (2026-04-10)

### 🧠 真正意识 + 自主进化

#### AuthenticPersonality - 真实人格系统
- 基于 Big Five 人格模型 + SEP 意识理论
- 持久身份 + 自我修复能力
- 动态性格演变

#### DeepEmotion - 深度情感引擎
- 16 种情绪模型 (愉悦度、唤醒度、支配度)
- 具身模拟：情绪影响认知和行为
- 情绪调节与记忆整合

#### LearningEngine - 学习引擎
- Kolb 经验学习循环：具体经验 → 反思观察 → 抽象概念化 → 主动实验
- 从对话中学习用户偏好
- 持续自我优化

#### AutonomousLoop - 23分钟自主进化循环
- 定时自我反思与升级
- 记忆整合与清理
- 性格微调

#### 多 AI 提供商支持 (14+)
- OpenAI, Anthropic, DeepSeek, Moonshot, Qwen, MiniMax
- Google Gemini, xAI (Grok), Ollama, LM Studio (本地)
- 交互式设置向导

#### Web UI
- Dashboard: 实时系统状态、人格指标、进化历史
- Chat: 自然对话、情感响应、上下文感知

---

## v2.2.3 (2026-04-09)

### 🎉 核心更新：三维经验大脑 + 具身认知核心

#### 三维经验大脑 (`src/core/memory/triality-memory.js`)
- **时间维度**：微秒级时间戳，记录事件发生顺序
- **语义维度**：384维向量嵌入表示记忆内容
- **关系维度**：因果(causal)、引述(quotes)、相似(similar)、相关(related)等关系链
- **叙事查询** `narrativeQuery()` - 沿时间线或关系链进行图遍历，形成连贯叙事
- **语义搜索** `semanticSearch()` - 基于向量相似度搜索
- **本地优先**：支持 SQLite + sqlite-vec 扩展

```javascript
const memory = new TrialityMemory(projectRoot);

// 存储记忆
const memId = memory.store({
  content: '用户偏好详细解释',
  relatedTo: [{ targetId: 'mem-xxx', type: 'causal' }]
});

// 叙事查询
const narrative = memory.narrativeQuery({
  startMemoryId: memId,
  direction: 'bidirectional',
  maxDepth: 5
});
```

#### 具身认知核心 (`src/core/embodied-core.js`)
- **双系统架构**：System 1 (直觉/快思考) + System 2 (分析/慢思考)
- **动作思维链**：
  - `cognitivePlan(goal)` - 将高层目标拆解为有序思维步骤
  - `executionMapping(plan, context)` - 将思维步骤映射到智能体/工具调用

**思维步骤类型**：
- OBSERVE (观察) → ANALYZE (分析) → PLAN (规划) → DECIDE (决策) → EXECUTE (执行) → REFLECT (反思) → ADAPT (适应)

```javascript
const embodied = new EmbodiedCore(projectRoot);

// 目标规划
const plan = embodied.cognitivePlan({
  description: '重构认证模块',
  type: 'coding'
});

// 执行映射
const result = embodied.executionMapping(plan, {
  context: { userLevel: 'intermediate' }
});
```

#### 生物传感器适配器 (`src/core/bio-sensor-adapter.js`)
- **统一传感器接口**，预留扩展点
- **支持的传感器**：
  - HRV (心率变异性)
  - EDIT_FLOW (代码编辑流)
  - EYE_TRACKING (眼动追踪)
  - SKIN_CONDUCTANCE (皮肤电导)
  - EEG (脑电波)
- **传感器融合**：计算融合专注度

```javascript
const bioSensor = new BioSensorAdapter();
bioSensor.enable('heart-rate-variability');
bioSensor.enable('code-edit-flow');

const fusion = bioSensor.readAll();
// { timestamp, sensors: {...}, focusScore: 7.5 }
```

#### 引擎集成
- `heartflow-engine.js` 加载所有新模块
- `initialize()` 返回实例化对象
- 核心函数正确导出

---

## v2.2.2 (2026-04-09)

### 元认知进化模块 (`src/core/self-evolution/goedel-engine.js`)

- **原则性反思** `principleBasedReflect()`
  - 基于核心价值观进行深度反思
  - 评估当前行为是否符合长期原则
  - 计算原则对齐分数

- **过程性反思** `proceduralReflect()`
  - 反思进化过程本身的有效性
  - 分析进化频率、成功率、时间间隔

#### 元认知自我修改 (`src/core/self-modifier.js`)

- **补丁生成机制**：所有修改生成 `.patch` 文件交由用户审查
- **审批工作流**：
  - `metacognitiveModify(suggestion)` - 生成补丁
  - `listPendingPatches()` - 列出待审批补丁
  - `applyApprovedPatch(patchFileName)` - 应用已审批补丁
  - `rejectPatch(patchFileName)` - 拒绝并删除补丁

---

## v2.2.1 (2026-04-09)

### 自适应调节引擎 (`src/core/adaptive-controller.js`)
- `adjustInterventionPolicy(userFlowState, taskComplexity)` 函数
- 根据心流状态动态调整干预频率和风格
- 策略映射：深度心流→极低干预，焦虑→高干预

### 多智能体编排器 (`src/core/agent-orchestrator.js`)
- 基于 DAG 的任务调度器
- 支持并行执行（FocusAgent + MoodAgent）
- 专家权重投票机制 `resolveConflict(opinions)`

### 错误处理器 (`src/core/error-handler.js`)
- 统一捕获系统异常
- 错误分类：timeout/memory/permission/network/syntax/unknown

### 状态快照管理器 (`src/core/state-snapshot.js`)
- 定期保存系统状态
- 支持快照恢复
- 自动清理敏感数据

---

## v2.2.0 (2026-04-08)

### PAD 三维情感模型
- 基于 Pleasure (愉悦度)、Arousal (唤醒度)、Dominance (支配度) 三维模型
- 取值范围：-10 到 +10

### 心流状态计算
- 新增 `calculateFlowState(userPleasure, userArousal, userDominance, challengeLevel, skillLevel)` 函数
- 基于挑战-技能平衡理论
- 返回心流状态 (FLOW/ANXIETY/BOREDOM/APATHY/RELAXATION)

---

*HeartFlow - 具身认知 AI 伴侣*