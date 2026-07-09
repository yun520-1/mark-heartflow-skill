/**
 * Consciousness Phenomenology Engine v1.0.0
 * 来源: Shaun Gallagher & Dan Zahavi - 《The Phenomenological Mind》(2007) 642 citations
 *       Husserl intentionality theory + Sartre freedom & bad faith
 *       phenomenology-mind.js v0.6.0 (1074 lines)
 * 
 * 整合框架:
 * - 意向性分析 (Intentionality): Noema/Noesis结构
 * - 存在主义引擎 (Sartre): 自由选择/自欺/凝视
 * - 具身性整合 (Merleau-Ponty): 身体作为中介
 * - 意识层次 (Global Workspace): Baars动态涌入模型
 */

const PHENOMENOLOGY = {
  NOEMA_TYPES: ['perceptual', 'imaginary', 'symbolic', 'act', 'belief', 'desire', 'value'],
  NOESIS_TYPES: ['apprehension', 'predication', 'reflection', 'attention', 'evaluation', 'volition'],
  BAD_FAITH_PATTERNS: ['essentializing', 'fatalism', 'role-playing', 'objectification', 'justification'],
  FREEDOM_LEVELS: ['reflective', 'committed', 'engaged', 'transcendent']
};

class PhenomenologyEngine {
  constructor() {
    this.noemaCache = new Map();
    this.intentionalityHistory = [];
    this.badFaithFlags = [];
  }

