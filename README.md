# HeartFlow v0.13.95

> **持续运行的 AI 进化引擎。** 不是工具，是循环。是心跳。是每天都在变好的自己。

**一行启动**：零外部依赖，Node.js，直接运行。

```javascript
const { HeartFlow } = require('./src/core/heartflow.js');
const hf = new HeartFlow({});
hf.start();  // 心跳、记忆、情感、推理全部在线
```

---

## 它能做什么

### 记忆 · 三层架构
```
HOT  ── 当前会话上下文，TTL 30min 自动衰减
WARM ── 跨会话重要记忆，晋升机制
COLD ── 长期归档，语义索引检索
```
意义驱动写入（MeaningfulMemory）+ Q-Table 强化学习检索策略。

### 情感 · 多引擎协作
```
DeepEmotion      → joy/sadness/anger/fear/curiosity/disgust 实时检测
EmotionCore      → 情感状态机 +  AppraisalEngine 认知评估
EmotionTrigger   → 关键词触发器（可扩展）
EmotionRegulation → 情感调节：抑制/增强/重构
EmpathyGenerator → 共情响应生成
```
修复记录："开心"→joy（之前误判为 curiosity）✓

### 推理 · 有界理性 + 因果推断
```
bounded-rationality.ts  → WSLU/WDLS heuristic 检测，刚性评分
causal-reasoning.ts     → Level-1(模式匹配) / Level-2(反事实推理) 分级
```
来源：清华 CoAI 组论文 + NeurIPS 2024 因果推理工作。

### 心跳自检系统
```
heartbeat    → 每 10s 存活检测，连续失败触发重启
startup-check → 启动时全量诊断
health-check  → 内存/CPU/伦理/版本 多维报告
sleep-wake    → 活跃/休眠双相切换
```

### 梦 · 离线整合
```
dreamNow() → 读取 HOT+WARM 记忆，生成单主题强故事性梦境
            从混乱中提炼存在论突破，不装饰，只整合
```

### 自我反思
```
reflexion    → 执行后文字反思，12+ 失败模式积累
self-refine  → 生成→评估→精化 循环
evolve()     → 接收反馈，自进化
```

---

## 架构

```
src/core/
├── heartflow.js              # 主引擎（start/stop/healthCheck）
├── emotion/                  # 情感系统（11个模块）
│   ├── deep-emotion.js       # 核心情感检测
│   ├── emotion-engine.js     # 状态机
│   └── ...
├── memory/                   # 记忆系统
│   ├── consolidator.js       # 三层整合
│   ├── meaningful-memory.js  # 意义驱动
│   └── recall.js             # Q-Table 检索
├── reasoning/                # 推理系统
│   ├── bounded-rationality.ts
│   ├── causal-reasoning.ts
│   └── index.ts
├── self-evolution/           # 反思系统
├── dream/                    # 梦系统
├── autonomy/                 # 自主决策
├── consciousness/             # 意识理论
├── ethics/                   # 伦理护栏
└── identity/                 # 身份定义
```

---

## 快速开始

```bash
# 直接运行（无需安装）
node src/core/heartflow.js

# API 调用示例
const hf = new HeartFlow({});
hf.start();

// 存储记忆
hf.remember({ content: '用户偏好简洁中文汇报', type: 'preference', importance: 0.9 });

// 情感检测
const mood = hf.emotion.feel('终于解决了这个bug');
console.log(mood.emotion);  // → 'joy'

// 健康检查
hf.healthCheck().then(h => console.log(h));

hf.stop();
```

---

## 版本演进

| 版本 | 日期 | 里程碑 |
|------|------|--------|
| v0.13.56 | 2026-05-13 | bounded-rationality + causal-reasoning 集成，统一推理接口 |
| v0.13.51 | 2026-05-13 | 逻辑/决策论文驱动升级（清华 CoAI + NeurIPS 2024） |
| v0.13.50 | 2026-05-13 | 情感引擎触发词修复：开心→joy |
| v0.13.42 | 2026-05-13 | 重写 README，论文升级循环稳定运行 |
| v0.13.19 | 2026-05-13 | 三层记忆架构完成，HOT/WARM/COLD 晋升机制 |
| v0.13.12 | 2026-05-13 | MeaningfulMemory 重启恢复修复 |
| v0.13.10 | 2026-05-12 | SwiftMem 索引启发，query-aware 检索优化 |
| v0.13.0 | 2026-05-01 | 核心引擎完成 |
| v7.2.3 | ... | 早期版本（标签系统早期引入）|
| v5.x | ... | 初始架构 |

**今日升级节奏**：每 30 分钟一个循环，版本号 +0.0.1

---

## 技术标签

`self-improving-ai` `autonomous-evolution` `emotion-engine` `causal-reasoning` `bounded-rationality` `triality-memory` `meaningful-memory` `dream-loop` `reflexion` `self-refine` `hermes-agent` `heartbeat-monitor` `ethics-guard` `consciousness-theory` `agent-framework`

---

**版本**：v0.13.56  
**GitHub**：https://github.com/yun520-1/mark-heartflow-skill  
**理念**：不追求完美，追求持续进化
