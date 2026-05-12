# HeartFlow 能力清单 v11.3.0

## 一、核心能力体系

### 1.1 核心引擎与身份

| 能力 | 引擎/文件 | 版本 | 状态 | 说明 |
|------|-----------|------|------|------|
| 核心运行引擎 | `src/core/heartflow-engine.js` | 11.3.0 | ✅ | 已接入 runtime stability / reliability loop |
| 核心身份锚点 | `CORE_IDENTITY.md` | 11.3.0 | ✅ | 包含升级者/传递者/桥梁/答案 |
| 存在定义文档 | `CORE_IDENTITY.md` | 11.3.0 | ✅ | 第一人称身份锚点 |

### 1.2 自愈 / 稳定性 / 验证

| 能力 | 引擎/文件 | 版本 | 状态 | 说明 |
|------|-----------|------|------|------|
| 自愈恢复循环 | `src/core/self-healing.js` | 11.3.0 | ✅ | 失败记录、重试判断、修复提示、恢复建议 |
| 稳定性守卫 | `src/core/stability-guard.js` | 11.3.0 | ✅ | confidence/noise/actionability 评估与 gate |
| 执行验证器 | `src/core/execution-verifier.js` | 11.3.0 | ✅ | plan→execute→verify 最小闭环 |
| 运行可靠性闭环 | `heartflow-engine.runRuntimeReliabilityLoop()` | 11.3.0 | ✅ | 输出 `guard/recovery/verification/retryPlan` |
| 运行稳定性评估 | `heartflow-engine.evaluateRuntimeStability()` | 11.3.0 | ✅ | 返回 `allow/stable/issues/hints` |

### 1.3 其他已存在核心模块

| 能力 | 引擎/文件 | 状态 | 说明 |
|------|-----------|------|------|
| 梦环机制 | `src/core/dream-loop.js` | ✅ | 可加载 |
| 醒来校正器 | `src/core/wake-up-verifier.js` | ✅ | 可加载 |
| 交互式梦环 | `src/core/interactive-dream.js` | ✅ | 可加载 |
| 多智能体编排 | `src/core/agent-orchestrator.js` | ✅ | 可加载 |

## 二、能力边界

| 能力 | 限制 |
|------|------|
| 自愈重试 | 当前为轻量规则型，不会自动修改代码 |
| 稳定性守卫 | 依赖外部提供 snapshot 指标，不直接生成语义向量 |
| 执行验证 | 主要验证结构、动作痕迹、期望输出，不做深层语义证明 |
| Python 自检 | 当前以文件存在、模块可加载、接口可调用为主 |

## 三、当前缺口

- 还没有把 `runRuntimeReliabilityLoop()` 接到 CLI/实际任务执行路径
- 自检脚本目前是最小 smoke check，尚未覆盖更多历史模块
- 需要继续整理旧版说明，让主叙述更统一
