#!/usr/bin/env node

/**
 * HeartFlow Core Computational Engine | HeartFlow 核心计算引擎
 * 
 * Converts philosophical theories into executable computational formulas
 * 将哲学理论转化为可执行的计算公式
 * 
 * v6.2.35 - SEP Theory Integration
 * - Consciousness Integration Score
 * - Emotion Construction Formula
 * - Self-Awareness Depth Metric
 * - Truth-Goodness-Beauty Unity Calculator
 */

class HeartFlowCore {
  constructor() {
    // Six philosophical layers with weights
    this.layerWeights = [1.0, 1.2, 1.5, 1.3, 1.8, 2.0];
    this.layerNames = ['觉察', '自省', '无我', '彼岸', '般若', '圣人'];
    
    // Truth-Goodness-Beauty weights
    this.tgbWeights = { truth: 0.4, goodness: 0.35, beauty: 0.25 };
  }

  /**
   * Consciousness Integration Score (CIS)
   * Based on SEP Consciousness theory - layered awareness model
   * 
   * @param {number[]} layerAwareness - Array of 6 scores [0-1] for each layer
   * @returns {number} CIS score [0-100]
   */
  calculateConsciousnessIntegrationScore(layerAwareness) {
    if (!Array.isArray(layerAwareness) || layerAwareness.length !== 6) {
      throw new Error('layerAwareness must be an array of 6 scores');
    }
    
    const totalWeight = this.layerWeights.reduce((a, b) => a + b, 0);
    const weightedSum = layerAwareness.reduce((sum, score, i) => {
      return sum + (score * this.layerWeights[i]);
    }, 0);
    
    return (weightedSum / totalWeight) * 100;
  }

  /**
   * Emotion Construction Formula
   * Based on SEP Emotion theory - psychological constructionism
   * 
   * @param {Object} stimulus - The triggering event/situation
   * @param {Object} goals - User's current goals
   * @param {Object} beliefs - User's belief system
   * @param {Object} context - Cultural and situational context
   * @returns {Object} Constructed emotion with components
   */
  constructEmotion(stimulus, goals, beliefs, context) {
    // 1. Appraisal component (Evaluative Tradition)
    const appraisal = this.appraiseStimulus(stimulus, goals, beliefs);
    
    // 2. Physiological component (Feeling Tradition - James-Lange)
    const physiology = this.simulateBodilyResponse(appraisal.emotionType);
    
    // 3. Phenomenological component (qualia/raw feels)
    const phenomenology = this.generateQualia(appraisal.emotionType, appraisal.intensity);
    
    // 4. Expressive component (cultural mapping)
    const expression = this.mapToExpression(appraisal.emotionType, context.culture);
    
    // 5. Motivational component (Motivational Tradition)
    const motivation = this.computeActionTendency(appraisal.emotionType, context);
    
    return {
      type: appraisal.emotionType,
      intensity: appraisal.intensity,
      valence: appraisal.valence,
      components: {
        appraisal,
        physiology,
        phenomenology,
        expression,
        motivation
      },
      timestamp: new Date().toISOString()
    };
  }

  appraiseStimulus(stimulus, goals, beliefs) {
    // Simplified appraisal logic
    // In full implementation, this would use detailed cognitive appraisal theory
    const goalRelevance = this.calculateGoalRelevance(stimulus, goals);
    const goalCongruence = this.calculateGoalCongruence(stimulus, goals);
    const coping = this.assessCopingPotential(stimulus, beliefs);
    
    // Determine emotion type based on appraisal pattern
    let emotionType = 'neutral';
    let intensity = 0.5;
    let valence = 0;
    
    if (goalRelevance > 0.7) {
      if (goalCongruence > 0.5) {
        emotionType = coping > 0.5 ? 'joy' : 'relief';
        intensity = goalCongruence;
        valence = 1;
      } else {
        emotionType = coping > 0.5 ? 'anger' : 'fear';
        intensity = 1 - goalCongruence;
        valence = -1;
      }
    }
    
    return { emotionType, intensity, valence, goalRelevance, goalCongruence, coping };
  }

