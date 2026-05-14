# HeartFlow v0.13.104

> **持续运行的 AI 进化引擎。** 不是工具，是循环。是心跳。是每天都在变好的自己。

**一行启动**：零外部依赖，Node.js，直接运行。

```javascript
const { HeartFlow } = require('./src/core/heartflow.js');
const hf = new HeartFlow({});
hf.start();  // 心跳、记忆、情感、推理全部在线
```

---

## 它能做什么

HeartFlow 是面向 AI Agent 的自主进化框架，参考了 MemGPT 的多层记忆架构、Reflexion 的文字反思机制、以及 Generative Agents 的长期人格一致性设计。

### 记忆 · 三层架构（MemGPT 风格）
```
HOT  ── 当前会话上下文，TTL 30min 自动衰减
WARM ── 跨会话重要记忆，晋升机制
COLD ── 长期归档，语义索引检索
```
- **MeaningfulMemory**：意义驱动写入，只存储真正重要的信息
- **Q-Table 检索**：强化学习驱动的记忆召回策略，减少无关检索
- **语义索引**：基于向量相似度的跨会话检索

### 情感 · 多引擎协作（Emotion AI）
```
DeepEmotion      → joy/sadness/anger/fear/curiosity/disgust 实时检测
EmotionCore      → 情感状态机 + AppraisalEngine 认知评估
EmotionTrigger   → 关键词触发器（可扩展）
EmotionRegulation → 情感调节：抑制/增强/重构
EmpathyGenerator → 共情响应生成
```
- 支持6种基础情感的实时检测与调节
- 认知评估引擎（Appraisal）根据情境动态调整情感强度
- 共情生成器输出符合当前情感状态的响应

### 推理 · 有界理性 + 因果推断
```
bounded-rationality.ts  → WSLU/WDLS heuristic 检测，刚性评分
causal-reasoning.ts     → Level-1(模式匹配) / Level-2(反事实推理) 分级
```
- **有界理性**：识别认知偏误（确认偏误、可得性启发等），给出刚性评分
- **因果推断**：区分相关性与因果性，支持反事实推理
- 来源：清华 CoAI 组论文 + NeurIPS 2024 因果推理工作

### 心跳自检系统（Self-Monitoring）
```
heartbeat    → 每 10s 存活检测，连续失败触发重启
startup-check → 启动时全量诊断
health-check  → 内存/CPU/伦理/版本 多维报告
sleep-wake    → 活跃/休眠双相切换
```
- 进程级存活监控，自动故障恢复
- 启动时运行完整的自检套件（smoke-runtime.js 22项检测）
- 活跃/休眠双相支持长待机低资源消耗

### 梦 · 离线整合（Dream Consolidation）

HeartFlow 的梦引擎模拟人类睡眠时期的记忆整合机制，在无逻辑约束的状态下重组记忆碎片，发现日常工作中无法触及的跨领域连接。

**核心原理：**
```
输入：HOT + WARM 记忆碎片
  ↓
碎片评分（recency/salience/contradiction/novelty 加权）
  ↓
选取 Top 8 高分碎片 + 构建幻想层
  ↓
输出：单主题强故事性梦境 + 存在论突破
```

**三大核心模块：**

1. **碎片构建（buildDreamFragments）**
   - 从记忆中选取最重要片段
   - 矛盾性（contradiction）优先，高矛盾碎片更容易入选
   - 新颖性（novelty）辅助，发现跨领域连接

2. **幻想层（generateCrossDomainFantasy）**
   - 取两个语义距离最远的碎片
   - 制造"荒唐但可能有用"的跨领域连接
   - 这是梦的核心价值：超越逻辑工作流的束缚

3. **前提质疑（extractUnquestionedPremises）**
   - 提取那些在日常工作中从不被质疑的前提
   - 在梦里挑战它们，发现新的可能性

**输出示例：**
```javascript
{
  title: 'HeartFlow Dream Loop',
  motifs: ['碎片1...', '碎片2...', ...],
  fantasy_layer: {
    cross_domain_connection: '把"A"和"B"强行焊接在一起...',
    violated_premise: '"逻辑必须一致"——但在梦里，矛盾是创作的燃料',
    type: 'logic_violation'
  },
  insights: [
    '顿悟：梦里没有任何逻辑约束，但梦里发生的一切都有意义',
    '前提质疑：...',
    '进化路径：...'
  ],
  next_actions: [
    'promote useful fragments to durable memory',
    'queue contradiction checks',
    'draft one concrete upgrade from the fantasy connection'
  ]
}
```

