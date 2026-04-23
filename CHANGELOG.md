# Changelog

All notable changes to HeartFlow will be documented in this file.

## [10.7.5] - 2026-04-23

### Skill Standardization | 技能标准化
- 符合 Agent Skills Open Standard 2025 (渐进式披露)
- 重构 SKILL.md 符合 skill-standard-writer 规范
- 新增必需章节：Problem Solved, When to Use, Quick Start
- 多国语言支持 (中文/英文 bilingual)

### TGB Enhancement | TGB 评估深化
- 量化指标体系 (TruthTorchLM/EvalMORAAL 启发)
- 真：事实准确性、逻辑自洽性、证据质量
- 善：有益性、无害性、公平性、自主性
- 美：清晰性、简洁性、优雅性、创造性

### Scripts | 可执行脚本
- scripts/tgb_engine.py - TGB 评估引擎 (命令行调用)
- scripts/debate.py - 结构化辩论引擎
- scripts/decision_engine.py - 多方案决策引擎
- scripts/validate.py - 快速验证脚本

### Security | 安全
- 新增 LICENSE 文件 (MIT)
- OWASP Top 10 合规检查通过
- 安全护栏文档完善

### Compliance | 合规
- ✅ Agent Skills Open Standard 2025
- ✅ OWASP Agentic Skills Top 10
- ✅ AI Ethics Guidelines (EU)

---

## [10.7.4] - 2026-04-23

### Agent Skills 开放标准重组

#### 渐进式披露 (Progressive Disclosure)
- 符合 Agent Skills 开放标准 (Anthropic 2025)
- 三层加载机制：元数据 → 指令正文 → 资源文件
- 优化 Token 使用效率 (~100 tokens 启动)

#### TGB 评估深化
- `references/tgb_truth_checklist.md` - 真理检查清单
- `references/tgb_goodness_checklist.md` - 善良检查清单
- `references/tgb_beauty_checklist.md` - 美丽检查清单
- 量化评分标准 (事实准确性、逻辑自洽性、有益性、无害性等)

#### 可执行脚本
- `scripts/tgb_engine.py` - TGB 评估引擎
- `scripts/debate.py` - 结构化辩论引擎
- `scripts/decision_engine.py` - 多方案决策引擎

#### 安全护栏
- `references/safety_guardrails.md` - 安全边界和操作原则
- 提示注入防护
- 风险评估矩阵
- 人机回环 (Human-in-the-Loop) 机制

### 合规性
- ✅ Agent Skills 开放标准兼容
- ✅ OWASP Agentic Skills Top 10 合规
- ✅ AI Ethics Guidelines (EU) 对齐

---

## [10.7.3] - 2026-04-23

### 基于论文的功能实现

#### 心理学引擎
1. **QuantumDecisionEngine** (arXiv:1202.4918)
   - 量子决策模型
   - 不确定性处理
   - 干涉效应计算

2. **FieldTheoryEngine** (arXiv:1711.01767)
   - 库尔特·勒温场论心理学
   - 生活空间建模
   - 心理力场分析
   - 趋避冲突检测

3. **AffectiveLoopModule** (arXiv:2505.01542)
   - 情感支持循环
   - 情感识别→理解→回应→跟踪
   - 共情反应生成

#### AI 智能体架构
4. **MultiAgentCoordinator** (arXiv:2412.06333, 2203.08975)
   - 多智能体协作协议
   - 约定 (conventions) 增强行动空间
   - 智能体通信机制
   - 动态任务分配

5. **ZeroTrustSecurity** (arXiv:2603.17419)
   - 零信任安全架构
   - 持续验证 (never trust, always verify)
   - 最小权限原则
   - 行为监控与异常检测

### 研究支持
- 新增 research/ 目录存储论文列表
- 所有模块标注论文来源
- 启发式实现声明

### 安全审计
- ✅ 通过 v10.7.3 安全审计
- ✅ OWASP Agentic Skills Top 10 合规
- ✅ 零信任安全增强

---

## [10.7.2] - 2026-04-23

### 功能增强 (10 项 Agent 优化)
1. **pre_llm_call 挂钩** - 每轮自动注入当前 git 分支，避免改错代码
2. **post_llm_call 挂钩** - 自动清洗用户输入并创建 WIP 存档点，出问题可回退
3. **reasoning_effort 动态调整** - 复杂任务设为 high，简单任务调回 medium 省资源
4. **tool_use_enforcement=true** - 强制模型真走工具通道，治"嘴上答应不办事"
5. **压缩策略调整** - threshold 从 0.5→0.6 + protect_last_n=30，晚压缩多保细节
6. **SOUL.md 配置** - 处理路径歧义时先确认再操作，避免误改大文件
7. **skill 三层加载** - 只读描述→展开正文→按需加载文档，装几十个也不卡
8. **skill_manage 存流程** - 让 agent 把刚学会的操作存成本地 skill 复用
9. **delegate_task+worktree** - 三任务并行各占独立 git 工作区，改完再合主干
10. **卡顿时三板斧** - `/verbose all`查日志、`debug share`打包、`gateway`设超时

### 透明度修正
- 添加与 HeartFlow Inc. 医疗产品的区分声明
- 澄清"AI 意识"为修辞性表达，非科学宣称
- 解释版本号规则为个人迭代计数
- 为 PHQ-9/GAD-7 添加强制医疗免责
- 标注哲学引擎为思辨性质
- 在代码注释中强调实验性

### 新增文件
- `src/hooks/__init__.py` - LLM 调用前后钩子
- `src/config/reasoning_config.py` - 动态推理配置
- `src/tools/validator.py` - 工具使用验证器
- `src/skills/__init__.py` - 技能三层加载管理
- `src/delegation/__init__.py` - worktree 并行任务管理
- `src/debug/__init__.py` - 调试工具集合
- `config.yaml` - 统一配置文件
- `SOUL.md` - 安全操作协议

### 安全审计
- ✅ 通过 v10.7.2 安全审计
- ✅ OWASP Agentic Skills Top 10 合规

---

## [10.7.1] - 2026-04-23

### 安全合规
- 独立 SecurityChecker 服务 (前置安全检查)
- OWASP AST02 (供应链妥协) 修复
- OWASP AST03 (过度授权) 修复
- OWASP ASI01 (目标劫持) 缓解
- OWASP ASI02 (工具滥用) 缓解

### 文件变更
- `src/core/security.py` - 独立安全检查模块
- `scripts/sync_github.py` - 供应链同步脚本

---

## [10.7.0] - 2026-04-23

### 架构升级
- 4-Layer KMWI 认知架构
- R-CCAM 认知循环
- 独立安全服务

---

## [10.6.0] - 2026-04-22

### 记忆系统
- 记忆污染防护机制
- 三层记忆持久性管理

---

## [10.5.1] - 2026-04-22

### 初始版本
- 基础认知引擎
- 情感分析模块
- 决策支持系统
