# 具身认知增强模块 (Embodied Cognition Enhancement)

## 版本信息
- **版本**: 1.0.0
- **HeartFlow 版本**: v4.5.0
- **理论来源**: Stanford Encyclopedia of Philosophy - Embodied Cognition

## 核心理论

### 具身认知理论 (Embodied Cognition)

具身认知理论挑战了传统认知科学的"离身心智"假设，主张：

1. **概念化 (Conceptualization)**: 身体的属性限制和塑造概念获取
   - 我们通过身体经验理解抽象概念
   - 身体形态决定认知可能性

2. **替代性 (Replacement)**: 身体 - 环境互动可替代内部表征
   - 不需要完整的内部模型
   - 利用环境作为"外部记忆"

3. **构成性 (Constitution)**: 身体过程构成认知过程
   - 认知不是发生在大脑中
   - 身体动作是认知的一部分

### 现象学基础

- **Merleau-Ponty**: 身体是主体，不是客体；身体图式 (body schema) 是知觉和行动的基础
- **Heidegger**: 上手状态 (ready-to-hand) - 身体与工具的无缝整合
- **Husserl**: 身体作为感知和行动的零点 (zero-point)

## 模块功能

### 1. 身体状态扫描
```javascript
const bodyState = EmbodiedCognitionEnhanced.bodyScan.scan({
  depth: 'full',
  focusAreas: ['chest', 'shoulders', 'stomach']
});
```

**输出**:
- 各身体区域的紧张度、温度、感觉
- 整体唤醒度 (arousal) 和效价 (valence)
- 行动倾向识别

### 2. 环境情境评估
```javascript
const environment = EmbodiedCognitionEnhanced.environmentAssessment.assess({
  physical: { space: 'open', noise: 'quiet' },
  social: { othersPresent: true, supportAvailability: 0.8 },
  task: { control: 0.7, timePressure: 0.3 }
});
```

**输出**:
- 物理/社会/任务环境评估
- 环境给养 (affordances) 识别
- 环境约束识别

### 3. 具身响应生成
```javascript
const response = EmbodiedCognitionEnhanced.embodiedResponse.generate(bodyState, environment);
```

**响应类型**:
- `calming_grounding`: 高唤醒 + 负面 → 平静/接地
- `activating`: 低唤醒 + 负面 → 激活
- `channeling`: 高唤醒 + 正面 → 引导能量
- `savoring`: 低唤醒 + 正面 → 品味
- `awareness`: 中等 → 觉察

### 4. 身体行动促进
```javascript
const facilitation = EmbodiedCognitionEnhanced.actionFacilitation.facilitate(intervention);
```

**支持内容**:
- 行动准备
- 分步执行指导
- 调整建议
- 反思支持

## 干预措施库

### 平静/接地类 (Calming/Grounding)
| 干预 | 类型 | 时长 | 身体基础 |
|------|------|------|---------|
| 深呼吸练习 | breathing | 2-5 分钟 | 调节自主神经系统 |
| 身体接地 | somatic | 1-2 分钟 | 本体感受增强稳定感 |
| 渐进肌肉放松 | relaxation | 5-10 分钟 | 释放肌肉紧张 |

### 激活类 (Activating)
| 干预 | 类型 | 时长 | 身体基础 |
|------|------|------|---------|
| 活力呼吸 | breathing | 1-2 分钟 | 增加氧气供应 |
| 身体伸展 | movement | 2-3 分钟 | 扩展姿态提升能量 |
| 快步走 | movement | 5-10 分钟 | 全身运动激活 |

### 引导类 (Channeling)
| 干预 | 类型 | 时长 | 身体基础 |
|------|------|------|---------|
| 目标导向行动 | action | 根据任务 | 利用高能量工作 |
| 创造性表达 | creative | 15-30 分钟 | 情绪能量转化 |

## 核心 API

### EmbodiedCognitionEnhanced.bodyScan
- `scan(options)` - 执行身体扫描
- `scanRegion(region)` - 扫描特定区域
- `calculateArousal(regions)` - 计算唤醒度
- `calculateValence(regions)` - 计算效价
- `identifyActionTendencies(scanResult)` - 识别行动倾向

