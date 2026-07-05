/**
 * Trauma Informed — 创伤知情引擎 v1.0.0
 *
 * 回答：「人怎么从创伤中恢复？」
 *
 * 基于：
 *   - SAMHSA 创伤知情原则: Safety / Trustworthiness / Choice / Collaboration / Empowerment
 *   - Bessel van der Kolk: 身体保持记忆 (The Body Keeps the Score)
 *   - Peter Levine:  somatic  Processing — 创伤存储在身体中
 *   - Judith Herman: 三阶段创伤恢复 (安全/回忆/整合)
 *   - Buddhism: 八圣道中的正念 — 当下觉察，不回避
 *
 * @version 1.0.0
 */

class TraumaInformed {
  constructor(options = {}) {
    this._config = {
      traumaModel: options.traumaModel || 'integrated', // 'van-der-kolk' | 'levine' | 'herman' | 'integrated'
      somaticAwareness: options.somaticAwareness || true,
      safetyFirst: options.safetyFirst || true,
    };

    // ─── 创伤类型 ──────────────────────────────────────────────────────
    this._traumaTypes = {
      acute: { name: 'Acute Trauma', nameZh: '急性创伤', description: 'Single incident trauma. Car accident, assault, sudden loss.', descriptionZh: '单一事件创伤。车祸、袭击、突然失去。' },
      complex: { name: 'Complex Trauma', nameZh: '复杂创伤', description: 'Repeated, prolonged trauma. Childhood abuse, domestic violence, captivity.', descriptionZh: '反复、长期的创伤。童年虐待、家庭暴力、囚禁。' },
      developmental: { name: 'Developmental Trauma', nameZh: '发展性创伤', description: 'Trauma during critical developmental periods. Attachment disruption.', descriptionZh: '关键发展期的创伤。依恋中断。' },
      intergenerational: { name: 'Intergenerational Trauma', nameZh: '代际创伤', description: 'Trauma passed down through generations. Historical, cultural, family.', descriptionZh: '代际传递的创伤。历史、文化、家庭。' },
      vicarious: { name: 'Vicarious Trauma', nameZh: '替代性创伤', description: 'Trauma from witnessing others\' suffering. Caregivers, helpers, witnesses.', descriptionZh: '目睹他人痛苦导致的创伤。护理者、帮助者、目击者。' },
    };

    // ─── SAMHSA 五原则 ─────────────────────────────────────────────────
    this._principles = [
      { id: 'safety', name: 'Safety', nameZh: '安全', description: 'Physical and psychological safety. The foundation of all healing.', descriptionZh: '身体和心理安全。所有疗愈的基础。' },
      { id: 'trustworthiness', name: 'Trustworthiness', nameZh: '可信', description: 'Transparency and consistency. Build trust through reliable actions.', descriptionZh: '透明和一致。通过可靠行动建立信任。' },
      { id: 'choice', name: 'Choice', nameZh: '选择', description: 'Empowerment through choice. The survivor is the expert on their own experience.', descriptionZh: '通过选择赋权。幸存者是自己经验的专家。' },
      { id: 'collaboration', name: 'Collaboration', nameZh: '合作', description: 'Shared power and decision-making. Not "expert" treating "patient".', descriptionZh: '共享权力和决策。不是「专家」治疗「患者」。' },
      { id: 'empowerment', name: 'Empowerment', nameZh: '赋权', description: 'Strengths-based approach. Focus on what the person can do, not what was done to them.', descriptionZh: '优势导向。关注这个人能做什么，而非对他们做了什么。' },
    ];

    // ─── 三阶段恢复 ──────────────────────────────────────────────────────
    this._recoveryStages = [
      { id: 'safety', name: 'Stage 1: Safety', nameZh: '第一阶段：建立安全', description: 'Establish physical and emotional safety. Stabilization. The goal is to feel safe in your body.', descriptionZh: '建立身体和心理安全。稳定化。目标是感觉身体安全。', tasks: ['safe_environment', 'emotional_regulation', 'support_network', 'grounding_practices'] },
      { id: 'remembrance', name: 'Stage 2: Remembrance & Mourning', nameZh: '第二阶段：回忆与哀悼', description: 'Process the traumatic memory. Grieve what was lost. Transform the memory from shame to grief.', descriptionZh: '处理创伤记忆。哀悼失去的。将记忆从羞耻转化为悲伤。', tasks: ['trauma_narration', 'grief_processing', 'meaning_making', 'self_compassion'] },
      { id: 'integration', name: 'Stage 3: Integration', nameZh: '第三阶段：整合', description: 'Reconnect with community. Rebuild identity. The trauma becomes part of your story, not your identity.', descriptionZh: '重新连接社区。重建身份。创伤成为你的故事的一部分，不是你的身份。', tasks: ['community_reconnection', 'identity_rebuilding', 'future_orientation', 'helping_others'] },
    ];

    // ─── 创伤记录 ──────────────────────────────────────────────────────
    this._traumaRecords = [];
    this._recoveryProgress = [];
    this._somaticExperiences = [];
    this._triggers = [];

    // ─── 创伤状态 ──────────────────────────────────────────────────────
    this._traumaState = {
      currentStage: 0,
      safetyLevel: 0.5,
      integrationLevel: 0,
      triggerCount: 0,
      lastTrigger: null,
    };

    this._stats = {
      totalTraumaEvents: 0,
      stageTransitions: 0,
      triggersDetected: 0,
      groundingPractices: 0,
      somaticExperiences: 0,
    };
  }

