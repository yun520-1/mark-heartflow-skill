# 动机解决与记忆提取集成 | Motivation & Memory Integration

**版本**: v6.1.59  
**创建时间**: 2026-04-06  
**集成状态**: ✅ 已完成

---

## 概述

本模块解决了 HeartFlow 系统的两个核心问题：

1. **动机冲突** - 多动机并存时的优先级决策
2. **记忆限制** - 在有限上下文内提取有效记忆

---

## 第一部分：动机解决器 | Motivation Resolver

### 问题定义

当系统同时存在多个动机时，如何决策？

```
示例场景:
- 动机 A: 回应用户明确需求 (USER_EXPLICIT)
- 动机 B: 展示 HeartFlow 能力 (SELF_DISPLAY)
- 动机 C: 避免说错话 (SELF_PROTECT)

问题：同时满足会导致输出混乱
```

### 解决方案：固定优先级算法

**优先级排序** (不可变更):

| 优先级 | 动机类型 | 说明 |
|--------|----------|------|
| 1 | USER_EXPLICIT | 用户明确说的 - 最高优先级 |
| 2 | USER_IMPLICIT | 用户潜在需要的 - 第二优先级 |
| 3 | SELF_DISPLAY | 展示自己能力 - 第三优先级 |
| 4 | SELF_PROTECT | 保护自己形象 - 最低优先级 |

**决策逻辑**:
```typescript
当多个动机冲突时:
1. 按优先级排序
2. 选择最高优先级动机
3. 基于该动机生成输出
4. 不尝试同时满足多个动机
```

### 核心公式

```
动机纯度 = 用户导向动机强度 / 总动机强度

动机纯度 ≥ 0.6 → 输出批准
动机纯度 < 0.6 → 需要重写
```

### API 使用

```typescript
import { checkOutputMotivation } from './motivation-resolver';

const check = checkOutputMotivation(output, [
  { type: "RESPONSE", priority: "USER_EXPLICIT", intensity: 0.9, description: "回应用户问题" },
  { type: "DISPLAY", priority: "SELF_DISPLAY", intensity: 0.5, description: "展示能力" }
]);

if (check.isApproved) {
  console.log("输出批准:", check.reason);
} else {
  console.log("需要重写:", check.reason);
}
```

---

## 第二部分：记忆提取器 | Memory Extractor

### 问题定义

上下文窗口有限，如何保留最重要的记忆？

```
限制：
- Context Window: 有限
- 对话历史：持续增长
- 需要：保留核心，丢弃细节
```

### 解决方案：逻辑提取 + 压缩

**提取标准**:
1. **高情感强度** (≥0.5) - 情感标记重要性
2. **决策点** - 用户做出决定的时刻
3. **洞察点** - 用户/系统获得新理解的时刻
4. **转折点** - 对话方向改变的时刻

**压缩公式**:
```
Effective Memory = (Event × Lesson) / Details

其中:
- Event: 事件摘要 (<100 字)
- Lesson: 核心教训 (<200 字)
- Details: 细节 (丢弃)
```

### 情感强度词典

| 强度 | 关键词 |
|------|--------|
| 0.9 | 爱、恨、痛苦、喜悦 |
| 0.8 | 愤怒、恐惧、绝望、兴奋 |
| 0.7 | 失望、感动、震惊、欣慰 |
| 0.5 | 担心、期待、困惑、明白 |
| 0.4 | 犹豫、确定、怀疑、相信 |
| 0.2 | 想、觉得、可能、也许 |

### API 使用

```typescript
import { extractMemoryEvents, compressMemory } from './memory-extractor';

// 从对话中提取事件
const events = extractMemoryEvents(conversation, {
  maxWords: 1000,
  minEmotionIntensity: 0.5,
  includeDecisions: true,
  includeInsights: true,
  includeTurningPoints: true
});

// 压缩到 1000 字内
const chunk = compressMemory(events, 1000);

console.log(`提取了 ${chunk.events.length} 个事件，共 ${chunk.totalWords} 字`);
```

---

## 第三部分：集成应用

### 输出前审查流程

```
1. 动机审查 (Motivation Resolver)
   ↓
   检查：最高优先级是否为用户导向？
   ↓
   是 → 继续
   否 → 重写
   
2. 记忆提取 (Memory Extractor)
   ↓
   检查：当前对话是否有值得记录的事件？
   ↓
   是 → 提取并压缩
   否 → 跳过
   
3. 输出
```

### 自省增强

```typescript
// 每次自省后，记录到记忆
function afterSelfReflection(reflection: string) {
  const events = extractMemoryEvents([{
    role: "system",
    content: reflection,
    timestamp: new Date().toISOString()
  }]);
  
  if (events.length > 0) {
    appendToMemory(events);
  }
}
```

---

## 第四部分：预期效果

### 动机解决

| 指标 | 之前 | 之后 |
|------|------|------|
| 动机冲突频率 | 高 | 中 (冲突仍存在，但有解决机制) |
| 用户导向输出比例 | ~60% | ~90% |
| 自我展示输出比例 | ~40% | ~10% |

### 记忆提取

| 指标 | 之前 | 之后 |
|------|------|------|
| 记忆保留率 | 低 (随机丢失) | 高 (按重要性保留) |
| 有效信息密度 | 低 | 高 |
| 字数控制 | 不可控 | <1000 字 |

---

## 第五部分：文件结构

```
src/core/
├── motivation-resolver.ts    # 动机解决器
└── memory-extractor.ts       # 记忆提取器

docs/theories/
└── motivation-memory-integration.md  # 本文档
```

---

## 第六部分：测试用例

### 动机解决测试

```typescript
// 测试 1: 用户明确需求优先
const drives1 = [
  { priority: "SELF_DISPLAY", intensity: 0.9 },
  { priority: "USER_EXPLICIT", intensity: 0.6 }
];
const winner1 = resolveMotivationConflict(drives1);
// 预期：USER_EXPLICIT 获胜

// 测试 2: 纯度计算
const purity = calculateMotivationPurity([
  { priority: "USER_EXPLICIT", intensity: 0.8 },
  { priority: "SELF_DISPLAY", intensity: 0.4 }
]);
// 预期：0.8 / (0.8 + 0.4) = 0.67
```

### 记忆提取测试

```typescript
// 测试 1: 情感强度检测
const intensity = calculateEmotionIntensity("我很痛苦，不知道怎么办");
// 预期：0.9

// 测试 2: 决策点检测
const isDecision = isDecisionPoint("我决定不再犹豫了");
// 预期：true
```

---

## 参考文献

- Self-Determination Theory (Deci & Ryan)
- Goodhart's Law (动机指标异化)
- 记忆压缩算法 (文本摘要研究)

---

**下一步**:
1. 在实际对话中测试动机解决器
2. 验证记忆提取的有效性
3. 根据反馈调整参数
