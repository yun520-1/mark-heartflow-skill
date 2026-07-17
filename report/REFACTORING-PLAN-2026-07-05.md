# 重构建议清单 — mark-heartflow-skill v5.7.4

> 审查日期：2026-07-05
> 基于 SOLID 原则和整洁代码标准

---

## P0 重构（必须）

### R-01: 拆分 heartflow.js（3,803 行 → ~4 个文件）

**目标：** 单一职责原则

**拆分方案：**

| 新文件 | 职责 | 估算行数 |
|--------|------|----------|
| `heartflow-starter.js` | 引擎启动/关闭、环境验证 | ~200 |
| `heartflow-orchestrator.js` | 引擎编排、dispatch 路由 | ~600 |
| `heartflow-dream.js` | 梦境生成、梦境历史 | ~500 |
| `heartflow-dialogue.js` | 对话持久化、对话历史 | ~300 |
| `heartflow-core.js` | think() 主循环、heartLogic 判断 | ~800 |

**风险：** 高（主入口拆分影响面大）
**验证：** 运行完整测试套件确认行为一致

### R-02: 拆分 code-generator.js（2,970 行 → ~3 个文件）

| 新文件 | 职责 | 估算行数 |
|--------|------|----------|
| `generator-core.js` | 核心生成逻辑 | ~800 |
| `prompt-factory.js` | 提示词模板 + 语言适配 | ~1000 |
| `generator-validator.js` | 代码验证 + 错误修复 | ~600 |

### R-03: 拆分 desire-cognition.js（3,168 行 → ~2 个文件）

| 新文件 | 职责 | 估算行数 |
|--------|------|----------|
| `desire-system.js` | 欲望计算 + 目标管理 | ~1500 |
| `cognition-engine.js` | 认知评估 + 情感映射 | ~1500 |

---

## P1 重构（建议）

### R-04: 提取 magic numbers 为常量

**文件：** `src/utils/constants.js`（新建）

```javascript
module.exports = {
  // 时间常量
  MS_PER_MINUTE: 60000,
  MS_PER_HOUR: 3600000,
  MS_PER_DAY: 86400000,

  // CJK Unicode 范围
  CJK_UNIFIED: { start: 0x4E00, end: 0x9FFF },
  KATAKANA: { start: 0x3040, end: 0x30FF },
  HANGUL: { start: 0xAC00, end: 0xD7AF },

  // 系统限制
  MAX_GOALS: 100,
  MAX_RECORDS_PER_GOAL: 10000,
  LAZY_CACHE_WARN: 100,

  // 代码执行
  CMD_TIMEOUT_MS: 3000,
  PYTHON_CHECK_TIMEOUT_MS: 2000,

  // 模块理想大小
  IDEAL_MODULE_MIN_LINES: 1500,
  IDEAL_MODULE_MAX_LINES: 5000,
};
```

### R-05: 实现统一 Logger

**文件：** `src/utils/logger.js`（新建）

```javascript
const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
let currentLevel = parseInt(process.env.LOG_LEVEL) || LEVELS.WARN;

function log(level, module, ...args) {
  if (level < currentLevel) return;
  const prefix = `[${new Date().toISOString().slice(11,19)}][${level}]`;
  console[level <= LEVELS.WARN ? 'log' : 'error'](`${prefix}[${module}]`, ...args);
}
module.exports = { debug: (...a) => log(LEVELS.DEBUG, ...a), ... };
```

### R-06: 修复空 catch 块

**文件：** `src/core/config.js:209`

```javascript
// 修复前
try { existing = JSON.parse(fs.readFileSync(userConfigPath, 'utf-8')); } catch (_) {}

// 修复后
try { existing = JSON.parse(fs.readFileSync(userConfigPath, 'utf-8')); }
catch (e) { logger.warn('config', `用户配置解析失败，使用默认值: ${e.message}`); }
```

---

## P2 重构（优化）

### R-07: 添加 JSDoc 类型标注

对公共 API 方法添加类型标注，提升 IDE 支持。

### R-08: 统一错误处理策略

建立 `src/utils/errors.js`，定义标准错误类：
- `ClarityError` — 基础错误
- `ConfigError` — 配置错误
- `MemoryError` — 记忆系统错误
- `SecurityError` — 安全违规

### R-09: 清理 TODO 标记

- goedel-engine.js — v1.3.6 版本已过时，决定实现或移除
- platform-adapter.js — 评估是否仍需 OpenClaw/Claude Code 适配

---

## 重构路径规划

```
Phase 1（本周）: R-06（空catch修复）+ R-04（常量提取）
Phase 2（2周）: R-05（Logger）+ R-07（JSDoc）
Phase 3（1月）: R-01（heartflow拆分）+ R-02（generator拆分）
Phase 4（持续）: R-03（desire拆分）+ R-08（错误处理统一）
```

每一步独立可验证，不影响其他功能。
