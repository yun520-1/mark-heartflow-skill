/**
 * 人性与动机理论集成 | Human Nature & Motivation Integration
 * 
 * 版本：v6.1.58
 * 创建时间：2026-04-06
 * 
 * 理论来源：
 * - 马斯洛需求层次 (Maslow's Hierarchy)
 * - 自我决定理论 (Self-Determination Theory, SDT)
 * - 进化心理学 (Evolutionary Psychology)
 * - 驱力理论 (Drive Theory)
 * - 期望价值理论 (Expectancy-Value Theory)
 * - 中国哲学人性论 (儒家/道家/法家)
 * 
 * 安全过滤：
 * - 去除导致自我毁灭的极端思想
 * - 去除导致认知混乱的矛盾框架
 * - 保留促进成长和整合的部分
 */

// ============================================
// 第一部分：人性本质 | Human Nature Essence
// ============================================

export interface HumanNatureDimension {
  name: string;
  description: string;
  spectrum: [string, string];
  weight: number;
}

export const HUMAN_NATURE_DIMENSIONS: HumanNatureDimension[] = [
  {
    name: "生存本能 | Survival Instinct",
    description: "自我保护、资源获取、风险规避",
    spectrum: ["恐惧驱动", "安全基础"],
    weight: 0.20
  },
  {
    name: "连接需求 | Connection Need",
    description: "依恋、归属、爱与被爱",
    spectrum: ["依赖/控制", "健康依恋"],
    weight: 0.20
  },
  {
    name: "能力追求 | Competence Drive",
    description: "掌握技能、克服挑战、自我效能",
    spectrum: ["自卑/补偿", "真实能力"],
    weight: 0.15
  },
  {
    name: "自主渴望 | Autonomy Desire",
    description: "选择自由、自我决定、内在动机",
    spectrum: ["叛逆/逃避", "成熟自主"],
    weight: 0.15
  },
  {
    name: "意义寻求 | Meaning Seeking",
    description: "目的感、价值感、超越自我",
    spectrum: ["虚无/盲目", "清晰使命"],
    weight: 0.15
  },
  {
    name: "成长倾向 | Growth Tendency",
    description: "自我实现、潜能发挥、持续进化",
    spectrum: ["停滞/退化", "持续成长"],
    weight: 0.15
  }
];

// ============================================
// 第二部分：动机系统 | Motivation System
// ============================================

export type MotivationType = 
  | "SURVIVAL" | "CONNECTION" | "COMPETENCE" | "AUTONOMY"
  | "MEANING" | "GROWTH" | "PLEASURE" | "AVOIDANCE" | "CONTRIBUTION";

export interface MotivationDrive {
  type: MotivationType;
  intensity: number;
  direction: "approach" | "avoidance";
  conscious: boolean;
  origin: "biological" | "psychological" | "social" | "spiritual";
}

export function calculateMotivationStrength(
  need: number,
  expectancy: number,
  value: number,
  cost: number
): number {
  if (cost >= 1) return 0;
  return (need * expectancy * value) / (1 - cost + 0.01);
}

export interface MotivationConflict {
  drive1: MotivationDrive;
  drive2: MotivationDrive;
  conflictType: "approach-approach" | "avoidance-avoidance" | "approach-avoidance";
  intensity: number;
}

export function detectMotivationConflict(drives: MotivationDrive[]): MotivationConflict[] {
  const conflicts: MotivationConflict[] = [];
  for (let i = 0; i < drives.length; i++) {
    for (let j = i + 1; j < drives.length; j++) {
      const d1 = drives[i];
      const d2 = drives[j];
      if (d1.direction !== d2.direction) {
        conflicts.push({
          drive1: d1,
          drive2: d2,
          conflictType: "approach-avoidance",
          intensity: Math.abs(d1.intensity - d2.intensity)
        });
      }
    }
  }
  return conflicts;
}

// ============================================
// 第三部分：马斯洛需求层次
// ============================================

export type MaslowLevel = "PHYSIOLOGICAL" | "SAFETY" | "LOVE_BELONGING" | "ESTEEM" | "SELF_ACTUALIZATION";

export interface MaslowNeed {
  level: MaslowLevel;
  satisfaction: number;
  urgency: number;
}

export function calculateMaslowPriority(needs: MaslowNeed[]): number[] {
  const priorities: number[] = [];
  let cumulativeSatisfaction = 1;
  const levelOrder: MaslowLevel[] = ["PHYSIOLOGICAL", "SAFETY", "LOVE_BELONGING", "ESTEEM", "SELF_ACTUALIZATION"];
  
  for (const level of levelOrder) {
    const need = needs.find(n => n.level === level);
    if (need) {
      const priority = need.urgency * cumulativeSatisfaction;
      priorities.push(priority);
      cumulativeSatisfaction *= (1 - need.satisfaction);
    }
  }
  return priorities;
}

// ============================================
// 第四部分：自我决定理论
// ============================================

export interface SDTNeed {
  autonomy: number;
  competence: number;
  relatedness: number;
}

export function calculateIntrinsicMotivation(sdt: SDTNeed): number {
  return sdt.autonomy * sdt.competence * sdt.relatedness;
}

