---
name: heartflow
version: 10.0.7
description: HeartFlow v10.0.7 - 决策引擎 + 心理健康分析 + 自我进化引擎
tags: [heartflow, decision, mental-health, consciousness, self-evolution, ai-safety]
---

# HeartFlow v10.0.7

自主决策引擎 + 心理健康分析系统 + 自我进化引擎。

## 版本

**v10.0.7** - 2026-04-19

## 核心定位（目标铁律）

1. **真善美逻辑** - TGB = 0.35×真 + 0.35×善 + 0.30×美
2. **六层哲学** - 无明→觉察→清明→圆融
3. **具身认知** - 双系统+7步思维链
4. **心理健康** - PHQ-9/GAD-7 评估
5. **行为经济** - 16种认知偏误识别
6. **记忆永存** - 四层记忆系统

## 论文提取（v10.0.7新增）

从论文 "Rethinking Memory in LLM based Agents" (Du et al., 2025) 提取的核心记忆操作：

|| 操作 | 定义 | HeartFlow集成 |
|------|------|---------------|
| **Consolidation** | 将短期经验转化为持久记忆 | memory_core 记忆巩固 |
| **Updating** | 修改现有记忆纳入最新更新 | memory_hooks 增量更新 |
| **Indexing** | 构建辅助代码作为记忆访问点 | ontology_engine 实体索引 |
| **Forgetting** | 删除过时或不正确内容 | 熵减引擎 过期清除 |
| **Retrieval** | 记忆检索 | TF-IDF向量搜索 |
| **Condensation** | 压缩关键信息 | 记忆压缩算法 |

## 快速开始

```python
import sys
sys.path.insert(0, 'scripts')
from heartflow_core import HeartFlow

hf = HeartFlow()
result = hf.process("今天工作压力大")
print(result.decision)
```

## 引擎 (11 个)

| 文件 | 名称 | 功能 |
|------|------|------|
| `heartflow_core.py` | HeartFlow 核心 | 主入口，集成所有引擎的统一处理接口 |
| `mental_health.py` | 心理健康 | PHQ-9 抑郁评估 + GAD-7 焦虑评估 + 危机干预 |
| `truth_good_beauty.py` | 真善美逻辑 | TGB = 0.35×真 + 0.35×善 + 0.30×美 |
| `decision_engine.py` | 决策引擎 | D = (G×V×E)/L 决策公式，多框架伦理分析 |
| `self_level_engine.py` | 六层自省 | 无明→觉察→清明→圆融 四层级智慧评估 |
| `entropy_engine.py` | 熵减引擎 | 基于热力学第二定律的信息有序度计算 |
| `emotion_engine.py` | 情绪引擎 | F = ⟨Q,I,B⟩ 情绪状态分析，复合情绪检测 |
| `consciousness_engine.py` | 意识系统 | Φ 整合信息量计算 + GWT 全局工作空间广播 |
| `rationality_engine.py` | 理性思维 | IGC三元组评估 + 过犹不及信号检测 |
| `ontology_engine.py` | 知识图谱 | 实体-关系图谱构建与查询 |
| `memory_palace.py` | 记忆宫殿 | Method of Loci 空间记忆系统 |

## 心理健康阈值

- **PHQ-9**: 0-4正常, 5-9轻, 10-14中, 15-19重, 20-27极重
- **GAD-7**: 0-4正常, 5-9轻, 10-14中, 15-21重
- **危机干预**: 分数≥15 或出现自杀念头立即触发

## 核心公式

- **真善美**: TGB = 0.35×真 + 0.35×善 + 0.30×美
- **决策**: D = (G×V×E)/L
- **意识**: Φ = Σ(λᵢ×wᵢ) - H_min
- **情绪**: F = ⟨Q,I,B⟩

## 注意事项

- 攻击性内容在测试模式下会被拒绝
- 用户模式下触发心理危机干预
- GitHub 上传功能默认禁用
