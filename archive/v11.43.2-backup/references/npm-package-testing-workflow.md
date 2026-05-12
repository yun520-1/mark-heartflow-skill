# NPM Package Testing Workflow — Third-Party Package Evaluation

**来源**: v11.21.1 VectorStore 升级 (2026-05-07)
**问题**: 如何在 Node.js 环境中安全评估第三方包

---

## 核心原则

> **先测试再依赖** — NPM 包质量参差不齐，流行不代表可用。

对于关键基础设施（向量存储、嵌入生成等），必须通过实际测试验证 API 稳定性，不能只看文档或 README。

---

## 测试流程

### 1. 创建隔离测试环境

```bash
cd /tmp
mkdir -p <pkg>-test
cd <pkg>-test
echo '{"name":"test","version":"1.0.0"}' > package.json
npm install <package-name> 2>&1 | tail -5
```

**目的**: 不污染项目 node_modules，先在 /tmp 验证

### 2. 基本导入测试

```bash
node -e "
const pkg = require('<package-name>');
console.log('Loaded');
console.log('exports:', Object.keys(pkg));
"
```

**观察**: 是否报错、exports 包含哪些 API

### 3. API 签名测试

```bash
node -e "
const pkg = require('<package-name>');
console.log('Constructor:', typeof pkg.<ClassName>);
console.log('Methods:', Object.getOwnPropertyNames(
  Object.getPrototypeOf(pkg.<ClassName>.prototype)
).filter(n => n !== 'constructor'));
"
```

### 4. 实际功能测试

```bash
node -e "
const pkg = require('<package-name>');
try {
  const instance = new pkg.<ClassName>(<realistic-params>);
  const result = instance.<real-method>();
  console.log('Result:', result);
} catch(e) {
  console.log('Error:', e.message);
}
"
```

---

## 本次测试记录

| 包名 | 测试结果 | 原因 |
|---|---|---|
| hnswlib-node | ❌ FAIL | API 不稳定，构造函数签名与文档不符 |
| vectordb (LanceDB) | ❌ FAIL | JS API 测试失败，cannot convert undefined |
| ChromaDB npm | ❌ FAIL | API 破坏性变化 |
| **自研 VectorStore** | ✅ PASS | 零外部依赖，接口清晰 |

---

## 决策树：何时自研 vs 依赖第三方

```
需要 npm 包吗？
├── 功能简单 → 用第三方，可靠
├── 功能复杂 (ML/向量/嵌入) → 执行测试
│   ├── 测试通过 → 依赖第三方
│   └── 测试失败 → 自研 或 换包
└── 性能关键 (>1000 items) → 必须测试，ANN 索引库实测
```

---

## 已知不稳定包 (2026-05 实测)

- `hnswlib-node` — API 破坏性变化
- `vectordb` (LanceDB JS) — 连接 API 不完整
- `chroma-js` / `chromadb` — npm 版本 API 不稳定

**替代方案**: 自研纯 JS 实现，接口设计成可切换后端

---

## 自研 VectorStore 设计要点

```javascript
class VectorStore {
  constructor(options) { /* dimension, metric, persistPath */ }
  upsert(id, embedding, metadata) { /* 写入 */ }
  search(query, topK, threshold) { /* 检索 */ }
  save() / _load() { /* 持久化 */ }
}
```

**当前实现**: 内存 Map + brute-force cosine similarity
**切换阈值**: 1000+ 记忆 → 接入 ChromaDB ANN 索引

---

## 验证命令

```bash
cd /Users/apple/.hermes/skills/ai/heartflow
node -e "
const { VectorStore } = require('./src/memory/vector-store.js');
const vs = new VectorStore({ dimension: 4, persistPath: '/tmp/vs-test.json' });
vs.upsert('m1', [1,2,3,4], { text: 'test' });
console.log('Size:', vs.size());
console.log('Stats:', vs.stats());
"
```
