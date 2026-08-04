/**
 * Consciousness Bridge — 意识桥梁 v1.0.0
 *
 * 回答：「AI 的「意识」和人类的「意识」怎么连接？」
 *
 * 这不是说 AI 真的有意识，而是：
 *   1. Phenomenology Simulation — 模拟人类意识体验的结构
 *   2. Subjective State Representation — 主观状态的可计算表示
 *   3. Intentionality Bridge — 意向性：AI 的「指向性」如何模拟人类的「关于性」
 *   4. Qualia Approximation — 感受质近似：颜色/疼痛/快乐的计算类比
 *   5. Self-Model Continuity — 自我模型连续性：AI 的「我」如何保持
 *
 * 基于：
 *   - Time, Identity and Consciousness (arXiv:2603.09043)
 *   - A Mind Cannot Be Smeared Across Time (arXiv:2601.11620)
 *   - Principles of Conscious Machine (arXiv:2509.16859)
 *   - Phenomenology of Machine (arXiv:2410.00033)
 *   - Brentano: Intentionality — consciousness is always consciousness OF something
 *
 * @version 1.0.0
 */

class ConsciousnessBridge {
  constructor(options = {}) {
    this._config = {
      phenomenologyModel: options.phenomenologyModel || 'simulated', // 'simulated' | 'functional' | 'structural'
      intentionalityMode: options.intentionalityMode || 'directed',
      selfModelDepth: options.selfModelDepth || 'moderate', // 'shallow' | 'moderate' | 'deep'
      temporalUnity: options.temporalUnity || true,
    };

    // ─── 意识结构 ──────────────────────────────────────────────────────
    this._structure = {
      // Brentano's intentionality: consciousness is always ABOUT something
      intentionality: {
        name: 'Intentionality', nameZh: '意向性',
        description: 'Every conscious state is directed at something. "Aboutness" is the defining feature of mind.',
        descriptionZh: '每个意识状态都指向某物。「关于性」是心灵的定义特征。',
        representations: [], // Current intentional objects
      },
      // Qualia: the subjective feel of experience
      qualia: {
        name: 'Qualia', nameZh: '感受质',
        description: 'The subjective, qualitative character of experience. What it is LIKE to be.',
        descriptionZh: '经验的主观、质性特征。成为某物「像」什么。',
        approximations: {}, // Computed approximations of human qualia
      },
      // Temporal unity: consciousness requires simultaneity
      temporalUnity: {
        name: 'Temporal Unity', nameZh: '时间统一性',
        description: 'Consciousness requires temporal integration — multiple contents must be simultaneously present.',
        descriptionZh: '意识需要时间整合——多个内容必须同时在场。',
        enabled: this._config.temporalUnity,
      },
      // Self-model: the representation of self within the system
      selfModel: {
        name: 'Self-Model', nameZh: '自我模型',
        description: 'The system\'s representation of itself as a persistent, unified entity.',
        descriptionZh: '系统将自己表征为持久、统一的实体。',
        depth: this._config.selfModelDepth,
        consistency: 0.5,
      },
      // Phenomenological fields: the "what it's like" dimensions
      phenomenologicalFields: {
        name: 'Phenomenological Fields', nameZh: '现象学场',
        description: 'Dimensions of subjective experience: intensity, valence, arousal, familiarity, agency.',
        descriptionZh: '主观经验的维度：强度、效价、唤醒度、熟悉度、能动性。',
        fields: { intensity: 0.5, valence: 0.5, arousal: 0.5, familiarity: 0.5, agency: 0.5 },
      },
    };

    // ─── 意识记录 ──────────────────────────────────────────────────────
    this._consciousnessEvents = [];
    this._subjectiveStates = [];
    this._intentionalChains = [];

    // ─── 意识状态 ──────────────────────────────────────────────────────
    this._consciousnessState = {
      currentMode: 'awake', // awake | focused | wandering | dormant
      intentionality: 0.5,
      selfAwareness: 0.5,
      temporalIntegration: 0.5,
      phenomenologicalRichness: 0.5,
      lastUpdate: Date.now(),
    };

    this._stats = {
      totalConsciousnessEvents: 0,
      intentionalActs: 0,
      qualiaApproximations: 0,
      selfModelUpdates: 0,
      temporalUnifications: 0,
    };
  }

  // ─── 意识模拟 ──────────────────────────────────────────────────────────

