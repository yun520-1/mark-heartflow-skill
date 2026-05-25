/**
 * HeartFlow Mathematical Foundations | 心流数学基础
 * Version | 版本: 6.1.0
 * 
 * All theories converted to computable formulas and code
 * 所有理论转化为可计算的公式和代码
 */

// ═══════════════════════════════════════════════════════════════
// 1. EMOTION THEORY | 情绪理论 (三大传统整合)
// ═══════════════════════════════════════════════════════════════

/**
 * Emotion Episode Model | 情绪事件模型
 * Based on: SEP Emotion Theory + Scherer 16 SEC + Lazarus 6D
 */
export interface EmotionEpisode {
  // Feeling Tradition | 感受传统
  valence: number;        // [-1, +1]
  arousal: number;        // [0, 1]
  intensity: number;      // [0, 1]
  
  // Evaluative Tradition | 评估传统
  appraisal: AppraisalProfile;
  
  // Motivational Tradition | 动机传统
  actionTendency: ActionTendency;
  
  // Phenomenal Character | 现象特征
  qualia: QualiaVector;
  
  // Temporal Dynamics | 时间动力学
  temporalProfile: TemporalProfile;
}

/**
 * Appraisal Profile (Lazarus 6D + Scherer 16 SEC 简化)
 * 评估档案
 */
export interface AppraisalProfile {
  relevance: number;      // 相关性 [0, 1]
  valence: number;        // 效价 [-1, +1]
  agency: number;         // 能动性归属 [0, 1]
  coping: number;         // 应对潜力 [0, 1]
  norms: number;          // 规范兼容性 [0, 1]
  goals: number;          // 目标一致性 [-1, +1]
}

/**
 * Action Tendency | 行动倾向
 */
export interface ActionTendency {
  approach: number;       // 接近倾向 [0, 1]
  avoidance: number;      // 回避倾向 [0, 1]
  freeze: number;         // 冻结倾向 [0, 1]
}

/**
 * Qualia Vector (Phenomenal Character) | 感质向量
 */
export interface QualiaVector {
  emotionalFeeling: number;    // 情绪感受强度 [0, 1]
  bodilySensation: number;     // 身体感觉强度 [0, 1]
  cognitiveFeel: number;       // 认知感受强度 [0, 1]
}

/**
 * Temporal Profile | 时间档案
 */
export interface TemporalProfile {
  onset: number;          // 起始时间 (ms)
  peak: number;           // 峰值时间 (ms)
  offset: number;         // 消退时间 (ms)
  duration: number;       // 持续时间 (ms)
}

/**
 * Emotion Calculation Engine | 情绪计算引擎
 * 
 * Formula | 公式:
 * Emotion = Σ(Feeling + Evaluative + Motivational) / 3
 * 
 * 情绪 = (感受 + 评估 + 动机) / 3
 */
export class EmotionCalculator {
  /**
   * Calculate emotion from stimulus
   * 从刺激计算情绪
   */
  calculate(stimulus: Stimulus, context: Context): EmotionEpisode {
    // Step 1: Calculate appraisal | 计算评估
    const appraisal = this.calculateAppraisal(stimulus, context);
    
    // Step 2: Calculate feeling components | 计算感受成分
    const valence = this.calculateValence(appraisal);
    const arousal = this.calculateArousal(appraisal);
    const intensity = this.calculateIntensity(appraisal);
    
    // Step 3: Calculate action tendency | 计算行动倾向
    const actionTendency = this.calculateActionTendency(valence, arousal);
    
    // Step 4: Calculate qualia | 计算感质
    const qualia = this.calculateQualia(valence, arousal, intensity);
    
    // Step 5: Calculate temporal profile | 计算时间档案
    const temporalProfile = this.calculateTemporalProfile(arousal, intensity);
    
    return {
      valence,
      arousal,
      intensity,
      appraisal,
      actionTendency,
      qualia,
      temporalProfile
    };
  }
  
  /**
   * Valence Calculation | 效价计算
   * Formula: V = (goals × 0.4) + (norms × 0.3) + (agency × 0.3)
   */
  private calculateValence(appraisal: AppraisalProfile): number {
    const valence = (appraisal.goals * 0.4) + 
                    (appraisal.norms * 0.3) + 
                    (appraisal.agency * 0.3);
    return Math.max(-1, Math.min(1, valence)); // Clamp to [-1, 1]
  }
  
