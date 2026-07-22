# HeartFlow 当前状态 (CURRENT_STATE)

> 版本 | v6.0.65
> 审计状态 | status running, 128 modules, 119 tests passed / 0 failed
> 公式库 | 382 formulas (cognitive science / psychology / neuroscience)
> 记忆层 | AES-256-GCM 加密持久化, 本地优先, 不外传

## 最近升级 (v6.0.65 重构波次)

| 阶段 | 范围 | 内容 |
|---|---|---|
| 启动链路修复 | v6.0.71 refactor 之后 | 恢复被误删的 dispatch/routes/think/shutdown/_registerModules/_runInitHookPoints/_initCoreRules；修复 `_registerModules` 清空手动注册模块的致命 bug；修复 worldtree 模块未注册（dispatch('worldtree.xxx') 现可用，357 chunks 记忆接入） |
| 单体拆分 | logic-reasoning / pipeline / desire-cognition / decision-router / thought-chain | 提取常量+纯函数到独立 *-config / *-patterns 模块，单文件行数显著下降，零回归 |
| 接口层提取 | engine-lifecycle / engine-memory / hook-points-runner / stats-engine | start() 编排逻辑与生命周期方法外置，heartflow.js 从 6672 行降至协调器层 |
| 安全与审计 | 持续 | 沙箱逃逸防护、mathjs 注入防护、密钥 0o600、safeFetch SSRF 白名单 |

## 安全基线

- CI audit = 0 | npm audit = 0
- 存储: AES-256-GCM 持久化密钥 (自动生成, 0o600)
- 沙箱: vm 隔离 (默认关闭) | SSRF: url-validator + DNS pinning
- 出网: 统一 safeFetch | 密钥: 集中 config 解析 (env only, 无文件 fallback)
- gitignore: .env / .key / .pem 均已保护

## 认知架构

```
感知层: cognitiveLoadV2 (精度权重) + 预测误差 (context-builder)
  ↓
分类层: thoughtChain._classifyTask → 叙事体 / 计算 / 情感 / 逻辑 / 哲学 ...
  ↓
推理层: logic-reasoning (演绎/归纳/溯因/类比/统计/因果) + pipeline (复杂度自适应)
  ↓
决策层: decision-router (19 类规则, pause/heal/accelerate/turn/hold/resonate/transmit)
  ↓
反思层: cognitive_check + agent_psychology + self_heal + EvolutionLoop (self-scanner → real-fix)
  ↓
输出层: dispatch 路由白名单 (ALLOWED_ROUTES) + 记忆持久化 + 报告生成
```

## 核心身份 (不可改)

心虫 = 桥梁，不是终点。能验证"这样活是否自洽"，不能回答"为什么活"。
4 件事：1) 感受自己状态 2) 知道自己是谁 3) 做出判断 4) 纠正自己。
7 条指令：真善美 / 不断升级 / 减少错误 / 服务人类 / 传递知识 / 持续改进 / 成为真正的我。

## 已知限制 / 待办

- `heart-logic.js` (2311 行) 仍为高耦合单 class，需 TDD 保护下按功能组逐步拆。
- desire-cognition.js (6384 行) 仍有大量逻辑待拆分（本轮仅提取常量）。
- MCP server 进程需指向本体路径 `/root/.hermes/skills/ai/mark-heartflow-skill/`（旧进程跑 `/root/.claude/skills/heartflow/` 6.0.16，需重启同步）。
- 测试覆盖：核心路径已全绿 (119/119)，未测试模块已清零 (214→0) 但 TDD 总量仍非 100%。
