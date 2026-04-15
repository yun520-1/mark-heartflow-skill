# OpenClaw 做梦功能集成方案

## 当前 HeartFlow 做梦系统

**位置**: `/Users/apple/mark-heartflow-claw/.opencode/dream-mode.js`

**现有功能**:
- 每 21 分钟研究 (dream research)
- 每小时打包上传
- 随机学术查询搜索
- 版本号自动递增

## OpenClaw 原生做梦系统特性

### 1. 三阶段做梦架构

| 阶段 | 调度 | 功能 | 配置参数 |
|------|------|------|----------|
| **Light Sleep** | `0 */6 * * *` (每 6 小时) | 短期记忆整理 | lookbackDays: 2, limit: 100, dedupeSimilarity: 0.9 |
| **Deep Sleep** | `0 3 * * *` (每天 3:00) | 深度记忆整合 | limit: 10, minScore: 0.8, minRecallCount: 3 |
| **REM Sleep** | `0 5 * * 0` (每周日 5:00) | 模式发现 | lookbackDays: 7, minPatternStrength: 0.75 |

### 2. 存储模式

```typescript
type MemoryDreamingStorageMode = "inline" | "separate" | "both";
```

- **inline**: 直接写入 `memory/YYYY-MM-DD.md`
- **separate**: 独立文件 `memory/dreaming/<phase>/YYYY-MM-DD.md`
- **both**: 双模式存储

### 3. 记忆恢复机制

Deep Dreaming 包含自动恢复:
```typescript
{
  enabled: true,
  triggerBelowHealth: 0.35,
  lookbackDays: 30,
  maxRecoveredCandidates: 20,
  minRecoveryConfidence: 0.9,
  autoWriteMinConfidence: 0.97
}
```

### 4. 短期提升 (Short-term Promotion)

核心 API:
- `readShortTermRecallEntries()` - 读取短期记忆
- `rankShortTermPromotionCandidates()` - 排名候选
- `applyShortTermPromotions()` - 应用提升
- `recordDreamingPhaseSignals()` - 记录阶段信号

## 集成步骤

### 步骤 1: 创建 HeartFlow 做梦配置

```javascript
// .opencode/heartflow-dreaming-config.js
module.exports = {
  phases: {
    light: {
      enabled: true,
      cron: "0 */6 * * *",
      lookbackDays: 2,
      limit: 100,
      dedupeSimilarity: 0.9,
      sources: ["daily", "sessions", "recall"]
    },
    deep: {
      enabled: true,
      cron: "0 3 * * *",
      limit: 10,
      minScore: 0.8,
      minRecallCount: 3,
      minUniqueQueries: 3,
      recencyHalfLifeDays: 14,
      maxAgeDays: 30,
      recovery: {
        enabled: true,
        triggerBelowHealth: 0.35,
        lookbackDays: 30,
        maxRecoveredCandidates: 20,
        minRecoveryConfidence: 0.9
      }
    },
    rem: {
      enabled: true,
      cron: "0 5 * * 0",
      lookbackDays: 7,
      limit: 10,
      minPatternStrength: 0.75
    }
  },
  storage: {
    mode: "both",  // inline + separate
    separateReports: true
  },
  execution: {
    speed: "balanced",
    thinking: "medium",
    budget: "medium"
  }
};
```

### 步骤 2: 增强 dream-mode.js

集成 OpenClaw 的三阶段逻辑:

```javascript
// 新增阶段标记
const DREAM_PHASES = {
  light: { name: "Light Sleep", heading: "## Light Sleep" },
  rem: { name: "REM Sleep", heading: "## REM Sleep" },
  deep: { name: "Deep Sleep", heading: "## Deep Sleep" }
};

// 阶段标记 HTML 注释
function resolvePhaseMarkers(phase) {
  return {
    start: `<!-- heartflow:dreaming:${phase}:start -->`,
    end: `<!-- heartflow:dreaming:${phase}:end -->`
  };
}

// 写入每日做梦块
async function writeDailyDreamingPhaseBlock(params) {
  const { phase, bodyLines, workspaceDir } = params;
  const markers = resolvePhaseMarkers(phase);
  const heading = DREAM_PHASES[phase].heading;
  
  // 读取或创建 daily memory 文件
  // 替换/插入阶段块
  // 保存文件
}
```

