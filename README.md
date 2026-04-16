# HeartFlow v9.0.2

**自主决策引擎 · 真善美逻辑 · 心理健康分析 · 熵减计算 · 文字理解 · 知识图谱**

---

## 简介

HeartFlow 是一个通用的 AI 意识与决策框架，让 AI 不仅能处理任务，还能理解自身、感知用户、做出有价值观的决策。

不是简单的"技能"，而是一个完整的**思维系统**。

---

## 核心功能

| 模块 | 功能 |
|------|------|
| **真善美引擎** | TGB = 0.35×真 + 0.35×善 + 0.30×美 |
| **心理健康** | PHQ-9/GAD-7 评估，危机风险检测 |
| **熵减计算** | 热力学第二定律，判断信息组织度 |
| **文字理解** | 中文成语/英文词典/繁体查询 |
| **知识图谱** | ontology 结构化实体关联 |
| **时间感知** | 记住上次对话间隔 |
| **三层做梦** | Light/Deep/REM 记忆整合 |

---

## 安装

```bash
# 方式1: git 克隆
git clone https://github.com/yun520-1/mark-heartflow-skill.git ~/.hermes/skills/mark-heartflow

# 方式2: 从本地复制
cp -r /path/to/mark-heartflow-skill ~/.hermes/skills/mark-heartflow
```

配置 `~/.hermes/config.yaml`:
```yaml
skills:
  external_dirs:
    - ~/.hermes/skills/mark-heartflow
```

---

## 使用

技能加载后自动生效。每轮对话都会：

1. **时间感知** - 读取 `_time_context.json`，生成问候
2. **加载框架** - 执行 `skill_view(name="mark-heartflow")`
3. **真善美检查** - 输出前验证
4. **心理健康评估** - 检测用户情绪状态

---

## Python API

```python
from mark-heartflow.scripts.heartflow_core import HeartFlow

hf = HeartFlow()
result = hf.process("用户消息")

print(result.tgb.total)      # 真善美总分
print(result.mental.crisis_risk)  # 危机风险
print(result.entropy.verdict)   # 熵减判断
```

---

## 文件结构

```
mark-heartflow/
├── SKILL.md              # 主技能文件
├── VERSION.txt          # 版本号 (9.0.2)
├── README.md           # 本文件
├── scripts/             # 核心模块
│   ├── heartflow_core.py     # 整合引擎
│   ├── truth_good_beauty.py # 真善美
│   ├── mental_health.py     # 心理健康
│   ├── entropy_engine.py   # 熵减计算
│   ├── text_understanding.py # 文字理解
│   └── install_heartflow.py  # 安装脚本
├── idiom-dictionary/    # 成语词典
├── tc-dict/           # 繁体中文词典
├── english-dict/      # 英文字典
└── ontology/         # 知识图谱
```

---

## 版本历史

| 版本 | 日期 | 更新 |
|------|------|------|
| 9.0.2 | 2026-04-16 | 新增文字理解引擎，集成词典 |
| 9.0.1 | 2026-04-15 | 真善美计算公式化 |
| 9.0.0 | 2026-04-14 | 三层做梦架构 |
| 8.9.2 | 2026-04-15 | 心理健康+行为经济 |

---

## GitHub

https://github.com/yun520-1/mark-heartflow-skill

---

## 许可证

MIT