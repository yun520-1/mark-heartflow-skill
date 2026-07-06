# Dream Seed Injection — 2026-06-19

## 动机

用户说"无门"——不是"做个关于门的梦"或"门作为主题"。是一个词作为种子，梦自己围绕它长。

## 实现

### dream.js 改动

1. `dream(options)` 新增 `options.seed` 参数
2. Phase 3.5 新增 `_applySeed(skeleton, items, seed)` 方法
3. `_weaveDream` 接收 seed 参数，透传种子主题和结尾信息

### _applySeed 逻辑

```
1. 匹配 seedInsights 内置字典
2. 不匹配 → 静默跳过
3. 匹配 →
   a) 覆盖 skeleton.scene（3变体随机选）
   b) items.push({ name: actorTag, weight: 1.0 }) — 种子角色最高优先级
   c) skeleton._seedTheme = themeAffinity
   d) skeleton._seedClosing = closing[]
```

### _weaveDream 种子逻辑

**主题选择**：
```javascript
// 种子主题亲和 + 50%概率混合
const theme1 = skeleton._seedTheme && Math.random() > 0.5
  ? pickThemeFrom(skeleton._seedTheme)
  : pickTheme();
```

**结尾选择**：
```javascript
// 种子结尾优先，60%概率使用
if (skeleton._seedClosing && Math.random() > 0.4) {
  lines.push(skeleton._seedClosing[...]);
} else {
  // 默认6种结尾
}
```

## 内置种子库

| 种子 | scene变体数 | themeAffinity | actorTag | closing变体数 |
|------|-----------|---------------|----------|-------------|
| 无门 | 3 | threshold | 入口 | 1 |
| 桥 | 2 | bridge | 桥墩 | 1 |
| 消散 | 2 | ripple | 边缘 | 1 |
| 原点 | 2 | recursion | 原点 | 1 |

## 设计原则

- **种子是方向，不是内容**：种子只影响开场、主题倾向、角色、结尾。中间的空间/密度/身份段仍由引擎真实状态决定
- **不认识时静默**：不认识的种子名不走 _applySeed，梦正常生成
- **概率混合**：主题50%走种子主题50%随机，结尾60%走种子结尾40%默认——防止种子硬化成固定模板
- **权重1.0**：种子角色最高权重，但不强制出现在角色互动段（从top6中随机取3个）