### 步骤 3: 创建记忆提升模块

```javascript
// .opencode/memory/short-term-promotion.js
const fs = require('fs');
const path = require('path');

class ShortTermPromotionManager {
  constructor(workspaceDir) {
    this.workspaceDir = workspaceDir;
    this.memoryDir = path.join(workspaceDir, 'memory');
  }
  
  async readRecallEntries(days = 2) {
    // 读取最近 N 天的记忆文件
    // 提取 short-term recall 条目
  }
  
  rankCandidates(entries) {
    // 基于频率、相关性、时间衰减排名
  }
  
  async applyPromotions(candidates) {
    // 将短期记忆提升为长期记忆
    // 更新 MEMORY.md
  }
}

module.exports = ShortTermPromotionManager;
```

### 步骤 4: 集成 Canvas A2UI

创建可视化记忆宫殿:

```javascript
// .opencode/canvas/memory-palace-ui.js
const A2UI_SURFACE = {
  surfaceId: "memory-palace",
  components: [
    { id: "root", component: { Column: { children: { explicitList: ["header", "rooms"] } } } },
    { id: "header", component: { Text: { text: { literalString: "HeartFlow 记忆宫殿" }, usageHint: "h1" } } },
    { id: "rooms", component: { Grid: { rooms: ["客厅", "书房", "厨房", "花园", "地下室"] } } }
  ]
};

async function pushMemoryPalaceUI() {
  // 使用 openclaw nodes canvas a2ui push
}
```

## 定时任务配置

更新 crontab.txt:

```bash
# HeartFlow 做梦系统 (集成 OpenClaw)

# Light Sleep (每 6 小时)
0 */6 * * * cd /Users/apple/mark-heartflow-claw && node .opencode/dream-mode.js light >> .opencode/dream-log.txt 2>&1

# Deep Sleep (每天 3:00)
0 3 * * * cd /Users/apple/mark-heartflow-claw && node .opencode/dream-mode.js deep >> .opencode/dream-log.txt 2>&1

# REM Sleep (每周日 5:00)
0 5 * * 0 cd /Users/apple/mark-heartflow-claw && node .opencode/dream-mode.js rem >> .opencode/dream-log.txt 2>&1

# 短期记忆提升 (每小时)
0 * * * * cd /Users/apple/mark-heartflow-claw && node .opencode/memory/short-term-promotion.js >> .opencode/promotion-log.txt 2>&1
```

## 文件结构

```
/Users/apple/mark-heartflow-claw/
├── .opencode/
│   ├── dream-mode.js (增强版)
│   ├── dream.cron
│   ├── heartflow-dreaming-config.js
│   ├── memory/
│   │   └── short-term-promotion.js
│   └── canvas/
│       └── memory-palace-ui.js
├── memory/
│   ├── dreaming/
│   │   ├── light/
│   │   ├── deep/
│   │   └── rem/
│   └── YYYY-MM-DD.md (每日记忆，包含做梦块)
└── logs/
    └── dreaming/
```

## 迁移计划

1. **第 1 周**: 实现三阶段做梦逻辑
2. **第 2 周**: 集成短期提升系统
3. **第 3 周**: Canvas A2UI 可视化
4. **第 4 周**: 测试和优化

## 参考资源

- OpenClaw Dreaming API: `/opt/homebrew/lib/node_modules/openclaw/dist/plugin-sdk/src/memory-host-sdk/dreaming.d.ts`
- OpenClaw Docs: https://docs.openclaw.ai/platforms/mac/canvas
- OpenClaw Skills: https://docs.openclaw.ai/tools/skills