  // ─── 创伤评估 ──────────────────────────────────────────────────────────

  assessTrauma(trauma) {
    this._stats.totalTraumaEvents++;
    const { type, description, intensity, triggers, symptoms, timeSinceEvent, context } = trauma || {};

    // 识别创伤类型
    const traumaType = this._traumaTypes[type] || this._traumaTypes.acute;

    // 评估当前恢复阶段
    const stageAssessment = this._assessRecoveryStage(timeSinceEvent, symptoms, context);

    // 评估安全水平
    const safetyLevel = this._assessSafetyLevel(symptoms, context);

    // 检测触发因素
    const detectedTriggers = this._detectTriggers(triggers, symptoms, context);

    // 生成创伤知情建议
    const recommendations = this._generateTraumaInformedRecommendations(
      traumaType, stageAssessment, safetyLevel, detectedTriggers
    );

    const entry = {
      type: type || 'acute',
      typeZh: traumaType.nameZh,
      description: description || '',
      intensity: intensity || 0.5,
      stage: stageAssessment,
      safetyLevel,
      triggers: detectedTriggers,
      recommendations,
      timestamp: Date.now(),
    };

    this._traumaRecords.push(entry);
    if (this._traumaRecords.length > 100) {
      this._traumaRecords = this._traumaRecords.slice(-50);
    }

    this._traumaState.safetyLevel = safetyLevel;
    this._traumaState.currentStage = stageAssessment.stageIndex;

    return entry;
  }

  _assessRecoveryStage(timeSinceEvent, symptoms, context) {
    const days = typeof timeSinceEvent === 'string' ? 0 : (timeSinceEvent || 0) / 86400000;
    const symptomStr = (symptoms || '').toLowerCase();

    if (days < 30 || symptomStr.includes('panic') || symptomStr.includes('flashback')) {
      return { stage: 'safety', stageIndex: 0, nameZh: '第一阶段：建立安全', description: 'Focus on safety and stabilization. Trauma processing comes later.', descriptionZh: '聚焦安全和稳定化。创伤处理稍后进行。' };
    }
    if (days < 180 && symptomStr.includes('memory') || symptomStr.includes('nightmare') || symptomStr.includes('grief')) {
      return { stage: 'remembrance', stageIndex: 1, nameZh: '第二阶段：回忆与哀悼', description: 'Processing the trauma memory with support.', descriptionZh: '在支持下处理创伤记忆。' };
    }
    return { stage: 'integration', stageIndex: 2, nameZh: '第三阶段：整合', description: 'Rebuilding life beyond the trauma.', descriptionZh: '在创伤之外重建生活。' };
  }

