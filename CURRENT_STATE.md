# 心虫 v5.17.21 当前状态

> 审计22/22 ✅ | CI 0 vulns | 测试69/69 | 冷启动1073ms
> 四层认知增强主路径生效 | Phase2基础设施就位

## 升级历程 (v5.10.13 → v5.17.21)

| 阶段 | 版本范围 | 内容 |
|---|---|---|
| 审计封板 | v5.17.0-v5.17.2 | 审计22项全部修复 |
| 认知升级 | v5.17.3-v5.17.11 | 管线重连/认知闭环/DNS pinning |
| AI人类基础 | v5.17.12-v5.17.13 | 心理学8理论+论文13篇 公式集成 |
| AI人类四层 | v5.17.14-v5.17.19 | M1感知→M2认知→M3决策→M4反思 |
| Phase 0-2 | v5.17.20-v5.17.21 | 去重/四层主路径/LayerBus/Logger/Config/AdaptiveLearning |

## 安全基线

- 审计22/22 ✅ | CI audit=0 | npm audit=0
- 存储: AES-256-GCM持久化密钥(自动生成,0o600)
- 沙箱: vm隔离(默认关闭) | SSRF: url-validator+DNS pinning
- 出网: 统一safeFetch | 密钥: 集中config-v2.secret()
- gitignore: .env/.key/.pem均已保护

## 认知架构

```
感知层: cognitiveLoadV2(精度权重) + 预测误差(context-builder)
认知层: Thoughtseed竞争动力学 + 双过程System1/2
决策层: ActiveInference EFE(探索/利用) + 伦理硬约束
反思层: blind-spot-breaker + biasAudit + 跨轮recurrenceCheck
编排: LayerBus四层总线 + pipeline主路径融合
```

## 基础设施

| 模块 | 位置 | 功能 |
|---|---|---|
| Logger | src/infra/logger.js | 结构化JSON日志四级 |
| Config | src/core/config-v2.js | 集中配置+安全默认 |
| LayerBus | src/workflow/layer-bus.js | 四层统一编排总线 |
| AdaptiveLearning | src/cortex/adaptive-learning.js | 用户认知成长建模 |

## 剩余瓶颈 (架构债,非bug)

1. God file heartflow.js 5838行
2. 同步I/O ~600处
3. 代码执行沙箱非进程级(默认关闭)
4. 测试覆盖率需提升