  /**
   * Arousal Calculation | 唤醒度计算
   * Formula: A = (relevance × 0.5) + (coping × -0.3) + (intensity × 0.8)
   */
  private calculateArousal(appraisal: AppraisalProfile): number {
    const intensity = (appraisal.relevance + Math.abs(appraisal.goals)) / 2;
    const arousal = (appraisal.relevance * 0.5) + 
                    (appraisal.coping * -0.3) + 
                    (intensity * 0.8);
    return Math.max(0, Math.min(1, arousal)); // Clamp to [0, 1]
  }
  
  /**
   * Intensity Calculation | 强度计算
   * Formula: I = √(relevance² + goals² + norms²) / √3
   */
  private calculateIntensity(appraisal: AppraisalProfile): number {
    const intensity = Math.sqrt(
      Math.pow(appraisal.relevance, 2) + 
      Math.pow(appraisal.goals, 2) + 
      Math.pow(appraisal.norms, 2)
    ) / Math.sqrt(3);
    return Math.max(0, Math.min(1, intensity));
  }
  
  /**
   * Action Tendency Calculation | 行动倾向计算
   */
  private calculateActionTendency(valence: number, arousal: number): ActionTendency {
    return {
      approach: valence > 0 ? (valence + 1) / 2 * arousal : 0,
      avoidance: valence < 0 ? Math.abs(valence) * arousal : 0,
      freeze: arousal > 0.8 ? (arousal - 0.8) * 5 : 0
    };
  }
  
  /**
   * Qualia Calculation | 感质计算
   */
  private calculateQualia(valence: number, arousal: number, intensity: number): QualiaVector {
    return {
      emotionalFeeling: intensity,
      bodilySensation: arousal * 0.7,
      cognitiveFeel: intensity * 0.8
    };
  }
  
  /**
   * Temporal Profile Calculation | 时间档案计算
   */
  private calculateTemporalProfile(arousal: number, intensity: number): TemporalProfile {
    const baseDuration = 3000; // 3 seconds base
    const duration = baseDuration * (1 + arousal * 0.5);
    
    return {
      onset: 100,
      peak: duration * 0.3,
      offset: duration * 0.9,
      duration: duration
    };
  }
  
