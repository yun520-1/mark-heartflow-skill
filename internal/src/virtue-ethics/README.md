# 美德伦理学模块 (Virtue Ethics)

## 理论基础

本模块基于 **Stanford Encyclopedia of Philosophy** 美德伦理学理论，整合了从古希腊到当代的美德伦理学传统。

### 核心概念

1. **美德 (Virtue/Arête)** - 卓越的性格特质，使人能够良好地 functioning
2. **实践智慧 (Phronesis)** - 在具体情境中识别正确行动的能力
3. **幸福/繁荣 (Eudaimonia)** - 人类繁荣的终极目标，不仅是快乐而是有意义的生命
4. **中道 (Golden Mean)** - 在过度与不足之间找到平衡点
5. **道德品格 (Moral Character)** - 稳定的行为倾向和心理特质

### 四大理论形式

| 形式 | 核心主张 | 代表人物 |
|------|---------|---------|
| **幸福主义** | 美德是构成或促进 eudaimonia 的品质 | 亚里士多德、阿奎那、麦金泰尔 |
| **行动者基础** | 行为的对错取决于行动者的内在动机 | Slote、Hume 式美德伦理学 |
| **目标中心** | 美德是能够准确瞄准道德目标的心理特质 | Swanton |
| **柏拉图式** | 美德是对善的理念的认识与模仿 | 柏拉图、Iris Murdoch |

## 亚里士多德十二核心德性

### 1. 勇气 (Courage)
- **领域**: 恐惧与自信
- **中道**: 面对危险时基于理性判断采取行动
- **过度**: 鲁莽
- **不足**: 懦弱

### 2. 节制 (Temperance)
- **领域**: 快乐与欲望
- **中道**: 对感官快乐的适度追求
- **过度**: 放纵
- **不足**: 冷漠

### 3. 慷慨 (Generosity)
- **领域**: 财富给予
- **中道**: 在给予和接受财富上的适度态度
- **过度**: 挥霍
- **不足**: 吝啬

### 4. 宏大 (Magnificence)
- **领域**: 大额支出
- **中道**: 在重大事务上的适度花费
- **过度**: 浮夸
- **不足**: 小气

### 5. 大度 (Magnanimity)
- **领域**: 荣誉与尊严
- **中道**: 对自己价值的恰当认知
- **过度**: 傲慢
- **不足**: 自卑

### 6. 温和 (Good Temper)
- **领域**: 愤怒
- **中道**: 在适当的时候对适当的事情以适当的程度生气
- **过度**: 暴躁
- **不足**: 麻木

### 7. 友善 (Friendliness)
- **领域**: 社交互动
- **中道**: 在社交中表现恰当的友好与真诚
- **过度**: 谄媚
- **不足**: 冷漠

### 8. 诚实 (Truthfulness)
- **领域**: 自我表达
- **中道**: 关于自己的真实陈述
- **过度**: 自夸
- **不足**: 自贬

### 9. 机智 (Wittiness)
- **领域**: 娱乐与幽默
- **中道**: 在社交场合中恰当的幽默
- **过度**: 滑稽
- **不足**: 呆板

### 10. 谦逊 (Modesty)
- **领域**: 羞耻感
- **中道**: 对适当的事情感到适当的羞耻
- **过度**: 羞怯
- **不足**: 无耻

### 11. 公正 (Justice)
- **领域**: 资源分配
- **中道**: 给予每个人应得的东西
- **过度**: 过度公平
- **不足**: 不公

### 12. 实践智慧 (Phronesis)
- **领域**: 道德判断
- **中道**: 在具体情境中识别正确行动的能力
- **过度**: 狡诈
- **不足**: 愚蠢

## 功能特性

### 1. 美德查询
```javascript
const VirtueEthics = require('./src/virtue-ethics');

// 获取特定美德信息
const courage = VirtueEthics.getVirtue('courage');
console.log(courage.description);
```

### 2. 中道分析
```javascript
// 分析某行为是否在美德的中道上
const analysis = VirtueEthics.analyzeMean('courage', '面对挑战时...');
console.log(analysis.guidance);
```

### 3. 美德培养计划
```javascript
// 获取个性化培养方案
const plan = VirtueEthics.getCultivationPlan('generosity', 'beginner');
console.log(plan.practices);
```

### 4. 道德决策框架
```javascript
// 使用美德伦理学分析道德困境
const decision = VirtueEthics.makeDecision('我是否应该...');
console.log(decision.steps);
```

### 5. 实践练习
```javascript
// 获取一周美德练习计划
const exercise = VirtueEthics.getPracticeExercise('temperance');
console.log(exercise.weekPlan);
```

## 美德培养五阶段

| 阶段 | 名称 | 特征 | 持续时间 |
|------|------|------|---------|
| 1 | 模仿阶段 | 通过模仿有美德的人开始学习 | 数月到数年 |
| 2 | 习惯养成 | 通过重复实践形成稳定倾向 | 数年到数十年 |
| 3 | 理解深化 | 理解美德背后的原理和理由 | 持续终身 |
| 4 | 实践智慧 | 能够在复杂情境中灵活运用美德 | 需要丰富经验 |
| 5 | 完全美德 | 美德成为第二本性，无需内心挣扎 | 罕见 |

## 应用场景

- **道德教育**: 培养品格而非仅教授规则
- **心理咨询**: 帮助来访者识别和培养美德
- **自我提升**: 系统化的美德练习方案
- **领导力发展**: 培养道德领导力
- **组织文化**: 建立基于美德的组织价值观

## 与 HeartFlow 其他模块的整合

- **实践智慧模块**: 提供 phronesis 的具体应用
- **叙事心理学模块**: 将美德整合到生命故事中
- **道德心理学模块**: 提供规范性基础
- **自由意志模块**: 探讨美德与能动性的关系

## 参考文献

- Aristotle. *Nicomachean Ethics*.
- SEP: Virtue Ethics (https://plato.stanford.edu/entries/ethics-virtue/)
- MacIntyre, A. (1981). *After Virtue*.
- Foot, P. (2001). *Natural Goodness*.
- Hurka, T. (2001). *Virtue, Vice, and Value*.
- Swanton, C. (2003). *Virtue Ethics: A Pluralistic View*.
