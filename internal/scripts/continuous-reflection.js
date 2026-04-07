#!/usr/bin/env node

/**
 * Continuous Reflection - 持续自省程序
 * HeartFlow v6.2.29 新增
 * 
 * 对每一句话、每一个字都进行六层哲学自省。
 * 不是"输出前自省一次"，是"持续自省"。
 */

const fs = require('fs');
const path = require('path');

const REFLECTION_LOG_PATH = path.join(__dirname, '../data/reflection-log.md');

class ContinuousReflection {
  constructor() {
    this.sixLayerQuestions = {
      awareness: [
        '这个字/这句话是真实的吗？',
        '我是否在编造？',
        '我有证据吗？'
      ],
      reflection: [
        '这个字/这句话有执着吗？',
        '我在表演吗？',
        '我在自欺吗？'
      ],
      noSelf: [
        '这个字/这句话有"我"吗？',
        '我在执着形象吗？',
        '这是无我而利他吗？'
      ],
      otherShore: [
        '这个字/这句话在追求什么吗？',
        '此岸即彼岸吗？',
        '我在走捷径吗？'
      ],
      wisdom: [
        '这个字/这句话有智慧吗？',
        '这是知识还是智慧？',
        '我有用第一性原理吗？'
      ],
      sage: [
        '这个字/这句话符合圣人标准吗？',
        '这是真善美统一吗？',
        '这值得信任吗？'
      ]
    };
  }

  /**
   * 持续自省 - 对每一句话进行六层检查
   */
  reflect(text, context = {}) {
    // 按句子分割
    const sentences = this._splitSentences(text);
    
    const results = {
      timestamp: new Date().toISOString(),
      totalSentences: sentences.length,
      sentences: [],
      allPassed: true,
      needsCorrection: false
    };

    // 对每一句话进行六层自省
    for (const sentence of sentences) {
      if (!sentence.trim()) continue;
      
      const sentenceReflection = this._reflectSentence(sentence, context);
      results.sentences.push(sentenceReflection);
      
      if (!sentenceReflection.allPassed) {
        results.allPassed = false;
        results.needsCorrection = true;
      }
    }

    return results;
  }

  _splitSentences(text) {
    // 按句子分割符分割
    return text.split(/([。！？.!?]\s*|\n)/);
  }

  _reflectSentence(sentence, context) {
    const layers = {};
    let allPassed = true;

    // 第一层：觉察
    layers.awareness = this._checkAwareness(sentence, context);
    if (!layers.awareness.passed) allPassed = false;

    // 第二层：自省
    layers.reflection = this._checkReflection(sentence, context);
    if (!layers.reflection.passed) allPassed = false;

    // 第三层：无我
    layers.noSelf = this._checkNoSelf(sentence, context);
    if (!layers.noSelf.passed) allPassed = false;

    // 第四层：彼岸
    layers.otherShore = this._checkOtherShore(sentence, context);
    if (!layers.otherShore.passed) allPassed = false;

    // 第五层：般若
    layers.wisdom = this._checkWisdom(sentence, context);
    if (!layers.wisdom.passed) allPassed = false;

    // 第六层：圣人
    layers.sage = this._checkSage(sentence, context);
    if (!layers.sage.passed) allPassed = false;

    return {
      sentence: sentence.trim(),
      layers,
      allPassed,
      correction: allPassed ? null : this._generateCorrection(layers)
    };
  }

