# 心虫升级记录：v2.10.2 → v2.13.0（2026-06-15）

## 升级清单

| 版本 | 变更 |
|------|------|
| v2.11.0 | 记忆检索修复（memoryLayers 显示真实数据） |
| v2.12.0 | AgentPsychology 接入 dispatch + 新增认知弹性维度 |
| v2.13.0 | 6个人类心理学模块→AI认知状态调节器 |

## 详细变更

### v2.10.2 → v2.11.0
- **P0**: 删除4个死模块引用（connection-engine/entropy-direction/clarity-engine/metaphor-library）
- **P0**: MCP运行目录同步（skill目录→运行目录）
- **P1**: 记忆检索修复（`identityCore.getMemoryStats` → `memory.getStats`）
- **P1**: CORE记忆新增3条实用决策规则（匹配优先/紧急信号/情绪升级）

### v2.11.0 → v2.12.0
- **AgentPsychology 接入 dispatch**: subsystemNames 两处 + ALLOWED_ROUTES 10个路由
- **MCP 新工具**: `heartflow_agent_psychology`
- **新增第7维度**: 认知弹性（cognitiveResilience）— 恢复速度和模式追踪

### v2.12.0 → v2.13.0
- **6个心理学模块 AI 化**: breathing-exercise / pause-and-reflect / cognitive-restructuring / emotional-check-in / grounding-technique / self-compassion-script
- **每个模块新增2个AI方法**: diagnose* + generate*
- **psychology/engine.js 接入**: 新增 require + 12个代理方法
- **dispatch 注册**: 12个 psychology.diagnoseXxx 路由
- **MCP 新工具**: `heartflow_engine_pacing` + `heartflow_cognitive_check`

## 涉及文件

- `src/core/heartflow.js` — 死模块删除 + dispatch路由 + subsystemNames
- `src/core/agent-psychology.js` — 新增认知弹性维度
- `src/psychology/engine.js` — require 6模块 + 12个代理方法
- `src/psychology/*.js` (6文件) — AI化改造
- `mcp/mcp-server-http.js` — 新工具定义+handler
- `mcp运行目录/mcp-server-http.js` — 同步
- `VERSION`, `package.json`, `SKILL.md` — 版本号更新

## 验证结果

- 全量语法检查通过
- `heartflow_agent_psychology` 返回7维完整评估
- `heartflow_engine_pacing` 返回认知节律诊断
- `heartflow_cognitive_check` 返回认知偏差+修复建议
- `memoryLayers: {core: 13, learned: 4, ephemeral: 0}`
