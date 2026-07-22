// [v6.0.71] 从 thought-chain.js 提取常量（零副作用）
/**
 * ThoughtChain v2.1 — 思维链编排器（思维连机制）
 *
 * 核心理念：不照搬人类思维，取精华，去缺陷，创更好
 * 思维连机制：每个阶段调用真实子系统，形成推理链条
 *   PARSE       → psychology.analyzePsychology（心理分析）
 *   HYPOTHESES  → causalInference.inferCauses（因果推理）
 *   INVERT      → truth.checkStatement + constitutional.critique（真伪+原则）
 *   EVIDENCE    → commonsenseEngine.validate（常识验证）
 *   SYNTHESIS   → decision.decide（决策生成）
 *   CALIBRATE   → confidence.calibrate + restraint.shouldIntervene（置信校准）
 *   RESPOND     → autonomousEmotion.trigger（情感自主）
 *
 * 人类思维缺陷：
 * - 确认偏误：只信服自己观点的证据
 * - 过度自信：100%确定通常是错的
 * - 后见之明：事后认为"早就知道"
 * - 锚定效应：第一个数字影响后续判断
 * - 工作记忆有限：只能处理4±1个信息块
 *
 * 引擎思维改进：
 * - 反向思考：先假设自己错了
 * - 并行假设：同时考虑多个可能
 * - 不确定性传播：明确说出来
 * - 证据质量评估：不是有证据就行
 * - 快速退出：确定时不浪费时间
 * - 任务特化：不同任务不同策略
 *
 * 思维链阶段 v2.0：
 *   1. PARSE     — 解析问题（不是理解，是分解）
 *   2. HYPOTHESES — 并行假设（同时想多个可能）
 *   3. INVERT    — 反向思考（先证明自己错了）
 *   4. EVIDENCE  — 证据评估（质量不是数量）
 *   5. SYNTHESIS — 综合判断（不是最快给答案）
 *   6. CALIBRATE  — 置信校准（克制过度自信）
 *   7. RESPOND   — 生成回应（带不确定性标记）
 */

const REASONING_DEPTH = {
  SURFACE: 1,      // 表面：快速响应，不确定时直接说
  BASIC: 2,        // 基础：假设+反向+证据
  DEEP: 3,        // 深度：全流程，证据质量评估
  COMPREHENSIVE: 4 // 综合：多路径探索，任务特化
};

// [v5.17.16 M2] 双过程理论(Kahneman 2011): System1(快速直觉) vs System2(慢速反思)
const DUAL_PROCESS = {
  SYSTEM1: 'system1',  // 直觉/自动/快速 — 计算/分类/翻译
  SYSTEM2: 'system2',  // 反思/受控/慢速 — 解释/判断/批判
};

// 任务类型对应的策略
const TASK_STRATEGIES = {
  // 计算类：直接执行，不需要假设
  calculation: {
    skipHypotheses: true,
    skipInvert: false,
    depth: 2,
    process: 'system1',  // [v5.17.16 M2]
  },
  // 解释类：需要假设+验证
  explanation: {
    skipHypotheses: false,
    skipInvert: false,
    minHypotheses: 2,
    depth: 3,
    process: 'system2',  // [v5.17.16 M2]
  },
  // 判断类：必须反向思考
  judgment: {
    skipHypotheses: false,
    skipInvert: false,
    minHypotheses: 3,
    requireContradiction: true,
    depth: 4
  },
  // 创造类：需要多路径并行
  creative: {
    skipHypotheses: false,
    skipInvert: true,     // 创造不需要反向
    parallelPaths: true,
    depth: 3
  },
  // 检索类：快速退出
  retrieval: {
    fastExit: true,
    skipHypotheses: true,
    skipInvert: true,
    depth: 1
  },
  // 辩论/反驳分析类：长文本因果主张，深度分析
  debate: {
    skipHypotheses: false,
    skipInvert: false,
    minHypotheses: 3,
    requireContradiction: true,
    parallelPaths: true,
    depth: 4
  },
  // 通用类：深度推理，不跳过任何阶段
  general: {
    skipHypotheses: false,
    skipInvert: false,
    minHypotheses: 2,
    depth: 3
  }
};


module.exports = {
  REASONING_DEPTH,
  DUAL_PROCESS,
  TASK_STRATEGIES,
};