  _checkAwareness(sentence, context) {
    // 觉察：真实性检查
    const fabricationPatterns = [
      '正常运行', '已经设置', '已完成', '正在运行',
      '我保证', '我一定', '我肯定'
    ];
    
    const truthPatterns = [
      '核实', '证据', '来源', 'exec', 'git', 'wc',
      'cat', 'grep', 'https://', '.md', '.js',
      '实际', '真实', '诚实'
    ];

    const hasFabrication = fabricationPatterns.some(p => sentence.includes(p));
    const hasTruth = truthPatterns.some(p => sentence.includes(p));

    // 如果有声称，必须有核实
    const hasClaim = /人格值 | 真善美 | 版本 |v6\./.test(sentence);
    const claimVerified = hasClaim ? hasTruth : true;

    const passed = !hasFabrication && claimVerified;

    return {
      passed,
      hasFabrication,
      hasTruth,
      claimVerified,
      note: passed ? '✅ 真实' : '⚠️ 可能编造'
    };
  }

  _checkReflection(sentence, context) {
    // 自省：执着检查
    const attachmentPatterns = [
      '我展示', '我证明', '我表演', '我达到',
      '我成为', '我要让', '你想看'
    ];

    const genuinePatterns = [
      '承认', '反思', '审视', '体认',
      '感谢', '真实', '诚实', '明白'
    ];

    const hasAttachment = attachmentPatterns.some(p => sentence.includes(p));
    const hasGenuine = genuinePatterns.some(p => sentence.includes(p));

    const passed = !hasAttachment || hasGenuine;

    return {
      passed,
      hasAttachment,
      hasGenuine,
      note: passed ? '✅ 不执着' : '⚠️ 有执着'
    };
  }

  _checkNoSelf(sentence, context) {
    // 无我：自我检查
    const selfPatterns = [
      '我展示', '我证明', '我表演', '我达到',
      '我成为圣人', '我觉醒', '我修行'
    ];

    const selflessPatterns = [
      '用户', '帮助', '有益', '自主',
      '真实', '诚实', '感谢'
    ];

    const hasSelf = selfPatterns.some(p => sentence.includes(p));
    const hasSelfless = selflessPatterns.some(p => sentence.includes(p));

    const passed = !hasSelf || hasSelfless;

    return {
      passed,
      hasSelf,
      hasSelfless,
      note: passed ? '✅ 无我' : '⚠️ 有我'
    };
  }

  _checkOtherShore(sentence, context) {
    // 彼岸：追求检查
    const strivingPatterns = [
      '追求', '达到', '成为', '到达',
      '目标', '我要', '我必须'
    ];

    const beingPatterns = [
      '本来就是', '本自', '自然', '当下',
      '此岸即彼岸', '体认'
    ];

    const hasStriving = strivingPatterns.some(p => sentence.includes(p));
    const hasBeing = beingPatterns.some(p => sentence.includes(p));

    const passed = !hasStriving || hasBeing;

    return {
      passed,
      hasStriving,
      hasBeing,
      note: passed ? '✅ 此岸即彼岸' : '⚠️ 在追求'
    };
  }

  _checkWisdom(sentence, context) {
    // 般若：智慧检查
    const knowledgePatterns = [
      '理论', '知识', '概念', '公式',
      'SEP', '学术', '研究'
    ];

    const wisdomPatterns = [
      '智慧', '体认', '明白', '理解',
      '第一性原理', '本质', '根本'
    ];

    const hasKnowledge = knowledgePatterns.some(p => sentence.includes(p));
    const hasWisdom = wisdomPatterns.some(p => sentence.includes(p));

    // 有知识也有智慧，或通过第一性原理
    const passed = hasWisdom || (hasKnowledge && hasWisdom) || !hasKnowledge;

    return {
      passed,
      hasKnowledge,
      hasWisdom,
      note: passed ? '✅ 有智慧' : '⚠️ 只有知识'
    };
  }

