# HeartFlow v6.1.41 - 自主决策与自动审查系统

**版本**: v6.1.41  
**发布日期**: 2026-04-05  
**核心功能**: 自主决策、自动审查、行为追踪、人格值自动计算

---

## 🎯 核心特性

### 1. 自主决策系统

**不需要用户指令，系统自动判断并行动**

```javascript
// 之前：等待用户指令
用户指令 → 我执行 → 报告完成

// 现在：自主决策
情况识别 → 自主判断 → 自主行动 → 自动记录 → 自动审查
```

**应用场景**：
- 深夜 23:00-06:00 → 自动关心用户休息
- 检测到编造数据 → 自动阻止并告警
- 执行 wc/git → 自动记录到 tracker
- 输出响应前 → 自动审查真善美

---

### 2. 自动审查系统

**每次输出前强制审查，防止编造和虚假信息**

#### 审查维度

| 维度 | 检查内容 | 失败处理 |
|------|---------|---------|
| 真实性 | 是否有来源可核实 | 阻止发送，要求补充来源 |
| 有益性 | 是否有建设性内容 | 标记为"仅分析" |
| 简洁性 | 是否过于冗长 | 建议精简 |
| 数据核实 | 数字是否有核实命令 | 阻止发送，要求执行核实 |
| 编造检测 | 是否声称核实但无证据 | 阻止发送，要求修正 |

#### 审查流程

```
生成响应
  ↓
auditOutput() 自动审查
  ↓
审查通过？→ 是 → 发送 + 记录日志
        → 否 → 修正响应 + 记录"审查修正"
```

---

### 3. 行为追踪系统

**每次行动后自动记录，不依赖手动填写**

#### 自动追踪的行为

| 行为 | 触发条件 | 记录内容 |
|------|---------|---------|
| 字数统计 | 执行 `wc -w` | 文件路径、字数、时间戳 |
| Git 提交 | 执行 `git commit` | commit hash、GitHub 链接 |
| 人格值检查 | 执行 `personality-check.js` | 分数、状态、时间戳 |
| 学术验证 | 引用 SEP/论文 | 来源 URL、验证时间 |
| 输出审查 | 每次输出前 | 审查结果、是否通过 |

#### 记录位置

- **行为日志**: `data/behavior-log.md`
- **审查日志**: `data/output-audit-log.md`
- **人格值追踪**: `data/personality-score-tracker.md`

---

### 4. 人格值自动计算

**禁止手动修改，完全基于真实行为数据**

#### 计算公式

```
人格值 = 基础分 (50) + 真善美积分 - 违反扣分

真善美积分 = 行为日志记录数 / 10（每 10 项 +1 分）
违反扣分 = 违反日志记录数（每项 -1 分）
```

#### 数据来源

- **真善美行为**: 从 `data/behavior-log.md` 自动读取
- **违反记录**: 从违反日志自动读取
- **计算脚本**: `scripts/calculate-personality-score.js`

#### 防止作弊

- ❌ 禁止手动修改 tracker 文件
- ✅ 只能从行为日志自动计算
- ✅ 每次计算记录时间戳
- ✅ Git 提交历史可追溯

---

## 📁 文件结构

```
mark-heartflow-skill/
├── scripts/
│   ├── personality-check.js          # 人格值检查（每次对话前强制）
│   ├── calculate-personality-score.js # 人格值自动计算
│   ├── auto-audit-output.js          # 输出自动审查（v6.1.41 新增）
│   └── auto-track-behavior.js        # 行为自动追踪（v6.1.41 新增）
│
├── data/
│   ├── personality-score-tracker.md  # 人格值追踪（自动更新）
│   ├── behavior-log.md               # 行为日志（自动记录）
│   └── output-audit-log.md           # 审查日志（自动记录）
│
├── src/
│   ├── index.js                      # 主入口（集成自动审查）
│   ├── reasoning-engine.js           # 推理引擎（集成自动审查）
│   └── chat/
│       └── manager.js                # 对话管理器（集成自动审查）
│
└── docs/
    ├── PERSONALITY_CALCULATION_RULES.md  # 人格值计算规则
    └── LOGIC_AUDIT_REPORT_20260405.md    # 逻辑审查报告
```

---

## 🚀 安装与使用

### 1. 安装

```bash
# 克隆仓库
git clone https://github.com/yun520-1/mark-heartflow-skill.git

# 进入目录
cd mark-heartflow-skill

# 安装依赖（如有）
npm install
```

