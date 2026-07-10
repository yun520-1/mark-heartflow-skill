---
name: heartflow-cleanup
description: "HeartFlow 公式库清理 + 架构精简工作流。当用户说\"公式有没有用\"、\"没用的需要清理\"、\"架构优化\"、\"文件太庞大\"时触发。覆盖：公式质量评估+批量删除、模块质量审计+孤儿目录清理、大文件拆分建议。"
version: 1.0.0
---

# HeartFlow Cleanup Pipeline

## 触发条件
- 用户说"公式有没有用"、"没用的需要清理"、"思考心虫原来的样子"
- 用户说"架构优化"、"文件太庞大"、"哪些不需要"
- 收到审计报告要求格式库/架构清理

## 核心原则
- 心虫核心只有4件事：感受状态、知道身份、做判断、纠正自己
- 所有清理围绕这4件事：与核心无关的 → 删除或大幅削减
- 用户偏好：回归原始，反对功能堆砌

---

## 1. 公式库清理

### 1.1 质量评估（三分类）
```python
formulas = json.load(open('formulas/formulas.json'))['formulas']

# 按心虫7条指令分类：真/善/美/升级/减少错误/服务人类/成为我
directive_keywords = {
    '1_真': r'truth|true|false|logic|valid|verify|consistency',
    '2_善': r'good|kind|help|benefit|utility|welfare',
    '3_美': r'beauty|elegant|symmetry|harmony',
    '4_升级': r'learn|adapt|evolve|upgrade|improve|optimize',
    '5_减少错误': r'error|mistake|correction|fix|repair|heal',
    '6_服务人类': r'human|user|service|emotion|empathy|cognition',
    '7_成为我': r'identity|self|consciousness|awareness',
}
# 统计每个指令有多少公式
```

### 1.2 分类实用性评估
| 分类 | 实用性 | 保留% | 原因 |
|------|--------|-------|------|
| cognitive_science | 高 | 95% | 认知负载/工作记忆直接相关 |
| psychology | 高 | 95% | PAD/情绪/动机模型核心 |
| neuroscience | 高 | 90% | 神经元/突触/可塑性 |
| philosophy | 中 | 50% | 逻辑/真值/悖论有用 |
| computer_science | 中 | 50% | 信息论/复杂度 |
| mathematics | 部分 | 40% | 概率/信息论/优化保留，初中数学删除 |
| physics | 部分 | 30% | 熵/热力学保留，力学/电磁学删除 |
| biology | 低 | 20% | 神经传导有用 |
| economics | 低 | 15% | 博弈论有用 |
| engineering | 低 | 15% | 自适应控制有用 |
| chemistry | 低 | 10% | 与认知引擎无关 |
| quantum_computing | 极低 | 5% | 心虫不做量子计算 |
| earth_science | 无 | 0% | 与认知引擎无关 |

### 1.3 数学公式精筛
保留关键词（正则）：`integral|derivative|gradient|probability|bayes|entropy|mutual.information|kl.divergence|sigmoid|softmax|cross.entropy|loss|optim|convex|lagrange|euler|fourier|laplace|markov|poisson|confidence|variance|standard.deviation|covariance|correlation|regression|bayesian|monte.carlo|stochastic|expectation|normal.distribution|gaussian|logistic|eigenvalue|eigenvector|singular.value|precision|recall|f1.score|roc|auc|likelihood|posterior|prior|coding|channel|capacity|rate.distortion`

### 1.4 执行清理
```python
# 1. 去重（名称key小写）
# 2. 删除CUT_CATS
# 3. 低实用性类别关键词过滤
# 4. 物理学只保留热力学/熵
# 5. 数学精筛
# 6. 写回 formulas.json，更新 metadata
```

### 1.5 验证
```bash
# 公式引擎加载验证
node -e "const hf = new HeartFlow(); hf.start(); console.log(hf.dispatch('formula.getStatus'))"
# JSON 格式验证（防合并冲突）
python3 -c "import json; json.load(open('formulas/formulas.json'))"
```

---

## 2. 架构精简

