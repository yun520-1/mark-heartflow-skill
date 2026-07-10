# v5.9.15 安全审计修复记录（2026-07-10）

## 审计方法

6个审计技能并发执行（3个 delegate_task 子代理 + 本地 Trail of Bits 扫描）：
- Cloudflare security-audit-skill（多阶段深度审计）
- Vibe Security（AI生成代码审计）
- Trail of Bits（sharp-edges + insecure-defaults + entry-point-analyzer + agentic-actions-auditor）

## 心虫代码规模

| 指标 | 数值 |
|------|------|
| JS 文件数 | 369 |
| 总行数 | 172,520 |
| 最大文件 | heartflow.js (4,451行) |
| 依赖 | mathjs ^15.2.0（唯一运行时依赖） |
| npm audit | 0 vulnerabilities |

## 扫描统计

| 检查项 | 数量 |
|--------|------|
| code-executor 沙箱（new Function/child_process） | 7 |
| 硬编码 API Key 模式 | 13 |
| RegExp（new RegExp构造） | 33 |
| 未捕获 Promise | 16 |
| console.log | 61 |
| TODO/FIXME | 4 |
| eval 使用（排除 code-verifier） | 0（false positive） |
| new Function | 3 |
| fs.writeFileSync | 132 |
| 网络请求（fetch/http） | 8 |
| process.env 引用 | ~10 |
| return undefined/null | 502 |
| 魔法数字 | 800 |
| 过长函数（>100行） | 20+ |
| 未处理空值（.length/.split等无null guard） | 2826 |
| setTimeout/setInterval（无clearTimeout） | 54 |

## 修复清单

### v5.9.13 叙事体检测修复
- psychology.js: detectPADFromText 新增叙事体检测
- thought-chain.js: _classifyTask 新增 narrative_analysis
- heart-logic.js / heart-judge.js / task-pipeline.js: 同步 narrative_analysis
- 阈值从 200 降到 30

### v5.9.14 安全修复
- formula-calculator.js: mathjs import/createUnit 禁用（C-02）
- mcp-server.js: Promise 加 .catch()（H-02）
- mcp-server.js: Token 速率限制 30→5（H-03）

### v5.9.15 全面修复
- heartflow.js: dispatch undefined 检测
- mcp-server.js: 速率限制确认
- utils.js: safeLog 安全日志
- path-guard.js: 路径安全校验模块
- fetch-safe.js: 安全网络请求模块
- regex-safe.js: 正则 DoS 防护模块
- formulas.json: git 合并冲突修复（3529公式恢复加载）
- VERSION: git 合并冲突修复

## 测试验证

### C-02 mathjs 注入防护
```
正常计算: 2+3 = 5 ✅
import 被阻止 ✅: mathjs import disabled in HeartFlow
createUnit 被阻止 ✅: mathjs createUnit disabled in HeartFlow
```

### path-guard.js
```
data/test.json → safe: true ✅
/etc/passwd → safe: false, "path outside allowed roots" ✅
../../../etc/shadow → safe: false, "path outside allowed roots" ✅
```

### dispatch + formula engine
```
cognitiveIndex.estimate: 正常返回 ✅
formula.getStatus: 3529 formulas ✅
```

### 叙事体检测
```
叙事文本 → outOfScope: true, emotion: "outOfScope" ✅
"我很愤怒" → angry, P=-4 ✅
"今天天气不错" → neutral ✅
```
