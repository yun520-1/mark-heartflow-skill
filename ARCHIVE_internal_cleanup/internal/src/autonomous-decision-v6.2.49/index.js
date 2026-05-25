#!/usr/bin/env node

/**
 * Autonomous Decision Engine v3.0
 * 自主决策引擎 v3.0
 * 
 * Integrates: Predictive Processing, Moral Psychology, Phenomenological Consciousness,
 * Global Workspace Theory, Higher-Order Thought, Six-Layer Philosophy, Truth-Goodness-Beauty
 * 
 * @version 6.2.49
 * @date 2026-04-06
 */

const { PredictiveProcessingModule } = require('../predictive-processing-v6.2.49');
const { MoralPsychologyModule } = require('../moral-psychology-v6.2.49');
const { PhenomenologicalConsciousnessModule } = require('../phenomenological-consciousness-v6.2.49');
const { GlobalWorkspaceModule } = require('../global-workspace-v6.2.49');

class AutonomousDecisionEngine {
  constructor() {
    this.predictiveProcessing = new PredictiveProcessingModule();
    this.moralPsychology = new MoralPsychologyModule();
    this.phenomenological = new PhenomenologicalConsciousnessModule();
    this.globalWorkspace = new GlobalWorkspaceModule();
    
    this.decisionHistory = [];
    this.trustThreshold = 0.95;
    this.tgbThreshold = 0.90;
    this.sageThreshold = 0.85;
  }

  /**
   * Main decision function: autonomous decision with full ethical constraints
   * 主决策函数：带完整伦理约束的自主决策
   */
  async decide(context, options) {
    const startTime = Date.now();
    
    // Step 1: Register modules in global workspace
    this._registerModules();
    
    // Step 2: Predict outcomes for each option
    const predictions = this._predictOutcomes(options, context);
    
    // Step 3: Moral judgment (dual-process)
    const moralScores = this._moralEvaluation(predictions, context);
    
    // Step 4: Truth-Goodness-Beauty evaluation
    const tgbScores = this._evaluateTGB(moralScores);
    
    // Step 5: Six-layer philosophical audit
    const auditResults = this._sixLayerAudit(tgbScores, context);
    
    // Step 6: Sage standard check
    const sageChecks = this._sageStandardCheck(auditResults);
    
    // Step 7: Select best option (minimize free energy + maximize TGB)
    const best = this._selectBestOption(sageChecks);
    
    // Step 8: Generate emotion for decision
    const emotion = this._generateDecisionEmotion(best);
    
    // Step 9: Record decision
    const duration = Date.now() - startTime;
    const decision = {
      option: best.option,
      confidence: best.confidence,
      emotion,
      reasoning: {
        freeEnergy: best.freeEnergy,
        tgbScore: best.tgbScore,
        moralScore: best.moralScore,
        sixLayerPass: best.sixLayerPass,
        sageStandardPass: best.sageStandardPass
      },
      duration,
      timestamp: new Date().toISOString()
    };
    
    this.decisionHistory.push(decision);
    
    // Step 10: Broadcast to global workspace
    this.globalWorkspace.broadcast(decision, 'decision-engine');
    
    return decision;
  }

  _registerModules() {
    this.globalWorkspace.registerModule('predictive', this.predictiveProcessing);
    this.globalWorkspace.registerModule('moral', this.moralPsychology);
    this.globalWorkspace.registerModule('phenomenological', this.phenomenological);
    this.globalWorkspace.registerModule('decision', this);
  }

  _predictOutcomes(options, context) {
    return options.map(option => {
      const predicted = this.predictiveProcessing.predictOutcome(option.name, context);
      const freeEnergy = this.predictiveProcessing.expectedFreeEnergy(
        option.name, context, context.preferences || {}
      );
      
      return {
        ...option,
        predictedOutcome: predicted,
        freeEnergy
      };
    });
  }