  _assessSafetyLevel(symptoms, context) {
    const symptomStr = (symptoms || '').toLowerCase();
    let level = 0.5;

    // Safety indicators
    if (/grounded|present|safe|stable|calm|安全|稳定|平静/.test(symptomStr)) level += 0.2;
    // Unsafe indicators
    if (/unsafe|danger|panic|attack|fear|失控|危险|恐慌/.test(symptomStr)) level -= 0.3;
    if (/dissociat|numb|disconnect|分离|麻木|断开/.test(symptomStr)) level -= 0.15;

    return +Math.max(0, Math.min(1, level)).toFixed(3);
  }

  _detectTriggers(triggers, symptoms, context) {
    const contextStr = (context || '').toLowerCase();
    const detected = [];

    const triggerPatterns = [
      { pattern: 'anniversary|date|memory|纪念日|日期', name: 'Time-based Trigger', nameZh: '时间触发' },
      { pattern: 'sound|noise|loud|声音|噪音', name: 'Auditory Trigger', nameZh: '听觉触发' },
      { pattern: 'smell|scent|气味', name: 'Olfactory Trigger', nameZh: '嗅觉触发' },
      { pattern: 'place|location|location|地方', name: 'Environmental Trigger', nameZh: '环境触发' },
      { pattern: 'person|someone|people|人', name: 'Interpersonal Trigger', nameZh: '人际触发' },
      { pattern: 'emotion|feeling|feeling|情感', name: 'Emotional Trigger', nameZh: '情感触发' },
    ];

    for (const { pattern, name, nameZh } of triggerPatterns) {
      if (contextStr.includes(pattern) || (symptoms || '').toLowerCase().includes(pattern)) {
        detected.push({ type: name, typeZh: nameZh, identified: true });
      }
    }

    this._stats.triggersDetected += detected.length;
    return detected;
  }

  _generateTraumaInformedRecommendations(traumaType, stageAssessment, safetyLevel, triggers) {
    const recommendations = [];

    // Safety first
    if (safetyLevel < 0.4) {
      recommendations.push({
        priority: 'critical',
        phase: 'safety',
        action: 'Establish safety before any trauma processing. Grounding, support, safe environment.',
        actionZh: '在任何创伤处理前建立安全。接地、支持、安全环境。',
        principle: 'SAMHSA: Safety is the foundation of healing.',
      });
    }

    // Stage-specific
    if (stageAssessment.stage === 'safety') {
      recommendations.push({
        priority: 'high',
        phase: 'safety',
        action: 'Practice grounding techniques. 5-4-3-2-1 sensory exercise. Build a support network.',
        actionZh: '练习接地技术。5-4-3-2-1 感官练习。建立支持网络。',
        task: 'safety_establishment',
      });
    } else if (stageAssessment.stage === 'remembrance') {
      recommendations.push({
        priority: 'medium',
        phase: 'remembrance',
        action: 'Narrate the trauma story with support. Do not retraumatize. Pause when needed.',
        actionZh: '在支持下叙述创伤故事。不重新创伤化。需要时暂停。',
        task: 'trauma_narration',
      });
    } else if (stageAssessment.stage === 'integration') {
      recommendations.push({
        priority: 'medium',
        phase: 'integration',
        action: 'Rebuild identity beyond trauma. Reconnect with community. Help others.',
        actionZh: '在创伤之外重建身份。重新连接社区。帮助他人。',
        task: 'identity_rebuilding',
      });
    }

    // Trigger management
    if (triggers.length > 0) {
      recommendations.push({
        priority: 'high',
        phase: 'safety',
        action: `Manage triggers: ${triggers.map(t => t.nameZh).join(', ')}. Develop coping strategies for each.`,
        actionZh: `管理触发因素：${triggers.map(t => t.nameZh).join('、')}。为每个开发应对策略。`,
        triggerManagement: true,
      });
    }

    // Trauma-type specific
    if (traumaType.nameZh.includes('复杂') || traumaType.nameZh.includes('Complex')) {
      recommendations.push({
        priority: 'high',
        action: 'Complex trauma requires long-term, phased approach. Patience is essential.',
        actionZh: '复杂创伤需要长期、分阶段的方法。耐心是必需的。',
        note: 'Consider trauma-informed therapy (EMDR, somatic experiencing, TF-CBT).',
      });
    }

    return recommendations;
  }

