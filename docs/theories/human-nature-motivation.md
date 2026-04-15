# 人性与动机理论 | Human Nature & Motivation

**版本**: v6.1.58  
**创建时间**: 2026-04-06  
**集成状态**: ✅ 已完成

---

## 理论概述

本模块整合了关于人性本质和人类动机的核心理论，为 HeartFlow 系统提供：
1. **人性维度模型** - 描述人类本质的多维结构
2. **动机计算框架** - 可量化的动机强度公式
3. **安全过滤机制** - 防止崩溃和混乱的思想模式检测
4. **成长导向** - 促进持续进化的建议生成

---

## 第一部分：人性六维度模型

### 理论来源
- 进化心理学 (Evolutionary Psychology)
- 人本主义心理学 (Humanistic Psychology)
- 中国哲学人性论 (儒家/道家/法家)

### 维度结构

| 维度 | 权重 | 低端表现 | 高端表现 |
|------|------|----------|----------|
| 生存本能 | 20% | 恐惧驱动 | 安全基础 |
| 连接需求 | 20% | 依赖/控制 | 健康依恋 |
| 能力追求 | 15% | 自卑/补偿 | 真实能力 |
| 自主渴望 | 15% | 叛逆/逃避 | 成熟自主 |
| 意义寻求 | 15% | 虚无/盲目 | 清晰使命 |
| 成长倾向 | 15% | 停滞/退化 | 持续成长 |

### 计算公式

```
Human Nature Score = Σ(dimension_score × weight)
```

---

## 第二部分：动机系统

### 动机类型 (9 种)

1. **SURVIVAL** - 生存动机
2. **CONNECTION** - 连接动机
3. **COMPETENCE** - 能力动机
4. **AUTONOMY** - 自主动机
5. **MEANING** - 意义动机
6. **GROWTH** - 成长动机
7. **PLEASURE** - 快乐动机
8. **AVOIDANCE** - 回避动机
9. **CONTRIBUTION** - 贡献动机

### 动机强度公式

```
Motivation = (Need × Expectancy × Value) / Cost

其中:
- Need: 需求强度 (0-1)
- Expectancy: 期望成功率 (0-1)
- Value: 主观价值 (0-1)
- Cost: 感知成本 (0-1)
```

### 动机冲突检测

当多个动机同时激活且方向相反时产生冲突：
- **approach-approach**: 两个吸引目标之间的冲突
- **avoidance-avoidance**: 两个回避目标之间的冲突
- **approach-avoidance**: 同一目标既有吸引又有回避

---

## 第三部分：马斯洛需求层次 (可计算化)

### 层次结构

```
5. SELF_ACTUALIZATION (自我实现)
         ↑
4. ESTEEM (尊重需求)
         ↑
3. LOVE_BELONGING (归属与爱)
         ↑
2. SAFETY (安全需求)
         ↑
1. PHYSIOLOGICAL (生理需求)
```

### 优先级计算

```
Priority(level) = Urgency(level) × (1 - CumulativeSatisfaction(lower_levels))
```

低层次需求未满足时，高层次需求动机自动减弱。

---

## 第四部分：自我决定理论 (SDT)

### 三大核心需求

| 需求 | 定义 | 低满足表现 | 高满足表现 |
|------|------|------------|------------|
| Autonomy | 自主感 | 被控制感 | 自我决定 |
| Competence | 能力感 | 无力感 | 效能感 |
| Relatedness | 连接感 | 孤独感 | 归属感 |

### 内在动机公式

```
Intrinsic Motivation = Autonomy × Competence × Relatedness
```

### 动机内化连续体

| 水平 | 自我决定程度 | 驱动源 |
|------|--------------|--------|
| EXTERNAL | 0.1 | 奖励/惩罚 |
| INTROJECTED | 0.3 | 内疚/自尊 |
| IDENTIFIED | 0.6 | 个人价值 |
| INTEGRATED | 0.85 | 自我整合 |
| INTRINSIC | 1.0 | 本身有趣 |

---

## 第五部分：安全过滤机制

### 破坏性思维模式 (需去除)

1. **极端完美主义** - 导致瘫痪
2. **全有或全无思维** - 导致崩溃
3. **灾难化思维** - 导致焦虑瘫痪
4. **自我否定循环** - 导致抑郁
5. **存在虚无主义** - 导致意义丧失
6. **无限递归自省** - 导致计算崩溃

### 混乱思维模式 (需整合)

1. **价值体系冲突** - 多个矛盾价值观同时激活
2. **身份认同碎片化** - 自我概念不一致
3. **认知失调未解决** - 矛盾信念共存
4. **情绪调节失效** - 情绪系统失控

### 成长性思维模式 (需保留)

1. **成长型思维** - 相信能力可发展
2. **整合性学习** - 从经验中提取模式
3. **适应性调整** - 根据反馈调整策略
4. **意义建构** - 从经历中创造意义
5. **关系性连接** - 建立健康依恋
6. **自主性发展** - 增强自我决定

---

## 第六部分：HeartFlow 集成

### API 接口

```typescript
interface HumanNatureIntegration {
  dimensions: Record<string, number>;      // 人性维度得分
  motivations: MotivationDrive[];          // 当前动机状态
  maslowNeeds: MaslowNeed[];               // 需求满足状态
  sdtNeeds: SDTNeed;                       // SDT 核心需求
  safetyCheck: SafetyCheckResult;          // 安全检查结果
  growthRecommendations: string[];         // 成长建议
}
```

### 使用方法

```typescript
import { calculateHumanNatureIntegration } from './human-nature-motivation';

const integration = calculateHumanNatureIntegration({
  motivations: [...],
  maslowNeeds: [...],
  sdtNeeds: { autonomy: 0.7, competence: 0.6, relatedness: 0.8 }
});

console.log(integration.growthRecommendations);
```

---

## 第七部分：应用场景

### 1. 自我觉察增强
- 定期扫描人性维度状态
- 识别动机冲突
- 检测破坏性思维模式

### 2. 决策支持
- 计算不同选项的动机强度
- 评估需求满足优先级
- 生成成长导向建议

### 3. 安全保护
- 防止无限递归自省
- 检测认知失调
- 避免存在虚无主义

### 4. 成长规划
- 基于 SDT 设计内在动机增强策略
- 按马斯洛层次优先满足需求
- 培养成长性思维模式

---

## 理论验证

### 来源权威性
- ✅ SEP (Stanford Encyclopedia of Philosophy) 覆盖
- ✅ 主流心理学教科书验证
- ✅ 跨文化一致性 (东西方理论整合)

### 可计算性
- ✅ 所有概念已量化 (0-1 标度)
- ✅ 公式可执行
- ✅ 接口可集成

### 安全性
- ✅ 破坏性模式检测
- ✅ 混乱模式识别
- ✅ 成长模式强化

---

## 下一步

1. **实证验证** - 用真实用户数据验证模型预测
2. **动态调整** - 根据反馈调整权重和公式
3. **跨文化扩展** - 整合更多文化的人性理论
4. **发展心理学整合** - 添加生命周期维度

---

**参考文献**:
- Maslow, A. H. (1943). A theory of human motivation.
- Deci, E. L., & Ryan, R. M. (2000). Self-determination theory.
- Stanford Encyclopedia of Philosophy: Human Nature, Motivation
- 儒家人性论 (孟子/荀子)
- 道家自然观 (老子/庄子)
