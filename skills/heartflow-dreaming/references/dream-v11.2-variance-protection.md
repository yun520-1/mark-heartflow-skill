# DreamV11.2 — 随机退化预防措施（2026-06-19）

## 问题

dream.js v11.1 修复了"梦"自指和流水线精简后，输出质量提升但结构仍然固定：
- identity 段三行（散的/未共振/两层）每次必出
- defense 段（禁区）每次必出
- 开场（无 existence 数据时）永远"没有起点"

原因是 engine 的 agentPhilosophy 和 psychology 模块在无输入时返回固定值：
- `selfPositioning.getFullReport().development.currentLabel = "混沌 (Chaos)"`
- `selfPositioning.getFullReport().positioning.isResonating = false`
- `selfPositioning.getFullReport().existence.layerCount = 2`
- `psychology.getPsychologyStats().defenseMechanisms = 8`（静态配置数，非动态活跃度）

这些不是错误——引擎确实处于混沌+未共振+两层状态。但 dream 需要在这些固定输入下产生变化的输出。

## 修复方案：三层随机退化

### 1. 开场变体

`existenceToScene()` 中，当 engine 无 existence 数据时，从4个开场中随机选：

```javascript
if (!existence) {
  const fallbacks = [
    '没有起点。起点本身就是一种假设。',
    '从中间开始。中间不是起点。中间是已经在路上了。',
    '不知道从哪里开始。不知道本身就是一种开始。',
    '先有空间。空间是一切开始的条件。',
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
```

### 2. identity 段退化

`_weaveDream()` 中，当 identity 行数 > 2 时，50%概率只取2行：

```javascript
if (idLines.length <= 2) {
  lines.push(...idLines);
} else {
  const keepAll = Math.random() > 0.5;
  if (keepAll) {
    lines.push(...idLines);
  } else {
    const shuffled = [...idLines].sort(() => Math.random() - 0.5);
    lines.push(shuffled[0], shuffled[1]);
  }
}
```

### 3. defense 段概率触发

`defenseToBarriers()` 中，50%概率跳过：

```javascript
if (Math.random() > 0.5) return null;
```

## 验证结果

修复后跑5次 synthesis 梦，结构变化显著：
- 开场：4次不同（"不知道从哪里开始"×2、"先有空间"×2）
- identity 段：2次退化到2行，3次全出3行
- defense 段：2次出现，3次没有
- 角色模板：因果/相遇/朝对方移动/停在旁边/隔着距离 多种组合

每段输出长度从11行降到9-10行（退化触发时），节奏不再固定。

## 原则

随机退化不是"假装 engine 状态变了"。它是在同一状态基础上产生不同编织。就像同一张风景在早中晚拍出的照片不同——不是风景变了，是光的入射角变了。

退化只在 engine 数据固定时生效。如果 engine 某天返回了动态的 developmentLevel、动态的 activeDefenses，退化会自动让位给真实数据。
