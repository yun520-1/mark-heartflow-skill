# HeartFlow 引擎自检方法论

## 核心原则

对代码做模拟运行审查，不是只读代码。要求实际执行 + 返回值验证。方法：subprocess 驱动 Node.js 模块，用文件追踪定位挂起。

## 典型 Bug 类型

### 类型 A：API 签名不匹配
测试代码用的方法名和实际导出不符 → 先 `Object.getOwnPropertyNames(Object.getPrototypeOf(instance))` 查真实方法。

### 类型 B：同步阻塞
`initialize()` 内部执行耗时操作（循环、文件IO）→ 导致调用方挂起 → 用 `/tmp` 文件追踪逐步定位。

### 类型 C：中文处理失效
分词/正则没有处理中文 → 相似度/匹配全失败 → 现象：接受率极低。

### 类型 D：返回值字段名错误
代码读 `result.decision` 但实际字段是 `result.finalDecision.decision`。

## 自检步骤

1. `subprocess.run(['node', '-e', code], cwd=core/, timeout=10)` 加载模块
2. 查导出：`Object.keys(module)` 或 prototype 方法列表
3. 写正确 API 的测试代码
4. 检查返回值的实际字段结构
5. 挂起 → 写 `/tmp/trace.txt` 追踪，逐步缩小范围

## 修复优先级

P0：功能完全失效（挂起、crash）
P1：功能可用但数值错误（接受率低、阈值不对）
P2：代码质量（停用词、保护模式）

## 本次修复记录（v11.34.5）

- `core-result-engine.js`：中文分词 + 关键词扩充 + 阈值调整（21%→58%）
- `memory-recall.js`：移除 initialize() 同步调用，改为直接 require 存储层
- `meaningful-memory.js`：ephemeral 持久化（_save + _load）
- `self-healing-rl.js`：RL key FNV-1a 哈希（防止截断冲突）
- `rate-limit-guard.js`：新增全局限速感知单例
- `forgetting-engine.js`：保护模式 5→26 个
- `decision-verifier.js`：停用词中英文分离