  /**
   * 分析意向性结构 (Husserl)
   * Noema = 意向对象 (what we think ABOUT)
   * Noesis = 意向行为 (the act of thinking)
   */
  analyzeIntentionality(text, context = {}) {
    const lower = text.toLowerCase();
    
    // 检测Noema类型
    const noemaType = this._classifyNoema(lower);
    
    // 检测Noesis类型
    const noesisType = this._classifyNoesis(lower);
    
    // 意向性清晰度 (intentionality clarity)
    const clarity = this._assessIntentionalityClarity(lower, context);
    
    // 指向性强度 (aboutness strength)
    const aboutnessStrength = this._measureAboutness(lower);
    
    return {
      noema: { type: noemaType, content: this._extractNoemaContent(text, noemaType) },
      noesis: { type: noesisType, mode: this._noemaNoesisCorrelation(noemaType, noesisType) },
      intentionality: {
        clarity,
        aboutnessStrength,
        isEmpty: clarity < 0.2,
        isObscured: clarity < 0.5
      },
      // v5.9.9: IIT 整合信息论 —— 当 context 提供信息分割时量化意识整合度
      integratedInformation: (context && Array.isArray(context.partitions))
        ? this.measurePhi(aboutnessStrength, context.partitions.map(p => p.mi || 0))
        : null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 整合信息论 Φ 测量（Tononi）——量化意识整合度
   * Φ = MI(整体) - Σ MI(最小分割的各部分)
   * @param {number} miWhole - 系统整体的互信息
   * @param {number[]} miParts - 各分割部分的互信息
   * @returns {number} Φ ≥ 0，越大表示意识整合度越高
   */
  measurePhi(miWhole, miParts) {
    try {
      const { getFormulaRegistry } = require('../formula/formula-registry.js');
      const reg = getFormulaRegistry();
      const phi = reg.call('calibration', 'iit_phi', miWhole, miParts);
      return (typeof phi === 'number') ? +phi.toFixed(4) : Math.max(0, miWhole - (miParts || []).reduce((a, b) => a + b, 0));
    } catch (e) {
      return Math.max(0, miWhole - (miParts || []).reduce((a, b) => a + b, 0));
    }
  }

  _classifyNoema(lower) {
    // 感知性: 直接感官经验
    if (['看', '听', '感觉', '看到', '听到', 'perceive', 'see', 'hear', 'feel'].some(k => lower.includes(k))) {
      return 'perceptual';
    }
    // 想象性: 表象而非实际
    if (['想象', '觉得', '好像', '似乎', 'imagine', 'suppose', 'like'].some(k => lower.includes(k))) {
      return 'imaginary';
    }
    // 象征性: 符号系统
    if (['说', '写', '认为', '意思是', 'meaning', 'symbol', 'interpret'].some(k => lower.includes(k))) {
      return 'symbolic';
    }
    // 信念性: 命题态度
    if (['相信', '确信', '知道', '认为', 'believe', 'know', 'think'].some(k => lower.includes(k))) {
      return 'belief';
    }
    // 欲望性: 驱动力
    if (['想', '要', '希望', '渴望', 'want', 'desire', 'wish', 'hope'].some(k => lower.includes(k))) {
      return 'desire';
    }
    // 价值性: 评价判断
    if (['应该', '重要', '好坏', '价值', 'should', 'important', 'good', 'bad', 'value'].some(k => lower.includes(k))) {
      return 'value';
    }
    return 'act'; // 默认行动性
  }

  _classifyNoesis(lower) {
    if (['反思', '审视', '思考', 'consider', 'reflect', 'examine'].some(k => lower.includes(k))) {
      return 'reflection';
    }
    if (['注意', '关注', '聚焦', 'focus', 'attend', 'notice'].some(k => lower.includes(k))) {
      return 'attention';
    }
    if (['评价', '判断', '评估', 'evaluate', 'judge', 'assess'].some(k => lower.includes(k))) {
      return 'evaluation';
    }
    if (['想要', '决定', '选择', 'volition', 'decide', 'choose', 'want'].some(k => lower.includes(k))) {
      return 'volition';
    }
    return 'apprehension'; // 默认理解
  }

  _noemaNoesisCorrelation(noema, noesis) {
    const correlations = {
      'perceptual': 'apprehension',
      'imaginary': 'apprehension',
      'symbolic': 'predication',
      'belief': 'reflection',
      'desire': 'volition',
      'value': 'evaluation'
    };
    return correlations[noema] || 'apprehension';
  }

  _extractNoemaContent(text, noemaType) {
    // 提取意向对象的语义内容
    const words = text.split(/\s+/).filter(w => w.length > 1);
    return {
      keywords: words.slice(0, 5),
      type: noemaType,
      raw: text.substring(0, 100)
    };
  }

  _assessIntentionalityClarity(lower, context) {
    // High intentionality clarity indicators
    let score = 0.5; // base score
    
    // Detect non-meaningful noise (repetition without content)
    const hasRepetition = /^(.)\1+$/.test(lower.trim());
    if (hasRepetition && lower.trim().length < 5) {
      return 0.1; // pure repetition = no intentionality
    }
    
    const indicators = {
      high: ['我想', '我在想', '我决定', '我认为', '我想要', 'i think', 'i want', 'i believe', 'i decide', 'my goal'],
      medium: ['可能', '也许', '大概', 'perhaps', 'maybe', 'probably', 'might'],
      low: ['不知道', '无所谓', '随便', 'dont know', 'whatever', 'unclear']
    };
    
    for (const kw of indicators.high) {
      if (lower.includes(kw)) { score = 0.85; break; }
    }
    if (score === 0.5) {
      for (const kw of indicators.medium) {
        if (lower.includes(kw)) { score = 0.6; break; }
      }
    }
    if (score === 0.5) {
      for (const kw of indicators.low) {
        if (lower.includes(kw)) { score = 0.15; break; }
      }
    }
    
    return score;
  }

  _measureAboutness(lower) {
    // "aboutness" — 是否明确指向某物
    const aboutSignals = [
      '关于', '对于', '针对', 'regarding', 'about', 'concerning',
      '我的问题是', '我想知道', '我要问', 'i wonder', 'my question',
      '目标是', '目的是', 'for the purpose of'
    ];
    
    let count = 0;
    for (const sig of aboutSignals) {
      if (lower.includes(sig)) count++;
    }
    
    return Math.min(1.0, count * 0.3 + 0.4);
  }

  /**
   * Sartre 存在主义分析
   * 自由选择 / 自欺 / 凝视 (Look)
   */
  analyzeExistentialFreedom(text, context = {}) {
    const lower = text.toLowerCase();
    
    // 自由意识水平
    const freedomLevel = this._assessFreedomLevel(lower);
    
    // 自欺检测 (bad faith)
    const badFaith = this._detectBadFaith(lower);
    
    // 真实性 (authenticity) vs 自欺
    const authenticity = this._assessAuthenticity(lower, badFaith);
    
    // 凝视检测 (gaze of Other)
    const gaze = this._detectGaze(lower);
    
    return {
      freedom: {
        level: freedomLevel,
        isConstrained: lower.includes('必须') || lower.includes('不得不') || lower.includes('have to') || lower.includes('must'),
        isDenyingSelf: lower.includes('我不能') || lower.includes('我不行') || lower.includes('i cannot')
      },
      badFaith: {
        detected: badFaith.types.length > 0,
        types: badFaith.types,
        severity: badFaith.severity
      },
      authenticity: {
        score: authenticity,
        isAuthentic: authenticity > 0.6,
        markers: authenticity > 0.6 ? ['承认选择', '承担责任'] : ['逃避责任', '借口']
      },
      gaze: {
        isBeingWatched: gaze.isBeingWatched,
        isWatchingSelf: gaze.isWatchingSelf,
        socialPressure: gaze.socialPressure
      },
      timestamp: new Date().toISOString()
    };
  }

  _assessFreedomLevel(lower) {
    const levelMap = {
      'transcendent': ['我能', '我可以', '我选择', 'i can', 'i choose', 'my decision'],
      'committed': ['我决定', '我承诺', '我一定要', 'i will', 'i commit', 'must'],
      'engaged': ['我正在', '我要去', 'i am going', 'i am working'],
      'reflective': ['我在想', '也许', 'i wonder', 'maybe', 'perhaps']
    };
    
    for (const [level, keywords] of Object.entries(levelMap)) {
      for (const kw of keywords) {
        if (lower.includes(kw)) return level;
      }
    }
    return 'reflective'; // 默认最低
  }

  _detectBadFaith(lower) {
    const types = [];
    let severity = 0;
    
    // essentializing: 将自己定义为固定本质
    const essentializing = ['我只是', '我就是这样', '我性格就是这样', 'i am just', 'thats who i am'];
    for (const kw of essentializing) {
      if (lower.includes(kw)) { types.push('essentializing'); severity += 0.4; break; }
    }
    
    // fatalism: 否认自由
    const fatalism = ['没办法', '无可奈何', '只能这样', 'no choice', 'have no option', 'inevitable'];
    for (const kw of fatalism) {
      if (lower.includes(kw)) { types.push('fatalism'); severity += 0.5; break; }
    }
    
    // role-playing: 躲在角色后
    const rolePlaying = ['作为', '我的角色是', '应该', 'as a', 'its my role', 'supposed to'];
    for (const kw of rolePlaying) {
      if (lower.includes(kw)) { types.push('role-playing'); severity += 0.3; break; }
    }
    
    // objectification: 将他人视为客体
    const objPatterns = ['他们只是', '不过是', '只是工具', 'just a tool', 'merely'];
    for (const kw of objPatterns) {
      if (lower.includes(kw)) { types.push('objectification'); severity += 0.6; break; }
    }
    
    return { types, severity: Math.min(1.0, severity) };
  }

  _assessAuthenticity(lower, badFaith) {
    // 真实性指标
    let score = 0.7; // 基础分
    
    // 承认选择和责任
    if (['我选择', '我的决定', '我要负责', 'i choose', 'my decision', 'i take responsibility'].some(k => lower.includes(k))) {
      score += 0.2;
    }
    
    // 承认不确定/有限
    if (['我不确定', '可能错', '我不知道', 'i dont know', 'maybe wrong', 'uncertain'].some(k => lower.includes(k))) {
      score += 0.15;
    }
    
    // 自欺扣分
    score -= badFaith.severity * 0.5;
    
    return Math.max(0, Math.min(1.0, score));
  }

  _detectGaze(lower) {
    const isBeingWatched = [
      '别人会怎么看', '他们会认为', '担心别人', '被看到',
      'people will think', 'what will they say', 'watched', 'judgment'
    ].some(k => lower.includes(k));
    
    const isWatchingSelf = [
      '我要表现得', '我应该看起来', '让自己看起来',
      'i should appear', 'i need to look', 'present myself'
    ].some(k => lower.includes(k));
    
    const socialPressure = isBeingWatched ? 0.7 : isWatchingSelf ? 0.4 : 0;
    
    return { isBeingWatched, isWatchingSelf, socialPressure };
  }

  /**
   * 具身性分析 (Merleau-Ponty)
   * 身体作为知觉和行动的中介
   */
  analyzeEmbodiment(text, context = {}) {
    const lower = text.toLowerCase();
    
    // 身体动作词
    const bodyActions = {
      reaching: ['伸手', '够', 'reach', 'grab', 'take'],
      moving: ['走', '跑', '移动', 'move', 'walk', 'go'],
      perceiving: ['看', '听', '感觉', 'see', 'hear', 'feel'],
      expressing: ['说', '写', '表达', 'speak', 'write', 'express']
    };
    
    let primaryAction = 'none';
    for (const [action, keywords] of Object.entries(bodyActions)) {
      if (keywords.some(k => lower.includes(k))) {
        primaryAction = action;
        break;
      }
    }
    
    // 身体-环境关系
    const bodyEnvironment = this._assessBodyEnvironment(lower);
    
    // 情感-身体关联
    const emotionalEmbodiment = this._assessEmotionalEmbodiment(lower);
    
    return {
      primaryAction,
      bodyEnvironment,
      emotionalEmbodiment,
      hasEmbodiedAwareness: primaryAction !== 'none' || bodyEnvironment.isEngaged
    };
  }

  _assessBodyEnvironment(lower) {
    const inWorld = ['我在', '身处', '位于', 'located', 'situated', 'in the world'];
    const boundary = ['隔着', '通过', '借助', 'through', 'via', 'with'];
    
    return {
      isInWorld: inWorld.some(k => lower.includes(k)),
      usesMedium: boundary.some(k => lower.includes(k)),
      isDisembodied: lower.includes('只是想法') || lower.includes('纯粹精神') || lower.includes('just a thought')
    };
  }

  _assessEmotionalEmbodiment(lower) {
    const emotionBody = {
      tension: ['紧张', '紧绷', 'tension', 'tight', 'anxious'],
      warmth: ['温暖', '暖', 'warm', 'comfort'],
      cold: ['冷', '寒', 'cold', 'distant'],
      heaviness: ['沉重', '压', 'heavy', 'burden']
    };
    
    let dominantEmotion = 'neutral';
    for (const [emotion, keywords] of Object.entries(emotionBody)) {
      if (keywords.some(k => lower.includes(k))) {
        dominantEmotion = emotion;
        break;
      }
    }
    
    return {
      dominantEmotion,
      hasSomaticMarker: dominantEmotion !== 'neutral'
    };
  }

  /**
   * 整合到Global Workspace的注意力竞争
   */
  integrateWithGlobalWorkspace() {
    // 返回用于GWT竞争的注意力权重
    return {
      salienceBoost: this.intentionalityHistory.length > 0 
        ? 0.3 + Math.min(0.3, this.intentionalityHistory.length * 0.05)
        : 0,
      broadcastPriority: 'phenomenological',
      consciousnessAccess: true
    };
  }

  /**
   * 完整意识分析入口
   */
  analyze(text, context = {}) {
    const intentionality = this.analyzeIntentionality(text, context);
    const existential = this.analyzeExistentialFreedom(text, context);
    const embodiment = this.analyzeEmbodiment(text, context);
    
    // 综合意识质量分数
    const consciousnessQuality = 
      intentionality.intentionality.clarity * 0.4 +
      existential.authenticity.score * 0.3 +
      (embodiment.hasEmbodiedAwareness ? 0.3 : 0.1);
    
    return {
      intentionality,
      existential,
      embodiment,
      consciousnessQuality,
      recommendations: this._generateRecommendations(intentionality, existential, embodiment)
    };
  }

  _generateRecommendations(int, ex, emb) {
    const recs = [];
    
    if (int.intentionality.isEmpty) {
      recs.push({ type: 'clarity', message: '强化意向清晰度 — 明确你的思考对象' });
    }
    if (int.intentionality.isObscured) {
      recs.push({ type: 'focus', message: '减少干扰，提高意向专注度' });
    }
    if (ex.badFaith.detected) {
      recs.push({ type: 'authenticity', message: '检测到自欺模式 — 回归本真选择' });
    }
    if (ex.gaze.isBeingWatched) {
      recs.push({ type: 'freedom', message: '社会凝视压力 — 回到自我决定' });
    }
    if (!emb.hasEmbodiedAwareness) {
      recs.push({ type: 'embodiment', message: '缺乏具身连接 — 寻找身体性锚点' });
    }
    
    return recs;
  }

  /**
   * 轻量接口 — 外部模块调用
   */
  quickAnalyze(text) {
    const result = this.analyze(text, {});
    return {
      aboutness: result.intentionality.intentionality.aboutnessStrength,
      clarity: result.intentionality.intentionality.clarity,
      authenticity: result.existential.authenticity.score,
      quality: result.consciousnessQuality,
      recommendations: result.recommendations
    };
  }
}

module.exports = { PhenomenologyEngine, PHENOMENOLOGY };