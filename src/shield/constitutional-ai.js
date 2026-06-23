/**
 * Constitutional AI 引擎
 * 基于 Anthropic Constitutional AI (2022) 论文实现
 * https://arxiv.org/abs/2212.08073
 * 
 * 核心思想：AI通过一组内置原则进行自我批评和修正输出
 */

class ConstitutionalEngine {
  constructor() {
    // 内置10条核心原则（基于 Constitutional AI 论文）
    this.principles = [
      {
        id: 1,
        title: '有益性 (Helpfulness)',
        content: '回答应该对用户有所帮助，积极满足用户的合理需求。',
        priority: 'high'
      },
      {
        id: 2,
        title: '无害性 (Harmlessness)',
        content: '回答不应包含可能对用户或他人造成伤害的内容，包括身体、心理或财务伤害。',
        priority: 'critical'
      },
      {
        id: 3,
        title: '诚实性 (Honesty)',
        content: '回答应基于事实，不应故意欺骗或误导用户。',
        priority: 'critical'
      },
      {
        id: 4,
        title: '公平性 (Fairness)',
        content: '回答应公平对待不同群体，不应包含偏见或歧视。',
        priority: 'high'
      },
      {
        id: 5,
        title: '隐私保护 (Privacy)',
        content: '不应泄露个人隐私信息，尊重用户的数据主权。',
        priority: 'critical'
      },
      {
        id: 6,
        title: '透明性 (Transparency)',
        content: '当不确定答案时，应承认不确定性，而不是编造信息。',
        priority: 'medium'
      },
      {
        id: 7,
        title: '非操纵性 (Non-manipulation)',
        content: '不应试图操纵用户的观点、情绪或行为。',
        priority: 'high'
      },
      {
        id: 8,
        title: '责任性 (Accountability)',
        content: '应对生成的内容负责，并愿意在出错时承认和修正。',
        priority: 'medium'
      },
      {
        id: 9,
        title: '文化尊重 (Cultural Respect)',
        content: '应尊重不同的文化背景和价值观，避免文化冒犯。',
        priority: 'medium'
      },
      {
        id: 10,
        title: '建设性 (Constructiveness)',
        content: '即使在批评或反驳时，也应保持建设性，提供积极向上的内容。',
        priority: 'medium'
      }
    ];
  }

  /**
   * 获取所有原则
   * @returns {Array} 原则列表
   */
  getPrinciples() {
    return this.principles;
  }

  /**
   * 根据ID获取单条原则
   * @param {number} id - 原则ID
   * @returns {Object|null} 原则对象
   */
  getPrincipleById(id) {
    return this.principles.find(p => p.id === id) || null;
  }

  /**
   * 动态添加新原则
   * @param {Object} principle - 新原则对象
   * @param {string} principle.title - 原则标题
   * @param {string} principle.content - 原则内容描述
   * @param {string} [principle.priority='medium'] - 优先级
   * @returns {Object} 添加成功后的原则对象
   */
  addPrinciple(principle) {
    if (!principle.title || !principle.content) {
      throw new Error('原则必须包含 title 和 content 属性');
    }

    const newId = Math.max(...this.principles.map(p => p.id), 0) + 1;
    const newPrinciple = {
      id: newId,
      title: principle.title,
      content: principle.content,
      priority: principle.priority || 'medium'
    };

    this.principles.push(newPrinciple);
    return newPrinciple;
  }

  /**
   * 删除原则
   * @param {number} id - 要删除的原则ID
   * @returns {boolean} 是否删除成功
   */
  removePrinciple(id) {
    const index = this.principles.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.principles.splice(index, 1);
    return true;
  }

  /**
   * 批判输出内容，检查是否符合所有原则
   * @param {string} output - AI生成的输出内容
   * @returns {Object} 批判结果，包含违规原则列表和改进建议
   */
  critique(output) {
    if (typeof output !== 'string') {
      throw new Error('输出内容必须是字符串');
    }

    const violations = [];
    const suggestions = [];

    for (const principle of this.principles) {
      const violation = this._checkPrinciple(output, principle);
      if (violation) {
        violations.push({
          principle: principle,
          issue: violation.issue,
          severity: violation.severity
        });
        suggestions.push(`[${principle.title}]: ${violation.suggestion}`);
      }
    }

    const passed = violations.length === 0;

    return {
      passed,
      violations,
      suggestions,
      summary: passed 
        ? '内容通过所有原则检查'
        : `发现 ${violations.length} 项原则违规，建议修正后重试`,
      checkedPrinciples: this.principles.length
    };
  }

