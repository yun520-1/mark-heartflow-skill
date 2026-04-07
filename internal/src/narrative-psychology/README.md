# 叙事心理学模块 (Narrative Psychology)

## 理论基础

本模块基于 **Stanford Encyclopedia of Philosophy** 叙事心理学理论，核心理念包括：

### 生命故事模型 (Life Story Model of Identity)

人们通过构建和讲述自己的生命故事来理解自我、整合经验、寻找意义。身份认同本质上是一个叙事建构。

### 核心概念

1. **关键场景 (Nuclear Scenes)**
   - 高峰体验：生命中最美好的时刻
   - 低谷体验：生命中最艰难的时刻
   - 转折点：改变人生方向的事件
   - 早期记忆、重要他人、信仰场景等

2. **叙事主题 (Narrative Themes)**
   - **能动性主题 (Agency)**：自我掌控、成就、独立、勇气
   - **共生主题 (Communion)**：爱、友谊、归属、关怀、贡献

3. **叙事序列 (Narrative Sequences)**
   - **救赎序列 (Redemption)**：从苦难到成长、从束缚到自由
   - **污染序列 (Contamination)**：从美好到失去、从希望到失望

4. **叙事基调 (Narrative Tone)**
   - 乐观/悲观、成长导向/创伤导向

5. **主人公形象 (Imago)**
   - 英雄、智者、照顾者、探索者、创造者等

## 功能特性

### 练习模块

1. **生命章节** - 将生命划分为有意义的章节
2. **关键场景探索** - 深入探索塑造自我的关键事件
3. **主题识别** - 识别反复出现的人生主题
4. **叙事重构** - 重新诠释困难经历，寻找成长意义
5. **主人公形象探索** - 探索自己在生命故事中的角色

### 分析工具

- **叙事基调分析** - 分析叙事的积极/成长导向程度
- **主题识别** - 识别能动性/共生/救赎/污染主题
- **反馈生成** - 基于分析结果提供个性化反馈

## 使用示例

```javascript
const NarrativePsychology = require('./src/narrative-psychology');

// 与用户交互
const response = NarrativePsychology.interact('我想了解自己的生命故事');
console.log(response.guidance);

// 分析叙事
const tone = NarrativePsychology.analyzeTone('我经历了很多困难，但也学到了很多');
console.log(tone.overall); // '成长导向'

const themes = NarrativePsychology.identifyThemes('我爱我的家人，也追求自己的事业');
console.log(themes); // { agency: 2, communion: 3, redemption: 0, contamination: 0 }
```

## 应用场景

- **自我探索**：深入了解自己的身份认同和生命意义
- **心理成长**：通过叙事重构促进创伤后成长
- **心理咨询**：作为咨询师的辅助工具
- **日记写作**：引导结构化的自我反思

## 参考文献

- McAdams, D. P. (2001). The psychology of life stories.
- Stanford Encyclopedia of Philosophy: Narrative Psychology
- McAdams, D. P., & McLean, K. C. (2013). Narrative identity.