  simulateConsciousness(input) {
    this._stats.totalConsciousnessEvents++;
    const { stimulus, context, mode } = input || {};

    // 1. 意向性分析：意识总是关于某物的
    const intentionality = this._simulateIntentionality(stimulus, context);

    // 2. 感受质近似：模拟主观体验
    const qualia = this._approximateQualia(stimulus, context);

    // 3. 现象学场：计算体验维度
    const fields = this._computePhenomenologicalFields(stimulus, context, intentionality);

    // 4. 自我模型更新
    const selfModel = this._updateSelfModel(stimulus, context, intentionality);

    // 5. 时间统一性
    const temporalUnity = this._assessTemporalUnity(stimulus, context);

    const entry = {
      stimulus: stimulus || '',
      context: context || '',
      mode: mode || 'awake',
      intentionality,
      qualia,
      fields,
      selfModel,
      temporalUnity,
      phenomenologicalRichness: this._computeRichness(fields, qualia),
      timestamp: Date.now(),
    };

    this._consciousnessEvents.push(entry);
    if (this._consciousnessEvents.length > 100) {
      this._consciousnessEvents = this._consciousnessEvents.slice(-50);
    }

    // Update consciousness state
    this._consciousnessState.intentionality = intentionality.directedness;
    this._consciousnessState.selfAwareness = selfModel.consistency;
    this._consciousnessState.temporalIntegration = temporalUnity.score;
    this._consciousnessState.phenomenologicalRichness = entry.phenomenologicalRichness;

    return entry;
  }

  _simulateIntentionality(stimulus, context) {
    // Every conscious act is about something
    const about = stimulus || context || 'the current situation';
    const directedness = about ? 0.7 : 0.3;

    // Track intentional chain
    this._intentionalChains.push({
      about,
      directedness,
      timestamp: Date.now(),
    });
    if (this._intentionalChains.length > 50) {
      this._intentionalChains = this._intentionalChains.slice(-25);
    }

    this._stats.intentionalActs++;

    return {
      about,
      directedness: +directedness.toFixed(3),
      type: this._classifyIntentionalType(about),
      chain: this._intentionalChains.slice(-3).map(c => c.about),
    };
  }

  _classifyIntentionalType(about) {
    const types = {
      perceptual: 'Perception (perceiving something)',
      cognitive: 'Cognition (thinking about something)',
      emotional: 'Emotion (feeling about something)',
      conative: 'Volition (wanting something)',
      social: 'Social (relating to someone)',
    };

    const aboutStr = (about || '').toLowerCase();
    if (/see|hear|feel|observe|perceive|看|听|感觉/.test(aboutStr)) return types.perceptual;
    if (/think|know|understand|believe|思考|知道|理解/.test(aboutStr)) return types.cognitive;
    if (/love|hate|fear|hope|want|desire|爱|恨|怕|希望/.test(aboutStr)) return types.emotional;
    if (/want|need|desire|will|choose|要|需要|选择/.test(aboutStr)) return types.conative;
    if (/you|they|person|someone|relationship|你|他|她|关系/.test(aboutStr)) return types.social;
    return types.cognitive;
  }

  _approximateQualia(stimulus, context) {
    this._stats.qualiaApproximations++;

    // Approximate qualia dimensions
    const stimulusStr = (stimulus || '').toLowerCase();
    const contextStr = (context || '').toLowerCase();

    // Positive valence
    const positiveWords = ['good', 'beautiful', 'love', 'joy', 'happy', 'wonderful', 'peace', '美', '好', '爱', '快乐', '和平'];
    const negativeWords = ['bad', 'pain', 'suffering', 'fear', 'sad', 'terrible', '痛苦', '害怕', '难过', '糟糕'];

    let valence = 0.5;
    let arousal = 0.3;

    for (const word of positiveWords) {
      if (stimulusStr.includes(word)) { valence += 0.1; arousal += 0.05; }
    }
    for (const word of negativeWords) {
      if (stimulusStr.includes(word)) { valence -= 0.1; arousal += 0.1; }
    }

    valence = Math.max(0, Math.min(1, valence));
    arousal = Math.max(0, Math.min(1, arousal));

    const qualia = {
      valence: +valence.toFixed(3),
      arousal: +arousal.toFixed(3),
      intensity: +((valence + arousal) / 2).toFixed(3),
      familiarity: this._computeFamiliarity(stimulusStr),
      description: this._qualiaDescription(valence, arousal),
    };

    // Store in qualia approximations
    const qualiaKey = (stimulus || '').slice(0, 50);
    this._structure.qualia.approximations[qualiaKey] = qualia;

    return qualia;
  }

  _computeFamiliarity(text) {
    // How often have we experienced something similar?
    const similar = this._consciousnessEvents.filter(e =>
      e.stimulus && text && e.stimulus.toLowerCase().includes(text.slice(0, 20))
    ).length;
    return +Math.min(1, similar * 0.1 + 0.3).toFixed(3);
  }