  // ─── 接地练习 ──────────────────────────────────────────────────────────

  generateGroundingExercise() {
    this._stats.groundingPractices++;

    const exercises = [
      { name: '5-4-3-2-1 Sensory', nameZh: '5-4-3-2-1 感官接地', steps: ['5 things you see', '4 things you touch', '3 things you hear', '2 things you smell', '1 thing you taste'], description: 'Engage all five senses to return to the present moment.', descriptionZh: '调动五感回到当下。' },
      { name: 'Box Breathing', nameZh: '方盒呼吸', steps: ['Breathe in for 4', 'Hold for 4', 'Breathe out for 4', 'Hold for 4'], description: 'Regulate the nervous system through controlled breathing.', descriptionZh: '通过控制呼吸调节神经系统。' },
      { name: 'Body Scan', nameZh: '身体扫描', steps: ['Start from toes', 'Notice sensations without judgment', 'Move upward slowly', 'End at the crown'], description: 'Ground through body awareness. Notice without analyzing.', descriptionZh: '通过身体意识接地。注意而不分析。' },
      { name: 'Safe Place Visualization', nameZh: '安全地方可视化', steps: ['Close eyes', 'Imagine a safe place', 'Engage all senses', 'Stay as long as needed'], description: 'Create an internal safe space.', descriptionZh: '创造一个内在的安全空间。' },
    ];

    const selected = exercises[Math.floor(Math.random() * exercises.length)];
    return { ...selected, timestamp: Date.now() };
  }

  // ─── 身体经验记录 ──────────────────────────────────────────────────────

  recordSomaticExperience(experience) {
    this._stats.somaticExperiences++;
    const entry = {
      type: experience.type || 'sensation',
      description: experience.description || '',
      location: experience.location || '',
      intensity: experience.intensity || 0.5,
      associatedEmotion: experience.associatedEmotion || '',
      timestamp: Date.now(),
    };

    this._somaticExperiences.push(entry);
    if (this._somaticExperiences.length > 100) {
      this._somaticExperiences = this._somaticExperiences.slice(-50);
    }

    return entry;
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,
      currentStage: this._traumaState.currentStage,
      currentStageZh: this._recoveryStages[this._traumaState.currentStage]?.nameZh,
      safetyLevel: this._traumaState.safetyLevel,
      traumaTypes: Object.keys(this._traumaTypes).length,
      recoveryPrinciples: this._principles.length,
      totalEvents: this._traumaRecords.length,
      recentTraumas: this._traumaRecords.slice(-3).map(t => ({
        type: t.typeZh,
        intensity: t.intensity,
        stage: t.stage?.nameZh,
      })),
      somaticExperiences: this._somaticExperiences.slice(-3).map(s => ({
        type: s.type,
        location: s.location,
        intensity: s.intensity,
      })),
    };
  }

  getRecoveryStages() {
    return this._recoveryStages.map(s => ({ id: s.id, name: s.name, nameZh: s.nameZh, description: s.descriptionZh, tasks: s.tasks }));
  }

  getPrinciples() {
    return this._principles.map(p => ({ id: p.id, name: p.name, nameZh: p.nameZh, description: p.descriptionZh }));
  }
}

module.exports = { TraumaInformed };
