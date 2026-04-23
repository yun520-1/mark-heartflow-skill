# Changelog

All notable changes to HeartFlow will be documented in this file.

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
