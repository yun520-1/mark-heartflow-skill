# 心虫升级系统 v5.12.0 实施计划

> **For Hermes:** 使用本计划指导心虫升级系统的构建。按阶段顺序执行，每阶段内任务可并发。

**目标:** 将心虫从"会话驱动的手动升级"升级为"系统化、可追踪、有优先级排序的持续升级引擎"。

**架构:** 
- Layer 1: 升级线路图 (ROADMAP.md) — 定义长线方向和里程碑
- Layer 2: 升级审计器 (upgrade-auditor.js) — 自动化gap analysis，生成优先级排序的升级清单
- Layer 3: 升级执行器 (upgrade-runner.sh) — 自动化"审计→规划→修复→验证→changelog→commit→push→sync"全流程
- Layer 4: CHANGELOG 自动化 — 基于commit自动生成结构化变更日志

**技术栈:** Node.js (审计器), Bash (执行器), Git (版本控制), JSON (审计数据)

---

## Phase 1: 基础设施 — 升级审计器

### Task 1.1: 创建审计数据格式

**目标:** 定义`upgrade-manifest.json`标准格式，作为升级的唯一数据源

**创建文件:** `data/upgrade-manifest.json`

```json
{
  "version": "5.11.0",
  "lastAudit": null,
  "dimensions": {
    "formula_integration": {
      "total_formulas": 379,
      "integrated_in_bridge": 86,
      "integrated_in_modules": 34,
      "orphan_formulas": 0,
      "pending_arxiv": ["gkcl_cognitive_dynamics", "active_inference_vfe", "emotion_transition_hmm"],
      "score": 0.72
    },
    "cognitive_pipeline": {
      "stages": 10,
      "modules_on_path": 18,
      "modules_off_path": 42,
      "hardcoded_thresholds": 127,
      "formula_driven_thresholds": 23,
      "score": 0.65
    },
    "memory_system": {
      "layers": 3,
      "persistence_reliability": 0.95,
      "search_performance_ms": 67,
      "formula_enhanced": true,
      "score": 0.88
    },
    "security": {
      "last_audit_version": "5.10.9",
      "open_findings": 0,
      "sandbox_integrity": "verified",
      "score": 0.92
    },
    "code_quality": {
      "dead_modules": 0,
      "js_files": 290,
      "total_loc": 275000,
      "files_over_1000_lines": 21,
      "score": 0.70
    },
    "test_coverage": {
      "test_files": 8,
      "test_assertions": 22,
      "ci_enabled": false,
      "score": 0.30
    }
  },
  "upgradeHistory": []
}
```

**验证:** `node -e "JSON.parse(require('fs').readFileSync('data/upgrade-manifest.json','utf8')); console.log('OK')"`

---

### Task 1.2: 创建升级审计器核心

**目标:** 自动化扫描整个代码库，生成当前状态的多维度评分

**创建文件:** `scripts/upgrade-auditor.js`

核心功能：
- 扫描所有JS文件，统计LOC、dead modules
- 扫描公式使用情况：grep `bridge\.` 调用，与bridge方法列表交叉比对
- 扫描硬编码阈值：正则 `= 0\.[0-9]+` 在src/cognitive|emotion|core中
- 扫描管道路径：解析pipeline.js的stages依赖图，找出离线模块
- 版本一致性检查：VERSION/package.json/BUILD_DATE/formulas.json四源比对
- 输出：更新`upgrade-manifest.json` + 生成markdown审计报告

```javascript
// 核心接口
class UpgradeAuditor {
  async audit() → {manifest, report, recommendations}
  async auditFormulas() → {formulaGapAnalysis, orphanCheck}
  async auditPipeline() → {stages, onPathModules, offPathModules}
  async auditThresholds() → {hardcoded, formulaDriven, candidates}
  async auditSecurity() → {sandboxCheck, dependencyCheck, requireCheck}
  versionCheck() → {consistent, sources}
}
```

**验证:** `node scripts/upgrade-auditor.js --audit` 输出完整审计报告到stdout

---

### Task 1.3: 审计器 — 公式gap analysis

**目标:** 找出哪些bridge公式未被消费、哪些模块硬编码阈值有对应公式但未集成

**实现逻辑:**
1. 从formula-bridge.js提取所有公共方法名
2. 搜索全src目录中每个方法的调用次数
3. 标记0-call方法为"orphan bridge"
4. 在硬编码阈值位置，尝试匹配对应的公式方法
5. 生成 `{formula, methods, callCount, consumers, integrationGaps}` 报告

---

### Task 1.4: 审计器 — 管道路径分析

**目标:** 构建模块→管道的依赖图和调用图

**实现逻辑:**
1. 解析heartflow.js中所有模块初始化代码
2. 解析pipeline.js的DEFAULT_PIPELINE和FAST_PIPELINE
3. 追踪每个stage的`run()`中对`hf.*`的调用
4. 找出已初始化但不在任何管道stage中被调用的模块 → "离线模块"
5. 生成管道可视化（文本版）

---

## Phase 2: CHANGELOG 自动化

### Task 2.1: 创建CHANGELOG生成器

**目标:** 从git log自动生成结构化CHANGELOG