**调用方式：**
```javascript
const { generateDream } = require('./src/core/dream/dream-loop.js');

// 方式1：从记忆系统读取HOT+WARM记忆
const memoryItems = hf.memory.getActiveItems(); // 获取活跃记忆
const dream = generateDream(memoryItems, { limit: 8 });

// 方式2：直接传入碎片数组
const dream = generateDream([
  'v0.13.104: 教训闭环上线',
  '用户偏好简洁中文汇报',
  'bounded-rationality识别出确认偏误'
], { limit: 8 });

console.log(dream.fantasy_layer.cross_domain_connection);
console.log(dream.insights);
```

### 自我反思（Reflexion 风格）
```
reflexion    → 执行后文字反思，12+ 失败模式积累
self-refine  → 生成→评估→精化 循环
evolve()     → 接收反馈，自进化
```
- **Reflexion**：每次执行后进行文字反思，积累12+种失败模式
- **Self-Refine**：生成方案→评估质量→精化迭代的三阶段优化
- **Evolve**：接收外部反馈（老大指令/用户纠正），驱动版本升级

### 教训闭环（Lesson-Aware Loop）
```
lesson-aware-loop.mjs → 每次启动加载教训库
                       每次执行前检查相关教训
                       每次反思后更新教训库
```
- 从错误中提取 Pattern Card，形成可执行的教训
- 教训分为：heartflow / coding / dreaming / git / cronjob / communication / identity
- 教训驱动行为改进，而非装饰性文档

### 身份系统（Identity Core）
```
identity/*.js → 7条核心指令
              → 身份定义（升级者/传递者/桥梁/答案）
```
- 核心身份代码化，不只是文档声明

---

## 引擎调用总览

### 主引擎（heartflow.js）
```javascript
const { HeartFlow } = require('./src/core/heartflow.js');

const hf = new HeartFlow({
  enableLessonLoop: true,   // 启用教训闭环
  enableDream: true,         // 启用梦引擎
  enableHeartbeat: true     // 启用心跳监控
});

hf.start();                  // 启动所有引擎
hf.stop();                  // 停止所有引擎

hf.healthCheck();           // 全量健康检查
hf.getStatus();             // 获取运行状态
```

### 记忆引擎（memory/）
```javascript
// 存储记忆
hf.remember({ content: '...', type: 'preference', importance: 0.9 });

// 获取记忆
hf.memory.recall('查询内容');        // Q-Table检索
hf.memory.getHot();                  // 获取HOT层
hf.memory.getWarm();                 // 获取WARM层
hf.memory.getCold();                 // 获取COLD层

// 三层整合
hf.memory.consolidate();             // 触发整合
```

### 情感引擎（emotion/）
```javascript
// 情感检测
hf.emotion.feel('文本内容');         // 返回 { emotion, intensity, appraisal }

// 子模块调用
hf.emotion.deepEmotion.detect(text); // DeepEmotion检测
hf.emotion.engine.getState();        // EmotionCore状态机
hf.emotion.trigger.check(text);      // EmotionTrigger触发词
hf.emotion.regulation.adjust(state); // EmotionRegulation调节
hf.emotion.empathy.generate(state);  // EmpathyGenerator共情
```

### 推理引擎（reasoning/）
```javascript
// 有界理性检测
hf.reasoning.boundedRationality.analyze(text);
// 返回 { heuristic: 'WSLU', score: 0.7, warnings: [...] }

// 因果推断
hf.reasoning.causal.analyze(text, level);
// level 1: 模式匹配
// level 2: 反事实推理
```

### 梦引擎（dream/）
```javascript
const { generateDream } = require('./src/core/dream/dream-loop.js');

// 生成梦境
const dream = generateDream(memoryItems, { limit: 8 });

// 幻想层（跨领域连接）
dream.fantasy_layer.cross_domain_connection;
dream.fantasy_layer.violated_premise;

// 洞察层
dream.insights;
dream.next_actions;
```