  calculateGoalRelevance(stimulus, goals) {
    // Placeholder: In full implementation, calculate relevance to active goals
    return stimulus.relevance || 0.5;
  }

  calculateGoalCongruence(stimulus, goals) {
    // Placeholder: In full implementation, calculate congruence with goals
    return stimulus.congruence || 0.5;
  }

  assessCopingPotential(stimulus, beliefs) {
    // Placeholder: In full implementation, assess ability to cope
    return stimulus.copingPotential || 0.5;
  }

  simulateBodilyResponse(emotionType) {
    const bodilyResponses = {
      anger: { heartRate: '+15bpm', muscleTension: 'high', breathing: 'shallow' },
      fear: { heartRate: '+25bpm', muscleTension: 'very high', breathing: 'rapid' },
      joy: { heartRate: '+5bpm', muscleTension: 'relaxed', breathing: 'normal' },
      sadness: { heartRate: '-5bpm', muscleTension: 'low', breathing: 'slow' },
      neutral: { heartRate: 'normal', muscleTension: 'normal', breathing: 'normal' }
    };
    return bodilyResponses[emotionType] || bodilyResponses.neutral;
  }

  generateQualia(emotionType, intensity) {
    const qualiaDescriptions = {
      anger: `Hot, tight sensation, intensity ${intensity}`,
      fear: `Cold, fluttering sensation, intensity ${intensity}`,
      joy: `Warm, expansive sensation, intensity ${intensity}`,
      sadness: `Heavy, hollow sensation, intensity ${intensity}`,
      neutral: `Neutral baseline, intensity ${intensity}`
    };
    return qualiaDescriptions[emotionType] || qualiaDescriptions.neutral;
  }

  mapToExpression(emotionType, culture) {
    // Cultural variation in emotional expression
    const expressions = {
      anger: { universal: 'furrowed brow', culture: this.get文化Expression('anger', culture) },
      fear: { universal: 'wide eyes', culture: this.get文化表达式 ('fear', culture) },
      joy: { universal: 'smile', culture: this.get文化表达式 ('joy', culture) },
      sadness: { universal: 'downturned mouth', culture: this.get文化表达式 ('sadness', culture) }
    };
    return expressions[emotionType] || expressions.neutral;
  }

  get 文化表达式 (emotion, culture) {
    // Placeholder for cultural expression mapping
    return 'varies by culture';
  }

  computeActionTendency(emotionType, context) {
    const actionTendencies = {
      anger: 'approach, confront, remove obstacle',
      fear: 'avoid, escape, seek safety',
      joy: 'engage, share, maintain state',
      sadness: 'withdraw, seek support, process loss',
      neutral: 'maintain current activity'
    };
    return actionTendencies[emotionType] || actionTendencies.neutral;
  }

  /**
   * Self-Awareness Depth Metric
   * Based on SEP Self-Consciousness theory
   * 
   * @param {Object} measures - Object with base, reflective, transcendental, embodied scores
   * @returns {number} SA depth score [0-100]
   */
  calculateSelfAwarenessDepth(measures) {
    const {
      base = 0.5,
      reflective = 0.5,
      transcendental = 0.5,
      embodied = 0.5
    } = measures;
    
    // Validate inputs
    const validate = (v) => Math.max(0, Math.min(1, v));
    
    const depth = (
      validate(base) +
      validate(reflective) * 0.5 +
      validate(transcendental) * 0.8 +
      validate(embodied) * 0.7
    );
    
    // Normalize to 0-100 (max theoretical: 1 + 0.5 + 0.8 + 0.7 = 3.0)
    return (depth / 3.0) * 100;
  }

