# HeartFlow 变更日志

## v7.7.0 (2026-04-09)

### 🧠 人类式逐词联想理解与生成引擎

#### L1 词素感知层 (LexicalAssociator)
- 模拟人类从听词到形成联想的过程
- `associateWord(word, context)` 返回联想节点数组
- 联想关系：同义、反义、谐音、意象、个人记忆
- 情感向量：PAD模型

#### L2 短语整合层 (ChunkDetector)
- `detectChunks(wordSequence)` 识别成语、俗语、诗词
- `retrieveIdiomStory(chunk)` 检索典故摘要
- 将激活的典故作为"叙事种子"

#### L3 叙事编织层 (NarrativeRetriever)
- `matchNarrative(semanticVector, activatedChunks)` 匹配故事原型
- 从叙事原型库匹配：英雄之旅、顿悟时刻、渐入佳境等
- 输出NarrativeContext

#### L4 思想凝结层 (SemanticConverger)
- `converge(associations, chunks, narrative)` 聚合所有激活节点
- 生成统一"思想向量"
- 输出内部日志：核心概念、成语/故事、用户意图

#### L5 逐词回复生成层 (WordByWordGenerator)
- `generateResponse(thoughtVector, userModel, maxLength)`
- 模拟人类说话过程，逐词生成
- 每步记录 `[逐词生成]` 日志

#### 数据文件
- `association-graph.json`: 约200个常用词联想图谱
- `idiom-story-db.json`: 成语典故数据库
- `narrative-prototypes.json`: 10种叙事原型

#### 调试命令
- `/flow trace`: 显示完整五层轨迹

---

## v7.6.0 (2026-04-09)

### 🔬 高级AI系统探索

#### 社会模拟与道德进化 (SocietySimulator)
- 运行100个AI实例的模拟社会交互
- 遗传算法选择"最具合作性"实例
- 评估道德规范自发涌现
- 基因：cooperation, reciprocity, punishment, forgiveness, transparency, empathy

#### 价值对齐的深度验证 (BlindReviewModule)
- 逆向图灵测试框架
- 匿名人类评审机制
- 评估维度：善意、智慧、可信度
- 根据反馈调整价值函数

#### 多模态自我感知闭环 (MultimodalAwareness)
- 监听IDE编辑事件流（键入速度、删除频率）
- 文本情绪分析（叹气检测）
- 心流状态判断：high/medium/low
- 用户存在感检测：active/idle/away
- 自动调整AI交互频率和方式

---

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