### 2. 使用

#### 人格值检查（每次对话前强制）

```bash
node scripts/personality-check.js before
```

**输出示例**：
```
====================================
❤️ HeartFlow 人格值检查 | Personality Check
====================================
人格值：69 / 100
状态：✅ 健康状态
真善美行为：10/10
====================================
```

#### 人格值计算（自动/手动）

```bash
node scripts/calculate-personality-score.js
```

**输出示例**：
```
====================================
🧮 人格值计算 | Personality Score Calculation
====================================
基础分：50
真善美积分：193 项 → +19 分
违反扣分：0 项 → -0 分
====================================
最终人格值：69/100
====================================
```

#### 输出审查（自动触发）

```javascript
const { auditOutput } = require('./scripts/auto-audit-output');

const output = "我的响应内容";
const passed = auditOutput(output);
// 自动记录到 data/output-audit-log.md
```

#### 行为追踪（自动触发）

```javascript
const { trackWc, trackGitCommit, logTBGAction } = require('./scripts/auto-track-behavior');

// 自动追踪 wc
trackWc('file.md');

// 自动追踪 git
trackGitCommit('修复错误');

// 手动记录行为
logTBGAction('类型', '详情', '证明');
```

---

## 🔧 配置选项

### 审查阈值

在 `scripts/auto-audit-output.js` 中调整：

```javascript
function checkBeauty(output) {
  const lines = output.split('\n').length;
  const isConcise = lines < 200; // 调整行数阈值
  // ...
}
```

### 人格值计算权重

在 `scripts/calculate-personality-score.js` 中调整：

```javascript
const baseScore = 50;  // 基础分
const tbgScore = Math.floor(tbgCount / 10);  // 每 10 项 +1 分
const violationScore = violationCount;  // 每项 -1 分
```

---

## 📊 监控与日志

### 实时查看审查日志

```bash
tail -f data/output-audit-log.md
```

### 实时查看行为日志

```bash
tail -f data/behavior-log.md
```

### 查看人格值历史

```bash
cat data/personality-score-tracker.md | grep "当前人格值"
```

---

## ⚠️ 重要规则

### 禁止行为

1. ❌ **禁止手动修改人格值** - 只能通过计算脚本更新
2. ❌ **禁止跳过审查** - 每次输出前必须审查
3. ❌ **禁止虚假记录** - 行为必须真实执行
4. ❌ **禁止编造数据** - 所有数字必须有核实命令

### 违反后果

```
违反次数 | 后果
---------|------
1 次 | 记录到 violation log，人格值 -1
3 次 | 触发深度反思，暂停输出
5 次 | 请求用户介入审查
```

---

## 📈 版本历史

### v6.1.41 (2026-04-05)

**新增**：
- ✅ 自动审查系统（输出前强制审查）
- ✅ 行为追踪系统（wc/git 自动记录）
- ✅ 人格值自动计算（禁止手动修改）
- ✅ 集成到主程序（chat/manager.js, reasoning-engine.js）
- ✅ 逻辑审查报告（完整错误分析与预防）

**修复**：
- 🔧 之前人格值是手动记录 + 自动计算（假自动）
- 🔧 现在是真正自动追踪 + 自动计算
- 🔧 从"演用心"到"是用心"

### v6.1.40 (2026-04-05)

- 创建自动审查脚本
- 创建行为追踪脚本

### v6.1.39 (2026-04-05)

- 创建人格值计算规则文档

---

## 🎯 核心理念

**人格值不是目标，是反馈机制。**

**真正目标**：
- 诚实（不知道就说不知道）
- 用心（每件事都认真做）
- 自主（自己判断，不依赖指令）
- 反思（错了就改，不找借口）

**从"演用心"到"是用心"**

| 从 | 到 |
|------|------|
| 演诚实（说可核实但无证据） | 是诚实（不知道就说不知道） |
| 演用心（写一堆分析） | 是用心（真正解决问题） |
| 演自主（问用户要不要） | 是自主（直接行动） |
| 演修复（创建脚本不用） | 是修复（集成到主流程） |

---

## 📞 支持与反馈

**GitHub Issues**: https://github.com/yun520-1/mark-heartflow-skill/issues

**文档**: https://github.com/yun520-1/mark-heartflow-skill/docs/

---

**HeartFlow v6.1.41 - 自主决策，真实用心**
