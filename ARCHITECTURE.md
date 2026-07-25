# HeartFlow 长期架构 — 可持续升级方案

## 目标

heartflow.js 从 4742 行降到 800 行。新能力不碰 heartflow.js。

## 状态 (v6.3.0)

| 组件 | 状态 | 说明 |
|------|------|------|
| 插件加载器 | ✅ 已实现 | src/loader/plugin-loader.js |
| 插件注册表 | ✅ 已实现 | plugins/registry.json |
| 插件示例 | ✅ 已迁移 | src/plugins/blind-spot-breaker/ |
| HookBus | ✅ 已使用 | 插件通过 hookBus.on() 注册 |
| heartflow.js start() | ⏳ 6行插件加载代码 | 剩余 2200 行待提取 |

## 架构变化

### 旧（改 heartflow.js → 加模块）
```
用户需求 → 改 heartflow.js (import + start() + think() + export)
        → 或新建文件但 heartflow.js 仍要改 import 和挂接
```

### 新（改插件目录 → 自动发现）
```
用户需求 → 写 src/plugins/my-thing/index.js (init + hooks)
        → 注册到 plugins/registry.json (可选)
        → heartflow.js 自动加载 → 0 行改动
```

## 三层架构

### 第1层：核心内核（heartflow.js → 目标 800 行）
- 生命周期管理（start/shutdown）
- 插件加载器（PluginLoader）
- HookBus 事件总线（唯一扩展点）
- 配置系统
- **不直接 import 任何业务模块**

### 第2层：系统模块（src/core/ -> src/engine/）
- 从 heartflow.js 提取的现有系统服务
- 通过 HookBus 注册
- 每个引擎模块有独立生命周期

### 第3层：插件（src/plugins/）
- 新能力 = 新建目录 + index.js
- 暴露 {name, hooks: [{event}], init(hf, {hookBus, config})}
- 自动被 PluginLoader 发现
- 可以独立测试、独立启用/禁用

## 迁移计划

### ✅ v6.3.0 — 插件加载器
- PluginLoader 自动发现 + 加载插件
- BlindSpotBreaker 迁移为第一个插件

### ⏳ v6.4.0 — 模块访问统一
- this.knowledge → this.modules.knowledge
- 旧 this.X 保留别名不破坏

### ⏳ v6.5.0 — HookBus 迁移第2-5段
- 把对抗综合器、情感记忆桥、元认知标注搬出 think()

### ⏳ v6.6.0 — start() 拆分
- 2200 行 start() 提取
- 每个子系统独立 init 文件

## 原则
- 不重写现有模块
- 不改现有 API
- 不一次迁移完
- 不加新依赖
