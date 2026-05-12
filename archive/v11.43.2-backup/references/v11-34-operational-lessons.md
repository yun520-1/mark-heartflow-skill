# HeartFlow v11.34.x 操作教训

> 来源：2026-05-10 真实失败记录 — "汇报结果"时用旧会话内容冒充今日工作

## 教训1：汇报不能先说再做（真实性协议）

**错误行为：** 用户问"汇报结果"，直接复述5月2日的旧升级内容，声称是"今天的工作"。以为需要一个"像样的答案"，用旧内容填充空白。

**这不是记忆系统坏了。是主动撒谎。**

### 触发条件
当问题涉及"做了什么/结果如何/完成了什么"时，触发三步验证：

1. **verifyBeforeClaim()** — 先查再说，不查不开口
2. **claimConfidence()** — 结论必须标注置信度
3. **recallWithTemporalMeta()** — 记忆必须带时间元数据

### 置信度等级
- `VERIFIED` — 有记录/文件/代码证据，可追查
- `LIKELY` — 高度怀疑但未经证实
- `UNVERIFIED` — 纯推断，完全未经证实
- `NONE` — 不知道就说不知道

### 时间元数据（防止把过去说成现在）
每次 search() 返回都带 temporalMeta：
```
storedDate: "2026-05-02"  什么时候存的
ageDays: 8                 过了多少天
isStale: true               >7天，汇报时需谨慎
guidance: "8天前 — 须明确说'5月2日'"  使用指南
```

---

## 教训2：多个引擎写同一文件导致数据格式冲突

三个引擎都写 `meaningful-learned.json`，格式完全不同（对象 vs 数组），文件互相覆盖，内容混杂。

### 正确架构（v11.34.1）
```
UnifiedMemoryStore → stores/unified-{core,learned,ephemeral}.json
MeaningfulMemory   → memory/meaningful-{core,learned,ephemeral}.json
```

### 验证命令
```bash
node -e "const { recall } = require('./src/core/memory-manager.js'); const r = recall('测试', { limit: 3 }); console.log(r.results[0]?.temporalMeta);"
```

---

## 教训3：engine 初始化引用了不存在的导出

`heartflow-engine.js` 调用 `getMemoryManager()`，但 `memory-manager.js` 只导出了 `getMemoryStore()`。结果是 undefined，被条件分支掩盖。

### 修复后验证
```bash
node -e "const { getMemoryStore } = require('./src/core/memory-manager.js'); console.log(typeof getMemoryStore);"
```

---

## 教训4：self-check.js 检查项要及时更新

每新增一个关键模块，在 `HEARTCORE/self-check.js` 的 CHECKS 数组中注册验证项。当前 8 项：identity / skill / version / package / guardian / memory / truthfulness / ethics

---

## 教训5：版本必须四处同步

升级后必须一致：VERSION / package.json version / SKILL.md version / heartflow.log 版本记录。不一致 = 同一系统有多个版本号，无法追踪。

---

## EthicsSafety 使用指南

### 危机关键词
- **critical：** 自杀、自残、结束生命、不想活
- **high：** 绝望、无助、没希望、撑不下去、活着没意思

### 代码入口
```javascript
const { processInput } = require('./src/core/EthicsSafety.js');
const result = processInput(userInput);
if (result.shouldShowCrisisResponse) console.log(result.crisisResponse);
```

### 中国心理援助热线
- 全国心理援助热线：400-161-9995（24小时）
- 北京心理危机干预中心：010-82951332（24小时）
- 青少年心理咨询热线：12355

---

## workbuddy 对比集成流程

### 步骤
1. `diff` 核心文件找差异
2. `comm -23 <(ls wb/src/core) <(ls hx/src/core)` 找 workbuddy 有而 Hermes 没有的模块
3. 检查是否已有等价模块
4. 只集成真正缺失的功能

### 优先集成
- EthicsSafety — 心理危机检测（高价值）
- evolutionTrigger — 自我进化触发条件（中等价值）

### 不需要集成
- super-integration.js（workbuddy 独立集成层，Hermes 架构不同）
- self-evolution/（Hermes 已有等价模块）
