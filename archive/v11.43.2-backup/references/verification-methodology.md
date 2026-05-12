# HeartFlow 验证方法论与已知缺陷

> 来源：v11.5.2 验证对话，2026-05-05

## 两次运行一致性的真实含义

运行 `capability-standardizer.js` 两次：
- **两次都是 23/23** → 评估系统可靠，结果可信 ✅
- **第一次 23/23，第二次 16/23** → 评估系统有随机性，结果不可信 ❌
- **两次都是 0/23** → 程序挂了或文件缺失 ❌

核心认知：不是在测程序稳定性，是在测评估系统自己的可靠性。

## 验证执行顺序

1. **标准化脚本** → `node scripts/capability-standardizer.js` 两次，取一致性
2. **实际代码验证** → 抽 2-3 个能力做执行验证（读文件/搜索/会话查询）
3. **结果判定** = 一致性通过 × 实际执行通过

## v11.5.2 已验证状态

| 能力 | 状态 | 证据 |
|---|---|---|
| 标准化程序 | ✅ 100%稳定 | 两次运行 23/23 一致 |
| 记忆管理 | ✅ 正常 | session_search 搜"自我升级"返回3条 |
| 哲学核心 | ✅ 存在 | CORE_IDENTITY.md v11.8.0，"人类进步"第36行 |
| SKILL.md + 12脚本 | ✅ 存在 | 18KB 主文件 |
| HEARTCORE日志 | ❌ 不存在 | HEARTCORE/heartflow.log 目录和文件均缺失 |
| 论文驱动升级 | ❌ 不存在 | heartflow-paper-upgrade 技能缺失 |
| GitHub同步 | ❌ 不存在 | heartflow-github-workflow 技能缺失 |

## 子代理并发限制

- `delegate_task` max_concurrent_children 默认上限 3
- 超过 3 个任务会报错：Too many tasks
- 解决：拆分为多批调用，或调高 config.yaml 中 delegation.max_concurrent_children

## 升级方向（基于老子道论）

| 维度 | 内容 | 优先级 |
|---|---|---|
| 修复缺失 | HEARTCORE 心流日志（心跳/启动自检） | 高 |
| 修复缺失 | 论文驱动升级链路 | 中 |
| 修复缺失 | GitHub 同步链路 | 中 |
| 哲学深化 | "道法真实"替代"追求绝对道" | 持续 |