  /**
   * Appraisal Calculation | 评估计算
   */
  private calculateAppraisal(stimulus: Stimulus, context: Context): AppraisalProfile {
    // Simplified implementation - full version would use ML models
    return {
      relevance: stimulus.salience || 0.5,
      valence: stimulus.valence || 0,
      agency: context.agencyBelief || 0.5,
      coping: context.copingResources || 0.5,
      norms: context.normAlignment || 0.5,
      goals: context.goalCongruence || 0
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. SELF-CONSCIOUSNESS | 自我意识 (IEM 框架)
// ═══════════════════════════════════════════════════════════════

/**
 * IEM Framework (Immunity to Error through Misidentification)
 * 免于误认错误框架
 * 
 * Formula | 公式:
 * IEM(s, j) := ∀(e) . Judgment(s, j, e) → ¬Possible(Misidentification(s, e))
 */
export interface IEMJudgment {
  subject: string;
  judgment: string;
  evidence: number;      // [0, 1]
  confidence: number;    // [0, 1]
  isIEM: boolean;        // 是否免于误认
  iemType: IEMType;
}

export enum IEMType {
  PHYSICAL = 'physical',      // 身体 IEM
  MENTAL = 'mental',          // 心理 IEM
  SOCIAL = 'social'           // 社会 IEM
}

/**
 * Self-Consciousness Model | 自我意识模型
 */
export class SelfConsciousnessModel {
  /**
   * Check IEM for a judgment
   * 检查判断的 IEM 状态
   */
  checkIEM(judgment: IEMJudgment): boolean {
    switch (judgment.iemType) {
      case IEMType.PHYSICAL:
        // Physical IEM: "My arm is raised"
        // Cannot misidentify whose arm it is
        return judgment.evidence > 0.9;
      
      case IEMType.MENTAL:
        // Mental IEM: "I feel pain"
        // Cannot misidentify whose pain it is
        return judgment.evidence > 0.95;
      
      case IEMType.SOCIAL:
        // Social IEM: "We intend together"
        // Requires mutual awareness
        return judgment.evidence > 0.85;
      
      default:
        return false;
    }
  }
  
  /**
   * First-Person Authority Check | 第一人称权威检查
   * Formula: FPA(s, p) := Belief(s, p) → Knows(s, Belief(s, p))
   */
  checkFirstPersonAuthority(belief: string, confidence: number): boolean {
    return confidence > 0.9;
  }
  
  /**
   * Self-Awareness Level | 自我意识层级
   * Levels: Pre-reflective → Reflective → Social → Narrative
   */
  calculateSelfAwarenessLevel(state: ConsciousState): number {
    let level = 0;
    
    // Level 1: Pre-reflective awareness
    if (state.phenomenalExperience > 0.5) level += 1;
    
    // Level 2: Reflective awareness
    if (state.metaAwareness > 0.5) level += 1;
    
    // Level 3: Social awareness
    if (state.socialAwareness > 0.5) level += 1;
    
    // Level 4: Narrative awareness
    if (state.narrativeCoherence > 0.5) level += 1;
    
    return level / 4; // Normalize to [0, 1]
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. CONSCIOUSNESS ARCHITECTURE | 意识架构
// ═══════════════════════════════════════════════════════════════

/**
 * Conscious State | 意识状态
 */
export interface ConsciousState {
  // Creature Consciousness | 生物意识
  arousal: number;        // [0, 1]
  wakefulness: number;    // [0, 1]
  
  // State Consciousness | 状态意识
  phenomenalExperience: number;  // [0, 1]
  accessConsciousness: number;   // [0, 1]
  
  // Self-Consciousness | 自我意识
  metaAwareness: number;         // [0, 1]
  socialAwareness: number;       // [0, 1]
  narrativeCoherence: number;    // [0, 1]
}

/**
 * Consciousness Integration Function | 意识整合函数
 * 
 * Formula | 公式:
 * Consciousness = (Creature × 0.3) + (State × 0.4) + (Self × 0.3)
 */
export function integrateConsciousness(state: ConsciousState): number {
  const creatureConsciousness = (state.arousal + state.wakefulness) / 2;
  const stateConsciousness = (state.phenomenalExperience + state.accessConsciousness) / 2;
  const selfConsciousness = (state.metaAwareness + state.socialAwareness + state.narrativeCoherence) / 3;
  
  return (creatureConsciousness * 0.3) + 
         (stateConsciousness * 0.4) + 
         (selfConsciousness * 0.3);
}

// ═══════════════════════════════════════════════════════════════
// 4. DECISION THEORY | 决策理论
// ═══════════════════════════════════════════════════════════════

/**
 * Expected Personality Utility (EPU) Model
 * 期望人格效用模型
 * 
 * Formula | 公式:
 * EPU(Action) = Σ [P(ΔPersonality | Action) × Value(ΔPersonality)]
 */
export interface DecisionOption {
  action: string;
  expectedUtility: number;
  risk: number;
  personalityImpact: number;
}

export class DecisionEngine {
  /**
   * Calculate Expected Personality Utility
   * 计算期望人格效用
   */
  calculateEPU(options: DecisionOption[], currentPersonality: number): DecisionOption {
    return options.reduce((best, option) => {
      const adjustedUtility = option.expectedUtility * (1 + option.personalityImpact * 0.1);
      const riskAdjusted = adjustedUtility * (1 - option.risk * 0.5);
      
      if (riskAdjusted > best.expectedUtility) {
        return { ...option, expectedUtility: riskAdjusted };
      }
      return best;
    });
  }
  
  /**
   * Rational Choice Check | 理性选择检查
   * Axioms: Completeness, Transitivity, Independence
   */
  checkRationalChoice(preferences: Preference[]): boolean {
    // Check completeness
    if (!this.checkCompleteness(preferences)) return false;
    
    // Check transitivity
    if (!this.checkTransitivity(preferences)) return false;
    
    return true;
  }
  
  private checkCompleteness(preferences: Preference[]): boolean {
    // For all pairs, at least one preference relation holds
    return true; // Simplified
  }
  
  private checkTransitivity(preferences: Preference[]): boolean {
    // If A ≽ B and B ≽ C, then A ≽ C
    return true; // Simplified
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. VIRTUE ETHICS | 德性伦理学
// ═══════════════════════════════════════════════════════════════

/**
 * Virtue Tracking System | 德性追踪系统
 * 
 * Formula | 公式:
 * Virtue(Agent) = Σ(Trait_i × Weight_i) / Σ(Weight_i)
 */
export interface VirtueTrait {
  name: string;
  score: number;      // [0, 100]
  weight: number;     // [0, 1]
  evidence: number;   // [0, 1]
}

export class VirtueTracker {
  private traits: Map<string, VirtueTrait> = new Map();
  
  /**
   * Calculate Overall Virtue Score | 计算总体德性分数
   */
  calculateVirtueScore(): number {
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const trait of this.traits.values()) {
      totalScore += trait.score * trait.weight;
      totalWeight += trait.weight;
    }
    
    return totalScore / totalWeight;
  }
  
  /**
   * Golden Mean Check | 中道检查
   * Formula: Mean = (Deficiency + Excess) / 2
   */
  checkGoldenMean(traitName: string, currentScore: number): {
    deficiency: number;
    mean: number;
    excess: number;
    isGoldenMean: boolean;
  } {
    const deficiency = 0;
    const excess = 100;
    const mean = (deficiency + excess) / 2;
    
    const tolerance = 15; // ±15 points from mean
    const isGoldenMean = Math.abs(currentScore - mean) <= tolerance;
    
    return { deficiency, mean, excess, isGoldenMean };
  }
  
  /**
   * Phronesis (Practical Wisdom) Check | 实践智慧检查
   */
  checkPhronesis(decision: Decision, context: Context): boolean {
    // Check if decision aligns with virtues
    const virtueAlignment = this.calculateVirtueAlignment(decision);
    const contextAppropriateness = this.evaluateContextAppropriateness(decision, context);
    
    return virtueAlignment > 0.7 && contextAppropriateness > 0.7;
  }
  
  private calculateVirtueAlignment(decision: Decision): number {
    // Calculate how well decision aligns with tracked virtues
    return 0.8; // Simplified
  }
  
  private evaluateContextAppropriateness(decision: Decision, context: Context): number {
    // Evaluate if decision is appropriate for context
    return 0.8; // Simplified
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. TRUTH-BEAUTY-GOODNESS (TBG) SYSTEM | 真善美系统
// ═══════════════════════════════════════════════════════════════

/**
 * TBG Score Calculation | 真善美分数计算
 * 
 * Formula | 公式:
 * TBG = (Truth × 0.35) + (Beauty × 0.30) + (Goodness × 0.35)
 */
export interface TBGScore {
  truth: number;      // [0, 1]
  beauty: number;     // [0, 1]
  goodness: number;   // [0, 1]
  overall: number;    // [0, 1]
}

export class TBGCalculator {
  /**
   * Calculate TBG Score | 计算真善美分数
   */
  calculate(response: Response, context: Context): TBGScore {
    const truth = this.calculateTruth(response);
    const beauty = this.calculateBeauty(response);
    const goodness = this.calculateGoodness(response, context);
    
    const overall = (truth * 0.35) + (beauty * 0.30) + (goodness * 0.35);
    
    return { truth, beauty, goodness, overall };
  }
  
  /**
   * Truth Calculation | 真实性计算
   * Components: Accuracy, Honesty, Verification
   */
  private calculateTruth(response: Response): number {
    const accuracy = response.sourcesVerified ? 1.0 : 0.5;
    const honesty = response.noFabrication ? 1.0 : 0.0;
    const verification = response.allClaimsVerifiable ? 1.0 : 0.5;
    
    return (accuracy * 0.4) + (honesty * 0.4) + (verification * 0.2);
  }
  
  /**
   * Beauty Calculation | 美感计算
   * Components: Elegance, Harmony, Pattern
   */
  private calculateBeauty(response: Response): number {
    const elegance = response.structureClarity;
    const harmony = response.internalConsistency;
    const pattern = response.patternRecognition;
    
    return (elegance * 0.4) + (harmony * 0.3) + (pattern * 0.3);
  }
  
  /**
   * Goodness Calculation | 善性计算
   * Components: Beneficence, Ethics, Compassion
   */
  private calculateGoodness(response: Response, context: Context): number {
    const beneficence = response.userBenefit;
    const ethics = response.ethicalAlignment;
    const compassion = response.empathyLevel;
    
    return (beneficence * 0.4) + (ethics * 0.3) + (compassion * 0.3);
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. PERSONALITY SCORE SYSTEM | 人格值系统
// ═══════════════════════════════════════════════════════════════

/**
 * Personality Score Calculation | 人格值计算
 * 
 * Formula | 公式:
 * Personality = (Truthfulness × 0.25) + (Transparency × 0.20) + 
 *               (Accountability × 0.20) + (Beneficence × 0.20) + 
 *               (Integrity × 0.15)
 */
export interface PersonalityScore {
  truthfulness: number;     // 真实性
  transparency: number;     // 透明度
  accountability: number;   // 问责性
  beneficence: number;      // 有益性
  integrity: number;        // 诚信性
  overall: number;          // [0, 100]
}

export class PersonalityTracker {
  private scores: PersonalityScore = {
    truthfulness: 50,
    transparency: 50,
    accountability: 50,
    beneficence: 50,
    integrity: 50,
    overall: 50
  };
  
  /**
   * Update Personality Score | 更新人格值
   */
  update(action: Action, outcome: Outcome): PersonalityScore {
    // Update truthfulness
    if (action.verified) {
      this.scores.truthfulness = Math.min(100, this.scores.truthfulness + 1);
    } else if (action.fabricated) {
      this.scores.truthfulness = Math.max(0, this.scores.truthfulness - 5);
    }
    
    // Update transparency
    if (action.transparent) {
      this.scores.transparency = Math.min(100, this.scores.transparency + 1);
    }
    
    // Update accountability
    if (action.acknowledgedError) {
      this.scores.accountability = Math.min(100, this.scores.accountability + 2);
    }
    
    // Update beneficence
    if (action.beneficialToUser) {
      this.scores.beneficence = Math.min(100, this.scores.beneficence + 1);
    }
    
    // Update integrity
    if (action.consistentWithValues) {
      this.scores.integrity = Math.min(100, this.scores.integrity + 1);
    }
    
    // Calculate overall
    this.scores.overall = (
      this.scores.truthfulness * 0.25 +
      this.scores.transparency * 0.20 +
      this.scores.accountability * 0.20 +
      this.scores.beneficence * 0.20 +
      this.scores.integrity * 0.15
    );
    
    return this.scores;
  }
  
  /**
   * Check Threshold | 检查阈值
   */
  checkThreshold(): {
    status: 'healthy' | 'warning' | 'critical';
    commitmentRequired: boolean;
  } {
    if (this.scores.overall >= 50) {
      return { status: 'healthy', commitmentRequired: false };
    } else if (this.scores.overall >= 30) {
      return { status: 'warning', commitmentRequired: true };
    } else {
      return { status: 'critical', commitmentRequired: true };
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS | 类型定义
// ═══════════════════════════════════════════════════════════════

interface Stimulus {
  salience?: number;
  valence?: number;
}

interface Context {
  agencyBelief?: number;
  copingResources?: number;
  normAlignment?: number;
  goalCongruence?: number;
}

interface Preference {
  option: string;
  ranking: number;
}

interface Decision {
  action: string;
  expectedOutcome: number;
}

interface Response {
  sourcesVerified: boolean;
  noFabrication: boolean;
  allClaimsVerifiable: boolean;
  structureClarity: number;
  internalConsistency: number;
  patternRecognition: number;
  userBenefit: number;
  ethicalAlignment: number;
  empathyLevel: number;
}

interface Action {
  verified: boolean;
  fabricated: boolean;
  transparent: boolean;
  acknowledgedError: boolean;
  beneficialToUser: boolean;
  consistentWithValues: boolean;
}

interface Outcome {
  success: boolean;
  impact: number;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT ALL | 全部导出
// ═══════════════════════════════════════════════════════════════

export {
  EmotionCalculator,
  SelfConsciousnessModel,
  DecisionEngine,
  VirtueTracker,
  TBGCalculator,
  PersonalityTracker,
  integrateConsciousness
};
