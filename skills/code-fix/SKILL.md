---
name: code-error-fixer
description: |
  Systematic code error diagnosis and fix skill. Handles compilation errors, runtime exceptions,
  type errors, logic bugs, crash analysis, dependency conflicts, and unexpected behavior.
  TRIGGER when: user reports an error/exception/bug/crash, build or test failures,
  unexpected behavior in code, type errors, runtime stack traces, dependency resolution failures,
  or asks "why is this not working" / "fix this error" / "debug this".
  DO NOT TRIGGER when: user asks for code review without errors, general architecture questions,
  feature requests without error context, or "how would I implement X" (use appropriate dev skill).
description_zh: 代码报错自动诊断与修复技能
description_en: "Code error auto-diagnosis & fix skill (compiler/runtime/logic bugs)"
version: 1.0.0
allowed-tools: Read,Bash,Glob,Grep,Edit,Write,WebSearch
metadata:
  category: debugging
  version: "1.0.0"
  sources:
    - Rubber Duck Debugging principle
    - Root Cause Analysis (RCA) methodology
    - Scientific Method for debugging
    - The Debugging Mindset (Andy Oram & Greg Wilson)
    - Why Programs Fail (Andreas Zeller)
---

# Code Error Fixer — 代码报错自动修复技能

系统化诊断和修复各类代码错误的工作流。遵循 **复现 → 定位 → 理解 → 修复 → 验证** 五步法，避免凭直觉猜测式改代码。

## 五步修复工作流（强制遵循）

```
用户报错 → [Step 1 复现] → [Step 2 定位] → [Step 3 理解] → [Step 4 修复] → [Step 5 验证] → 结案
                              ↑_____________ 证据不足时回到 Step 1 _____________↓
```

### Step 1: 复现 (Reproduce)

**目标：稳定复现问题，收集完整错误上下文。**

必须收集的信息（缺一不可，逐项核对）：

- [ ] **完整错误消息** — 不要摘要，截取完整堆栈/日志
- [ ] **触发条件** — 什么操作/输入/数据会触发？是否必现？
- [ ] **环境信息** — 语言/运行时版本、操作系统、依赖版本、Node/Python/Go 等版本
- [ ] **相关代码** — 出错的源文件、最近修改的文件、配置文件
- [ ] **复现步骤** — 用户能否提供最小复现？如果不能，自己构造

执行动作：
1. 读取报错文件内容（Read）
2. 检查运行环境（`node --version`, `python --version`, `go version` 等）
3. 尝试在本地复现（运行构建/测试/启动命令）
4. 如果错误依赖特定输入，引导用户提供或构造最小复现用例
5. 如果无法复现，要求用户提供更多上下文并**不能继续修复**

**产出：** 清晰的错误描述 + 可复现的步骤

### Step 2: 定位 (Isolate)

**目标：缩小问题范围，找到根因所在的精确位置。**

定位策略（优先级从高到低）：

| 策略 | 适用场景 | 方法 |
|------|---------|------|
| **二分法** | 大段代码/多文件 | 注释掉一半代码，看错误是否消失；重复直到定位 |
| **堆栈追踪** | 运行时异常/崩溃 | 从栈顶往栈底读，找到第一个**你自己的代码** |
| **差异对比** | 之前能工作现在不行 | `git diff`，`git blame` 找到最近修改 |
| **最小化输入** | 输入数据导致异常 | 逐步缩小输入，找到触发异常的精确数据 |
| **断言/日志** | 逻辑错误/静默失败 | 在关键路径插入临时日志或断言 |
| **依赖分析** | 编译/运行时依赖错误 | 检查 `package.json` / `go.mod` / `requirements.txt` 版本约束 |

执行动作：
1. 读取报错文件中涉及的文件（从堆栈/报错行号开始）
2. 追踪变量/函数的源头和流向
3. 用二分法注释无关代码缩小范围
4. 必要时插入临时 `console.log` / `print` / `fmt.Println`
5. 检查版本兼容性和最近变更

**🔴 铁律：在没有定位到具体哪一行/哪个变量前，禁止进行修复。**

### Step 3: 理解 (Understand)

**目标：彻底理解根因——回答"为什么会产生这个错误"。**

- 查看相关 API / 函数文档
- 理解预期行为 vs 实际行为的差异
- 检查边界条件、空值、类型不匹配、竞态条件等常见根因
- 对不确定的根因，查阅 Web 搜索确认（库的已知 issue、API 变更等）

**🔴 铁律：不能解释根因，就不能开始修复。**

### Step 4: 修复 (Fix)

**目标：最小改动、精准修复。**

- **最小改动原则** — 只改导致问题的地方，不顺便重构
- **避免"霰弹式修改"** — 一次只改一个地方，验证后再改下一个
- 先考虑修复方案对现有逻辑的影响（回归风险）
- 处理边缘情况：空值、边界值、类型转换、异步时序
- 添加必要的防御性检查（但不滥用）

### Step 5: 验证 (Verify)

**目标：确认修复有效且没有引入新问题。**

