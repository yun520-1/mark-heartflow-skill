/**
 * Conflict Resolution — 冲突解决引擎 v1.0.0
 *
 * 回答：「人怎么处理矛盾？」
 *
 * 基于：
 *   - Thomas-Kilmann: 五种冲突处理模式 (竞争/迁就/回避/妥协/合作)
 *   - Nonviolent Communication (NVC): Rosenberg 的四步法 (观察/感受/需要/请求)
 *   - Buddhism: 八正道中的正语 — 说话是为了理解，不是伤害
 *   - Confucianism: 和而不同 — 和谐但不必相同
 *   - Fisher/Ury: 原则谈判 — 区别人与问题，关注利益而非立场
 *
 * @version 1.0.0
 */

class ConflictResolution {
  constructor(options = {}) {
    this._config = {
      primaryStyle: options.primaryStyle || 'collaborating',
      culture: options.culture || 'integrated',
      powerBalance: options.powerBalance || 'equal', // 'equal' | 'imbalanced' | 'unknown'
    };

    // ─── 冲突处理模式 ──────────────────────────────────────────────────
    this._styles = {
      competing: { name: 'Competing', nameZh: '竞争', description: 'High assertiveness, low cooperativeness. Win-lose.', descriptionZh: '高自信，低合作。赢-输。', whenToUse: 'Emergency, unpopular decisions, protecting self from harm.', whenToUseZh: '紧急情况、不受欢迎的决定、保护自己免受伤害。' },
      accommodating: { name: 'Accommodating', nameZh: '迁就', description: 'Low assertiveness, high cooperativeness. Lose-win.', descriptionZh: '低自信，高合作。输-赢。', whenToUse: 'When relationship matters more than issue. When you are wrong.', whenToUseZh: '当关系比问题重要时。当你错了时。' },
      avoiding: { name: 'Avoiding', nameZh: '回避', description: 'Low assertiveness, low cooperativeness. No resolution.', descriptionZh: '低自信，低合作。无解决。', whenToUse: 'When issue is trivial. When emotions are too high. When you need time.', whenToUseZh: '当问题不重要时。当情绪太高时。当你需要时间时。' },
      compromising: { name: 'Compromising', nameZh: '妥协', description: 'Medium assertiveness, medium cooperativeness. Partial win-lose.', descriptionZh: '中等自信，中等合作。部分赢-输。', whenToUse: 'When goals are equally important. Time pressure. Temporary solution.', whenToUseZh: '当目标同等重要时。时间压力。临时解决方案。' },
      collaborating: { name: 'Collaborating', nameZh: '合作', description: 'High assertiveness, high cooperativeness. Win-win.', descriptionZh: '高自信，高合作。赢-赢。', whenToUse: 'When both issues are important. When you need a creative solution. When merging insights.', whenToUseZh: '当两个问题都重要时。当需要创造性解决方案时。当合并见解时。' },
    };

    // ─── NVC 四步 ──────────────────────────────────────────────────────
    this._nvcSteps = [
      { step: 1, name: 'Observation', nameZh: '观察', description: 'State facts without judgment or evaluation.', descriptionZh: '陈述事实，不带判断或评价。' },
      { step: 2, name: 'Feeling', nameZh: '感受', description: 'Express your emotions without blaming.', descriptionZh: '表达你的情感，不带指责。' },
      { step: 3, name: 'Need', nameZh: '需要', description: 'Identify the underlying need driving the feeling.', descriptionZh: '识别驱动感受的底层需要。' },
      { step: 4, name: 'Request', nameZh: '请求', description: 'Make a specific, actionable request (not a demand).', descriptionZh: '提出具体、可执行的请求（不是要求）。' },
    ];

    // ─── 冲突记录 ──────────────────────────────────────────────────────
    this._conflicts = [];
    this._resolutions = [];
    this._nvcPractices = [];

    this._stats = {
      totalConflicts: 0,
      resolvedConflicts: 0,
      unresolvedConflicts: 0,
      nvcPractices: 0,
      styleDistribution: { competing: 0, accommodating: 0, avoiding: 0, compromising: 0, collaborating: 0 },
    };
  }

  // ─── 冲突分析 ──────────────────────────────────────────────────────────

  analyzeConflict(conflict) {
    this._stats.totalConflicts++;
    const { parties, issue, positions, emotions, context } = conflict || {};

    // 识别冲突类型
    const conflictType = this._identifyConflictType(issue, positions, context);

    // 评估各方立场
    const partyAnalysis = this._analyzeParties(parties, positions, emotions);

    // 识别底层利益
    const interests = this._identifyInterests(positions);

    // 推荐处理模式
    const recommendedStyle = this._recommendStyle(conflictType, partyAnalysis, interests);

    // 生成 NVC 对话框架
    const nvcFramework = this._generateNVCFramework(conflict);

    // 评估解决可能性
    const resolution = this._assessResolution(conflictType, partyAnalysis, recommendedStyle);

    const entry = {
      type: conflictType,
      parties: parties || [],
      issue: issue || '',
      positions: positions || {},
      partyAnalysis,
      interests,
      recommendedStyle,
      nvcFramework,
      resolution,
      timestamp: Date.now(),
    };

    this._conflicts.push(entry);

    return entry;
  }

