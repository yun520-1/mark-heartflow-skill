# Skill Generator 升级模式

Skill Generator 类模块负责从分析报告中识别模式并自动生成标准化技能文件。典型模块：`skill-generator.js`。

## 常见功能缺失

### 1. 通用模板问题
所有 pattern 使用完全相同的模板输出，无论 pattern 类型如何（情绪/任务/中断/心流）：

```javascript
// ❌ 所有模式生成相同内容
generateSkillFile(pattern) {
  return `# ${pattern.name}
## 处理策略
### 1. 识别信号
### 2. 响应策略
### 3. 跟进机制`;
}
```

### 2. 硬编码置信度
所有匹配的模式获得固定置信度（如 `0.8`），无法区分强匹配和弱匹配。

### 3. 无去重/合并
同一报告命中多个模式时，各自生成独立技能文件，不考虑模式重叠（如"情绪调节"和"沮丧处理"高度相关）。

### 4. 无生成后验证
生成后不检查技能文件的质量/完整性。

## 标准升级清单

### 1. 策略模板注册表（STRATEGY_TEMPLATES）
为每种 pattern 类型定义专用内容模板：

```javascript
const STRATEGY_TEMPLATES = {
  'handle-frustration': {
    steps: [
      '1. 识别情绪信号：检测沮丧/挫败关键词',
      '2. 共情确认：用 I-statement 承认感受',
      // ...
    ],
    phrases: ['我理解这可能会让人感到沮丧'],
    antiPatterns: ['不要使用"别担心"等否定感受的回应']
  },
  // ... 其他类型
};
```

### 2. 加权评分引擎（_scorePattern）
替代固定置信度：

```javascript
_scorePattern(patternKey, patternDef, content, hitCount) {
  const matchCount = patternDef.trigger.filter(t => content.includes(t)).length;
  const triggerCoverage = matchCount / patternDef.trigger.length;
  const decay = Math.max(0.3, 1 - (hitCount || 0) * 0.1); // 重复衰减
  const priorityBonus = patternDef.priority === 'high' ? 0.1 : 0;
  return { confidence, triggerCoverage, decayApplied };
}
```

### 3. 模式去重合并（_deduplicatePatterns）
同 category 模式自动合并：

```javascript
_deduplicatePatterns(patterns) {
  // 同 category + 置信度差 < 0.3 → 合并触发词、取最高优先级
}
```

### 4. 生成后质量验证（validateGeneratedSkill）
5 维度检查：

| 维度 | 检查内容 |
|------|---------|
| 步骤完整性 | 包含执行步骤节 |
| 触发条件 | 包含触发条件节 |
| 反模式 | 包含反模式/避免节 |
| 内容长度 | >200 字符 |
| 话术存在 | 包含推荐话术节 |

### 5. 优先级排序
命中模式按优先级排序（high > medium > low），同优先级按置信度。

### 6. 默认回退模板
未知 pattern 自动使用通用默认模板（5步通用流程），不抛异常。

## 接口兼容性要求

```javascript
// 原始导出（必须保持）
module.exports = { SkillGenerator, PATTERN_REGISTRY };

// 新增导出（推荐）
module.exports = { SkillGenerator, PATTERN_REGISTRY, STRATEGY_TEMPLATES };
```

- `SkillGenerator` 类的构造函数签名不变
- `generateSkill(pattern, options)` 接口不变
- `identifyPatterns(report)` 返回类型不变（只是内部排序更合理）
- `generateSkillFile(pattern)` 内部重写但外部接口不变