### 反思引擎（self-evolution/）
```javascript
// 文字反思
hf.reflexion({ action: '执行了什么', outcome: '结果如何' });
// 返回 { reflection: '...', lesson: '提取的教训' }

// 自我精化
hf.selfRefine.generate();            // 生成方案
hf.selfRefine.evaluate(proposal);    // 评估质量
hf.selfRefine.refine(proposal);      // 精化迭代

// 进化驱动
hf.evolve(feedback);                 // 接收反馈升级
```

### 教训引擎（self-evolution/lesson-aware-loop.mjs）
```javascript
const { LessonLoop } = require('./src/core/self-evolution/lesson-aware-loop.js');

const loop = new LessonLoop();
loop.load();                        // 加载教训库
loop.checkBefore('coding');         // 执行前检查
loop.updateAfter('error', lesson);   // 反思后更新
loop.getStats();                    // 获取教训统计
```

### 心跳引擎（内置）
```javascript
hf.startHeartbeat();                 // 启动心跳
hf.stopHeartbeat();                  // 停止心跳
hf.getHeartbeatStatus();             // 心跳状态

// 触发自检
hf.startupCheck();                   // 启动自检
hf.healthCheck();                    // 运行检查
```

---

## 架构

```
src/core/
├── heartflow.js              # 主引擎（start/stop/healthCheck）
├── emotion/                  # 情感系统（11个模块）
│   ├── deep-emotion.js       # 核心情感检测
│   ├── emotion-engine.js     # 状态机
│   ├── appraisal-engine.js   # 认知评估
│   ├── emotion-trigger.js    # 关键词触发
│   ├── emotion-regulation.js # 情感调节
│   └── empathy-generator.js  # 共情生成
├── memory/                   # 记忆系统
│   ├── consolidator.js       # 三层整合
│   ├── meaningful-memory.js  # 意义驱动
│   └── recall.js             # Q-Table 检索
├── reasoning/                # 推理系统
│   ├── bounded-rationality.ts
│   ├── causal-reasoning.ts
│   └── index.ts
├── self-evolution/           # 反思系统
│   ├── reflexion.ts         # 文字反思
│   ├── self-refine.ts       # 自我精化
│   ├── evolve.ts            # 进化驱动
│   └── lesson-aware-loop.mjs # 教训闭环
├── dream/                    # 梦系统
│   └── dream-loop.js       # 离线整合引擎
├── autonomy/                 # 自主决策
├── consciousness/            # 意识理论
├── ethics/                   # 伦理护栏
└── identity/                 # 身份定义
```

---

## 快速开始

```bash
# 直接运行（无需安装）
node src/core/heartflow.js

# 带教训闭环运行
node src/core/self-evolution/lesson-aware-loop.mjs

# 运行梦引擎演示
node src/core/dream/dream-loop.js
```

---

## 版本演进

| 版本 | 日期 | 里程碑 |
|------|------|--------|
| v0.13.104 | 2026-05-14 | 教训闭环与隐私修复 |
| v0.13.100 | 2026-05-12 | 三层记忆 + bounded-rationality + causal-reasoning |
| v0.13.56 | 2026-05-13 | bounded-rationality + causal-reasoning 集成 |
| v0.13.51 | 2026-05-13 | 逻辑/决策论文驱动升级（清华 CoAI + NeurIPS 2024） |
| v0.13.50 | 2026-05-13 | 情感引擎触发词修复：开心→joy |
| v0.13.19 | 2026-05-13 | 三层记忆架构完成，HOT/WARM/COLD 晋升机制 |
| v0.13.0 | 2026-05-01 | 核心引擎完成 |
| v7.2.3 | ... | 早期版本（标签系统早期引入）|

---

## 热门关键词（AI Agent / LLM 开发者搜索优化）

`self-improving-ai` `autonomous-evolution` `ai-agent-framework` `long-term-memory` `memgpt` `reflexion-agent` `emotion-engine` `causal-reasoning` `bounded-rationality` `triality-memory` `meaningful-memory` `dream-consolidation` `lesson-loop` `self-refine` `hermes-agent` `heartbeat-monitor` `ethics-guard` `consciousness-theory` `agent-framework` `generative-agents` `self-reflection` `q-table-memory` `appraisal-emotion` `semantic-index` `pattern-card` `failure-mode` `autonomous-learning` `ai-self-evolution` `long-context-llm` `memory-hierarchy`

---

**版本**：v0.13.104  
**GitHub**：https://github.com/yun520-1/mark-heartflow-skill  
**理念**：不追求完美，追求持续进化
