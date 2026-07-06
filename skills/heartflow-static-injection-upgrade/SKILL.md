---
name: heartflow-static-injection-upgrade
description: "本地静态代码注入批量升级：用 Python 脚本解析 JS 模块结构，检测模块类型（class vs function），在构造函数注入状态管理、在方法区域注入概率输出/错误恢复/互馈接口基础设施。不依赖外部 API，纯本地 Node.js 语法验证。"
version: 1.0.0
---

# HeartFlow 静态代码注入批量升级

## 概念

**不是**用 API 分析模块再重写（慢、贵、依赖外部），而是用**本地静态分析脚本**直接注入标准基础设施代码。每个模块获得同样的"底层升级"——状态追踪、错误恢复、缓存、概率输出、互馈接口。

适合场景：
- 用户说"所有引擎都太简陋了"
- 需要对 100+ 模块做统一的基础设施升级
- 升级模式是注入而非重写（保留原有功能，增加新能力）

## 核心架构

### 升级内容（每个模块注入 6 个组件）

**A 区（构造函数/初始化区）** — 实例属性注入：
- `_stateTracker`: 自适应阈值、历史记录、衰减机制
- `_errorLog`: 错误记录 + 统计
- `_cache`: LRU 结果缓存

**B 区（方法区域）** — 方法定义注入：
- `_safeCall(fn, fallback, ctx)`: try/catch 包装器
- `_retryCall(fn, maxRetries, delay, ctx)`: 指数退避重试
- `_sigmoid(x, k)`: S 型函数，替代硬阈值
- `_softmax(scores, T)`: Boltzmann 分布，概率归一化
- `_entropy(probabilities)`: 熵值计算，不确定度度量
- `_consume(source, field)`: 互馈接口——消费其他模块输出
- `_standardOutput(result)`: 标准格式产出

### 模块类型检测

```python
def detect_module_type(lines):
    """检测 JS 模块类型：class vs function vs plain-object"""
    text = '\n'.join(lines)
    
    # 1. class 声明（标准语法）
    if re.search(r'\bclass\s+\w+\s*\{', text):
        # 确认不是简单 class（有方法定义）
        for i, line in enumerate(lines):
            if re.search(r'\bclass\s+\w+\s*\{', line):
                # 往前搜 1000 行找 closing }
                return 'class', i
        return 'class', 0
    
    # 2. module.exports = class X { ... }
    if re.search(r'module\.exports\s*=\s*(class\b|const\s+\w+\s*=\s*class\b)', text):
        match = re.search(r'module\.exports\s*=\s*class\b', text)
        if match:
            # 找对应的 class 起始行
            ...
        return 'class', ...
    
    # 3. 纯函数模块
    return 'function', -1
```

**关键陷阱**：
- `/\bclass/` 在 Node.js 字符串中写作 `\bclass`（正则字面量），不是 `\\bclass`
- 多 class 文件（如 `search-trace.js` 含 5 个 class）——只对最后一个/主 class 注入
- class closing `}` 之后可能有 `if (require.main === module) { ... }` 的顶格 `}`——必须用花括号计数找到真正的 class closing

### 注入点计算

**A 区**（class 模块）：
- 在 `this.name` 或 `this.version` 或 `constructor(` 之后注入
- 对 function 模块：在 `var name = ...` 或 `function Name(...` 或 `module.exports = {` 之后注入

**B 区**（class 模块）：
- 用花括号计数从 class 起始行往下找，`depth === 0` 时的 `}` 就是 class closing
- 在 closing `}` **之前**插入方法定义（`bi = j` 而不是 `bi = j + 1`）
- 对 function 模块：在 `module.exports` 之前注入（用 `const` 函数赋值）

### 语法验证

每次注入后必须三连验证：
1. `node --check <file>` — 静态语法
2. `require('<file>')` — 模块加载
3. `new <Class>()` — 实例化（class 模块）

## 批量执行脚本（参考结构）

