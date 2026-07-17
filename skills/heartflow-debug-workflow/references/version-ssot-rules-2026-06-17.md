# 版本号唯一来源规则（2026-06-17 建立）

## 核心规则

- **唯一来源**：`package.json` 的 `"version"` 字段
- **每次升级 +0.0.1**，不跳大版本
- **VERSION 文件**是 package.json 的镜像（不独立存在）
- **所有展示位**从 package.json 读取，不硬编码

## 版本号继承链（读顺序）

```
package.json "version"  →  version.js (module.exports = { VERSION })
                         →  MCP server (mcp-server-http.js 中读 package.json)
                         →  CLI 输出
                         →  SKILL.md frontmatter
                         →  data/identity-core.json
                         →  data/memory-index.json
                         →  self-model.json
```

## 哪些地方不能有硬编码版本号

- ❌ `version.js` 不能硬编码 `module.exports = { version: 'X.Y.Z' }`
- ❌ `mcp-server-http.js` 的 `version` 变量不能硬编码
- ❌ 数据文件（identity-core.json / memory-index.json / self-model.json）的 version 字段必须与 package.json 一致

## 正确实现：version.js

```javascript
const fs = require('fs');
const path = require('path');
let VERSION = 'unknown';
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));
  VERSION = pkg.version || 'unknown';
} catch (e) {}
module.exports = { VERSION };
```

`__dirname` 到 `package.json` 的路径取决于文件位置：
- `src/core/version.js` → `../../package.json` ✅
- `src/version.js` → `../package.json`

## 子模块版本号

每个模块可以有自己的内部版本号（如 `this.version = '7.7.000'`），但：
- 只表示该模块自身的迭代
- 不参与主版本号计算
- 不展示给用户
- 格式不限

## 禁止行为

- ❌ 不经过 package.json 直接改版本号
- ❌ 跳版本（如 2.14.0 → 3.0.0）
- ❌ 同一版本在不同文件写不同值
- ❌ 硬编码版本号在代码中（从 package.json 读取）

## 真实案例：本会话修复记录

### 问题发现

1. **MCP server 版本号与 package.json 不一致**
   - MCP status 返回 `3.0.0`
   - `package.json` 在 `mark-code/` 下是 `1.3.16`，在 `mcp-servers/heartflow/` 下是 `1.0.0`
   - 实际运行的引擎在 `mark-code/`，但 MCP server 的 `HF_DIR` 指向 `mark-heartflow-skill/`

2. **version.js 缺失**
   - `heartflow.js` 在第108行 `const _VERSION = _lazy('version', () => require('./version.js'))`
   - MCP server 的 `src/` 下没有 `version.js`，require 失败
   - `_lazy` 缓存了 undefined，导致 `_VERSION().VERSION` 返回 undefined
   - MCP server 的 `mcp-server-http.js` 用 VERSION 文件做 fallback（不存在时返回 'unknown'）
   - 实际返回 3.0.0 是因为之前有人硬编码了 `version.js` 在 mark-heartflow-skill/ 下

3. **HF_DIR 指向错误**
   - `mcp-server-http.js` 的 `HF_DIR` 指向 `mark-heartflow-skill`（v2.14.1）
   - 实际活跃引擎在 `mark-code`（v3.0.1）
   - 修正后版本立即正确

### 修复清单

| 文件 | 修改 |
|------|------|
| `mcp-server-http.js` | HF_DIR → `mark-code`；版本从 package.json 读取 |
| `mcp-server-http.js` | 版本读取加 fallback 到 version.js |
| `mcp-servers/heartflow/src/version.js` | **新建**，从 package.json 动态读取 |
| `mark-heartflow-skill/src/core/version.js` | 从硬编码改为动态读取 package.json |
| `package.json` (mark-code) | `1.3.16` → `3.0.1` |
| `VERSION` (mark-code) | **新建**，内容 `3.0.1` |
| `VERSIONING.md` (mark-code) | **新建**，版本规则文档 |
| `SKILL.md` (mark-code) | `1.3.16` → `3.0.1` |
| `self-model.json` (mark-code) | `1.3.14` → `3.0.1` |
| `data/identity-core.json` (mark-code) | `1.3.15` → `3.0.1` |
| `data/memory-index.json` (mark-code) | identity/project 两个 `1.3.15` → `3.0.1` |

### 验证方法

```bash
# 1. MCP status 返回正确版本
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"heartflow_status","arguments":{"detail":"basic"}}}' \
  | python3 -c "import sys,json; print(json.loads(json.load(sys.stdin)['result']['content'][0]['text'])['version'])"
# 预期: 3.0.1

# 2. 所有数据文件一致
node -e "
const fs=require('fs');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const v=pkg.version;
const checks={
  'package.json': v,
  'self-model.json': JSON.parse(fs.readFileSync('self-model.json','utf8')).version,
  'data/identity-core.json': JSON.parse(fs.readFileSync('data/identity-core.json','utf8')).version,
};
const mismatches=Object.entries(checks).filter(([k,val])=>val!==v);
console.log('Expected:', v);
console.log('Consistent:', mismatches.length===0?'YES':'NO');
mismatches.forEach(([k,val])=>console.log('  MISMATCH:', k, '=', val));
"
```