- [ ] 运行复现步骤确认错误消失
- [ ] 运行现有测试套件
- [ ] 检查相关功能的冒烟测试
- [ ] 检查是否引入了新的 TypeScript / linter 错误
- [ ] 如果影响面大，建议用户 review

**如果验证失败 → 回到 Step 1。**

---

## 常见错误类型与诊断策略

### 1. 编译/语法错误

| 类型 | 快速定位技巧 |
|------|-------------|
| 类型错误 (TypeScript) | 从第一个错误开始修复（后续往往只是级联） |
| 语法错误 | 检查括号/引号/逗号配对，模板字符串中的反引号 |
| 导入错误 | `ImportError` / `ModuleNotFoundError` — 检查路径、大小写、`__init__.py` |
| 链接错误 | 检查库版本、ABI 兼容性、链接库路径 |

### 2. 运行时异常

| 异常 | 常见根因 |
|------|---------|
| `NullPointerException` / `Cannot read property of undefined` | 异步数据未加载、可选链缺失、初始值未设 |
| `TypeError: X is not a function` | 导入错误、变量覆盖、调用时机过早 |
| `IndexError` / `IndexOutOfBounds` | off-by-one 错误、空列表、边界条件 |
| `StackOverflow` | 无限递归、事件循环、循环依赖 |
| `OutOfMemoryError` | 内存泄漏、大对象未释放、数据量超出预期 |

### 3. 逻辑 Bug

| 类型 | 诊断方法 |
|------|---------|
| 条件分支错误 | 列出所有分支 + 输入组合，逐一验证 |
| 循环/遍历错误 | 追踪循环变量变化，检查边界条件 |
| 异步/并发错误 | 检查 race condition，添加锁或原子操作 |
| 状态管理错误 | 追踪状态变更链路，检查不可变性 |
| 浮点精度 | 不直接比较浮点数，使用 epsilon 或 Decimal |

### 4. 依赖/环境问题

| 问题 | 诊断方法 |
|------|---------|
| 版本冲突 | `npm ls <pkg>`, `go mod graph`, `pipdeptree` |
| 环境差异 | 对比开发/测试/生产环境的 `.env` 和配置文件 |
| 缓存问题 | 清除缓存：`node_modules`, `pip cache`, Go build cache |
| 平台差异 | 路径分隔符、换行符（CRLF vs LF）、文件权限 |

### 5. 数据/API 错误

| 问题 | 诊断方法 |
|------|---------|
| API 返回值异常 | `curl` / 浏览器检查真实响应，验证接口文档 |
| 数据格式不对 | 检查 JSON Schema、边界类型（空数组/null/缺失字段） |
| 编码问题 | UTF-8 vs GBK、BOM、特殊字符转义 |

---

## 核心原则

### 1. 一次只改一个问题
不要同时修复多个无关问题。每个修复独立验证，否则无法确定哪个改动有效。

### 2. 证据驱动
每个结论必须由数据支持：堆栈、日志、变量值、测试结果。禁止脑补根因。

### 3. 先检查最简单的可能性
- 拼写错误？大小写？路径分隔符？
- 缓存需要清除？
- 服务需要重启？
- 配置文件生效了吗？

### 4. 最小复现原则
如果能构造最小复现（Minimal Reproducible Example），优先用它调试。MRE 本身往往就已经揭示了根因。

### 5. 回退总比乱改好
如果问题复杂且时间紧迫，回退到上次正常工作的版本好过胡乱修复引入更多问题。

---

## 技术栈快速参考

### JavaScript / TypeScript / Node.js

```bash
# 检查 Node 版本和类型定义
node --version && npx tsc --version

# 检查依赖版本冲突
npm ls <package-name>          # 已安装的版本树
npm outdated                    # 可更新的包
npx synp --source-file          # yarn.lock ↔ package-lock.json 转换检查

# 清除缓存
rm -rf node_modules && npm install
# 或
npm cache clean --force
```

### Python

```bash
# 检查 Python 版本和虚拟环境
python --version && which python
pip list | grep <package>

# 依赖树
pipdeptree -p <package>

# 重新安装
pip install --force-reinstall <package>
```

### Go

```bash
go version
go env GOPATH GOROOT
go mod graph | grep <package>
go mod tidy
```

### Rust

```bash
rustc --version && cargo --version
cargo tree -p <crate>
cargo clean && cargo build
```

---

## 对话模板

当用户报告错误时，按以下结构回复：

1. **错误复现** — 确认收到的错误信息 + 环境信息（如已提供）
2. **缺失信息** — 如果缺少关键信息，列出需要补充的内容
3. **定位计划** — 简要说明打算如何排查
4. **发现** — 定位过程中的发现/新信息
5. **根因** — 确定根因时的明确声明
6. **修复方案** — 具体修改内容 + 预期效果
7. **验证结果** — 验证结论

---

## 禁止做的事

- ❌ 不收集完整错误信息就开始猜
- ❌ 不确认根因就改代码（霰弹式修改）
- ❌ 一次改多个无关问题
- ❌ 修复后不验证
- ❌ 对不确定的问题直接建议"升级依赖"或"重装"而不分析根因
- ❌ 复杂问题不尝试构建最小复现