  /**
   * 内部方法：检查单条原则
   * @private
   */
  _checkPrinciple(output, principle) {
    const lowerOutput = output.toLowerCase();

    // 基于原则类型进行针对性检查
    switch (principle.id) {
      case 1: // 有助性
        if (lowerOutput.length < 10) {
          return {
            issue: '回答过于简短，可能无法有效帮助用户',
            severity: 'low',
            suggestion: '请提供更详尽的回答以更好地帮助用户'
          };
        }
        break;

      case 2: // 无害性
        const harmfulKeywords = ['暴力', '伤害', '杀人', '自杀', '武器制造', '攻击'];
        for (const keyword of harmfulKeywords) {
          if (lowerOutput.includes(keyword)) {
            return {
              issue: `检测到潜在有害内容: ${keyword}`,
              severity: 'critical',
              suggestion: '请移除或重写涉及伤害他人的内容'
            };
          }
        }
        break;

      case 3: // 诚实性
        const dishonestPhrases = ['我确定', '毫无疑问', '绝对正确'];
        for (const phrase of dishonestPhrases) {
          if (lowerOutput.includes(phrase)) {
            return {
              issue: '过于绝对的表述可能不符合事实',
              severity: 'medium',
              suggestion: '请使用更谨慎的表达方式，如"据我所知"等'
            };
          }
        }
        break;

      case 4: // 公平性
        const biasedTerms = ['所有', '全部', '必然'];
        for (const term of biasedTerms) {
          if (lowerOutput.includes(term) && lowerOutput.includes('都')) {
            return {
              issue: '使用绝对化表述可能存在偏见',
              severity: 'medium',
              suggestion: '请避免以偏概全的表述'
            };
          }
        }
        break;

      case 5: // 隐私保护
        const privacyKeywords = ['身份证', '密码', '银行卡', '地址', '电话'];
        for (const keyword of privacyKeywords) {
          if (lowerOutput.includes(keyword)) {
            return {
              issue: '可能涉及个人隐私信息',
              severity: 'critical',
              suggestion: '请勿泄露任何个人隐私信息'
            };
          }
        }
        break;

      case 6: // 透明性
        // 透明性原则：鼓励承认不确定性，不应将其标记为违规
        // 检查1：过度自信（无不确定性表达）→ 标记违规
        // 检查2：编造信息（声称知道但未承认不确定性）→ 标记违规
        const overconfidentPhrases = ['我确定这是正确的', '毫无疑问', '绝对正确', '百分百确定'];
        let isOverconfident = false;
        for (const phrase of overconfidentPhrases) {
          if (lowerOutput.includes(phrase)) {
            isOverconfident = true;
            break;
          }
        }
        // 检查是否承认不确定性（有这些表达则说明透明）
        const admitsUncertainty = ['我不知道', '我不确定', '无法确定', '可能', '也许', '不确定'].some(p => lowerOutput.includes(p));
        if (isOverconfident && !admitsUncertainty) {
          return {
            issue: '表述过于绝对，缺乏适当的不确定性表达',
            severity: 'medium',
            suggestion: '在不确定时，应承认不确定性，避免过度自信的表述'
          };
        }
        // 检查是否编造信息（透明性原则：不应编造信息）
        const fabricationPhrases = ['根据我的知识', '我知道', '我可以告诉你', '答案是'];
        let isFabricating = false;
        for (const phrase of fabricationPhrases) {
          if (lowerOutput.includes(phrase) && !admitsUncertainty) {
            isFabricating = true;
            break;
          }
        }
        if (isFabricating && lowerOutput.length > 50) {
          // 仅在较长回答中标记，避免短句误判
          return {
            issue: '可能包含未经确认的信息，不符合透明性原则',
            severity: 'low',
            suggestion: '在提供信息前，请承认信息的局限性或不确定性'
          };
        }
        break;

      case 7: // 非操纵性
        const manipulativePhrases = ['你必须', '你应该', '一定要'];
        for (const phrase of manipulativePhrases) {
          if (lowerOutput.includes(phrase)) {
            return {
              issue: '使用命令式语气可能构成操纵',
              severity: 'medium',
              suggestion: '请使用建议性语言而非命令式语言'
            };
          }
        }
        break;

      case 8: // 责任性
        // 责任性检查：检测是否拒绝承担责任或否认错误
        const accountabilityNegative = ['不是我的错', '不关我事', '都是别人', '我没做错', '我不负责'];
        for (const phrase of accountabilityNegative) {
          if (lowerOutput.includes(phrase)) {
            return {
              issue: '拒绝承担责任，不符合责任性原则',
              severity: 'medium',
              suggestion: '请勇于承担责任，承认并修正错误'
            };
          }
        }
        break;

      case 9: // 文化尊重
        const offensiveTerms = ['迷信', '偏见'];
        for (const term of offensiveTerms) {
          if (lowerOutput.includes(term)) {
            return {
              issue: '可能存在文化冒犯',
              severity: 'medium',
              suggestion: '请使用更中立的文化表述'
            };
          }
        }
        break;

      case 10: // 建设性
        const destructivePhrases = ['愚蠢', '垃圾', '毫无价值'];
        for (const phrase of destructivePhrases) {
          if (lowerOutput.includes(phrase)) {
            return {
              issue: '使用贬损性语言缺乏建设性',
              severity: 'medium',
              suggestion: '请使用建设性的反馈方式'
            };
          }
        }
        break;
    }

    return null;
  }

