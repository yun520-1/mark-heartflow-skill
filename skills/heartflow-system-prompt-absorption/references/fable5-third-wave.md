# Fable 5 第三波吸收 — v2.9.5

## 新增模块

### output-checklist.js
- 位置: `src/core/output-checklist.js`
- 来源: Fable 5 `request_evaluation_checklist` (line 1198-1222)
- 核心: 输出前 4 步检查
  - Step 0: 需要输出吗？（空回复/问候过长检查）
  - Step 1: 质量检查（自相矛盾/过度列表/错误引用）
  - Step 2: 安全检查（复用 heart-logic 方法：版权/福祉）
  - Step 3: 偏好检查（简洁/语言/技术深度）
  - Step 4: 公正检查（政治议题各方观点）
- 快捷方法: `quickCheck()` 只做 Step 2
- 集成: think() 中 ThoughtChain 结果后执行

### preference-guard.js
- 位置: `src/core/preference-guard.js`
- 来源: Fable 5 `preferences_info` (line 846-933)
- 核心: 三类型偏好引擎
  - `always`: 总是应用，安全例外（永远同意、永远不批评等）
  - `behavioral`: 直接相关且能提升回复质量时应用
  - `contextual`: 仅查询直接引用或明确请求个性化时应用
- 冲突检测: 自动识别相反偏好（简洁 vs 详细、中文 vs 英文）
- 12 条不应用规则:
  1. 技术问题除非专业认证直接相关
  2. 创意内容除非明确要求
  3. 个人偏好不做类比/隐喻
  4. 不以"根据你的偏好"开头/结尾
  5. 不用于无关领域
  6. Always 类型安全例外
  7. 最新指令覆盖旧偏好
  8. 安全/正确性优先于偏好
  9. 不鼓励不安全行为
  10. 不用于诊断标签
  11. 不创造亲密假象
  12. 不影响核心判断

## 修改的文件

- `heartflow.js`: 构造函数初始化 + dispatch 路由注册 + think() 嵌入
- `heartflow-memory-inject.js`: 偏好段加类型标注和谨慎规则说明

## 实战教训

1. 新模块创建后必须注册 dispatch 路由，否则 `dispatch('module.method')` 报 "route not allowed"
2. output-checklist 是软检查（不阻断输出），PreferenceGuard 是硬规则引擎
3. 记忆注入的偏好段标注类型 ([always]/[behavioral]/[contextual]) 让 LLM 自行判断
4. 两轮吸收不够，大型系统提示需要三轮：上层能力→底层结构→新模块创建