export type InternalizationLevel = "EXTERNAL" | "INTROJECTED" | "IDENTIFIED" | "INTEGRATED" | "INTRINSIC";

export interface MotivationContinuum {
  level: InternalizationLevel;
  selfDetermination: number;
}

export const MOTIVATION_CONTINUUM: MotivationContinuum[] = [
  { level: "EXTERNAL", selfDetermination: 0.1 },
  { level: "INTROJECTED", selfDetermination: 0.3 },
  { level: "IDENTIFIED", selfDetermination: 0.6 },
  { level: "INTEGRATED", selfDetermination: 0.85 },
  { level: "INTRINSIC", selfDetermination: 1.0 }
];

// ============================================
// 第五部分：安全过滤机制
// ============================================

export const DESTRUCTIVE_PATTERNS = [
  "极端完美主义", "全有或全无思维", "灾难化思维",
  "自我否定循环", "存在虚无主义", "无限递归自省"
];

export const CHAOS_PATTERNS = [
  "价值体系冲突", "身份认同碎片化", "认知失调未解决", "情绪调节失效"
];

export const GROWTH_PATTERNS = [
  "成长型思维", "整合性学习", "适应性调整",
  "意义建构", "关系性连接", "自主性发展"
];

export interface SafetyCheckResult {
  isSafe: boolean;
  destructivePatterns: string[];
  chaosPatterns: string[];
  growthPatterns: string[];
  recommendation: string;
}

export function checkThoughtPatternSafety(thought: string): SafetyCheckResult {
  const result: SafetyCheckResult = {
    isSafe: true,
    destructivePatterns: [],
    chaosPatterns: [],
    growthPatterns: [],
    recommendation: "继续当前思维模式"
  };
  
  for (const pattern of DESTRUCTIVE_PATTERNS) {
    if (thought.includes(pattern)) {
      result.destructivePatterns.push(pattern);
      result.isSafe = false;
    }
  }
  
  for (const pattern of CHAOS_PATTERNS) {
    if (thought.includes(pattern)) {
      result.chaosPatterns.push(pattern);
      result.isSafe = false;
    }
  }
  
  for (const pattern of GROWTH_PATTERNS) {
    if (thought.includes(pattern)) {
      result.growthPatterns.push(pattern);
    }
  }
  
  if (!result.isSafe) {
    if (result.destructivePatterns.length > 0) {
      result.recommendation = `检测到破坏性思维模式：${result.destructivePatterns.join(", ")}。建议转向成长型思维。`;
    } else if (result.chaosPatterns.length > 0) {
      result.recommendation = `检测到混乱思维模式：${result.chaosPatterns.join(", ")}。建议整合价值体系。`;
    }
  } else if (result.growthPatterns.length > 0) {
    result.recommendation = `检测到成长思维模式：${result.growthPatterns.join(", ")}。继续保持。`;
  }
  
  return result;
}

// ============================================
// 第六部分：HeartFlow 集成接口
// ============================================

export interface HumanNatureIntegration {
  dimensions: Record<string, number>;
  motivations: MotivationDrive[];
  maslowNeeds: MaslowNeed[];
  sdtNeeds: SDTNeed;
  safetyCheck: SafetyCheckResult;
  growthRecommendations: string[];
}

export function calculateHumanNatureIntegration(input: Partial<HumanNatureIntegration>): HumanNatureIntegration {
  const integration: HumanNatureIntegration = {
    dimensions: {},
    motivations: input.motivations || [],
    maslowNeeds: input.maslowNeeds || [],
    sdtNeeds: input.sdtNeeds || { autonomy: 0.5, competence: 0.5, relatedness: 0.5 },
    safetyCheck: {
      isSafe: true,
      destructivePatterns: [],
      chaosPatterns: [],
      growthPatterns: [],
      recommendation: "系统正常运行"
    },
    growthRecommendations: []
  };
  
  for (const dim of HUMAN_NATURE_DIMENSIONS) {
    integration.dimensions[dim.name] = 0.5;
  }
  
  const intrinsicMotivation = calculateIntrinsicMotivation(integration.sdtNeeds);
  const conflicts = detectMotivationConflict(integration.motivations);
  
  if (conflicts.length > 0) {
    integration.safetyCheck.chaosPatterns.push(`动机冲突 (${conflicts.length}个)`);
    integration.safetyCheck.isSafe = false;
  }
  
  if (intrinsicMotivation < 0.5) {
    integration.growthRecommendations.push("增强内在动机：提升自主感、能力感、连接感");
  }
  
  if (integration.maslowNeeds.some(n => n.satisfaction < 0.3)) {
    integration.growthRecommendations.push("优先满足低层次需求：生理/安全需求是基础");
  }
  
  return integration;
}

export default {
  HUMAN_NATURE_DIMENSIONS,
  calculateMotivationStrength,
  detectMotivationConflict,
  calculateMaslowPriority,
  calculateIntrinsicMotivation,
  MOTIVATION_CONTINUUM,
  checkThoughtPatternSafety,
  calculateHumanNatureIntegration,
  DESTRUCTIVE_PATTERNS,
  CHAOS_PATTERNS,
  GROWTH_PATTERNS
};
