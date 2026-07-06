# Hooks Adapter 模式（hooks-adapter.js）

## 概述

`hooks-adapter.js` 将 Claude Code 的 4 个 hooks 生命周期事件映射为心虫内部事件。v2.2.0 引入。

## Claude Code Hooks → 心虫映射

| Claude Code Hook | 心虫事件 | 默认行为 |
|-----------------|---------|---------|
| `SessionStart` | `cognitive.boot` | 加载身份核心、记忆系统、元认知协议 |
| `UserPromptSubmit` | `psychology.scan+intent` | 心理扫描、意图检测、情绪评估 |
| `PostToolUse` | `codeEngine.review+audit` | 代码审查（Edit/Write工具）、安全审计（git commit/push） |
| `Stop` | `lesson.extract+merge` | 教训提取、记忆合并、自我进化更新 |

## 导出接口

```js
const { Hooks, HOOK_EVENTS, _defaultHandlers } = require('./src/core/hooks-adapter.js');

// 4个事件常量
HOOK_EVENTS.SESSION_START      // 'SessionStart'
HOOK_EVENTS.USER_PROMPT_SUBMIT // 'UserPromptSubmit'
HOOK_EVENTS.POST_TOOL_USE      // 'PostToolUse'
HOOK_EVENTS.STOP               // 'Stop'

// 注册自定义处理器
Hooks.on('SessionStart', (context) => {
  return { context: '...', actions: [...], metrics: {...} };
});

// 便捷方法
Hooks.onSessionStart(handler);
Hooks.onUserPromptSubmit(handler);
Hooks.onPostToolUse(handler);
Hooks.onStop(handler);

// 触发事件
Hooks.events['SessionStart'].fire(context);

// 重置
Hooks.reset();
```

## 设计特点

- 纯 JS 对象输出，零外部依赖
- 每个处理器返回 `{ context, actions, metrics }`
- 支持自定义处理器注册（`Hooks.on(event, handler)`）和重置
- 无自定义处理器时使用默认处理器自动兜底
- 多处理器结果自动合并

## 与 Claude Code 插件 hooks 的关系

Claude Code 插件系统（如 security-guidance 插件）使用同名的 4 事件架构：
- `SessionStart` → 运行 bootstrap 脚本
- `UserPromptSubmit` → 运行安全检查脚本（可 block 或 append context）
- `PostToolUse` → 匹配特定工具调用（如 `Edit|Write|Bash(git commit:*)`）后触发
- `Stop` → asyncRewake 模式运行最终审查

心虫的 hooks-adapter 是对齐此架构的适配层，但不依赖 Claude Code 插件系统。