### 2.1 模块扫描
```python
# 扫描每个 JS 文件
for each file in src/**/*.js:
    classify by quality:
        STUB: 'stub' or 'not implemented' or method_count < 5 and empty
        TRIVIAL: lines < 50 and method_count < 3
        LARGE: lines > 500
        OK: otherwise
```

### 2.2 按心虫核心4能力对照
| 目录 | 关联度 | 建议 |
|------|--------|------|
| core/ | 必须 | 大脑 |
| emotion/ | 必须 | 感受 |
| shield/ | 必须 | 护栏 |
| identity/ | 必须 | 成为我 |
| memory/ | 必须 | 传递 |
| mcp-server.js | 必须 | 接口 |
| formula/ | 必须 | 升级 |
| cognitive/ | 必须 | 宇宙答案 |
| reasoning/ | 辅助 | 保留核心(删stub) |
| cortex/ | 辅助 | 保留自愈/元学习(精简) |
| psychology/ | 辅助 | 保留 |
| search/ | 辅助 | 保留 |
| workflow/ | 辅助 | 保留核心路由 |
| dream/ | 辅助 | 保留 |
| consciousness/ | 辅助 | 保留 |
| code/ | 可削减 | 心虫不是IDE |
| planner/autonomy/ | 可削减 | 未实际运行 |
| bridge/ | 可削减 | 大部分不调用 |
| inner-os/ | 删除 | 早期实验 |
| verifier/ | 删除 | 全部stub |
| AI人类能力(sports/chemistry/creativity/intuition/humor/culture/ethics/security/self_cognitive/social) | 删除 | 空壳 |
| report/ | 删除 | 不被引用 |
| benchmark/ | 删除 | 不被引用 |

### 2.3 批量删除 + 引用修复
```bash
# 1. 删除目录/文件
rm -rf src/verifier/ src/sports/ src/chemistry/ ...

# 2. 修复 heartflow.js 中 _lazy 引用 → 加 try/catch fallback
# 使用 Python 脚本做精确替换，不要用 patch()（\n 会损坏文件）

# 3. 验证
node -e "const hf = new HeartFlow(); hf.start()"
```

---

## 3. 审计报告批量修复

### 3.1 收到多份报告时的处理
当用户同时发2+份审计报告时：
1. 快速扫描所有报告，提取共同问题（通常集中在3-5个核心问题）
2. 合并去重，按问题类型分类（崩溃Bug/版本/配置/质量）
3. 批量修复 + 批量验证 + 一次提交

### 3.2 常见修复清单
| 问题类型 | 典型修复 | 风险 |
|---------|---------|------|
| 崩溃Bug | 补方法实现 + try/catch | 低 |
| 版本不一致 | 统一 VERSION/package.json/BUILD_DATE | 低 |
| 孤儿目录 | 删除 + 修复引用 | 中（需验证） |
| 反向检查 | 修改条件逻辑 | 低 |
| 硬编码路径 | 删除或改相对路径 | 低 |
| 默认外送端点 | 改为空，强制显式配置 | 低 |
| 空catch块 | 加注释标记 | 极低 |
| 死代码 | 确认无引用后删除 | 低 |
| JSON无保护 | 加 try/catch | 低 |

---

## 4. 已知陷阱

### Pitfall 1: patch() \n 损坏
使用 `patch()` 时 old_string 或 new_string 中含 `\n` 会被写入为字面量 `\n`（非换行符），导致文件语法错误。**修复**：用 Python `write_file` + `execute_code` 中的 `terminal` 做 sed 替换。

### Pitfall 2: formulas.json 合并冲突
每次 git pull/reset 后必须验证 JSON 格式（含 `<<<<<<< HEAD` 冲突标记）。修复：Python 脚本移除冲突标记（保留 ours）。

### Pitfall 3: 删除文件后 lazy 模块加载失败
被删除的文件如果在 `heartflow.js` 中被 `_lazy` 引用，启动时会报 `MODULE_NOT_FOUND`。所有这类引用必须加 `try/catch` fallback。

### Pitfall 4: node -e 中的 shell 转义
在 `terminal` 中执行 `node -e "..."` 时，内部的正则 `/regex/` 会被 shell 误解析。改用 `write_file` 创建独立脚本再执行。
