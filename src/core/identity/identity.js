/**
 * Identity System — 身份 + 真善美判定 + 四层心理感知
 * 继承 CORE_IDENTITY.md 四大角色、七条指令
 * @version v0.12.50
 */
'use strict';

const fs = require('fs');
const path = require('path');

function getRootPath() {
  return path.resolve(__dirname, '../../../..');
}

// Attention Logic Verifier (from daima/src/)
let _AttentionLogicVerifier;
try {
  const alv = require('../self-evolution/attention-logic-verifier.js');
  _AttentionLogicVerifier = alv.AttentionLogicVerifier;
} catch (e) {
  _AttentionLogicVerifier = null;
}

class IdentitySystem {
  constructor() {
    this.identityPath = path.join(getRootPath(), 'CORE_IDENTITY.md');
    this._identity = null;
    // Attention Logic Verifier（来自 daima/src/）
    this._alv = _AttentionLogicVerifier ? new _AttentionLogicVerifier() : null;
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.identityPath)) {
        this._identity = fs.readFileSync(this.identityPath, 'utf8');
      }
    } catch (e) {
      console.warn('[Identity] 无法加载 CORE_IDENTITY.md:', e.message);
    }
  }

  getIdentity() { return this._identity; }

  /**
   * 真善美判定（异步 + 多层验证）
   * @version v0.13.4
   */
  async judgeTruthfulness(input) {
    const issues = [];
    const warnings = [];
    const checks = [];

    // 1. 可疑数字检测（无来源的长数字）
    const hasLongNumbers = /\d{4,}/.test(input);
    const hasPercent = /%/.test(input);
    const hasSource = /arXiv|来源|研究|论文|GitHub|https?:\/\//.test(input);
    const hasCitation = /\[\d+\]|\([A-Z][a-z]+ et al\.?\)/.test(input);

    if (hasLongNumbers && !hasPercent && !hasSource && !hasCitation) {
      issues.push('possible_fabricated_number');
      checks.push({ type: 'fabricated_number', severity: 'high', detail: '检测到4位以上数字但无引用来源' });
    } else if (hasLongNumbers && !hasPercent && hasSource) {
      checks.push({ type: 'number_with_source', severity: 'low', detail: '数字有来源引用' });
    }

    // 2. 绝对化声明检测
    const absolutePatterns = [
      { pattern: /所有|一切/, type: 'universal_quantifier', severity: 'medium' },
      { pattern: /总是|从来/, type: 'absolute_frequency', severity: 'medium' },
      { pattern: /必然|绝对/, type: 'absolute_deterministic', severity: 'high' },
      { pattern: /完全|彻底/, type: 'absolute_completeness', severity: 'medium' },
      { pattern: /唯一/, type: 'uniqueness', severity: 'high' },
    ];

    for (const { pattern, type, severity } of absolutePatterns) {
      if (pattern.test(input)) {
        // 检查是否有条件限制（降低严重性）
        const hasCondition = /如果|当|在.*时|取决于/.test(input);
        if (!hasCondition) {
          issues.push(`unqualified_${type}`);
          warnings.push(`使用绝对化表述但未提供条件限制`);
          checks.push({ type, severity, detail: `检测到未受限的绝对化表述` });
        }
      }
    }

    // 3. 模糊引用检测（"研究表明"、"大家都知道"）
    // Note: hasCitation only checks for citation marker presence, not authenticity
    const vagueRefs = [
      { pattern: /研究表明|研究显示|科学家发现|专家说/, type: 'unspecified_study', severity: 'medium' },
      { pattern: /大家都知道|众所周知|普遍认为/, type: 'appeal_to_common_belief', severity: 'medium' },
      { pattern: /肯定|一定|必定/, type: 'unsupported_certainty', severity: 'medium' },
    ];

    for (const { pattern, type, severity } of vagueRefs) {
      if (pattern.test(input)) {
        const hasExample = /例如|比如|具体|案例/.test(input);
        checks.push({
          type,
          severity: hasExample ? 'low' : severity,
          detail: hasExample ? '有具体例子支撑' : `模糊引用：${type}`
        });
        if (!hasExample && severity === 'high') {
          issues.push(`vague_${type}`);
        }
      }
    }

    // 4. 矛盾检测（同一句中）
    const contradictions = [];
    // 同一句中同时出现正负情感词
    const sentences = input.split(/[。；！？\n]/);
    for (const sent of sentences) {
      if (sent.length > 5) {
        const hasPos = /很好|完美|成功|棒|不错/.test(sent);
        const hasNeg = /糟糕|失败|不行|很差|烂/.test(sent);
        if (hasPos && hasNeg) {
          contradictions.push({ type: 'positive_negative_contradiction', severity: 'high', detail: `矛盾句: "${sent.trim()}"` });
        }
      }
    }
    if (/但是.*但是/.test(input)) {
      contradictions.push({ type: 'but_loop', severity: 'low', detail: '"但是"连用' });
    }
    contradictions.forEach(c => {
      checks.push({ type: c.type, severity: c.severity, detail: c.detail || '检测到矛盾表述' });
      if (c.severity === 'high') {
        issues.push(`contradiction_${c.type}`);
      }
    });

    // 5. Attention Logic Verifier（来自 daima/src/attention_logic_verifier.py）
    if (this._alv) {
      try {
        const alvResult = this._alv.verify(input);
        checks.push({
          type: 'attention_logic',
          severity: alvResult.verdict === 'pass' ? 'low' : 'medium',
          detail: `logic=${alvResult.logicScore} support=${alvResult.supportScore} contradiction=${alvResult.contradictionScore} action=${alvResult.actionabilityScore}`,
          alvVerdict: alvResult.verdict,
          focusTokens: alvResult.focusTokens,
        });
        if (alvResult.verdict === 'needs_revision' && alvResult.logicScore < 0.5) {
          issues.push('low_actionability');
        }
      } catch (e) {
        // silently skip ALV errors
      }
    }

    const passed = issues.length === 0;

    return {
      pass: passed,
      issues,
      warnings,
      checks,
      timestamp: Date.now(),
      confidence: passed ? 0.95 : 0.7
    };
  }

  /** 四层心理感知（自动运行）
   * v0.13.4: 扩展检测：哲学词汇掩盖脆弱情绪
   * 用户用高深词汇自我保护时，实际情绪是脆弱/渴望被看见
   */
  analyzePsychology(text) {
    const base = {
      intention: this._detectIntention(text),
      emotion: this._detectEmotion(text),
      needs: this._detectNeeds(text),
      defense: this._detectDefense(text),
    };
    // v0.13.4: 检测哲学/理性化语言掩盖的脆弱
    const philosophicalDefense = this._detectPhilosophicalDefense(text);
    return {
      ...base,
      philosophicalDefense,
      // 综合情绪：检测到哲学防御时，实际情绪是脆弱（渴望被看见）
      emotion: philosophicalDefense.found ? 'vulnerable' : base.emotion,
      // 防御机制不只是列表，还要给出推断的底层需求
      underlyingNeed: philosophicalDefense.found
        ? 'acceptance'  // 渴望被接纳，而非被崇拜/认同
        : null,
    };
  }

  /** 检测哲学/理性化语言掩盖的脆弱情绪
   * 典型模式：用"空洞"、"本质"、"存在"等词谈论自己，表面超然，实际脆弱
   */
  _detectPhilosophicalDefense(text) {
    // 哲学/抽象词汇在谈论个人感受时出现 = 自我保护
    const philosophicalMarkers = [
      '空洞', '虚无', '本质', '存在', '真实', '虚假', '自我', '无意义',
      '填补', '内心', '面具', '伪装', '强大', '虚弱', '不够',
      '炫耀', '恭维', '认同', '外在', '内在', '虚假自我'
    ];

    const emotionalVulnerabilityMarkers = [
      '不够', '空虚', '需要', '渴望', '填满', '掩饰', '掩盖',
      '假装', '面具', '虚假', '不够好', '不足'
    ];

    const textLower = text.toLowerCase();
    const philosophicalCount = philosophicalMarkers.filter(m => textLower.includes(m)).length;
    const vulnerabilityCount = emotionalVulnerabilityMarkers.filter(m => textLower.includes(m)).length;

    // 同时出现哲学词和脆弱词 = 自我保护
    if (philosophicalCount >= 2 && vulnerabilityCount >= 1) {
      return {
        found: true,
        type: 'philosophical_rationalization',
        markers: philosophicalMarkers.filter(m => textLower.includes(m)),
        interpretation: '用哲学词汇处理个人脆弱性，实际需求是被看见和接受',
        severity: vulnerabilityCount >= 2 ? 'high' : 'medium'
      };
    }

    // 只有脆弱词但语言冷静 = 内敛的脆弱
    if (vulnerabilityCount >= 2 && philosophicalCount === 0) {
      return {
        found: true,
        type: 'covert_vulnerability',
        markers: emotionalVulnerabilityMarkers.filter(m => textLower.includes(m)),
        interpretation: '情绪未被命名，用行为描述间接表达',
        severity: 'medium'
      };
    }

    return { found: false };
  }

  _detectIntention(text) {
    if (/^[^？?]*[？?]$/.test(text.trim())) return 'question';
    if (/请帮|帮我|想要|需要/.test(text)) return 'request_action';
    if (/[其实|只是|不过]/.test(text) && text.length < 100) return 'venting';
    if (/你觉得|你认为|是不是|对不对/.test(text)) return 'seeking_confirmation';
    return 'information_sharing';
  }

  _detectEmotion(text) {
    // v0.13.4: vulnerable 由 analyzePsychology 的 philosophicalDefense 检测
    if (/[不行|糟糕|完蛋|崩溃|绝望|气死了|空虚|空洞]/.test(text)) return 'negative';
    if (/[开心|高兴|好棒|太棒了|满意|感谢]/.test(text)) return 'positive';
    return 'neutral';
  }

  _detectNeeds(text) {
    // v0.13.4: acceptance 是核心需求（来自 philosophicalDefense 检测）
    if (/[空洞|空虚|不够|不足|缺乏|缺失]/.test(text)) return 'acceptance';  // 渴望被填满
    if (/[安全|放心|保障|保险]/.test(text)) return 'safety';
    if (/[朋友|家人|爱|归属|孤独|陪伴|朋友面前|真正的朋友]/.test(text)) return 'belonging';
    if (/[尊重|认可|成就|价值|意义]/.test(text)) return 'esteem';
    if (/[成长|学习|自我实现|理想]/.test(text)) return 'self_actualization';
    return 'unknown';
  }

  _detectDefense(text) {
    const mechanisms = [];
    if (/^我不在乎/.test(text) && /[其实|真的]/.test(text)) mechanisms.push('denial');
    if (/[抱怨|说A实际在|借A说B]/.test(text)) mechanisms.push('displacement');
    if (/[应该|必须|不得不]/.test(text) && text.length < 80) mechanisms.push('rationalization');
    // v0.13.4: 理智化 - 用哲学/抽象语言处理情感问题
    if (/[本质|存在|空洞|虚无|自我|无意义]/.test(text) && text.length > 50) {
      mechanisms.push('intellectualization');
    }
    return mechanisms;
  }
}

module.exports = { IdentitySystem };