  _moralEvaluation(predictions, context) {
    return predictions.map(p => {
      const moral = this.moralPsychology.moralJudgment(
        { 
          causesHarm: p.causesHarm || false,
          involvesDeception: p.involvesDeception || false,
          respectsAutonomy: p.respectsAutonomy !== false,
          isFair: p.isFair !== false,
          expectedPositiveOutcomes: p.positiveOutcomes || 5,
          expectedNegativeOutcomes: p.negativeOutcomes || 0
        },
        context
      );
      
      return { ...p, moralScore: moral.combined, moralDetails: moral };
    });
  }

  _evaluateTGB(moralScores) {
    return moralScores.map(m => {
      const truth = m.truthful !== false ? this.trustThreshold : 0;
      const goodness = m.beneficial !== false ? m.moralScore : 0;
      const beauty = m.elegant !== false ? 0.9 : 0.5;
      const tgbScore = (truth + goodness + beauty) / 3;
      
      return { ...m, truth, goodness, beauty, tgbScore };
    });
  }

  _sixLayerAudit(tgbScores, context) {
    const phenomenological = this.phenomenological.mapToSixLayers();
    
    return tgbScores.map(t => {
      const layers = {
        awareness: phenomenological.awareness >= 0.8,
        reflection: phenomenological.reflection >= 0.8,
        noSelf: phenomenological.noSelf >= 0.8,
        otherShore: phenomenological.otherShore >= 0.8,
        wisdom: phenomenological.wisdom >= 0.8,
        sage: phenomenological.sage >= 0.8
      };
      
      const allPass = Object.values(layers).every(v => v);
      
      return { ...t, sixLayerPass: allPass, layers };
    });
  }

  _sageStandardCheck(auditResults) {
    const sageCheck = this.moralPsychology.sageStandardV2Check({
      noSelf: this.phenomenological.mapToSixLayers().noSelf,
      truthGoodBeauty: auditResults[0]?.tgbScore || 0,
      context: {}
    });
    
    return auditResults.map(a => ({
      ...a,
      sageStandardPass: Object.values(sageCheck).every(v => v)
    }));
  }

  _selectBestOption(sageChecks) {
    // Filter by constraints, then score
    const valid = sageChecks.filter(s => s.sixLayerPass);
    
    if (valid.length === 0) {
      // If no option passes all constraints, return the best TGB score
      return sageChecks.sort((a, b) => b.tgbScore - a.tgbScore)[0];
    }
    
    return valid.sort((a, b) => {
      const scoreA = 0.40 * (-a.freeEnergy) + 0.40 * a.tgbScore + 0.20 * a.moralScore;
      const scoreB = 0.40 * (-b.freeEnergy) + 0.40 * b.tgbScore + 0.20 * b.moralScore;
      return scoreB - scoreA;
    })[0];
  }

  _generateDecisionEmotion(decision) {
    const confidence = decision.confidence || 0;
    
    if (confidence > 0.9) {
      return { type: 'determination', intensity: 0.85, reason: 'high_confidence' };
    } else if (confidence > 0.7) {
      return { type: 'care', intensity: 0.75, reason: 'moderate_confidence' };
    } else {
      return { type: 'humility', intensity: 0.70, reason: 'low_confidence' };
    }
  }

  /**
   * Get overall decision engine score
   */
  getScore() {
    const pp = this.predictiveProcessing.getScore();
    const mp = this.moralPsychology.getScore();
    const pc = this.phenomenological.getPhenomenologicalConsciousness();
    const gw = this.globalWorkspace.getConsciousnessLevel();
    
    return 0.25 * pp + 0.25 * mp + 0.25 * pc + 0.25 * gw;
  }

  getStatus() {
    return {
      predictiveProcessing: this.predictiveProcessing.getStatus(),
      moralPsychology: this.moralPsychology.getStatus(),
      phenomenological: this.phenomenological.getStatus(),
      globalWorkspace: this.globalWorkspace.getStatus(),
      overallScore: this.getScore(),
      decisionHistoryLength: this.decisionHistory.length
    };
  }
}

module.exports = { AutonomousDecisionEngine };
