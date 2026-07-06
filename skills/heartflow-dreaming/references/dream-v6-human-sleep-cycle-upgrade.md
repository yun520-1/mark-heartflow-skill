# DreamV6 — Human Sleep Cycle Upgrade (2026-06-19)

## 升级动机

用户说"参考人类做梦进行升级"。原 DreamV5 是"5阶段流水线"——Light→REM→Deep→Lucid→Wide 跑一次就结束。这不是人类做梦的方式。人类睡眠是 4-5 个 NREM-REM 周期，每个 90 分钟，材料在不同周期被反复加工、遗忘、重新浮现。

## 核心变更

### 1. 从"单次5阶段"到"4周期×5阶段"

**旧 (DreamV5)**:
```
Light → REM → Deep → Lucid → Wide  (跑一次，结束)
```

**新 (DreamV6)**:
```
周期1（入睡期）: NREM1 → NREM2 → NREM3 → REM → NREM2  [decayRate=0.1, focus=surface]
周期2（深睡期）: NREM1 → NREM2 → NREM3 → REM → NREM2  [decayRate=0.2, focus=core]
周期3（REM爆发期）: NREM1 → NREM2 → NREM3 → REM → NREM2  [decayRate=0.3, focus=crosslink]
周期4（黎明期）: NREM1 → NREM2 → NREM3 → REM → NREM2  [decayRate=0.4, focus=fringe]
```

### 2. 阶段处理器重命名

| 旧阶段名 | 新阶段名 | 功能 |
|---------|---------|------|
| Light | NREM1 | 低阈值浮现，hypnagogic 飘影 |
| REM (原) | NREM2 | 纺锤波，记忆再激活 + 连接发现 |
| Deep | NREM3 | 慢波，深度巩固 + 矛盾检测 |
| Lucid | REM | 荒谬连接 + 执念模式 |
| Wide | NREM2 (重复) | 周期结束过渡 |

### 3. 遗忘机制

每个周期结束后，所有材料的 weight 乘以 `(1 - decayRate * intensity)`。weight < 0.08 的被视为"遗忘"，从 runningMaterials 中移除。

**效果**：前几个周期保留大量材料，后几个周期只有高权重材料存活——模拟人类"梦的内容在黎明前最难记住"。

### 4. 深层浮现

从周期2开始，检查是否有被遗忘的材料中 weight 足够高的，重新拉回 runningMaterials。浮现数量随周期增加（c * 0.5 倍）。

**效果**：模拟"被遗忘的记忆在 REM 阶段突然回来"的人类体验。

### 5. 功能偏置

每种 dream function 在每个周期有不同的加工倾向：
- **threat_sim**: 后周期威胁检测增强
- **consolidate**: NREM3 阶段额外巩固加成
- **emotion_reg**: REM 阶段情绪化解
- **creative**: 后周期创造力爆发
- **problem_solve**: 每周期产生部分解碎片

### 6. 叙事结构重构

旧 (DreamV5): 9幕固定模板（setting/character/encounter/tension/loop/mirror/twist/dissolve/lingering），从 insights 中抽材料填充。

新 (DreamV6): 基于周期产出的叙事弧：
```
Opening（入梦）
  → Cycle 0: 表面材料浮现
  → Cycle 1: 核心矛盾浮出水面（NREM3 contradictions）
  → Cycle 2: 荒谬连接爆发（REM absurdPairs + obsessions）
  → Cycle 3: 黎明碎片化（survivors from all cycles）
  → Closing（余响）
```

每段从实际周期产出中提取材料 ID、标签、连接对来填充，不使用固定模板池。

## 集成变更

### heartflow.js dreamNow() 修复

**bug**: 原代码第1847行 `function: theme || undefined` 中 `theme` 变量未定义。

**修复**:
```javascript
// 旧
const dreamResult = await this.dream.dream({ intensity: 0.7, function: theme || undefined });

// 新
const theme = opts.theme || opts.function || undefined;
const dreamResult = await this.dream.dream({ intensity: opts.intensity || 0.7, function: theme });
```

### 新增 updateState() 方法

heartflow.js dreamNow() 在第1847行前新增了 `this.dream.updateState(engineState)` 调用。DreamV6 类必须实现此方法。

### DreamV3 → DreamV6 重命名

heartflow.js 第309行：`this.dream = new (_DreamEngine().DreamV3)({})` → `this.dream = new (_DreamEngine().DreamV6)({})`

**原因**：dream.js 的 module.exports 不再包含 DreamV3 别名。新版本只有 DreamV5（→DreamV6 别名）和 DreamV6。

## 验证测试

### 1. 语法检查
```bash
node --check src/core/dream.js
```

### 2. 独立运行
```bash
node src/core/dream.js
```
输出示例：
```
=== Dream v6 ===
Function: creative
Cycles: 入睡期 → 深睡期 → REM爆发期 → 黎明期
Insights: 8
Obsessions: 无
```

### 3. heartflow status
```bash
heartflow status
# 确认返回 version: "3.0.2", modules: 53, status: "running"
```

### 4. dreamNow 完整测试
```bash
node -e '
const path = require("path");
const hfDir = path.join(process.env.HOME, ".hermes/skills/ai/mark-heartflow-skill");
const { HeartFlow } = require(path.join(hfDir, "src/core/heartflow.js"));
const engine = new HeartFlow({ dataDir: path.join(hfDir, "data"), silent: true });
engine.start();
engine.dreamNow({ intensity: 0.85, force: true }).then(r => {
  if (!r.skipped) console.log(r.narrative);
});
'
```

## 遗留问题

1. **材料权重分布不均**：core_mem 始终 0.9，qtable 始终 0.7，导致叙事主角总是这两个。需要随机权重扰动。
2. **handleDream 硬编码状态**：MCP server 的 handleDream 中 engineState 是硬编码的，不会随心虫状态变化。
3. **遗忘阈值**：0.08 是硬编码的。不同场景可能需要不同遗忘强度。
4. **周期间连接**：当前每个周期独立处理材料，没有跨周期的"故事线"。