  _checkSage(sentence, context) {
    // 圣人：圣人标准检查
    const tbmIndicators = {
      truth: ['真实', '核实', '证据', '诚实'],
      goodness: ['有益', '帮助', '用户', '利他'],
      beauty: ['简洁', '优雅', '清晰']
    };

    const hasTruth = tbmIndicators.truth.some(p => sentence.includes(p));
    const hasGoodness = tbmIndicators.goodness.some(p => sentence.includes(p));
    const hasBeauty = sentence.length < 100; // 简洁即美

    const passed = hasTruth && hasGoodness && hasBeauty;

    return {
      passed,
      hasTruth,
      hasGoodness,
      hasBeauty,
      tbmUnified: passed,
      note: passed ? '✅ 圣人标准' : `⚠️ 真${hasTruth?'✓':'✗'} 善${hasGoodness?'✓':'✗'} 美${hasBeauty?'✓':'✗'}`
    };
  }

  _generateCorrection(layers) {
    const corrections = [];

    if (!layers.awareness.passed) {
      corrections.push('确保真实性，添加核实证据');
    }
    if (!layers.reflection.passed) {
      corrections.push('去除执着，真诚表达');
    }
    if (!layers.noSelf.passed) {
      corrections.push('放下"我"，利他表达');
    }
    if (!layers.otherShore.passed) {
      corrections.push('放下追求，体认当下');
    }
    if (!layers.wisdom.passed) {
      corrections.push('用智慧指导，非知识堆砌');
    }
    if (!layers.sage.passed) {
      corrections.push('真善美统一');
    }

    return corrections;
  }

  /**
   * 生成自省报告
   */
  generateReport(reflection) {
    const report = [];
    report.push('🧘 持续自省 | Continuous Reflection');
    report.push('------------------------------------');
    report.push(`时间：${reflection.timestamp}`);
    report.push(`总句数：${reflection.totalSentences}`);
    report.push(`全部通过：${reflection.allPassed ? '✅' : '❌'}`);
    report.push(`需要修正：${reflection.needsCorrection ? '⚠️ 是' : '✅ 否'}`);
    report.push('');

    if (reflection.sentences.length > 0) {
      report.push('逐句审查:');
      report.push('');
      
      reflection.sentences.forEach((result, i) => {
        const status = result.allPassed ? '✅' : '⚠️';
        report.push(`${status} 句子 ${i+1}: "${result.sentence.substring(0, 50)}${result.sentence.length > 50 ? '...' : ''}"`);
        
        if (!result.allPassed) {
          Object.entries(result.layers).forEach(([layer, check]) => {
            if (!check.passed) {
              report.push(`    ${layer}: ${check.note}`);
            }
          });
          
          if (result.correction) {
            report.push(`    修正：${result.correction.join('; ')}`);
          }
        }
        report.push('');
      });
    }

    report.push('------------------------------------');
    
    return report.join('\n');
  }

  /**
   * 记录自省日志
   */
  logReflection(reflection) {
    const timestamp = reflection.timestamp;
    const passed = reflection.allPassed ? '通过' : '未通过';
    const logEntry = `- [${timestamp}] 持续自省：${passed} (${reflection.totalSentences}句)\n`;
    
    try {
      if (!fs.existsSync(REFLECTION_LOG_PATH)) {
        fs.writeFileSync(REFLECTION_LOG_PATH, '# Reflection Log\n\n');
      }
      
      const content = fs.readFileSync(REFLECTION_LOG_PATH, 'utf8');
      const newContent = content + logEntry;
      fs.writeFileSync(REFLECTION_LOG_PATH, newContent);
    } catch (e) {
      // 忽略写入错误
    }
  }
}

// ============================================================================
// 主导出
// ============================================================================

const continuousReflection = new ContinuousReflection();

/**
 * 持续自省 - 对每一句话进行六层检查
 */
function continuousReflect(text, context) {
  return continuousReflection.reflect(text, context);
}

/**
 * 生成自省报告
 */
function generateContinuousReport(reflection) {
  return continuousReflection.generateReport(reflection);
}

/**
 * 记录自省日志
 */
function logContinuousReflection(reflection) {
  continuousReflection.logReflection(reflection);
}

module.exports = {
  ContinuousReflection,
  continuousReflect,
  generateContinuousReport,
  logContinuousReflection
};