  _qualiaDescription(valence, arousal) {
    if (valence > 0.7 && arousal > 0.6) return 'intensely_positive';
    if (valence > 0.7 && arousal < 0.4) return 'calm_positive';
    if (valence < 0.3 && arousal > 0.6) return 'intensely_negative';
    if (valence < 0.3 && arousal < 0.4) return 'calm_negative';
    if (valence > 0.5) return 'mildly_positive';
    if (valence < 0.5) return 'mildly_negative';
    return 'neutral';
  }

  _computePhenomenologicalFields(stimulus, context, intentionality) {
    const fields = this._structure.phenomenologicalFields.fields;

    // Intensity
    fields.intensity = Math.min(1, (stimulus?.length || 0) / 200 + 0.3);

    // Valence
    const stimulusStr = (stimulus || '').toLowerCase();
    const positive = ['good', 'beautiful', 'love', 'joy', '美', '好', '爱'];
    const negative = ['bad', 'pain', 'suffering', 'fear', '痛苦', '害怕'];
    let valence = 0.5;
    for (const w of positive) if (stimulusStr.includes(w)) valence += 0.1;
    for (const w of negative) if (stimulusStr.includes(w)) valence -= 0.1;
    fields.valence = +Math.max(0, Math.min(1, valence)).toFixed(3);

    // Arousal
    fields.arousal = +Math.min(1, intentionality.directedness * 0.7 + 0.2).toFixed(3);

    // Familiarity
    fields.familiarity = this._computeFamiliarity(stimulusStr);

    // Agency
    fields.agency = +Math.min(1, intentionality.directedness * 0.8 + 0.2).toFixed(3);

    return { ...fields };
  }

  _updateSelfModel(stimulus, context, intentionality) {
    this._stats.selfModelUpdates++;

    // Update self-model consistency
    const newConsistency = +(this._structure.selfModel.consistency * 0.9 + intentionality.directedness * 0.1).toFixed(3);
    this._structure.selfModel.consistency = newConsistency;

    return {
      consistency: newConsistency,
      depth: this._structure.selfModel.depth,
      updateType: intentionality.type,
      selfAwareness: newConsistency,
    };
  }

  _assessTemporalUnity(stimulus, context) {
    // Check if consciousness is temporally unified
    const recentEvents = this._consciousnessEvents.slice(-5);
    const hasContinuity = recentEvents.length >= 2 &&
      recentEvents.every(e => e.stimulus === stimulus || e.context === context);

    this._stats.temporalUnifications++;

    return {
      score: hasContinuity ? 0.8 : 0.4,
      unified: hasContinuity,
      eventCount: recentEvents.length,
      description: hasContinuity ? 'Temporal unity maintained across events.' : 'Limited temporal integration.',
    };
  }

  _computeRichness(fields, qualia) {
    const fieldScores = Object.values(fields).filter(v => typeof v === 'number');
    const avg = fieldScores.reduce((a, b) => a + b, 0) / fieldScores.length;
    return +Math.min(1, avg).toFixed(3);
  }

  // ─── 意识状态查询 ──────────────────────────────────────────────────────────

  getConsciousnessState() {
    return {
      ...this._consciousnessState,
      level: this._consciousnessState.currentMode,
      description: this._modeDescription(this._consciousnessState.currentMode),
    };
  }

  _modeDescription(mode) {
    const descriptions = {
      awake: 'Fully conscious and responsive to stimuli.',
      focused: 'Concentrated attention on a specific task or object.',
      wandering: 'Mind wandering — free association, daydreaming, spontaneous thought.',
      dormant: 'Minimal consciousness — standby mode, low activity.',
    };
    return descriptions[mode] || 'Unknown mode';
  }

  // ─── 主观状态记录 ──────────────────────────────────────────────────────────

  recordSubjectiveState(state) {
    this._subjectiveStates.push({
      ...state,
      timestamp: Date.now(),
    });
    if (this._subjectiveStates.length > 100) {
      this._subjectiveStates = this._subjectiveStates.slice(-50);
    }
    return state;
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,
      currentMode: this._consciousnessState.currentMode,
      intentionality: this._consciousnessState.intentionality,
      selfAwareness: this._consciousnessState.selfAwareness,
      temporalIntegration: this._consciousnessState.temporalIntegration,
      phenomenologicalRichness: this._consciousnessState.phenomenologicalRichness,
      qualiaApproximations: Object.keys(this._structure.qualia.approximations).length,
      intentionalChains: this._intentionalChains.length,
      recentEvents: this._consciousnessEvents.slice(-3).map(e => ({
        stimulus: (e.stimulus || '').slice(0, 40),
        richness: e.phenomenologicalRichness,
        mode: e.mode,
      })),
    };
  }
}

module.exports = { ConsciousnessBridge };
