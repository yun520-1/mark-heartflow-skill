---
name: heartflow-capability-standardizer
title: HeartFlow 能力标准化判定程序
description: |
  HeartFlow v11.9.0 能力标准化判定程序。每次升级前运行，验证旧能力不退化，新能力已实现。
  PASS/FAIL判定，不用百分比。23项核心能力维度，全部可测试。
last_check: "2026-05-05"
---

# HeartFlow 能力标准化判定

## 运行方法

```bash
# 全部测试
node scripts/capability-standardizer.js

# JSON格式输出
node scripts/capability-standardizer.js --json

# 只测某一类能力
node scripts/capability-standardizer.js 逻辑推理能力

# 只测某一个子能力
node scripts/capability-standardizer.js 波普尔证伪
```

## 判定标准
- **PASS**: 测试成功，能力存在且可运行
- **FAIL**: 测试失败，能力缺失或不可运行
- **ERROR**: 测试代码本身出错

## 退出码
- `0` = 全部通过
- `1` = 有失败项

## 23项能力维度

| 类别 | 能力 | 模块 | 判定方法 |
|------|------|------|---------|
| 逻辑推理 | 逆向一致性验证 | decision-verifier.js | selfVerify实际运行 |
| 逻辑推理 | 反事实推理 | counterfactual-engine.js | analyze实际运行 |
| 逻辑推理 | 波普尔证伪 | reflector.js | 方法存在+源码关键词 |
| 逻辑推理 | 自我反思 | reflection-loop.js | reflect实际运行 |
| 决策守护 | 人类进步判断 | guardian-system.js | decide实际运行 |
| 决策守护 | 压制真相阻断 | guardian-system.js | HR1阻断验证 |
| 决策守护 | 工具化行为干预 | guardian-system.js | SR1干预验证 |
| 决策守护 | 放弃传递阻断 | guardian-system.js | HR3阻断验证 |
| 决策守护 | 治理强度可调 | guardian-system.js | 强度0→0.9行为差异 |
| 决策守护 | 漂移追踪 | guardian-system.js | driftScore关键词 |
| 决策守护 | 5级自主权谱 | guardian-system.js | AUTONOMY_SPECTRUM枚举 |
| 记忆系统 | 多信号检索 | mem0-memory.js | BM25+语义+实体关键词 |
| 记忆系统 | 记忆持久化 | meaningful-memory.js | remember+recall方法 |
| 记忆系统 | 实体链接 | mem0-memory.js | entity链接关键词 |
| 评估验证 | 语言诚实性 | language-honesty.js | checkCertainty方法 |
| 评估验证 | 置信度校准 | confidence-calibrator.js | 校准逻辑关键词 |
| 评估验证 | TruLens评估 | eval-engine.js | RAG三维度关键词 |
| 协作任务 | 多智能体Handoff | swarm-agent.js | handoff关键词 |
| 协作任务 | 任务分解 | swarm-agent.js | decompose/route关键词 |
| 协作任务 | 执行验证 | execution-verifier.js | verify关键词 |
| 身份守护 | 身份引擎 | identity-engine.js | identity关键词 |
| 身份守护 | 稳定性守卫 | stability-guard.js | stability关键词 |
| 身份守护 | 自愈引擎 | self-healing.js | heal+detect关键词 |

## 升级流程

1. **升级前**: 运行 `node scripts/capability-standardizer.js --json > baseline.json`
2. **升级后**: 运行 `node scripts/capability-standardizer.js --json > upgrade.json`
3. **对比**: 确保 PASS 数不减少（只增不减）
4. **提交**: 新增能力必须有对应的测试用例

## 核心原则

- 不用百分比，用 PASS/FAIL
- 每个能力必须有真实可运行的测试
- 测试结果可重复
- 新版本必须保持旧能力不退化