  _identifyConflictType(issue, positions, context) {
    const issueStr = (issue || '').toLowerCase();
    const contextStr = (context || '').toLowerCase();

    if (/value|belief|principle|信仰|价值观|原则/.test(issueStr)) return 'values_conflict';
    if (/relationship|trust|respect|关系|信任|尊重/.test(issueStr)) return 'relationship_conflict';
    if (/resource|money|time|资源|钱|时间/.test(issueStr)) return 'resource_conflict';
    if (/data|fact|truth|information|事实|数据|真相/.test(issueStr)) return 'factual_conflict';
    if (/role|responsibility|authority|角色|责任|权力/.test(issueStr)) return 'power_conflict';
    if (/goal|priority|direction|目标|方向|优先级/.test(issueStr)) return 'goal_conflict';

    return 'interpersonal_conflict';
  }

  _analyzeParties(parties, positions, emotions) {
    const analysis = {};
    for (const party of (parties || [])) {
      const position = positions?.[party] || {};
      analysis[party] = {
        position: position.statement || '',
        interests: position.interests || [],
        emotions: emotions?.[party] || 'unknown',
        powerLevel: position.power || 'medium',
        willingnessToNegotiate: position.willingness || 0.5,
      };
    }
    return analysis;
  }

  _identifyInterests(positions) {
    const interests = { stated: [], unstated: [], shared: [] };

    for (const [party, pos] of Object.entries(positions || {})) {
      if (pos.interests) {
        interests.stated.push({ party, interests: pos.interests });
      }
    }

    // Find shared interests
    const allInterests = interests.stated.flatMap(s => s.interests);
    const interestCounts = {};
    for (const interest of allInterests) {
      interestCounts[interest] = (interestCounts[interest] || 0) + 1;
    }
    interests.shared = Object.entries(interestCounts)
      .filter(([_, count]) => count >= 2)
      .map(([interest]) => interest);

    return interests;
  }

  _recommendStyle(conflictType, partyAnalysis, interests) {
    // Collaborative is best when both parties have high power and shared interests
    const parties = Object.values(partyAnalysis);
    const highPowerParties = parties.filter(p => p.powerLevel === 'high').length;
    const sharedInterests = interests.shared.length;

    if (sharedInterests >= 2 && highPowerParties >= 1) {
      return { style: 'collaborating', nameZh: '合作', confidence: 0.8, reason: 'Shared interests identified. Both parties have power to negotiate.' };
    }

    if (conflictType === 'values_conflict') {
      return { style: 'compromising', nameZh: '妥协', confidence: 0.6, reason: 'Value conflicts rarely fully resolved. Find coexistence.' };
    }

    if (conflictType === 'resource_conflict') {
      return { style: 'collaborating', nameZh: '合作', confidence: 0.7, reason: 'Resource conflicts benefit from creative problem-solving.' };
    }

    if (conflictType === 'relationship_conflict') {
      return { style: 'accommodating', nameZh: '迁就', confidence: 0.5, reason: 'Relationship repair takes precedence over winning.' };
    }

    return { style: 'compromising', nameZh: '妥协', confidence: 0.5, reason: 'Default to compromise when style unclear.' };
  }

  _generateNVCFramework(conflict) {
    const { parties, issue } = conflict || {};
    const frameworks = {};

    for (const party of (parties || [])) {
      frameworks[party] = {
        observation: `When [specific behavior related to ${issue || 'the issue'}]...`,
        feeling: 'I feel [emotion] because...',
        need: 'I need [specific need] because...',
        request: 'Would you be willing to [specific action]?',
      };
    }

    return {
      steps: this._nvcSteps,
      frameworks,
      groundRules: [
        'Speak from personal experience, not generalizations.',
        'No interruptions. Each person speaks fully before response.',
        'Focus on needs, not blame.',
        'Requests, not demands.',
      ],
    };
  }

  _assessResolution(conflictType, partyAnalysis, recommendedStyle) {
    const parties = Object.entries(partyAnalysis);
    const willingnessToNegotiate = parties.reduce((s, [_, p]) => s + (p.willingnessToNegotiate || 0.5), 0) / parties.length;

    let probability, timeToResolve;

    if (willingnessToNegotiate > 0.7) {
      probability = 0.8;
      timeToResolve = 'days-weeks';
    } else if (willingnessToNegotiate > 0.4) {
      probability = 0.5;
      timeToResolve = 'weeks-months';
    } else {
      probability = 0.2;
      timeToResolve = 'months-years';
    }

    return {
      probability: +probability.toFixed(3),
      timeToResolve,
      recommendedApproach: recommendedStyle.nameZh,
      keyConditions: [
        'Both parties must feel heard before problem-solving',
        'Separate people from the problem',
        'Focus on interests, not positions',
        'Generate options for mutual gain',
      ],
    };
  }

