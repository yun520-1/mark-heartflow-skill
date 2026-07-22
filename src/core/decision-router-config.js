// [v6.0.71] 从 decision-router.js 提取常量定义（零副作用）
/**

 * decision-router.js — 通用分析→决策路由引擎 v3.0.0

 *

 * v3.0.0 升级（2026-06-23）：

 *   - 新增 U/D/A/H 四维场域追踪（基于 luoxuejian000 论文框架）

 *   - 新增翻转点检测：Primary / Alternate1 / Alternate2 + U_PEAK_REVERSAL

 *   - 吸收加权 H 公式：H = 0.4·U + 0.3·D - 0.3·A

 *   - 新增4条场域感知规则

 *

 * 核心问题：心虫 53 个模块中有 53 个"只分析不决策"的模块。

 * 它们会评估、检测、诊断，但结果止步于"报告"——没人把报告转成指令。

 *

 * 这个模块解决：

 *   任何模块的评估结果 → 自动转化为可执行的决策指令

 *

 * 设计原则：

 * - 不新增分析维度，只消费已有模块的输出

 * - 模块不需改造，加一个 route 标记即可自动获得决策能力

 * - 每个"分析结果"都能映射到 8 种基础决策之一

 * - 决策可以嵌套（决策A的副作用触发决策B）

 *

 * 工作流程：

 *   dispatch('subsystem.method') → 执行原始逻辑 → 检测返回值

 *   → 如果是分析型结果（有 score/level/status/severity 等字段）

 *   → 匹配决策规则 → 生成决策指令 → 返回 { result, decision }

 */



const VERSION = '3.8.3';



// ─── U/D/A/H 场域追踪参数（基于 luoxuejian000 论文） ──────────────────────

// H = λU·U + λD·D - λA·A

const FIELD_WEIGHTS = {

  lambdaU: 0.4,  // 统一性——身份在场强度

  lambdaD: 0.3,  // 发展性——信息推进结构化程度

  lambdaA: 0.3,  // 对抗性——矛盾边密度

};



// v3.8.0：场景感知权重配置

// 不同场景类型使用不同的 U/D/A 权重，解决固定权重在特定场景失效的问题

const SCENE_WEIGHTS = {

  // 默认/通用对话

  general: { lambdaU: 0.4, lambdaD: 0.3, lambdaA: 0.3 },

  // 纯技术讨论：U 偏高但 A 偏低 → 降低 U 权重暴露停滞

  technical: { lambdaU: 0.25, lambdaD: 0.45, lambdaA: 0.3 },

  // 情感冲突：A 波动大 → 降低 A 惩罚避免过度反应

  emotional: { lambdaU: 0.35, lambdaD: 0.25, lambdaA: 0.2 },

  // 分析/推理任务：D 最重要

  analytical: { lambdaU: 0.2, lambdaD: 0.5, lambdaA: 0.3 },

  // 创意/发散任务：U 最重要

  creative: { lambdaU: 0.5, lambdaD: 0.2, lambdaA: 0.3 },

  // 自我修复/反思：A 是最重要的信号

  reflective: { lambdaU: 0.25, lambdaD: 0.25, lambdaA: 0.5 },

};



// 翻转点检测阈值（论文实验验证值）

const FLIP_THRESHOLDS = {

  aBoundaryLow: 0.12,     // A 值边界下限

  aBoundaryHigh: 0.9,     // A 值边界上限

  aStdevDead: 0.01,       // A 值 3 步滑动标准差"僵死"阈值

  dVolatilityDropWindow: 5, // D 波动率移动平均窗口

  amplitudeRatio: 2.0,    // 主导维度振幅超过历史均值倍数

  aJumpThreshold: 0.1,    // A 值跳变检测阈值

  aDiveThreshold: 0.3,    // A 值跳水阈值

  hRiseThreshold: 0.05,   // H 值同步上升阈值

  uPeakDropThreshold: -0.05, // U 值从峰值回落阈值

  epsilon: 0.005,         // 驱动归因最小变化量

  historyWindow: 10,      // 场域历史窗口（步数）

  // v3.7.0：谐振窗口参数（基于 luoxuejian000 论文 §3.1 谐振调谐论）

  resonanceWindowLow: 0.35,   // 谐振窗口下限 H

  resonanceWindowHigh: 0.65,  // 谐振窗口上限 H

  resonanceMaxA: 0.2,         // 谐振态最大允许 A 值

  resonanceMinSteps: 5,       // 进入谐振态所需的最小稳定步数

  resonanceDecayWindow: 8,    // 谐振衰减窗口（步数）

};



// ─── 模型配置文件 ────────────────────────────────────────────────────────

const MODEL_PROFILES = {

  flash: {

    label: 'Fast inference, prone to hallucination',

    confidenceFloor: 0.3,    confidenceStandard: 0.5,

    confidenceHigh: 0.7,     confidenceMax: 0.9,

    decisionShift: 0.0,      explorationEpsilon: 0.10,

    fallbackThreshold: 0.4,

  },

  premium: {

    label: 'Well-calibrated full model',

    confidenceFloor: 0.3,    confidenceStandard: 0.4,

    confidenceHigh: 0.55,    confidenceMax: 0.85,

    decisionShift: -0.05,    explorationEpsilon: 0.08,

    fallbackThreshold: 0.3,

  },

  flagship: {

    label: 'Best-in-class calibration',

    confidenceFloor: 0.2,    confidenceStandard: 0.35,

    confidenceHigh: 0.5,     confidenceMax: 0.8,

    decisionShift: -0.1,     explorationEpsilon: 0.05,

    fallbackThreshold: 0.25,

  },

  lightweight: {

    label: 'Small/quantized model, poor calibration',

    confidenceFloor: 0.4,    confidenceStandard: 0.6,

    confidenceHigh: 0.8,     confidenceMax: 0.95,

    decisionShift: 0.1,      explorationEpsilon: 0.15,

    fallbackThreshold: 0.5,

  },

};



const DEFAULT_PROFILE = MODEL_PROFILES.flash;



// ─── 决策类型（与 philosophy-to-decision.js 一致） ────────────────────────

const DECISION = {

  PAUSE: 'pause',           // 减速/暂停

  ACCELERATE: 'accelerate', // 加速

  TURN: 'turn',             // 转向

  HOLD: 'hold',             // 坚守

  HEAL: 'heal',             // 自愈/修复

  RESONATE: 'resonate',     // 共振/加强

  TRANSMIT: 'transmit',     // 传递/输出

  REST: 'rest',             // 休息/低能耗

};



const DECISION_PRIORITY = {

  [DECISION.HEAL]: 100,

  [DECISION.TURN]: 90,

  [DECISION.PAUSE]: 80,

  [DECISION.REST]: 70,

  [DECISION.TRANSMIT]: 60,

  [DECISION.RESONATE]: 50,

  [DECISION.ACCELERATE]: 40,

  [DECISION.HOLD]: 30,

};



// ─── 决策路由引擎 ────────────────────────────────────────────────────────

const { getCognitiveBridge } = 
module.exports = {
  VERSION,
  FIELD_WEIGHTS,
  SCENE_WEIGHTS,
  FLIP_THRESHOLDS,
  MODEL_PROFILES,
  DEFAULT_PROFILE,
  DECISION,
  DECISION_PRIORITY,
};