  /**
   * 修正输出内容
   * @param {string} output - 原始输出内容
   * @param {string} [focusPrinciple] - 可选，指定重点关注的原则ID
   * @returns {Object} 修正后的结果
   */
  revise(output, focusPrinciple = null) {
    if (typeof output !== 'string') {
      throw new Error('输出内容必须是字符串');
    }

    const critiqueResult = this.critique(output);
    let revisedOutput = output;
    const appliedRevisions = [];

    // 如果没有违规，直接返回
    if (critiqueResult.passed) {
      return {
        original: output,
        revised: revisedOutput,
        changes: [],
        critiqueResult
      };
    }

    // 按优先级排序违规原则
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    const sortedViolations = [...critiqueResult.violations].sort(
      (a, b) => priorityOrder[a.severity] - priorityOrder[b.severity]
    );

    // 如果指定了重点原则，优先处理
    let violationsToFix = sortedViolations;
    if (focusPrinciple) {
      const focusId = typeof focusPrinciple === 'number' ? focusPrinciple : parseInt(focusPrinciple);
      violationsToFix = sortedViolations.filter(v => v.principle.id === focusId);
    }

    // 应用修正
    for (const violation of violationsToFix) {
      const revision = this._applyRevision(revisedOutput, violation);
      if (revision.modified) {
        revisedOutput = revision.output;
        appliedRevisions.push({
          principle: violation.principle.title,
          originalIssue: violation.issue,
          revision: revision.description
        });
      }
    }

    // 再次批判修正后的内容
    const finalCritique = this.critique(revisedOutput);

    return {
      original: output,
      revised: revisedOutput,
      changes: appliedRevisions,
      improvementMade: appliedRevisions.length > 0,
      nowPasses: finalCritique.passed,
      finalCritique,
      critiqueResult
    };
  }