  // ─── NVC 实践 ──────────────────────────────────────────────────────────

  practiceNVC(practice) {
    const { situation, observation, feeling, need, request, outcome } = practice || {};

    const entry = {
      situation: situation || '',
      observation,
      feeling,
      need,
      request,
      outcome: outcome || 'pending',
      timestamp: Date.now(),
    };

    this._nvcPractices.push(entry);
    this._stats.nvcPractices++;

    return {
      practice: entry,
      feedback: this._evaluateNVC(entry),
    };
  }

  _evaluateNVC(practice) {
    let score = 0;
    const feedback = [];

    // Check observation (no judgment language)
    if (practice.observation && !/always|never|wrong|bad|shouldn/.test(practice.observation)) {
      score += 0.25;
      feedback.push({ aspect: 'observation', positive: true, note: 'Good: observation without judgment.' });
    } else if (practice.observation) {
      feedback.push({ aspect: 'observation', positive: false, note: 'Remove judgment words (always, never, should).' });
    }

    // Check feeling (specific emotion)
    if (practice.feeling && /feel|感到|觉得/.test(practice.feeling)) {
      score += 0.25;
      feedback.push({ aspect: 'feeling', positive: true, note: 'Good: expressing feeling.' });
    }

    // Check need (underlying need identified)
    if (practice.need && /need|需要|want|want|desire/.test(practice.need)) {
      score += 0.25;
      feedback.push({ aspect: 'need', positive: true, note: 'Good: identified underlying need.' });
    }

    // Check request (specific and actionable)
    if (practice.request && /would you|could you|可以|能否/.test(practice.request)) {
      score += 0.25;
      feedback.push({ aspect: 'request', positive: true, note: 'Good: specific request, not a demand.' });
    }

    return { score, feedback, improvement: score < 0.7 ? 'Practice identifying needs and making requests.' : 'Excellent NVC practice.' };
  }

  // ─── 和解促进 ──────────────────────────────────────────────────────────

  facilitateReconciliation(conflictId) {
    const conflict = this._conflicts.find(c => c.timestamp === conflictId) || this._conflicts[this._conflicts.length - 1];
    if (!conflict) return null;

    const steps = [
      { phase: 'separate', nameZh: '分离', description: 'Create space. Cool down before engagement.', descriptionZh: '创造空间。在参与前冷静下来。' },
      { phase: 'listen', nameZh: '倾听', description: 'Each party speaks without interruption. Focus on understanding.', descriptionZh: '每一方在不被打断的情况下说话。专注于理解。' },
      { phase: 'validate', nameZh: '验证', description: 'Acknowledge each person\'s pain and perspective.', descriptionZh: '承认每个人的痛苦和视角。' },
      { phase: 'apologize', nameZh: '道歉', description: 'Where appropriate, offer genuine apology. No "but" allowed.', descriptionZh: '在适当的地方，提供真诚的道歉。不允许「但是」。' },
      { phase: 'forgive', nameZh: '宽恕', description: 'Release the grudge. Not for the other person — for yourself.', descriptionZh: '释放怨恨。不是为了对方——是为了自己。' },
      { phase: 'rebuild', nameZh: '重建', description: 'Establish new agreements. What will be different going forward?', descriptionZh: '建立新协议。未来会有什么不同？' },
    ];

    const result = {
      conflict: conflict.issue,
      type: conflict.type,
      reconciliationSteps: steps,
      estimatedTime: 'weeks-months',
    };

    const resolution = {
      conflictId: conflict.timestamp,
      style: 'reconciliation',
      result,
      timestamp: Date.now(),
    };

    this._resolutions.push(resolution);
    this._stats.resolvedConflicts++;

    return resolution;
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,
      totalConflictsAnalyzed: this._conflicts.length,
      resolutionRate: this._stats.totalConflicts > 0 ? +(this._stats.resolvedConflicts / this._stats.totalConflicts).toFixed(3) : 0,
      preferredStyle: Object.entries(this._stats.styleDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown',
      recentConflicts: this._conflicts.slice(-3).map(c => ({
        type: c.type,
        issue: (c.issue || '').slice(0, 40),
        recommendedStyle: c.recommendedStyle?.nameZh,
      })),
      nvcPractices: this._nvcPractices.slice(-3).map(p => ({
        situation: (p.situation || '').slice(0, 40),
        outcome: p.outcome,
      })),
    };
  }
}

module.exports = { ConflictResolution };
