# HeartFlow v0.12.50 重建方法论

> 来源：2026-05-11 彻底重建 v11.43.2 → v0.12.50

---

## 核心教训：路径深度陷阱

### 问题描述

将单文件拆分为子目录后，`__dirname` 相对路径必须调整。

**错误原因**：`path.resolve(__dirname, '../..')` 对 2 层深度正确，但子模块在 3 层深度时需要 `../../../`。

```
heartflow/                      ← __dirname 起点
src/core/heartflow.js           ← 2层: '../..' → heartflow/ ✓
src/core/memory/consolidator.js ← 3层: '../..' → src/ ✗
                                ← 正确: '../../..' → heartflow/ ✓
```

### 经验法则

```
src/core/ 下的模块:  path.resolve(__dirname, '../../../..')  → 到达 heartflow/ 根
src/core/memory/:    同上（已经是3层，基准是heartflow/）
子模块 getDataPath:  path.resolve(__dirname, '../../../data', ...segments)
```

### 快速验证

```bash
node HEARTCORE/heartbeat.js        # 验证路径是否正确
node HEARTCORE/startup-check.js     # 验证 VERSION/CORE_IDENTITY 等文件是否可达
```

---

## 核心教训：正则字符类陷阱

### 问题描述

字符类 `[...]` 内，`|` 是**字面量 pipe**，不是 alternation。

```javascript
// ❌ 错误：[/ 包含 | 字面量]
/[请帮|帮我|想要|需要]/.test('我需要帮助')  // false！

// ✅ 正确：不用字符类，或字符类内不用 |
/请帮|帮我|想要|需要/.test('我需要帮助')   // true
```

### 受影响模块

- `src/core/ethics/guard.js` — 自我伤害检测
- `src/core/identity/identity.js` — 意图检测

### 修复模式

```javascript
// ❌ 之前（错误）
if (/[请帮|帮我|想要|需要]/.test(text)) return 'request_action';

// ✅ 之后（正确）
if (/请帮|帮我|想要|需要/.test(text)) return 'request_action';
```

---

## 重建检查清单

### 1. 路径验证（每建一个子模块必须执行）

```bash
node HEARTCORE/heartbeat.js        # 12项检查，验证所有路径正确
node HEARTCORE/startup-check.js     # 验证 VERSION/CORE_IDENTITY 等可达
node tests/core.test.js             # 17项测试全过
```

### 2. 正则审查

```bash
# 检查所有 JS 文件中的字符类
grep -rn '/\[.*|' ~/.hermes/skills/ai/heartflow/src/core/ --include="*.js"
```

---

*v0.12.50 重建 — 2026-05-11*