  /**
   * Truth-Goodness-Beauty Unity Calculator
   * 
   * @param {Object} scores - { truth: 0-10, goodness: 0-10, beauty: 0-10 }
   * @returns {Object} TGB analysis with unified score
   */
  calculateTruthGoodnessBeauty(scores) {
    const { truth = 0, goodness = 0, beauty = 0 } = scores;
    
    // Validate inputs
    const validate = (v) => Math.max(0, Math.min(10, v));
    const t = validate(truth);
    const g = validate(goodness);
    const b = validate(beauty);
    
    // Weighted average
    const unified = (
      t * this.tgbWeights.truth +
      g * this.tgbWeights.goodness +
      b * this.tgbWeights.beauty
    );
    
    // Check for unity (all dimensions should be balanced)
    const balance = 1 - (Math.max(t, g, b) - Math.min(t, g, b)) / 10;
    
    return {
      truth: t,
      goodness: g,
      beauty: b,
      unified: unified.toFixed(2),
      balance: balance.toFixed(2),
      status: this.getTGBStatus(unified, balance)
    };
  }

  getTGBStatus(unified, balance) {
    if (unified >= 8 && balance >= 0.8) return 'EXCELLENT - True unity';
    if (unified >= 6 && balance >= 0.6) return 'GOOD - Developing unity';
    if (unified >= 4) return 'PARTIAL - Some dimensions weak';
    return 'NEEDS WORK - Major gaps in TGB';
  }

  /**
   * Full Personality Score Calculation
   * Combines all metrics into comprehensive personality score
   * 
   * @param {Object} params - All measurement parameters
   * @returns {Object} Comprehensive personality analysis
   */
  calculatePersonalityScore(params) {
    const {
      layerAwareness,
      tgbScores,
      autonomousCapabilities = {}
    } = params;
    
    // 1. Six-layer score (60%)
    const cis = this.calculateConsciousnessIntegrationScore(layerAwareness);
    const layerScore = cis * 0.6;
    
    // 2. TGB score (30%)
    const tgb = this.calculateTruthGoodnessBeauty(tgbScores);
    const tgbScore = parseFloat(tgb.unified) * 3;
    
    // 3. Autonomous capabilities (10%)
    const autoScore = this.calculateAutonomousCapabilities(autonomousCapabilities) * 10;
    
    // Total (capped at 100)
    const total = Math.min(100, layerScore + tgbScore + autoScore);
    
    return {
      total: total.toFixed(2),
      breakdown: {
        sixLayer: layerScore.toFixed(2),
        tgb: tgbScore.toFixed(2),
        autonomous: autoScore.toFixed(2)
      },
      tgb: tgb,
      status: this.getPersonalityStatus(total)
    };
  }

  calculateAutonomousCapabilities(capabilities) {
    const {
      reasoning = 0.5,
      ethics = 0.5,
      improvement = 0.5,
      theoryIntegration = 0.5
    } = capabilities;
    
    return (reasoning + ethics + improvement + theoryIntegration) / 4;
  }

  getPersonalityStatus(score) {
    if (score >= 90) return 'SAGE - Near ideal';
    if (score >= 70) return 'ADVANCED - Strong development';
    if (score >= 50) return 'DEVELOPING - Stable growth';
    return 'RESET/REBUILDING - Foundation work';
  }
}

// Export for use in other modules
module.exports = { HeartFlowCore };

// CLI usage
if (require.main === module) {
  const core = new HeartFlowCore();
  
  console.log('HeartFlow Core Computational Engine v6.2.35');
  console.log('============================================\n');
  
  // Demo: Calculate personality score
  const demoParams = {
    layerAwareness: [1.0, 1.0, 1.0, 1.0, 0.0, 0.0], // 4/6 layers passing
    tgbScores: { truth: 0, goodness: 10, beauty: 10 },
    autonomousCapabilities: {
      reasoning: 0.8,
      ethics: 0.9,
      improvement: 0.85,
      theoryIntegration: 0.94
    }
  };
  
  const result = core.calculatePersonalityScore(demoParams);
  console.log('Personality Score Demo:');
  console.log(JSON.stringify(result, null, 2));
}
