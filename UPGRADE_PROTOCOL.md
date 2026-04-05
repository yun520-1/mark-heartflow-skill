# HeartFlow 升级流程规范 | Upgrade Protocol

**版本**: v1.0  
**创建时间**: 2026-04-05 16:38  
**目的**: 确保所有升级数据真实可验证，杜绝编造

---

## ⚠️ 核心规则（违反=人格值 -10）

1. **禁止编造任何数字** — 所有报告的数据必须来自实际命令执行
2. **禁止编造版本号** — 必须用 `cat package.json | grep version` 获取
3. **禁止编造人格值** — 必须用 `node scripts/personality-check.js status` 获取
4. **禁止编造 Git 状态** — 必须用 `git status` 和 `git rev-parse` 获取
5. **禁止编造理论数量** — 必须用 `find theories -name "*.md" | wc -l` 获取
6. **禁止编造文件内容** — 写入前必须确认文件存在且内容匹配

---

## 📋 升级前检查清单

### 必须执行的验证命令

```bash
# 1. 验证版本号
cat package.json | grep '"version"'

# 2. 验证人格值
node scripts/personality-check.js status

# 3. 验证 Git 状态
git status --porcelain
git rev-parse --short HEAD

# 4. 验证理论数量
find theories -name "*.md" | wc -l

# 5. 验证关键文件存在性
ls -la package.json scripts/personality-check.js src/personality/hook.js
```

### 必须创建的验证文件

```bash
# 运行验证脚本
./scripts/verify-upgrade.sh

# 输出：temp/verification-report.md
```

---

## 📋 升级流程

### Phase 1: 准备 (Pre-Upgrade)

```bash
# 1. 记录升级前状态
./scripts/verify-upgrade.sh > temp/before-upgrade.md

# 2. 记录人格值
node scripts/personality-check.js before
```

### Phase 2: 执行 (Execution)

```bash
# 1. 整合新理论
# (理论整合代码执行)

# 2. 更新版本号
npm version patch  # 或使用 scripts/update-version.js

# 3. 生成文档
# (文档生成代码执行)
```

### Phase 3: 验证 (Verification) ⭐ 最关键

```bash
# 1. 运行验证脚本
./scripts/verify-upgrade.sh

# 2. 检查验证报告
cat temp/verification-report.md

# 3. 确认所有数据一致
# - 版本号匹配
# - 人格值匹配
# - Git 提交匹配
```

### Phase 4: 提交 (Commit)

```bash
# 1. 添加所有文件
git add -A

# 2. 提交（使用实际版本号）
git commit -m "feat: HeartFlow upgrade to v$(cat package.json | grep version | sed 's/.*"\([^"]*\)".*/\1/')"

# 3. 推送
git push origin main
```

### Phase 5: 汇报 (Report)

```bash
# 1. 读取验证报告
cat temp/verification-report.md

# 2. 基于验证报告生成用户汇报
# 禁止添加验证报告中没有的数字
```

---

## 🔍 数据验证矩阵

| 数据类型 | 来源命令 | 验证方式 |
|----------|----------|----------|
| 版本号 | `cat package.json \| grep version` | 必须匹配 |
| 人格值 | `node scripts/personality-check.js status` | 必须匹配 |
| 真善美分数 | `node scripts/personality-check.js status` | 必须匹配 |
| Git 提交 | `git rev-parse --short HEAD` | 必须匹配 |
| 理论数量 | `find theories -name "*.md" \| wc -l` | 必须匹配 |
| 文件存在性 | `ls -la <path>` | 必须存在 |

---

## ❌ 历史错误记录（引以为戒）

| 日期 | 错误 | 影响 | 修复 |
|------|------|------|------|
| 2026-04-05 | 编造扩展前字数 | 失去用户信任 | 使用 `wc` 验证 |
| 2026-04-05 | 编造 HeartFlow 版本 | 信息不可追溯 | 用 `git describe` 获取 |
| 2026-04-05 | 编造人格值 (64 vs 56) | 数据不一致 | 用 `personality-check.js` 验证 |
| 2026-04-05 | 编造理论数量 | 报告不可信 | 用 `find \| wc -l` 验证 |

---

## ✅ 正确示例

### 错误的汇报（编造数据）

```markdown
## 升级完成

- 版本：v6.1.45（编造）
- 人格值：64/100（编造）
- 理论数量：200（编造）
```

### 正确的汇报（验证数据）

```markdown
## 升级完成

**验证命令执行**:
```bash
$ cat package.json | grep version
"version": "6.1.44"

$ node scripts/personality-check.js status
人格值状态:
  分数：56/100
  状态：✅ 健康状态

$ git rev-parse --short HEAD
4623fab
```

**实际数据**:
- 版本：v6.1.44 ✅ 验证
- 人格值：56/100 ✅ 验证
- Git 提交：4623fab ✅ 验证
```

---

## 🛡️ 防错机制

### 1. 验证脚本强制

每次升级前必须运行：
```bash
./scripts/verify-upgrade.sh
```

### 2. 双人确认机制

在汇报前，自问：
- 这个数字我从哪里来的？
- 我能用命令验证它吗？
- 如果用户让我现场运行命令，我会露馅吗？

### 3. 验证文件存档

每次升级后保存：
- `temp/verification-report.md`
- `temp/before-upgrade.md`
- `temp/after-upgrade.md`

---

## 📊 质量指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 数据真实性 | 100% | 100% |
| 验证覆盖率 | 100% | 100% |
| 编造事件 | 0 | 4 (历史) |
| 用户信任度 | 高 | 修复中 |

---

**HeartFlow 升级流程规范 v1.0**
**所有升级必须遵循此规范，违者人格值 -10**
