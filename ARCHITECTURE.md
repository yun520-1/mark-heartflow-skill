# HeartFlow v0.13.9 — Architecture

## 设计原则

1. **AI可自安装** — 安装脚本必须是纯文本，能被任何AI理解和执行
2. **模块化** — 每个子系统独立，可单独测试/升级
3. **安全第一** — 所有外部输入经过安全层验证
4. **无单点故障** — 核心崩溃不影响诊断和恢复
5. **面向未来** — 支持最新AI研究框架（DSPy、LMQL、Ollama等）

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    HeartFlow Core v0.13.9               │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  Identity   │  │  Capability  │  │    Safety     │ │
│  │  System v2  │  │   Registry   │  │  Validator    │ │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘ │
│         │                 │                   │         │
│  ┌──────┴─────────────────┴───────────────────┴───────┐ │
│  │              Agent Orchestrator                     │ │
│  │   [Planner] → [Executor] → [Critic] → [Memory]    │ │
│  └──────────────────────┬────────────────────────────┘ │
│                         │                               │
│  ┌──────────────────────┴────────────────────────────┐ │
│  │              Tool Integration Layer                 │ │
│  │   [Terminal] [Browser] [File] [Web] [Delegation]  │ │
│  └──────────────────────┬────────────────────────────┘ │
│                         │                               │
│  ┌──────────────────────┴────────────────────────────┐ │
│  │           Memory Subsystem v2                       │ │
│  │   [Hot] → [Warm] → [Cold] → [Archive]            │ │
│  │   [FSRS v4] [HippoRAG] [EASE] [CrossTimeReplay]  │ │
│  └────────────────────────────────────────────────────┘ │
│                         │                               │
│  ┌──────────────────────┴────────────────────────────┐ │
│  │           Plugin System                             │ │
│  │   [Hooks] [Events] [Lifecycle] [Sandbox]          │ │
│  └────────────────────────────────────────────────────┘ │
│                         │                               │
│  ┌──────────────────────┴────────────────────────────┐ │
│  │           Self-Upgrade System v2                    │ │
│  │   [Paper Hunter] [Verifier] [Integrator] [Rollback]│ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┴─────────────────────────────┐
│              Skill Installer (AI-Readable)              │
│   [install.sh] — 单文件，纯Shell，无外部依赖           │
└─────────────────────────────────────────────────────────┘
```

## 核心模块

### Core Engine (`core/`)
- `engine.js` — 主入口，事件循环，生命周期管理
- `events.js` — 事件总线（发布/订阅）
- `state.js` — 全局状态管理

### Identity System v2 (`identity/`)
- 核心身份定义（7条不可更改指令）
- 身份锚点（MultiAnchorIdentity）
- 身份验证和注入

### Capability Registry (`capability/`)
- 能力注册和发现
- 动态能力绑定
- 能力版本管理

### Memory Subsystem v2 (`memory/`)
- 热层：FSRS v4调度
- 温层：HippoRAG实体图
- 冷层：EASE语义压缩
- 归档层：CrossTimeReplay

### Agent Orchestrator (`orchestrator/`)
- Planner：任务分解
- Executor：执行计划
- Critic：自我批评和验证

### Tool Integration (`tools/`)
- Terminal：命令执行
- Browser：网页交互
- FileSystem：文件操作
- WebSearch：信息检索
- Delegation：子Agent调度

### Safety Layer (`safety/`)
- 输入验证
- 输出过滤
- 权限控制
- 审计日志

### Plugin System (`plugins/`)
- 生命周期钩子
- 事件订阅
- 沙箱隔离

### Self-Upgrade System v2 (`upgrade/`)
- 论文搜索和评估
- 代码验证和集成
- 原子升级和回滚

## 通信协议

所有模块间通信通过**事件总线**：

```javascript
// 发布事件
eventBus.emit('memory:stored', { id, content, type });

// 订阅事件
eventBus.on('memory:stored', async (data) => {
  await capabilityRegistry.notify('memory_available', data);
});
```

## 插件接口

```javascript
// 标准插件结构
{
  name: 'example-plugin',
  version: '1.0.0',
  hooks: {
    'pre:task': async (task) => task,
    'post:task': async (result) => result,
  },
  capabilities: ['web_search', 'browser'],
}
```

## 安全模型

1. **能力边界** — 每个工具独立权限范围
2. **输入净化** — 所有外部输入经过正则和类型验证
3. **输出过滤** — 敏感信息自动过滤
4. **审计日志** — 所有操作可追溯
5. **故障隔离** — 单个插件崩溃不影响核心

## 安装流程

```bash
# AI可执行的单行安装
curl -fsSL https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/v0.13.9/install.sh | sh
```

安装脚本 < 100行，无外部依赖，任何AI都能理解和执行。
