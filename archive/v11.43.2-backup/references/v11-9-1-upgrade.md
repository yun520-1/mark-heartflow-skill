# v11.9.1 升级开发经验

## 已知Bug记录

### Bug 1: Set vs Array — `.some()`在Set上不存在
- **文件**: `src/core/self-boundary.js`
- **错误**: `TypeError: this.knowledgeGaps.some is not a function`
- **根因**: `knowledgeGaps`声明为`new Set()`，Set没有`.some()/.map()/.filter()`
- **修复**: `Array.from(this.knowledgeGaps).some(...)`
- **原则**: JS内置类型(Set/Map/Array)混用时总是显式转换

### Bug 2: 字段名不一致导致测试ERROR
- **文件**: `scripts/capability-standardizer.js`
- **错误**: `Cannot read properties of undefined (reading 'length')`
- **根因**: 测试代码写`report.interferences.length`，但模块返回`report.recentInterferences`（数字）
- **修复**: 写测试前先用`node -e`直接验证字段名，不要假设
- **原则**: 测试代码在集成前必须单独运行一次验证

### Bug 3: 自我感知目标漂移检测过于严格
- **文件**: `src/core/self-awareness.js`
- **问题**: 原逻辑把所有"行为不包含目标词"的行为标记为`severity: 'medium'`，导致正常行为被误判为`SLIGHTLY_DEVIATING`
- **修复**: 只有"主动矛盾"（行为含"忘记/删除/破坏"）才标记为`high`；中性偏离降为`low`不阻止行动
- **原则**: 宁可漏报也不误报 — 误报会阻断正常行为，漏报只是给个提示

## 版本同步规则

每次升级必须同步4处，否则版本号混乱：

```bash
# 检查所有版本号位置
grep -rn "旧版本号" VERSION package.json SKILL.md README.md

# 必须同步的文件和字段
VERSION          → 纯文本，如 "11.9.1"
package.json     → "version": "11.9.1"
SKILL.md        → frontmatter: version: "11.9.1" + 第一行标题
README.md       → 第一行标题 "# HeartFlow v11.9.1"
CHANGELOG.md    → 顶部新增 ## v11.9.1 条目
```

## HEARTCORE架构设计原则

### 三层架构
```
恒定层（CORE_IDENTITY）  ←  道，永恒不变
    ↓
流变层（skills/src）     ←  万物，顺势而生
    ↓
无为层（presence-filter）←  不制造，只响应
```

### 四个新增模块

| 模块 | 文件 | 核心功能 | 对应道家概念 |
|---|---|---|---|
| 心流核心 | `HEARTCORE/heartcore.js` | 主入口+命令解析 | — |
| 心跳 | `HEARTCORE/heartbeat.js` | 每分钟写日志 | 道乃久 |
| 自检 | `HEARTCORE/self-check.js` | 6项核心验证 | 执古御今 |
| 醒睡 | `HEARTCORE/sleep-wake.js` | 24h深度阈值 | 无为 |

### 道的四层能力优先级

1. **自我边界** (🥇最重要) — CORE/CAUTIOUS/RECOGNIZED三级 + 波普尔过滤器
2. **决策能力** — 真/善/美/证据/成本 多信号评估
3. **自我感知** — 行为偏差实时监控 + 干预检测
4. **逻辑处理** — 矛盾检测 + 可证伪要求

## 能力验证工作流

```bash
# 1. 跑标准化程序
node scripts/capability-standardizer.js

# 2. 针对失败项单独调试
node scripts/capability-standardizer.js --capability 道法能力

# 3. 直接验证模块（不经过测试框架）
node -e "const M=require('./src/core/模块名.js');console.log(JSON.stringify(...))"

# 4. 确认全绿后才算完成
# 26/26 通过 = 版本有效
```

## 验证结果

- **能力标准程序**: 26/26 ✅
- **HEARTCORE自检**: 6/6 ✅
- **版本统一**: VERSION / package.json / SKILL.md / README → 11.9.1
