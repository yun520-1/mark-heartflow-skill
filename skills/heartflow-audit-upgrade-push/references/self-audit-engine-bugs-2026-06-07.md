# Self-Audit Engine Bug Analysis (2026-06-07, updated 2026-06-09)

## 问题 1: `_estimateDuplication()` O(n²) 无限挂起

**位置**: `code-engine.js` → `auditCodebase()` → `_estimateDuplication()`

**触发条件**: `self-audit.js` 的 `auditDependencies()` 调用 `engine.auditCodebase(ROOT)`，后者内部调用 `_estimateDuplication(codeFiles, fileContents)`。

**根因分析**:
```
_estimateDuplication() {
  // 对所有文件提取所有函数
  for (const [filePath, {content, lang}] of fileContents) {
    const analysis = this.analyzeCode(content, lang);
    for (const func of analysis.functions) {
      functionSignatures.push({...});  // 5391 个函数
    }
  }
  // O(n²) 两两比较
  for (let i = 0; i < functionSignatures.length; i++) {
    for (let j = i + 1; j < functionSignatures.length; j++) {
      const similarity = stringSimilarity(a.bodyHash, b.bodyHash);  // ~14.5M 次调用
    }
  }
}
```

**影响**: 维度4（依赖审计）完全不可用。`auditCodebase()` 超时 60 秒仍无返回。

## 问题 2: `reviewCode()` 在 code-engine.js 上 OOM 崩溃（2026-06-09 更新）

**位置**: `code-engine.js` → `reviewCode()` → `_checkTypeCoercion()`

**触发条件**: `self-audit.js` 的 `auditCodeQuality()` 对 code-engine.js (129KB, 3528行) 调用 `engine.reviewCode(content, 'javascript')`。

**2026-06-09 新发现**: 问题已从 6月7日的「挂起」恶化为 **OOM 崩溃**。当 `runAudit({mode:'full'})` 遍历全部 77 个 core 模块 + 91 个其他 JS 文件时，Node.js v25.8.2 堆内存膨胀至 4GB+，触发 `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed`。

**逐项检查结果**:
| 检查方法 | 耗时 | 说明 |
|---------|------|------|
| `analyzeCode(code-engine.js)` | 223ms ✅ | 单文件正常 |
| `_checkNullUndefined` | 3ms ✅ | |
| `_checkBoundaryConditions` | 6ms ✅ | |
| `_checkImplicitAssumptions` | 47ms ✅ | |
| `_checkAsyncErrorHandling` | 5ms ✅ | |
| `_checkTypeCoercion` | **OOM** ❌ | `line.match(/(\w+)\s*\+\s*(\w+)/)` 在 3529 行上触发深度 regex 回溯 + AST 对象无法 GC |
| `_checkDeadCode` | 55ms ✅ | (单文件独立测试) |

**OOM 堆栈特征**:
- 崩溃点: `StringPrototypeTrim` 内置函数（字符串处理在 GC 期间耗尽最后内存）
- `--max-old-space-size=512` 不够
- 默认 2GB 堆上限也不够
- 168 个 JS 文件 × `analyzeCode()` 每次返回大型 AST 对象 → 对象累积无法 GC

**可靠的手动审计替代方案（不经过 CodeEngine）**:
```javascript
// 版本一致性检查
const fs = require('fs');
const vf = fs.readFileSync('VERSION','utf-8').trim();
const pkg = JSON.parse(fs.readFileSync('package.json','utf-8'));
const sk = fs.readFileSync('SKILL.md','utf-8');
const fm = sk.match(/version:\s*"([^"\n]+)"/);
const hf = fs.readFileSync('src/core/heartflow.js','utf-8');
const doc = hf.match(/HeartFlow\s+v(\d+\.\d+\.\d+)/);

// 文件完整性检查（existsSync 不加载内容）
fs.existsSync('src/core/heartflow.js')  // true/false

// 运行时版本（只加载 version.js，不触发全量分析链）
const {VERSION} = require('./src/core/version.js');
```

## 问题 3: `extractExports()` 漏检

**位置**: `self-audit.js` → `extractExports()`

**影响**: `auditDeadCode()` 只找到 9 个文件有导出（实际远多于 9）。

**漏检的导出模式**:
- `module.exports = { xxx, yyy, ... }` — 最常用的 CommonJS 模式
- `export * from '...'` — 重导出
- `export { default as xxx }` — 带别名的重导出

## 问题 4: 版本不一致（2026-06-09 更新）

**问题根因**: `VERSION` 文件被手动编辑（或 `bumpVersion` 未调用），导致其他文件不同步。

**2026-06-09 现场**:
| 源 | 当前值 | 期望值 | 状态 |
|---|--------|--------|------|
| `VERSION` 文件 | 2.8.25 | — (SSOT) | ✅ |
| `package.json` | 2.8.24 | 2.8.25 | ❌ |
| `SKILL.md frontmatter` | 2.8.24 | 2.8.25 | ❌ |
| `heartflow.js` doc 注释 | 2.8.14 | 2.8.25 | ❌ 严重过时 |
| `version.js` doc 注释 | 2.2.11 | — | INFO (历史值) |

**关键发现**: `bumpVersion()` 在 `version.js` 中已实现，但它同步 VERSION 文件 + package.json + SKILL.md，**不更新** heartflow.js 的 doc 注释。当 VERSION 文件被手动编辑时（而非通过 bumpVersion），package.json 和 SKILL.md 都会落后。

**修复方案**:
1. 运行 `node -e "const {bumpVersion}=require('./src/core/version.js'); console.log(bumpVersion('patch',{dryRun:true}));"` 确认当前版本
2. 实际执行去掉 `dryRun` 同步所有文件
3. 手动修复 `src/core/heartflow.js` 中的 doc 注释版本号