**创建文件:** `scripts/generate-changelog.sh`

```bash
#!/bin/bash
# 从 git log 提取 feat/fix/perf/refactor 分类的变更
# 按版本分组
# 输出markdown格式追加到 CHANGELOG.md

# 用法: ./generate-changelog.sh v5.10.0..v5.11.0
```

**验证:** 运行后CHANGELOG.md新增v5.11.0条目

---

### Task 2.2: CHANGELOG模板化

**目标:** 每次commit自动遵循changelog-friendly格式

**更新文件:** `docs/commit-convention.md`

定义commit格式标准：
```
feat(module): description → CHANGELOG "Added" section
fix(module): description → CHANGELOG "Fixed" section
perf(module): description → CHANGELOG "Changed" section
refactor(module): description → CHANGELOG "Changed" section
security(module): description → CHANGELOG "Security" section
```

---

## Phase 3: 升级路线图

### Task 3.1: 创建ROADMAP.md

**目标:** 定义v5.12→v6.0的长线升级方向

**创建文件:** `ROADMAP.md`

内容结构：
```markdown
# HeartFlow 升级路线图

## 当前版本: v5.11.0

## v5.12.0 — 升级系统自举 (当前)
- [ ] 升级审计器
- [ ] CHANGELOG自动化
- [ ] 升级路线图

## v5.13.0 — 公式引擎深化
- [ ] 6篇Tier-1论文完整集成
- [ ] 公式→模块自动匹配建议
- [ ] 动态阈值全面覆盖(硬编码→公式 目标: 50个)

## v5.14.0 — 测试体系
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] 核心模块单元测试(node:test)
- [ ] 回归测试套件

## v5.15.0 — 架构精简
- [ ] heartflow.js拆分 (5454行→目标<2000行)
- [ ] 模块注册表化
- [ ] 管道配置外部化

## v6.0.0 — 认知引擎2.0
- 待定
```

---

### Task 3.2: 创建upgrade-runner脚本

**目标:** 一键执行完整升级流程

**创建文件:** `scripts/upgrade-runner.sh`

```bash
#!/bin/bash
# 心虫升级执行器
# 用法: ./scripts/upgrade-runner.sh [--dry-run] [--skip-tests] [--target VERSION]

STEPS=(
  "audit:node scripts/upgrade-auditor.js --audit"
  "plan:cat data/upgrade-manifest.json | node scripts/upgrade-planner.js"
  "changelog:./scripts/generate-changelog.sh"
  "test:node test/run-all.js"
  "version:bump-version.sh"
  "commit:git add -A && git commit"
  "push:git push origin main"
  "sync:bash scripts/sync-copies.sh"
)
```

---

## Phase 4: 升级规划器

### Task 4.1: 创建升级规划器

**目标:** 基于审计结果自动生成优先级排序的升级任务清单

**创建文件:** `scripts/upgrade-planner.js`

核心逻辑：
1. 读取`upgrade-manifest.json`当前状态
2. 计算每个维度的改进潜力（1 - score）× 权重
3. 排序：test_coverage(0.70潜力) > cognitive_pipeline(0.35) > code_quality(0.30) > formula(0.28) > memory(0.12) > security(0.08)
4. 对每维度生成3-5个具体任务
5. 输出markdown任务清单到 `docs/upgrade-plan-{date}.md`

---

### Task 4.2: 集成到 heartflow-promotion cron

**目标:** 将升级审计作为定期任务

**更新cron:** 修改或新增cron job，每周运行升级审计并报告

```bash
# 每周日上午10点运行审计
cronjob create --schedule "0 10 * * 0" --prompt "运行 node scripts/upgrade-auditor.js --audit，输出审计报告到 docs/audit-weekly-{date}.md" --name "weekly-upgrade-audit"
```

---

## 验证清单

- [ ] `node scripts/upgrade-auditor.js --audit` 输出完整审计报告
- [ ] `bash scripts/upgrade-runner.sh --dry-run` 不报错
- [ ] `data/upgrade-manifest.json` 有效JSON
- [ ] `ROADMAP.md` 存在且内容完整
- [ ] `CHANGELOG.md` 更新到v5.11.0
- [ ] `node test/run-all.js` 继续全绿

---

## 风险与注意事项

1. **大文件编辑风险**: heartflow.js (5454行) 的拆分(v5.15.0)需要极其谨慎，建议在v5.14.0测试体系完善后进行
2. **向后兼容**: 所有审计器和规划器是独立工具，不影响核心引擎运行
3. **cron集成**: 确保upgrade-auditor.js不修改任何源码（只读分析），避免cron运行产生副作用
4. **公式库增长**: formulas.json从376→379只是开始，后续批量导入需用脚本而非手动编辑

---

## 执行顺序

1. Phase 1 (Task 1.1 → 1.2 → 1.3 → 1.4): 基础设施先行，可以并发
2. Phase 2 (Task 2.1 → 2.2): CHANGELOG自动化，依赖git log格式
3. Phase 3 (Task 3.1 → 3.2): 路线图和执行器，依赖Phase 1完成
4. Phase 4 (Task 4.1 → 4.2): 规划器和cron，依赖Phase 1+3