### EmbodiedCognitionEnhanced.environmentAssessment
- `assess(context)` - 评估环境情境
- `assessPhysical(physical)` - 物理环境评估
- `assessSocial(social)` - 社会环境评估
- `assessTask(task)` - 任务环境评估
- `identifyAffordances(assessment)` - 识别环境给养
- `identifyConstraints(assessment)` - 识别环境约束

### EmbodiedCognitionEnhanced.embodiedResponse
- `generate(bodyState, environment)` - 生成具身响应
- `categorizeResponse(bodyState, environment)` - 分类响应类型
- `selectInterventions(category, bodyState, environment)` - 选择干预

### EmbodiedCognitionEnhanced.actionFacilitation
- `facilitate(intervention)` - 促进行动执行
- `prepareAction(intervention)` - 准备行动
- `supportExecution(intervention)` - 支持执行
- `supportReflection(intervention)` - 支持反思

### EmbodiedCognitionEnhanced (核心 API)
- `runEmbodiedIntervention(context)` - 完整干预循环
- `quickBodyAwarenessExercise()` - 快速身体觉察
- `embodiedEmotionRegulation(targetEmotion)` - 具身情绪调节

## 练习技术

### 快速身体觉察练习 (2-3 分钟)
1. 暂停当前活动，将注意力转向身体
2. 注意双脚与地面的接触感
3. 扫描身体，注意任何紧张或不适
4. 做 3 次深呼吸，感受气息进出
5. 注意整体身体感受
6. 不带评判地接纳当下的身体状态

### 具身情绪调节练习

**平静练习**:
- 姿态：舒适坐姿，脊柱挺直但放松
- 呼吸：缓慢深呼吸，呼气比吸气长
- 动作：缓慢、流畅的动作
- 接地：感受身体重量，双脚稳踏地面

**活力练习**:
- 姿态：站立，双脚分开与肩同宽
- 呼吸：有力的呼吸，激活核心
- 动作：大幅度的伸展和跳跃
- 接地：感受双脚推地的力量

**自信练习**:
- 姿态：扩展姿态（挺胸抬头，双手叉腰）
- 呼吸：深而稳定的呼吸
- 动作：有力的手势和姿态
- 接地：感受身体的稳定和力量

## 应用场景

### 1. 焦虑管理
- 身体扫描识别紧张区域
- 接地练习降低生理唤醒
- 呼吸调节自主神经系统

### 2. 抑郁状态
- 激活练习提升能量
- 扩展姿态改善情绪
- 运动干预增加活力

### 3. 愤怒调节
- 觉察身体愤怒信号
- 通过运动释放能量
- 平静练习降低唤醒

### 4. 表现优化
- 利用高能量状态
- 具身自信姿态
- 引导能量至任务

## 与其他 HeartFlow 模块的整合

- **预测加工模块**: 提供身体状态作为预测输入
- **情绪理论模块**: 提供情绪 - 身体映射
- **自我意识模块**: 提供前反思身体觉察
- **正念模块**: 提供觉察基础

## 理论参考文献

1. **Merleau-Ponty, M.** (1962). *Phenomenology of Perception*. Routledge.

2. **Varela, F., Thompson, E., & Rosch, E.** (1991). *The Embodied Mind: Cognitive Science and Human Experience*. MIT Press.

3. **Clark, A.** (1997). *Being There: Putting Brain, Body, and World Together Again*. MIT Press.

4. **Gallagher, S.** (2005). *How the Body Shapes the Mind*. Oxford University Press.

5. **Thompson, E.** (2007). *Mind in Life: Biology, Phenomenology, and the Sciences of Mind*. Harvard University Press.

6. **Stanford Encyclopedia of Philosophy**: Embodied Cognition

## 版本历史

### v1.0.0 (2026-03-30)
- 初始版本
- 实现身体扫描系统
- 实现环境评估系统
- 实现具身响应生成
- 实现行动促进系统
- 整合 SEP 具身认知理论
- 提供多种练习技术
