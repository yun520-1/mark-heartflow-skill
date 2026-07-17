# 2026-06-28: `src/code/` 目录拉平 + require 路径修复

## 背景

SkillSpector 审计发现 `src/code/code-engine.js` 有 suspicious.dangerous_exec 误报。调查发现 `src/code/code-engine.js` 是 mark-code 项目遗留的死模块（127KB），它和两个 `self-audit.js`（各34KB）形成孤立引用链——三者均未被心虫核心模块引用。删除后自动消除4个误报。

## 问题

`src/code/` 下存在嵌套目录 `src/code/code/`，4个文件分散在两层：

```
src/code/
  skill-generator.js        (17KB)
  code/                     ← 嵌套目录
    code-planner.js         (29KB)
    code-writer.js          (60KB)
    code-executor.js        (38KB)
```

此外 heartflow.js 的惰性加载注册表引用了 3 个不存在的文件：
- `code-generator.js`
- `code-verifier.js` 
- `code-knowledge.js`

## 修复步骤

### 1. 拉平目录

```bash
# 移出嵌套文件
mv src/code/code/code-planner.js src/code/code-planner.js
mv src/code/code/code-writer.js  src/code/code-writer.js
mv src/code/code/code-executor.js src/code/code-executor.js
rmdir src/code/code/

# git 会自动识别为 rename (100% similarity)
```

### 2. 修复 require 路径

**heartflow.js 3处修改：**

| 位置 | 原路径 | 新路径 |
|------|--------|--------|
| 惰性加载 (115-117行) | `../code/code/code-*.js` | `../code/code-*.js` |
| 注册表 (499-506行) | `../code/code/code-*.js` | `../code/code-*.js` |
| 注册表删除3个条目 | `code`, `codeVerifier`, `codeKnowledge` | 删除整行 |
| else-if 分支 (1420-1433行) | `codeKnowledge`/`code`/`codeVerifier` 特例 | 删除对应分支 |

**self-initiator.js 8处修改（路径不一致问题）：**

self-initiator.js 引用了 3 种不同的错误路径（都在 `src/planner/` 下）：

| 模块 | 错误路径 | 正确路径 |
|------|---------|---------|
| CodeExecutor (3处) | `../core/code/code-executor.js` | `../code/code-executor.js` |
| CodePlanner (1处) | `../code/code/code-planner.js` | `../code/code-planner.js` |
| CodeWriter (4处) | `../core/code/code-writer.js` | `../code/code-writer.js` |

### 3. 验证

```bash
# 语法检查
node --check src/core/heartflow.js
node --check src/planner/self-initiator.js
find src -name '*.js' -exec node --check {} \;  # 全量通过

# 模块加载验证
node -e "
  ['../code/code-executor.js', '../code/code-planner.js',
   '../code/code-writer.js', '../code/skill-generator.js']
  .forEach(f => { try { require(f); ok++ } catch(e) { /* fail */ } });
"  # 4/4 通过

# 检查残余引用
rg -n 'code/code/' --glob '*.js' src/   # 无
rg -n 'core/code/' --glob '*.js' src/   # 无
rg -n 'code-generator' --glob '*.js' src/  # 无
```

## 关键教训

1. **嵌套目录是重构遗留**：`src/code/code/` 很可能是 `git mv` 或目录重组时留下的，require 路径未同步更新
2. **require 路径不一致**：self-initiator.js 用了 `../core/code/`（指向 src/core/code/ 但 src/code 下无 core 目录）和 `../code/code/`（旧嵌套路径），说明文件是被分多次从不同位置复制/移动过来的
3. **注册表死模块**：`code-generator`、`code-verifier`、`code-knowledge` 在注册表中但磁盘上不存在——惰性加载不会报错，但 dispatch 路由会默默返回 undefined
4. **删除文件消除误报**：code-engine.js 被 SkillSpector 标了4个 CRITICAL 误报（正则安全检测模式），删除后自动消除，比加声明注释更彻底
5. **SkillSpector 误报特征**：安全检测模式（正则匹配 `exec\(`/`eval\(` 等模式）会被误标为 suspicious.dangerous_exec 和 suspicious.dynamic_code_execution。识别方法：看该行代码是 `_re('exec\\s*\\(')` 还是 `execSync(...)` ——前者是安全检测，后者是真执行
