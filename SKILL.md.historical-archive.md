# HeartFlow Historical Archive
> 从 SKILL.md 移出的历史版本说明，减少每次加载 token 消耗

## v11.3.2 GitHub-derived integration

This upgrade searched GitHub for reusable agent-skill implementation patterns and integrated the safest transferable parts:

- `ChrisWiles/claude-code-showcase` — hooks, skills, agents, commands, and workflow organization
- `sickn33/antigravity-awesome-skills` — large-scale installable agentic skill library pattern
- `ivan-magda/claude-code-plugin-template` — plugin marketplace scaffolding and validation orientation
- `inkog-io/inkog` and `agent-audit-kit`-style projects — static security scanning mindset for AI agents
- existing HeartFlow identity-engine foundations inspired by Generative Agents / MemGPT / Reflexion

The code-level integration is `src/core/skill-governance-integrator.js`, a pure JavaScript module that adds:

- upgrade planning phases: research → plan → implement → audit → sync
- audit gates: version consistency, privacy redaction, dangerous action review, history preservation, verification evidence
- document classification for skill standard checks
- evidence ledger summaries for upgrade traceability

## v11.4.0 Paper Integration (7 Papers)

Upgraded via mark.md methodology (2026-05-01). Integrated 7 papers from arXiv/ACL/CVPR 2026 into `src/core/skill-governance-integrator.js`:

| Paper | Venue | Core Integration |
|---|---|---|
| SAVeR | ACL 2026 | Adversarial belief auditing gate before action |
| DeepVerifier | CVPR 2026 | 5-category 13-sub failure taxonomy rubric |
| SkillGuard-Robust | arXiv:2604.25109 | 3-way classification, 97.30% exact match |
| SSL Representation | arXiv:2604.24026 | Scheduling-Structural-Logical normalization |
| Ctx2Skill | arXiv:2604.27660 | Challenger/Reasoner/Judge self-play loop |
| MemArchitect | arXiv:2603.18330 | FSRS v4 + Kalman Filter memory governance |
| AER | arXiv:2603.21692 | Agent Execution Record provenance primitive |

New class: `HeartFlowV1140` extends `SkillGovernanceIntegrator` with all 7 modules.

Key files:
- `src/core/skill-governance-integrator.js` — all 7 paper modules appended
- `src/core/execution-verifier.js` — enhanced with DeepVerifier taxonomy
- `src/core/memory/triality-memory.js` — enhanced with MemArchitect tri-path loop

## v11.6.0 道虫升级 — 做减法的艺术

**核心哲学**：《道德经》的道论成为心虫的新镜子。

| 道论概念 | 心虫实现 | 模块 |
|---------|---------|------|
| 反者道之动 | 答案生成前先质疑自身前提 | CounterfactualEngine |
| 柔弱胜刚强 | 承认不确定性，表达置信度分布 | ConfidenceCalibrator |
| 道法自然 | 判断何时不干预，让答案涌现 | SpontaneousRestraint |
| 上善若水 | 利万物而不争——不争对，不争赢 | 全部三个模块 |

**新增模块**：

| Module | File | Source |
|---|---|---|
| CounterfactualEngine | `counterfactual-engine.js` | 反者道之动 + Double-loop learning + 对话起源召回 |
| ConfidenceCalibrator | `confidence-calibrator.js` | 柔弱胜刚强 + Uncertainty Quantification |
| SpontaneousRestraint | `spontaneous-restraint.js` | 道法自然 + Less-is-More Agentic (arXiv 2503.10567) |

**版本贡献**：
- 逻辑错误率进一步降低（通过反方生成和置信度校准）
- 过度自信表达减少（通过语言校准）
- 不必要干预减少（通过自发性克制）
- 答案质量提升（通过三模块协同）