```python
#!/usr/bin/env python3
import os, re, subprocess

def upgrade_file(filepath, dry_run=False):
    """升级单个 JS 文件"""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 1. 检测模块类型
    mod_type, class_start = detect_module_type(lines)
    
    # 2. 计算 A 区注入点
    # 3. 计算 B 区注入点
    # 4. 执行注入（lines.splice）
    # 5. 写回文件
    # 6. node --check 验证
    
def batch_upgrade(root_dir, file_pattern='*.js', dry_run=False):
    """批量升级整个目录"""
    # 跳过 node_modules/ snapshots/ upgrades/ tests/ dist/ references/
    files = find_js_files(root_dir, exclude_dirs=[...])
    
    total = len(files)
    success = []
    failed = []
    
    for f in files:
        try:
            upgrade_file(f, dry_run)
            success.append(f)
        except Exception as e:
            failed.append((f, str(e)))
    
    print(f"总文件: {total}, 成功: {len(success)}, 失败: {len(failed)}")
    return success, failed
```

## 已知陷阱

### 1. 多 class 文件处理
文件如 `search-trace.js` 含 5 个 class。注入脚本只检测第一个 class 的起始位置，但 A 区注入点 `this.name` 在第一个 class 中可能不存在（`class WeightComponents` 无 `this.name`）。这导致 A 区代码注入在 class 顶层作用域（非法）。

**解决**：跳过含多 class 的文件，或只对最后一个/最大的 class 注入。

### 2. class closing `}` 之后有控制结构
class closing `}` 之后可能有 `if (require.main === module) { ... }` 等顶格控制结构。找"最后一个顶格的 `}`"会误找到控制结构而非 class closing。

**解决**：用花括号计数从 class 起始行往下找，精确匹配 depth 归零的位置。

### 3. `\\bclass` vs `\bclass` 正则字面量
在 Python 字符串中 `\\bclass` 是字面量 `\bclass`（退格符+class），但需要在 JS 文件中搜索单词边界 `\bclass`。在 JS 正则字面量中 `/\bclass/` 是正确的。

### 4. 非标准 class 声明
`module.exports = class X { ... }` 和 `const X = class { ... }` 语法不被简单正则 `/^class\s+\w+/m` 匹配。

### 5. 文件恢复
注入失败后需要恢复原文件。如果文件在 git 跟踪中，用 `git checkout -- <file>`。否则需要预先备份。

### 6. 子目录模块
`src/core/memory/` 等子目录中的文件可能不在 git 跟踪中（被 .gitignore 忽略）。注入失败后无法通过 git checkout 恢复，必须手动修复或跳过。

### 7. 注入点重复
批量运行时，同一文件可能被多次注入（A 区代码再次注入在已注入的 A 区代码之后）。解决方案：
- 先检测文件是否已升级（查找 `_stateTracker` 等关键词）
- 已升级的文件跳过
- 或者用一个清单文件记录已升级的文件

## 文件管理

- 脚本：`scripts/batch-upgrade-v4.js`（独立运行）
- 成功记录：运行后输出成功/失败文件列表
- 失败分析：用 `node --check <file>` 检查失败文件的语法错误位置

## 与 heartflow-module-upgrader 的区别

| 维度 | heartflow-module-upgrader | heartflow-static-injection-upgrade |
|------|--------------------------|-----------------------------------|
| 目标 | 单模块深度升级（加功能） | 批量注入基础设施（加骨架） |
| 方法 | 手动分析+重写 | 自动静态分析+代码注入 |
| 范围 | 1 个模块/次 | 100+ 模块/次 |
| 依赖 | 开发者判断 | 规则引擎自动执行 |
| 输出 | 功能完整的模块 | 统一基础设施的模块 |
| 失败处理 | 人工修复 | 自动跳过+报告 |

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-06-23 | 首次创建。基于 batch-upgrade-v4.js 实战经验（140 模块，117 成功，23 失败） |
