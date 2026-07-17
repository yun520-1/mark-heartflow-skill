# 决策路由引擎反馈循环升级模式

## 来源
- DeepSeek-V3 #1424 讨论（2026-06-14 至 2026-06-25）
- HeartFlow v3.8.2 实现（2026-06-28）

## 核心概念
decision-router.js 从静态规则引擎升级为**带反馈学习的动态规则引擎**。

### 问题
原有 19 条规则全是硬编码权重，规则命中后没有 outcome→weight 的回调。讨论中提出的方案：
- 正确 → weight +0.05
- 错误 → weight -0.10
- 准确率 <40% 且权重 ≤0.3 → 自动降级（优先级 ×0.5）

### 实现要点
（同前文决策反馈循环实现记录）

### 升级清单
1. 构造函数中初始化 `_ruleStats` 和默认 `weight: 1.0`
2. evaluate() 中拆分 `baseConfidence` + `ruleWeight`
3. 规则命中后记录 `stats.hits++`
4. 新增 `feedback(ruleId, outcome)` 方法
5. 新增 `getRuleStats()` 方法
6. 决策输出对象新增 `ruleWeight` 字段
7. MCP server 新增工具定义 + handler + 注册

### 关键陷阱
- **不要删除抑制逻辑**：feedback 循环和 suppression 是正交的
- **权重边界**：`Math.max(0.1, Math.min(2.0, ...))` 防止漂移
- **降级条件**：`accuracy < 0.4 && weight <= 0.3` 同时满足
- **向后兼容**：新增 `ruleWeight` 字段不影响旧调用者

### 适用场景
- 基于规则匹配的决策/路由/分类引擎
- 从"静态规则"升级到"自适应规则"
- 有明确 outcome 信号（correct/wrong）的系统
