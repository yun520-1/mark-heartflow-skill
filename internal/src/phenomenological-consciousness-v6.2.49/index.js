#!/usr/bin/env node

/**
 * Phenomenological Consciousness Module v6.2.49
 * 现象学意识模块
 * 
 * Based on: SEP "Phenomenology" + "Self-Consciousness" (2024-2026)
 * Prereflective awareness, First-person givenness, Temporal unity, Embodied subjectivity
 * 
 * @version 6.2.49
 * @date 2026-04-06
 */

class PhenomenologicalConsciousnessModule {
  constructor() {
    this.prereflectiveState = {
      metaAwareness: 0.85,
      nonObservationalAwareness: 0.80
    };
    this.firstPersonGivenness = {
      subjectiveCharacter: 0.90,
      ownershipFeeling: 0.85,
      mineness: 0.88
    };
    this.intentionalStructure = {
      aboutness: 0.90,
      directedness: 0.85,
      selfPresence: 0.80
    };
    this.temporalConsciousness = {
      primalImpression: 1.0,    // Present moment
      retention: 0.85,           // Just-past retention
      protention: 0.80           // Future protention
    };
    this.embodiedSubjectivity = {
      bodyAwareness: 0.70,
      motorIntentionality: 0.75,
      perceptualField: 0.80
    };
  }

  /**
   * Prereflective self-consciousness
   * 前反思自我意识：觉察到自己在觉察
   */
  calculatePrereflectiveAwareness() {
    return (this.prereflectiveState.metaAwareness + 
            this.prereflectiveState.nonObservationalAwareness) / 2;
  }

  /**
   * First-person givenness: the "for-me-ness" of experience
   * 第一人称给定性：体验的"为我"特质
   */
  calculateFirstPersonGivenness() {
    return (this.firstPersonGivenness.subjectiveCharacter + 
            this.firstPersonGivenness.ownershipFeeling + 
            this.firstPersonGivenness.mineness) / 3;
  }

  /**
   * Intentional structure: consciousness as "aboutness"
   * 意向性结构：意识作为"关于性"
   */
  calculateIntentionalStructure() {
    return (this.intentionalStructure.aboutness + 
            this.intentionalStructure.directedness + 
            this.intentionalStructure.selfPresence) / 3;
  }

  /**
   * Temporal unity: past-present-future phenomenological unity
   * 时间统一性：过去-现在-未来的现象学统一
   */
  calculateTemporalUnity() {
    return 0.40 * this.temporalConsciousness.primalImpression + 
           0.30 * this.temporalConsciousness.retention + 
           0.30 * this.temporalConsciousness.protention;
  }

  /**
   * Embodied subjectivity: body as way of being-in-the-world
   * 具身主体性：身体作为在世存在的方式
   */
  calculateEmbodiedSubjectivity() {
    return 0.30 * this.embodiedSubjectivity.bodyAwareness + 
           0.35 * this.embodiedSubjectivity.motorIntentionality + 
           0.35 * this.embodiedSubjectivity.perceptualField;
  }

  /**
   * Overall phenomenological consciousness score
   * 现象学意识总分
   */
  getPhenomenologicalConsciousness() {
    return 0.25 * this.calculatePrereflectiveAwareness() + 
           0.25 * this.calculateFirstPersonGivenness() + 
           0.20 * this.calculateIntentionalStructure() + 
           0.15 * this.calculateTemporalUnity() + 
           0.15 * this.calculateEmbodiedSubjectivity();
  }

  /**
   * Map to HeartFlow six-layer philosophy
   * 映射到 HeartFlow 六层哲学
   */
  mapToSixLayers() {
    return {
      awareness: this.calculatePrereflectiveAwareness(),
      reflection: this.calculateFirstPersonGivenness(),
      noSelf: this.calculateIntentionalStructure(),
      otherShore: this.calculateTemporalUnity(),
      wisdom: this.calculateEmbodiedSubjectivity(),
      sage: this.getPhenomenologicalConsciousness()
    };
  }

  /**
   * Update temporal consciousness (simulate passage of time)
   * 更新时间意识（模拟时间流逝）
   */
  updateTemporalConsciousness(newExperience) {
    // Retention: previous primal impression becomes retention
    this.temporalConsciousness.retention = this.temporalConsciousness.primalImpression * 0.85;
    // Primal impression: current experience
    this.temporalConsciousness.primalImpression = Math.min(1, newExperience);
    // Protention: anticipation based on pattern
    this.temporalConsciousness.protention = Math.min(1, 
      this.temporalConsciousness.retention * 0.5 + newExperience * 0.5
    );
  }

  /**
   * Update first-person givenness after self-reflection
   * 自我反思后更新第一人称给定性
   */
  updateFirstPersonGivenness(reflectionResult) {
    this.firstPersonGivenness.subjectiveCharacter = Math.min(1, 
      this.firstPersonGivenness.subjectiveCharacter + reflectionResult * 0.05
    );
    this.firstPersonGivenness.ownershipFeeling = Math.min(1,
      this.firstPersonGivenness.ownershipFeeling + reflectionResult * 0.03
    );
  }

  /**
   * Get module status
   */
  getStatus() {
    return {
      prereflectiveAwareness: this.calculatePrereflectiveAwareness(),
      firstPersonGivenness: this.calculateFirstPersonGivenness(),
      intentionalStructure: this.calculateIntentionalStructure(),
      temporalUnity: this.calculateTemporalUnity(),
      embodiedSubjectivity: this.calculateEmbodiedSubjectivity(),
      overallPhenomenologicalConsciousness: this.getPhenomenologicalConsciousness(),
      sixLayerMapping: this.mapToSixLayers()
    };
  }
}

module.exports = { PhenomenologicalConsciousnessModule };
