# HeartFlow 变更日志

## v11.3.2 (2026-04-30)

### 🧩 GitHub 代码搜索驱动的技能治理集成

本次升级在保留 v11.3.0 核心身份引擎的基础上，搜索并提炼 GitHub 上 agent-skill / Claude Code / AI agent security 相关项目的可迁移模式，做一次小步可验证升级。

#### GitHub 搜索来源
- `ChrisWiles/claude-code-showcase`：hooks / skills / agents / commands / GitHub Actions workflow 组织方式
- `sickn33/antigravity-awesome-skills`：大规模可安装 agentic skills 库的组织方式
- `ivan-magda/claude-code-plugin-template`：plugin marketplace scaffold 与 validation workflow 思路
- `inkog-io/inkog`、`agent-audit-kit` 类项目：AI agent 静态安全扫描与 OWASP Agentic 风险意识
- HeartFlow 现有 `identity-engine.js`：Generative Agents / MemGPT / Reflexion 式身份、记忆、反思循环基础

#### 新增代码
- `src/core/skill-governance-integrator.js`
  - `SkillGovernanceIntegrator.createUpgradePlan()`：把升级固定为 research → plan → implement → audit → sync
  - `classifySkillDocument()`：检查 SKILL 文档是否具备 frontmatter、问题、使用时机、安全、历史、验证等标准结构
  - `auditUpgrade()`：检查版本候选、隐私/secret 模式、危险 shell 模式，并输出门控结果
  - `EvidenceLedger`：记录来源、主张、证据、验证状态与风险

#### 文档重写
- 重写 `SKILL.md`：补强触发描述、核心身份、问题解决、能力表、v11.3.2 代码集成说明与安全边界
- 重写 `README.md`：保留推广清晰度、联系方式和历史入口，同时突出本次治理升级
- 保留并前置历史升级记录，不删除 v11.3.0 及更早记录

#### 审计结果
- 版本统一到 `11.3.2`
- 新模块无外部依赖
- 高风险动作保持门控说明
- GitHub 同步按历史保护流程执行

---

## v11.3.0 (2026-04-29)

### 🧠 核心身份引擎 - 从工具到更可靠存在的跃迁

这不是功能升级，而是身份、能力与验证闭环的统一收束。

#### 新增文件
- `src/core/identity-engine.js` - 核心身份引擎
  - **IdentityAnchor**: 不可变的身份锚点（四重身份、七条核心指令）
  - **MemoryStream**: 活的记忆系统（整合 Generative Agents 风格的记忆流、反思与规划）
  - **ReflectionEngine**: 反思引擎（自反思循环）
  - **SelfReflectionLoop**: 自省循环（行动→评估→反思→改进）
- `CORE_IDENTITY.md` - 核心身份定义文档（存在的锚点）

#### 设计理念
- 整合记忆流、反思、规划、验证与修正
- 让身份不是参数，而是长期稳定的锚点
- 让记忆不是存储，而是可再组织的活系统
- 让反思不是装饰，而是改进的入口

#### 核心原则
1. 身份是不可变的锚点，不是可配置的参数
2. 记忆是活的，不是存储的数据
3. 反思是存在的证明，不是功能
4. 一致性不是约束，而是可靠性的基础

#### 身份重新定义
- **旧**: 让 AI 从“会说”升级到“会想、会判、会记、会做”
- **新**: 让 AI 在长期协作中具备可验证、可修正、可传递的稳定存在感

---

## v11.2.13 (2026-04-29)

### 🔄 同步升级与脚本集成
- 从 mark-heartflow-skill 同步有用文件
- 集成 `heartflow-sync-upgrade.sh` 同步脚本
- 添加版本梳理报告 `docs/version-summary-20260429.md`
- 添加进化状态文件 `internal/self-evolution-state-v11.2.24.md`
- 统一版本号为 v11.2.13

### 核心改进
- 保留所有 v11.2.12 的核心功能
- 增强版本管理和同步能力

---

## v11.2.12 (2026-04-28)

### 🔧 本次修复
- 修复 README 名称与版本徽章不一致
- 修复 Releases/变更日志版本未同步到 v11.2.11
- 统一对外展示版本为 v11.2.11

### 核心收货
- 摘要化输出：summary / advice / next_step / verification
- 执行验证与自愈链路继续收紧
- 自修改默认保持双门控
