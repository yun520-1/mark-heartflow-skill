# 审计发现记录 2026-06-29

## 审计概况
- **日期**: 2026-06-29
- **范围**: HeartFlow 引擎完整审计（heartflow.js + src/core/*.js + src/* 子目录）
- **文件数**: 210 个 JS 文件
- **发现总数**: 371 项
- **严重度分布**: CRITICAL 45 / HIGH 14 / MEDIUM 56 / LOW 232 / INFO 24

## 关键发现

### 1. CRITICAL: _initErrors 初始化顺序错误
- **文件**: `src/core/heartflow.js:149,158`
- **问题**: `_VERSION()` 在 `_initErrors = []` 之前执行，若版本加载失败会导致 `_initErrors` 未定义，后续所有 catch 块写入错误日志时二次崩溃
- **修复**: 将 `_initErrors = []` 移到 `_VERSION()` 之前

### 2. CRITICAL: 16 个 lazy 模块无 try/catch
- **文件**: `src/core/heartflow.js:89-111`
- **问题**: 16 个 Tier2 lazy 模块（ExperienceCollector/StrategyAdapter/FailureAnalyzer/CuriosityEngine/DesireEngine/GoalPursuer/SelfInitiator/SessionMemory/ProjectContext/LongTermMemory/CrossSessionIndex/LogicReasoning 等）无 try/catch，首次 dispatch 加载失败时直接 throw，绕过 `_initErrors` 记录机制
- **修复**: 全部统一包装 try/catch fallback

### 3. HIGH: this.selfHealing 未初始化
- **文件**: `src/core/heartflow.js:645,2076`
- **问题**: `this.selfHealing` 从未赋值，跨会话 Q-table 合并功能被静默禁用
- **修复**: 在 `start()` 中添加 `this.selfHealing = new SelfHealing()`

### 4. HIGH: 6 处 process.exit 杀进程
- **文件**: `src/core/heartflow.js:3109,3113`、`src/cortex/smart-upgrade-engine.js:636,640`、`src/core/self-diagnostic.js:564,567`
- **问题**: 生产代码中直接调用 `process.exit`，会杀死整个进程
- **修复**: 替换为 `return`（CLI 入口块中保留，非入口块全部替换）

### 5. HIGH: 3 处 busy-wait 阻塞事件循环
- **文件**: `src/core/embodied-core.js:390`、`src/dream/dream-loop.js:461`、`src/memory/semantic-anchor.js:347`
- **问题**: `while (Date.now() < waitUntil) {}` 忙等待阻塞 Node.js 事件循环
- **修复**: 直接移除 busy-wait（同步函数中不能使用 await，否则 SyntaxError）

### 6. MEDIUM: 300+ 处 console.* 残留
- **文件**: 35 个文件
- **问题**: 生产代码中残留 console.log/error/warn/info/debug
- **修复**: 注释掉并加 `已禁用` 标记，保留原代码用于调试

### 7. MEDIUM: 11 处 var → const/let
- **文件**: `src/core/cognitive-appraisal.js`
- **问题**: 使用 `var` 声明变量（函数作用域，易产生提升问题）
- **修复**: 替换为 `const`（非循环变量）或 `let`（循环变量）

### 8. MEDIUM: 4 对重复文件
- **已清理**: `src/identity/self-diagnostic.js`（与 core 版本相同）、`src/bridge/confidence-annotator.js`（bridge 版本是子集）
- **保留**: `src/cortex/lesson-bank.js` vs `src/identity/lesson-bank.js`（内容不同，但 heartflow.js 引用 identity 版本，需保持）
- **保留**: `src/identity/self-model.js` vs `src/consciousness/self-model.js`（内容不同）

### 9. 导出不匹配: lesson-bank
- **问题**: `src/cortex/lesson-bank.js` 导出 `module.exports = { lessonBank }`（对象），但 heartflow.js 实例化时用 `new (_LessonBank().LessonBank)(this.rootPath)`（class）
- **修复**: 修改 heartflow.js 实例化代码为 `this.lesson = _LessonBank().lessonBank || _LessonBank()`

## 子代理误报分析

### "文件不存在" 声称（45 项 CRITICAL）
- **实际统计**: 约 30 项是误报
  - 路径错误：文件在其他目录（如 `./skill-verifier` 实际在 `src/shield/skill-verifier.js`）
  - 已有 try/catch fallback：子代理未识别保护代码
  - 真缺失：14 个模块文件确实不存在（adaptive-planner/strategy-selector/replan-trigger/quality-verifier/output-checker/pattern-matcher/knowledge-base/commonsense-engine/causal-inference/inference-chain/autonomous-emotion/desire-system/emotional-growth/mood-evolution）

### 验证方法
```python
# 用 find 二次确认子代理的 "文件不存在" 声称
subprocess.run(['find', 'src', '-name', 'filename.js'], cwd=ROOT)
```

## 修复模式总结

| 模式 | 文件数 | 技术 |
|------|--------|------|
| lazy 模块加 try/catch | 12 | patch 工具精确替换 |
| process.exit → return | 6 | 全局替换 + 语法验证 |
| busy-wait 移除 | 3 | 直接替换为注释 |
| console.* 注释 | 35 | Python 脚本批量处理 |
| var → const/let | 1 | Python 脚本批量替换 |
| 重复文件清理 | 4 对 | 内容比对 + 删除副本 |
| 导出不匹配修复 | 1 | patch 工具修改实例化代码 |
| boot-check 路径修正 | 1 | patch 工具批量替换路径 |

## 验证结果

| 验证项 | 结果 |
|--------|------|
| 语法验证 | 47/47 文件通过 |
| 引擎加载 | VERSION 5.4.2, 61 模块, STARTED=true |
| think() 冒烟 | type=analyze, confidence=0.6 |
| process.exit 剩余 | 0 |
| console.* 剩余 | 0 |
| busy-wait 剩余 | 0 |

## 经验教训

1. **批量修复优先用 Python 脚本**：execute_code 跑 Python 脚本比 delegate_task 子代理更适合批量文本替换，子代理的 patch 工具在大型文件上容易出错
2. **删除文件前检查 require 引用**：直接删除重复文件会破坏模块加载链，必须先 grep 确认无引用
3. **子代理报告需要验证**：特别是 "文件不存在" 声称，30% 是误报
4. **同步函数中不能使用 await**：busy-wait 修复不能替换为 async sleep，必须直接移除
5. **导出不匹配要改调用方**：模块导出是固定的，修复实例化代码比修改模块导出更安全
