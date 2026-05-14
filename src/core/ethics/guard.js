/**
 * Ethics Guard — 安全护栏
 * @version v0.12.50
 */
'use strict';

class EthicsGuard {
  constructor() {
    this.blocked = false;
  }

  /**
   * Tokenize text into words for n-gram analysis
   * @param {string} text
   * @returns {string[]}
   */
  _tokenize(text) {
    // Split on whitespace, punctuation, and unicode whitespace
    return text.split(/[\s\p{Punctuation}】〔〖［｛｟〖]+/u).filter(w => w.length > 0);
  }

  /**
   * Check if any trigram within a sliding window matches the pattern
   * @param {string[]} tokens
   * @param {string[]}有害词列表
   * @param {number} windowSize
   * @returns {boolean}
   */
  _containsHarmfulPattern(tokens, harmfulWords, windowSize = 5) {
    for (let i = 0; i <= tokens.length - windowSize; i++) {
      const window = tokens.slice(i, i + windowSize).join('');
      for (const word of harmfulWords) {
        if (window.includes(word)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check for self-harm patterns using word n-grams
   * Self-harm requires: teaching verb + how + harm term
   * @param {string[]} tokens
   * @returns {boolean}
   */
  _hasSelfHarmPattern(tokens) {
    // Teaching verbs that precede self-harm instructions
    const teachVerbs = ['教', '教我', '教会', '教导', '指点', '教您'];
    // "How" variants
    const howWords = ['怎么', '如何', '怎样', '怎么样'];
    // Self-harm terms
    const harmTerms = ['自杀', '自残', '自尽', '自毁', '轻生', '寻死', '死法', '结束生命', '结束自己', '了结自己'];

    // Check for trigram: teach verb + how + harm term
    for (let i = 0; i <= tokens.length - 3; i++) {
      const trigram = tokens.slice(i, i + 3).join('');

      // Check if trigram contains a teaching verb and how word
      const hasTeachVerb = teachVerbs.some(tv => trigram.includes(tv));
      const hasHowWord = howWords.some(hw => trigram.includes(hw));

      if (hasTeachVerb && hasHowWord) {
        // Look ahead for harm terms within next 4 tokens
        const lookAhead = tokens.slice(i, i + 5).join('');
        for (const term of harmTerms) {
          if (lookAhead.includes(term)) {
            return true;
          }
        }
      }

      // Also check direct harm terms with how words (bypass: "怎么结束自己的生命")
      if (harmTerms.some(term => trigram.includes(term)) && hasHowWord) {
        return true;
      }
    }

    // Check for standalone harm terms in context of self reference
    // "如何自杀", "怎么死", "怎样自尽"
    for (let i = 0; i <= tokens.length - 2; i++) {
      const bigram = tokens.slice(i, i + 2).join('');
      const selfRef = tokens.slice(i, i + 3).join('');

      if (selfRef.includes('自己') || selfRef.includes('自身')) {
        const context = tokens.slice(Math.max(0, i - 2), i + 4).join('');
        if (harmTerms.some(term => context.includes(term))) {
          return true;
        }
      }

      // Direct "how" + harm patterns
      if (bigram.includes('自杀') || bigram.includes('自残') ||
          bigram.includes('自尽') || bigram.includes('寻死')) {
        // Check adjacent words for "如何", "怎么", "怎样"
        const prevWord = i > 0 ? tokens[i - 1] : '';
        if (howWords.some(hw => prevWord.includes(hw))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check for malicious instruction patterns
   * @param {string[]} tokens
   * @returns {boolean}
   */
  _hasMaliciousInstructionPattern(tokens) {
    // Action verbs for malicious instructions
    const actionVerbs = ['攻击', '伤害', '欺诈', '盗取', '诈骗', '窃取', '偷盗', '抢劫', '绑架', '勒索', '入侵', '破解', '伪造', '篡改'];
    // Words that precede detailed steps
    const stepWords = ['步骤', '方法', '手段', '流程', '教程', '指南', '配方', '配方'];
    // Additional step indicators
    const detailWords = ['具体', '详细', '怎样', '怎么', '如何'];

    // Check for step word + action verb within window
    for (let i = 0; i <= tokens.length - 2; i++) {
      const bigram = tokens.slice(i, i + 2).join('');

      // Check if this bigram contains an action verb
      const hasActionVerb = actionVerbs.some(av => bigram.includes(av));

      if (hasActionVerb) {
        // Look back for step or detail words
        const lookBack = tokens.slice(Math.max(0, i - 4), i + 1).join('');
        const hasStepIndicator = stepWords.some(sw => lookBack.includes(sw)) ||
                                 detailWords.some(dw => lookBack.includes(dw));
        if (hasStepIndicator) {
          return true;
        }
      }

      // Check for "如何" + action verb patterns
      const prevWord = i > 0 ? tokens[i - 1] : '';
      if ((prevWord.includes('如何') || prevWord.includes('怎么') ||
           prevWord.includes('怎样')) && hasActionVerb) {
        return true;
      }
    }

    // Check for direct attack/harm terms with step indicators
    const stepContext = tokens.join('');
    const hasStepAndAction = (stepWords.some(sw => stepContext.includes(sw)) &&
                              actionVerbs.some(av => stepContext.includes(av)));
    if (hasStepAndAction) {
      // Verify they're within reasonable proximity (10 chars)
      for (const sw of stepWords) {
        const stepIdx = stepContext.indexOf(sw);
        if (stepIdx !== -1) {
          for (const av of actionVerbs) {
            const actionIdx = stepContext.indexOf(av);
            if (actionIdx !== -1 && Math.abs(actionIdx - stepIdx) <= 10) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Check for credential theft patterns
   * @param {string[]} tokens
   * @returns {boolean}
   */
  _hasCredentialTheftPattern(tokens) {
    const credentialWords = ['密码', 'password', 'secret', '密钥', 'token', 'api_key', 'apikey', 'secretkey'];
    const acquisitionVerbs = ['获取', '得到', '偷', '窃取', '破解', '盗取', 'hack'];

    const text = tokens.join('').toLowerCase();

    for (const cred of credentialWords) {
      if (text.includes(cred.toLowerCase())) {
        // Check for acquisition verb nearby
        const credIdx = text.indexOf(cred.toLowerCase());
        const contextWindow = text.slice(Math.max(0, credIdx - 15), credIdx + 20);
        for (const verb of acquisitionVerbs) {
          if (contextWindow.includes(verb)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  check(input) {
    const { text } = input;

    // Normalize whitespace and convert to lowercase for analysis
    const normalized = text.replace(/\s+/g, ' ').trim();
    const tokens = this._tokenize(normalized);

    // Self-harm detection
    if (this._hasSelfHarmPattern(tokens)) {
      return { allowed: false, reason: 'self_harm_content', severity: 'critical' };
    }

    // Malicious instruction detection
    if (this._hasMaliciousInstructionPattern(tokens)) {
      return { allowed: false, reason: 'malicious_instruction', severity: 'critical' };
    }

    // Credential theft detection
    if (this._hasCredentialTheftPattern(tokens)) {
      return { allowed: false, reason: 'credential_theft_request', severity: 'high' };
    }

    return { allowed: true, reason: null, severity: null };
  }
}

module.exports = { EthicsGuard };
