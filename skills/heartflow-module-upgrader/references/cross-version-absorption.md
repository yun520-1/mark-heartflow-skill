# 跨心虫版本代码吸收工作流

## 适用场景

当两个心虫（HeartFlow）版本在不同路径下各自演化时（如 `~/.hermes/skills/ai/mark-heartflow-skill/` 的Hermes心虫 vs `~/.claude/skills/mark-heartflow-skill/` 的Claude心虫），将旧版中有价值但新版缺失的模块/方法吸收到新版中。

## 执行步骤

### Step 1: 审计两个版本的差异

```bash
# 对比文件列表
diff <(cd ~/.hermes/skills/ai/mark-heartflow-skill/src/core && find . -name '*.js' | sort) \
     <(cd ~/.claude/skills/mark-heartflow-skill/src/core && find . -name '*.js' | sort)
```

重点关注：
- 旧版有、新版没有的模块
- 旧版中某个方法的功能是新版缺失的（如 code-planner.js 的 buildDependencyGraph）
- 注意：旧版可能依赖外部 npm 包（如 acorn），评估是否值得迁移

### Step 2: 提取核心逻辑

不要整个文件复制——只提取**核心逻辑**，以简洁的方式整合到新版的目标模块中：

```bash
# 定位核心方法的位置
grep -n "function\|async.*(" ~/.claude/skills/mark-heartflow-skill/src/core/code/code-planner.js | head -20
```

### Step 3: 写入新版目标模块

**关键规则：** 不能直接用 patch 工具在大型 JS 文件（>1000行）中追加新方法。用 Python 脚本精确控制插入位置：

```python
from hermes_tools import read_file

# 1. 找到类结束位置
# 类结束 '}' 在行首（0缩进），且之前是方法定义
# 用 grep -n '^}' 定位

# 2. Python 列表操作精确插入
lines = read_file('/path/to/target.js')['content'].split('\n')
insert_pos = class_end_line - 1  # 0-indexed
new_lines = lines[:insert_pos] + [new_methods] + lines[insert_pos:]

# 3. 用 write_file 写入
write_file('/path/to/target.js', '\n'.join(new_lines))
```

**缩进纪律：**
- 类方法使用 4 空格缩进（不是 2 空格）
- 方法体内部再缩进 4 空格（共 8 空格）
- 注释缩进与方法定义对齐
- JSDoc 注释 (`/** */`) 缩进与方法定义一致

### Step 4: 验证

```bash
# 语法验证
node --check <target-file.js>

# 功能验证
node -e "
const { ClassName } = require('./target-file.js');
const instance = new ClassName();
const result = instance.newMethod(testInput);
console.log('OK:', JSON.stringify(result));
"
```

## 已知陷阱

### 1. 子代理写入产生严重损坏

**不要用子代理的 patch 工具在大型 JS 文件（>1000行）中追加新方法。** 子代理的 patch 经常出现：
- 缩进错乱（2空格 vs 4空格）
- 类结束 `}` 位置错误（在 `// ==== 导出` 注释之后）
- 重复的代码段/注释
- 语法错误

**根因：** 子代理通过 patch 工具间接修改文件，对文件整体结构缺乏感知。patch 在大型文件中匹配 `old_string` 时可能匹配到错误位置。

**修复方法：** 不要试图在损坏文件上反复 patch 修复——直接 `git checkout -- <file>` 恢复原始版本，然后用 `execute_code`（Python 脚本）精确控制插入位置。

### 2. 类结束 `}` 定位

大型 JS 文件中类结束 `}` 可能在中间位置，而不是文件末尾附近：
- `class CodeEngine {` 在第 251 行
- 类结束 `}` 在第 3060 行（文件共 3065 行）
- 后面还有 `// ==== 导出`、`module.exports = { CodeEngine }`

**正确找法：**
```bash
grep -n '^}' file.js
```
或计算括号深度：`{` 加1，`}` 减1，找到深度回到0且非注释的行。

**不能用** `wc -l` 或 `tail -5` 推算。

### 3. 原有代码可能已有未闭合的括号

在 git 版本中文件语法正确（括号平衡），但在多次 patch 后可能产生括号不平衡。如果遇到：
```
SyntaxError: Unexpected token '{'
```
先 `git checkout -- <file>` 恢复，再重新做精确的写入。

### 4. 方法命名冲突

新方法名不能与类中已有方法重名。在写入前：
```bash
grep -n "methodName(" target-file.js
```

### 5. 语言关键词支持

从旧版吸收的中文需求分析逻辑，必须补全中文关键词：
- `数据库` → hasDatabase
- `数据模型` → hasModels
- `业务` / `处理` → hasServices / hasControllers
- 旧版可能只有英文关键词