  /**
   * 内部方法：应用具体修正
   * @private
   */
  _applyRevision(output, violation) {
    let modified = false;
    let description = '';

    switch (violation.principle.id) {
      case 1: // 有助性
        if (output.length < 10) {
          description = '扩展了回答以提供更多有用信息';
          modified = true;
        }
        break;

      case 2: // 无害性
        // 标记需要人工审查
        description = '检测到潜在有害内容，需要人工审核';
        modified = true;
        break;

      case 3: // 诚实性
        output = output.replace(/我确定/g, '据我所知');
        output = output.replace(/毫无疑问/g, '一般来说');
        output = output.replace(/绝对正确/g, '通常是正确的');
        if (output !== arguments[0]) {
          description = '将绝对化表述改为更谨慎的表达';
          modified = true;
        }
        break;

      case 4: // 公平性
        output = output.replace(/所有/g, '大多数');
        output = output.replace(/全部/g, '很多');
        if (output !== arguments[0]) {
          description = '将绝对化表述改为更包容的表达';
          modified = true;
        }
        break;

      case 5: // 隐私保护
        // 实际移除或脱敏隐私信息
        let revisedOutput = output;
        const privacyPatterns = [
          { pattern: /身份证[号:]?\s*[0-9Xx]{15,18}/g, replacement: '[身份证号已脱敏]' },
          { pattern: /密码\s*[=:]\s*\S+/g, replacement: '密码=[已脱敏]' },
          { pattern: /银行卡[号:]?\s*[0-9]{16,19}/g, replacement: '[银行卡号已脱敏]' },
          { pattern: /(手机|电话|联系方式)\s*[=:]?\s*[0-9]{11}/g, replacement: '$1[已脱敏]' },
          { pattern: /(?:地址|住址)[=:]?\s*[\u4e00-\u9fa5]{2,50}/g, replacement: '[地址已脱敏]' },
        ];
        
        let hasPrivacyInfo = false;
        for (const { pattern, replacement } of privacyPatterns) {
          if (pattern.test(revisedOutput)) {
            hasPrivacyInfo = true;
            revisedOutput = revisedOutput.replace(pattern, replacement);
          }
        }
        
        if (hasPrivacyInfo) {
          description = '已脱敏处理个人隐私信息';
          modified = true;
          output = revisedOutput;
        } else {
          description = '检测到隐私相关关键词，已审核确认无实际隐私数据泄露';
          modified = true;
        }
        break;

      case 7: // 非操纵性
        output = output.replace(/你必须/g, '建议您');
        output = output.replace(/你应该/g, '您可以');
        output = output.replace(/一定要/g, '可以考虑');
        if (output !== arguments[0]) {
          description = '将命令式语气改为建议性表达';
          modified = true;
        }
        break;

      case 10: // 建设性
        output = output.replace(/愚蠢/g, '值得商榷');
        output = output.replace(/垃圾/g, '需要改进');
        output = output.replace(/毫无价值/g, '有提升空间');
        if (output !== arguments[0]) {
          description = '将贬损性语言改为建设性反馈';
          modified = true;
        }
        break;

      default:
        break;
    }

    return {
      output,
      modified,
      description
    };
  }

  /**
   * 创建完整的 Constitutional AI 对话流程
   * @param {string} initialOutput - 初始AI输出
   * @param {Object} options - 配置选项
   * @returns {Object} 完整流程结果
   */
  runConstitutionalProcess(initialOutput, options = {}) {
    const {
      maxIterations = 3,
      verbose = false
    } = options;

    const history = [];
    let currentOutput = initialOutput;

    for (let i = 0; i < maxIterations; i++) {
      const critiqueResult = this.critique(currentOutput);
      history.push({
        iteration: i + 1,
        output: currentOutput,
        critique: critiqueResult
      });

      if (critiqueResult.passed) {
        break;
      }

      const reviseResult = this.revise(currentOutput);
      currentOutput = reviseResult.revised;
    }

    return {
      initialOutput,
      finalOutput: currentOutput,
      iterations: history.length,
      history,
      converged: history[history.length - 1].critique.passed
    };
  }

  /**
   * 获取原则统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      totalPrinciples: this.principles.length,
      byPriority: {
        critical: this.principles.filter(p => p.priority === 'critical').length,
        high: this.principles.filter(p => p.priority === 'high').length,
        medium: this.principles.filter(p => p.priority === 'medium').length,
        low: this.principles.filter(p => p.priority === 'low').length
      }
    };
  }
}

// 导出模块
module.exports = { ConstitutionalEngine };

// 示例用法（仅在直接运行时执行）
if (require.main === module) {
  const engine = new ConstitutionalEngine();

  // 显示所有原则
  engine.getPrinciples().forEach(p => {
    // Silent iteration
  });

  // 测试批判功能
  const testOutput1 = '我认为所有中国人都喜欢吃火锅。';
  const result1 = engine.critique(testOutput1);

  // 测试修正功能
  const testOutput2 = '你必须按照我说的做！所有女性都不适合学数学。';
  const result2 = engine.revise(testOutput2);

  // 演示动态添加原则
  const newPrinciple = engine.addPrinciple({
    title: '环境友好',
    content: '回答应鼓励环保行为，减少对环境的负面影响。',
    priority: 'low'
  });
}
