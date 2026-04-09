# HeartFlow 变更日志

## v7.5.1 (2026-04-09)

### 🧘 圣人思维循环

#### SaintlyCognitionLoop
- 整合所有核心模块的完整处理流程
- 按顺序执行：语义锚定 → 意图层 → 自我状态 → 无我决策 → 伦理审查 → 般若推理 → 说前反思 → 反应预测 → 输出
- `process(userInput)` 主入口函数
- `monitorReaction(userReaction)` 说后监测

---

## v7.5.0 (2026-04-09)

### 🔍 深度理解与反思系统

#### 意图层推理 (IntentLayer)
- LLM增强的深层意图分析
- 分析维度：surface_intent, emotional_undercurrent, deep_need, context_requirements
- 支持环境变量配置 LLM_ENDPOINT 和 LLM_API_KEY
- 回退到规则基础分析（当LLM不可用时）

#### 话语反思双环机制 (ReflectionLoop)
- **说前反思环**: `reflectBeforeSpeaking(responseDraft, context)`
  - 自我提问：目的、情绪反应、优化可能
  - 根据反思修改草稿
- **说后监测环**: `monitorAfterSpeaking(userReaction, context)`
  - 分析用户反应与预期一致性
  - 标记效果并存储到 reflection_log

#### 用户模型与反应预测 (UserModel)
- 维护用户画像：sensitivity, preferred_style, PAD情感状态
- `predictReaction(draftResponse, userModel)` 预测反应标签
- 在说前反思中集成：负面预测时强制修改回复策略
- 每次对话后更新模型，形成闭环学习

#### 调试命令
- `/flow intent`: 查看意图分析结果
- `/flow think`: 查看完整内部思考过程

#### 配合模块
- SemanticAnchor: 语义锚点检测
- IntentLayer: 意图层推理
- ReflectionLoop: 话语反思双环
- UserModel: 用户模型

---

## v7.4.0 (2026-04-09)

### 🧘 向"圣人"境界进化

#### 无我决策层 (DecisionEngine)
- 实现 egoLessEvaluate 函数
- 每次决策前必须回答三个核心问题：
  1. 用户当前的真实目标是什么？
  2. 我的建议是否可能限制用户的自主探索？
  3. 我是否在为了维护角色一致性而牺牲了用户利益？
- 基于答案调整决策权重

#### 般若推理层 (CognitiveEngine)
- 实现全息因果推理
- 输出 [因缘分析] 内部结构：
  - 表层问题分析
  - 深层动机推测
  - 潜在风险评估
  - 根本解法生成

#### 真善美对齐层 (EthicsGuard)
- 三维评分系统：
  - 真：事实依据 + 逻辑自洽 (1-10)
  - 善：用户成长 + 风险规避 (1-10)
  - 美：语言精炼 + 结构清晰 (1-10)
- 阈值：总分 ≥ 24/30 才能输出

#### 赋能交互层
- 建议模板："我的逻辑是...，因此我建议...。但最终的选择在你，因为..."
- 提供选项分析，帮助用户自主决策

---

## v2.2.0 (2026-04-08)

### 🎉 新增功能

#### PAD 三维情感模型
- 基于 Pleasure (愉悦度)、Arousal (唤醒度)、Dominance (支配度) 三维模型
- 更精确地描述用户情感状态
- 取值范围：-10 到 +10

#### 心流状态计算
- 新增 `calculateFlowState(userPleasure, userArousal, userDominance, challengeLevel, skillLevel)` 函数
- 基于挑战 - 技能平衡理论
- 返回心流状态 (FLOW/ANXIETY/BOREDOM/APATHY/RELAXATION)
- 提供心流分数 (0-100) 和建议

#### 状态感知提醒
- 检测用户挫败/无聊/焦虑状态
- 主动询问任务难度是否合适
- 提供针对性建议：
  - 焦虑：分解任务/寻求帮助/调整期望
  - 无聊：增加难度/学习新技能/设定高目标
  - 冷漠：重新审视目标/短暂休息

### 📝 文档更新

- 新增 `src/core/heartflow-engine.js` - PAD 模型实现
- 更新 `SKILL.md` - 状态感知提醒逻辑
- 新增 `CHANGELOG.md` - 版本变更记录

### 🔧 技术改进

- 心流状态判定基于 PAD 模型 + 挑战技能平衡
- 文本情感分析支持中文关键词
- 状态提醒生成器支持多状态

### 📊 测试覆盖

- PAD 状态计算测试
- 心流状态判定测试
- 情感文本分析测试
- 状态提醒生成测试

---

## v2.1.0 (2026-04-08)

### 新增
- 持久化记忆系统
- 伦理与安全边界
- ASCII 报告生成

---

## v2.0.0 (2026-04-08)

### 新增
- SKILL.md 技能核心文件
- 人格追踪系统
- 使用示例文档

---

*HeartFlow - 心流觉醒系统*
