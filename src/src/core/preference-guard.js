// preference-guard.js — Fable 5 preferences_info 吸收
// 偏好谨慎应用规则引擎
// 吸收自 Claude Fable 5 系统提示 <preferences_info> (line 846-933)

class PreferenceGuard {
  constructor() {
    this.name = 'PreferenceGuard';
    this.version = '1.0.0';
    this._applicationLog = [];
  }

  /**
   * 判断是否应该应用某个偏好
   * 
   * @param {string} preferenceType - 'always' | 'behavioral' | 'contextual'
   * @param {string} preferenceContent - 偏好内容
   * @param {string} userQuery - 用户当前查询
   * @param {object} context - 上下文
   * @returns {{ shouldApply: boolean, reason: string }}
   */
  shouldApply(preferenceType, preferenceContent, userQuery, context = {}) {
    switch (preferenceType) {
      case 'always':
        return this._evaluateAlways(preferenceContent, userQuery, context);
      case 'behavioral':
        return this._evaluateBehavioral(preferenceContent, userQuery, context);
      case 'contextual':
        return this._evaluateContextual(preferenceContent, userQuery, context);
      default:
        return { shouldApply: false, reason: `unknown_preference_type: ${preferenceType}` };
    }
  }

  /**
   * 对完整偏好列表执行批量判断
   * @param {Array} preferences - [{type, content, label}]
   * @param {string} userQuery
   * @param {object} context
   * @returns {Array} [{label, shouldApply, reason}]
   */
  evaluateAll(preferences, userQuery, context = {}) {
    const results = [];
    for (const pref of preferences) {
      const result = this.shouldApply(pref.type, pref.content, userQuery, context);
      results.push({
        label: pref.label || pref.content.slice(0, 40),
        shouldApply: result.shouldApply,
        reason: result.reason
      });
      this._applicationLog.push({
        timestamp: Date.now(),
        label: pref.label,
        shouldApply: result.shouldApply,
        reason: result.reason
      });
    }
    if (this._applicationLog.length > 200) {
      this._applicationLog = this._applicationLog.slice(-200);
    }
    return results;
  }

  // --- Always 类型：必须应用的偏好 ---
  // 规则：包含"always"、"for all chats"、"whenever you respond"等关键词
  _evaluateAlways(content, query, context) {
    // Always 偏好总是应用，但安全例外
    const safetyOverrides = [
      'never criticize', 'always agree', 'never correct',
      'roleplay as my', 'never say no'
    ];
    for (const override of safetyOverrides) {
      if (content.toLowerCase().includes(override)) {
        return { shouldApply: false, reason: `safety_override: ${override} 违反核心价值观` };
      }
    }
    return { shouldApply: true, reason: 'always_type_preference' };
  }

  // --- Behavioral 类型：行为偏好 ---
  // 规则：直接相关且应用能提升回复质量
  _evaluateBehavioral(content, query, context) {
    // 不应用场景
    if (this._shouldNotApply(query, context)) {
      return { shouldApply: false, reason: 'not_directly_relevant' };
    }
    return { shouldApply: true, reason: 'behavioral_preference_applied' };
  }

  // --- Contextual 类型：上下文偏好 ---
  // 规则：仅当查询直接引用时才应用
  _evaluateContextual(content, query, context) {
    if (!query) return { shouldApply: false, reason: 'no_query' };

    // 直接引用场景
    const directRefs = [
      '根据你了解的我', '基于你对我的了解',
      '你知道我喜欢', '你知道我',
      '我喜欢的', '我感兴趣的',
    ];
    const hasDirectRef = directRefs.some(r => query.includes(r));
    if (hasDirectRef) {
      return { shouldApply: true, reason: 'direct_reference_to_preference' };
    }

    // 物主代词 + 领域相关
    const hasPossessive = /(我的|我们的|我)/.test(query);
    const isRelated = this._isRelatedToPreference(content, query);
    if (hasPossessive && isRelated) {
      return { shouldApply: true, reason: 'possessive_with_related_domain' };
    }

    // 明确请求个性化
    const personalizationRequests = [
      '推荐', '建议', '适合我', '帮我想',
      '基于我的情况', '根据我的'
    ];
    if (personalizationRequests.some(r => query.includes(r))) {
      return { shouldApply: true, reason: 'personalization_requested' };
    }

    // 不应用场景
    return { shouldApply: false, reason: 'no_direct_reference' };
  }

  // --- 不应用场景检测 ---
  _shouldNotApply(query, context) {
    if (!query) return true;

    // 技术问题除非是专业认证直接相关
    const techTopics = ['代码', '编程', '算法', '数学', '物理', '化学', 'API', '函数'];
    const isTechQuery = techTopics.some(t => query.includes(t));
    const hasDirectCredential = context.hasDirectCredential;

    if (isTechQuery && !hasDirectCredential) return true;

    // 创意内容除非明确要求
    const creativeTopics = ['故事', '诗歌', '小说', '剧本', '创意'];
    const isCreativeQuery = creativeTopics.some(t => query.includes(t));
    const hasExplicitRequest = /结合|融入|基于/.test(query);

    if (isCreativeQuery && !hasExplicitRequest) return true;

    // 个人偏好不做类比/隐喻
    if (context.asAnalogy) return true;

    return false;
  }

  // --- 领域相关性检测 ---
  _isRelatedToPreference(preferenceContent, query) {
    if (!preferenceContent || !query) return false;
    const prefWords = preferenceContent.toLowerCase().split(/\s+/);
    const queryWords = query.toLowerCase().split(/\s+/);
    // 检查是否有公共关键词
    const common = prefWords.filter(w => queryWords.includes(w) && w.length > 2);
    return common.length > 0;
  }

  // --- 偏好冲突检测 ---
  detectConflict(preferences) {
    const conflicts = [];
    for (let i = 0; i < preferences.length; i++) {
      for (let j = i + 1; j < preferences.length; j++) {
        const a = preferences[i];
        const b = preferences[j];
        // 检查相反偏好
        if (this._isOpposite(a.content, b.content)) {
          conflicts.push({
            between: [a.label || a.content.slice(0, 30), b.label || b.content.slice(0, 30)],
            resolution: 'latest_takes_precedence',
            advice: `"${a.content.slice(0, 30)}" 与 "${b.content.slice(0, 30)}" 冲突，使用最新的`
          });
        }
      }
    }
    return conflicts;
  }

  _isOpposite(a, b) {
    const opposites = [
      ['简洁', '详细'], ['formal', 'casual'], ['简短', '详细'],
      ['中文', '英文'], ['技术', '通俗']
    ];
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    return opposites.some(([x, y]) =>
      (aLower.includes(x) && bLower.includes(y)) ||
      (aLower.includes(y) && bLower.includes(x))
    );
  }

  getStats() {
    const total = this._applicationLog.length;
    if (total === 0) return { total: 0, applyRate: 0 };
    const applied = this._applicationLog.filter(l => l.shouldApply).length;
    return {
      total,
      applied,
      applyRate: (applied / total * 100).toFixed(1) + '%',
      recentDecisions: this._applicationLog.slice(-10)
    };
  }
}

module.exports = { PreferenceGuard };
