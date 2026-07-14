# HeartFlow v6.0.1 — 本地认知预处理引擎

> HeartFlow 是一个本地认知预处理引擎，提供结构化认知数据供下游模型参考。默认在用户终端内运行，不依赖外部 AI 服务。

---

## 安全特性

- **零后台进程**：不启动守护进程，不常驻内存。
- **无遥测**：不发送使用数据到任何服务器。
- **代码执行默认关闭**：需显式配置才允许执行代码。
- **MCP 走 stdio**：不监听网络端口，不暴露 HTTP 服务。
- **无硬编码凭据**：密钥由用户本地生成，不提交到仓库。

---

## 快速启动

```bash
# 克隆
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 验证
node bin/verify.js

# 交互模式
node bin/cli.js chat

# 单次分析
node bin/cli.js --chat "我想辞职去创业"

# 查看状态
node bin/cli.js status
```

### MCP 工具（25 个）

| 工具 | 功能 |
|------|------|
| `heartflow_think` | 完整思维链推理 |
| `heartflow_think_fast` | 快速推理 |
| `heartflow_think_deep` | 深度推理 |
| `heartflow_dream` | 梦境生成与整合 |
| `heartflow_memory_search` | 跨层记忆检索 |
| `heartflow_emotion` | 情绪分析（PAD 三维） |
| `heartflow_emotion_analyze` | 简化情绪分析 |
| `heartflow_psychology_analyze` | PAD + 意图 + 防御机制 |
| `heartflow_psychology_deep` | 深度心理学（大五人格/共情） |
| `heartflow_ai_psychology` | AI 原生心理学 |
| `heartflow_agent_psychology` | 代理心理学 |
| `heartflow_philosophy` | 统一哲学引擎 |
| `heartflow_ai_philosophy` | AI 原生哲学分析 |
| `heartflow_philosophy_decision` | 哲学决策分析 |
| `heartflow_verify_reasoning` | 验证推理自洽性 |
| `heartflow_self_heal` | 自愈 |
| `heartflow_status` | 引擎健康检查 |
| `heartflow_dispatch` | 通用路由（150+ 路由） |
| `heartflow_record_lesson` | 记录教训 |
| `heartflow_transmit` | 知识传递 |
| `heartflow_being` | 存在逻辑 |
| `heartflow_decision_router` | 决策路由器 |
| `heartflow_decision_router_stats` | 决策路由统计 |
| `heartflow_cognitive_check` | 认知状态检查 |
| `heartflow_module_health` | 模块健康检查 |

---

## 架构

```
输入 → [认知管道] → 结构化数据 → LLM → 最终响应
```

| 层级 | 目录 | 功能 |
|------|------|------|
| **Engine Core** | `src/core/` | 主循环、决策路由、判断引擎、认知协议 |
| **Memory** | `src/memory/` | 三层记忆、知识图谱、记忆融合 |
| **Shield** | `src/shield/` | 安全护栏、伦理守护、语言诚实、思维检查日志 |
| **Cortex** | `src/cortex/` | 自愈、失败分析、经验回放、反思循环、进化 |
| **Identity** | `src/identity/` | 自我定位、哲学引擎、大五人格、共情评估 |
| **Emotion** | `src/emotion/` | 欲望认知、情绪分析、三毒检测、情感成长 |
| **Dream** | `src/dream/` | 梦境引擎、多片段综合、叙事生成 |
| **Reasoning** | `src/reasoning/` | 逻辑推理、辩论分析、事实验证、联想引擎 |
| **Code** | `src/code/` | 代码执行、规划、生成、重构、验证 |
| **Psychology** | `src/psychology/` | AI 心理学引擎、呼吸练习、认知重构、自我慈悲 |
| **Bridge** | `src/bridge/` | LLM 桥接、意图分类、语气分析、翻译管线 |
| **Consciousness** | `src/consciousness/` | 全局工作空间、心智漫游、现象学引擎 |
| **Inner-OS** | `src/inner-os/` | 内部操作系统（会话/状态/事件/格式化） |
| **Planner** | `src/planner/` | 自适应规划、好奇心引擎、欲望引擎、自主目标 |
| **Workflow** | `src/workflow/` | 思维链、管线、时间扩展、知识传递 |
| **Search** | `src/search/` | BM25、混合搜索、语义搜索 |
| **Verifier** | `src/verifier/` | 输出检查、模式匹配、质量验证 |

---

## 版本

| Metric | Value |
|--------|-------|
| **Version** | 6.0.1 |
| **Modules** | 131+ |
| **Core Formulas** | 379+ |
| **Tests** | 44+ files |
| **MCP Tools** | 25 |

---

## 设计目标

HeartFlow 的目标是减少认知误差，提升结构化输出的可用性：

| 维度 | 目标 |
|------|------|
| 🧠 **认知秩序** | 减少混乱、增加清晰 |
| ❤️ **关系秩序** | 保持上下文连续、避免遗漏 |
| 🎨 **感知秩序** | 从噪声中提取信号 |

---

## 安装方式

```bash
# 方式一：git clone（推荐）
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
npm install

# 方式二：npm
npm install @yun520-1/heartflow
```

> Hard dependency: `mathjs`. Optional: `@xenova/transformers`, `pm2`.

---

## 迁移指南 (v5 → v6)

If you are upgrading from HeartFlow v5.x to v6.0.1:

1. **Version sync**: run `node scripts/sync-version.js` so `VERSION`, `package.json`, `SKILL.md`, and `BUILD_DATE` are aligned.
2. **Verify baseline**: run `node bin/verify.js` and ensure all 14 checks pass.
3. **Run tests**: run `npm test` and confirm integration/unit suites pass.
4. **Encrypted memory**: v6 continues AES-256-GCM memory encryption. If you see `HEARTFLOW_AES_KEY is not set`, either set the same key as before or delete encrypted memory files to start fresh.
5. **Module API**: most public APIs remain stable. New subsystems are exposed via `hf._modules` and dispatch routes. If you relied on internal module ordering, switch to named dispatch or explicit module access.
6. **Persona/preset usage**: v6 adds richer persona presets under `presets/`. Review default persona selection if you override behavior at startup.
7. **MCP tools**: existing 25 tools are preserved. No breaking changes to tool names or schemas in this release.

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| **6.0.1** | 2026-07-14 | 版本统一整改：SKILL/README/CURRENT_STATE/package.json/version.js 全部对齐到 6.0.1 |
| **6.0.0** | 2026-07-12 | 核心重构完成：131+ 模块、379+ 公式、179/179 测试通过、记忆系统 R1-R8 |
| 5.10.0 | 2026-07-10 | 三层体系确立、366 核心公式、292 模块、七条指令写入 CORE |
| 5.9.12 | 2026-07-04 | 公式驱动模块：决策/情绪/记忆/认知负荷/梦境/心理学对话 |

---

## 联系方式

- 📧 **邮箱**: markcell@qq.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/yun520-1/mark-heartflow-skill/issues)
- 📦 **npm**: [@yun520-1/heartflow](https://www.npmjs.com/package/@yun520-1/heartflow)

---

<p align="center">
  <strong>HeartFlow v6.0.1</strong> — A cognitive preprocessor that structures thought for downstream models<br>
  <sub>MIT License · Copyright © 2026</sub>
</p>
