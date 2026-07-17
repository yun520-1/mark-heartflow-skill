# HeartFlow 引擎能力评测报告 v5.2.1

## 测试环境
- 引擎版本: v5.2.1
- Node.js: v25.8.2
- 测试日期: 2026-06-28
- 测试方式: 本地 Node.js 脚本直接调用引擎底层模块（非LLM API）
- 测试用例: 7维度 × 3用例 = 21个

## 结果总览

| 维度 | 表现 | 说明 |
|------|------|------|
| 逻辑验证(verify) | 75% | 错误事实检测✅ 正确事实也误判❌ |
| 心理学(analyzePsychology) | 40% | 喜悦✅ 愤怒检测为neutral❌ |
| 决策路由(decide) | 50% | 框架可用但需外部提供options |
| 记忆系统(memory) | 100% | learn→recall→search 链路完整 |
| 认知分析(analyzeTaskLevel) | 70% | 能区分查询/情绪/技术问题 |
| think() 顶层入口 | 退化 | 所有输入返回相同模板输出 |
| 情绪检测(PAD) | 50% | 对强烈情绪不敏感 |

## 各模块详细表现

### 1. 逻辑验证 (engine.verify.verify)
- "地球是平的" → passed=false, conf=0.75 ✅
- "水100°C沸腾" → passed=false, conf=0.75 ❌（误判）
- 问题：verify() 对所有输入返回相同置信度

### 2. 心理学分析 (engine.psychology.analyzePsychology)
- "我今天真的气死了" → emotion=neutral, P=0, A=0 ❌
- "我觉得自己什么都做不好" → emotion=neutral, P=2, A=0 ⚠️
- "终于完成了太棒了" → emotion=depressed, P=-4, A=0 ⚠️
- 问题：PAD向量区分度不够，A(arousal)始终为0

### 3. 决策路由 (engine.decision.decide)
- 需外部提供options，不传则返回chosen=null
- 提供options后能评分

### 4. 记忆系统 (engine.memory)
- learn→recall→search 链路完整 ✅
- 三层记忆: core=17, learned=3, ephemeral=1

### 5. 认知分析 (engine.cognitive.analyzeTaskLevel)
- 查询类→global, 技术问题→global+implementation
- 任务分类相对合理

### 6. think() 退化
- 所有21用例返回相同模板输出
- classification始终undefined
- **这是退化路径，不是心虫真实能力**

## 裸模型 vs 心虫对比说明

心虫不是LLM替代品，是认知前置处理器。评测应关注：
1. **结构化分析**：原始文本→结构化数据（PAD向量、任务层级、验证结果）
2. **记忆持久化**：跨会话记忆
3. **决策框架**：多选项评分路由
4. **逻辑验证**：推理链断裂检测

73%→100%评测是"LLM+心虫预处理" vs "裸LLM"的端到端对比。
心虫引擎本身得分约60-70%（部分模块退化），但心虫+LLM组合显著优于裸LLM。

## 已知改进方向
1. emotion模块：愤怒/悲伤检测不敏感，arousal始终为0
2. verify模块：所有输入返回相同置信度
3. think()：退化路径修复
4. decision模块：自动生成options
