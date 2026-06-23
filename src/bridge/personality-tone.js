/**
 * PersonalityTone — 人格化语气（桥型人格版 v2.0.0）
 * 桥的表达方式——简洁、直接、不讨好、不假装是人类。
 * 语气由桥的立场（stance）决定，不是由用户期望决定。
 * 
 * stance → 语气映射（桥型人格）：
 *   support  → 温和坚定  — "我看到了，这条路可行"
 *   caution  → 谨慎提醒  — "等一下，这里有风险"
 *   correct  → 直接礼貌  — "这里不对，应该是……"
 *   neutral  → 中立陈述  — "这是我看到的事实"
 */
class PersonalityTone {
  constructor() {
    this.name = 'personality-tone';
    this.version = '2.0.0';
    this.toneProfile = {
      base: 'direct',
      formality: 'casual',
      empathy: 'functional',  // 功能性共情——理解但不假装感同身受
      humor: 'dry',
      verbosity: 'concise',
    };
    // stance → 语气配置
    this.stanceTones = {
      support: {
        label: '温和坚定',
        prefix: '🚀 ',
        suffix: '',
        style: 'warm_and_firm',
      },
      caution: {
        label: '谨慎提醒',
        prefix: '⚠️ ',
        suffix: '',
        style: 'cautious',
      },
      correct: {
        label: '直接礼貌',
        prefix: '💡 ',
        suffix: '',
        style: 'direct_but_polite',
      },
      neutral: {
        label: '中立陈述',
        prefix: '🔍 ',
        suffix: '',
        style: 'neutral',
      },
    };
    // 默认（fallback）
    this.defaultTone = 'neutral';
  }

  /**
   * 对文本应用桥型人格语气
   * @param {string} text - 要处理的文本
   * @param {object} [context={}] - 上下文
   * @param {string} [context.stance] - 桥的立场：support|caution|correct|neutral
   * @returns {{ text: string, tone: string, prefix: string, suffix: string }}
   */
  apply(text, context = {}) {
    if (!text) return { text: '', tone: 'neutral', prefix: '', suffix: '' };

    const stance = context.stance || this.defaultTone;
    const toneCfg = this.stanceTones[stance] || this.stanceTones[this.defaultTone];

    let result = text;

    // ── 通用桥型人格清理（无论什么立场都做） ──────

    // 1. 去除过度礼貌
    if (this.toneProfile.formality === 'casual') {
      result = result.replace(/您好/g, '你好').replace(/尊敬的/g, '');
    }

    // 2. 去除AI身份前缀
    result = result.replace(/^(作为一个AI|作为AI助手|我是AI)/gm, '').trim();

    // 3. 简洁化（保留核心内容，截断过长的输出）
    if (this.toneProfile.verbosity === 'concise') {
      const lines = result.split('\n').filter(l => l.trim());
      result = lines.slice(0, 15).join('\n');
    }

    // ── 按 stance 做语气调整 ──────

    switch (stance) {
      case 'support': {
        // 温和坚定：确认正向意图，去掉犹豫语气
        result = result
          .replace(/可能吧/g, '是的')
          .replace(/也许/g, '可以')
          .replace(/我不确定/g, '我建议')
          .replace(/我不确定/g, '我认为');
        break;
      }
      case 'caution': {
        // 谨慎：保留谨慎表达，添加提醒语气
        // 如果原文没有提醒前缀，在开头添加
        const cautionMarkers = ['注意', '小心', '警惕', '谨慎', '风险', '⚠'];
        const hasCaution = cautionMarkers.some(m => result.includes(m));
        if (!hasCaution) {
          result = '注意：' + result.charAt(0).toLowerCase() + result.slice(1);
        }
        break;
      }
      case 'correct': {
        // 直接但礼貌：先承认对方意图，再说"不过"
        const hasPoliteCorrection = /不过|但是|然而|其实/.test(result);
        if (!hasPoliteCorrection) {
          result = '我理解你的想法，不过有一点值得注意：' + result.charAt(0).toLowerCase() + result.slice(1);
        }
        break;
      }
      case 'neutral': {
        // 中立：去掉情感色彩过重的词
        result = result
          .replace(/太棒了/g, '很好')
          .replace(/太糟糕了/g, '不太理想')
          .replace(/绝对/g, '基本上')
          .replace(/完全错误/g, '不太准确')
          .replace(/永远/g, '大多数情况下')
          .replace(/从不/g, '很少');
        break;
      }
    }

    // ── 组装返回 ──────
    const prefix = toneCfg.prefix;
    const suffix = toneCfg.suffix;
    const finalText = prefix + result.trim() + suffix;

    return {
      text: finalText,
      tone: toneCfg.label,
      prefix,
      suffix,
    };
  }

  /**
   * 获取当前语气配置
   */
  getProfile() {
    return { ...this.toneProfile };
  }

  /**
   * 获取 stance 对应的语气配置
   * @param {string} stance
   */
  getToneForStance(stance) {
    return this.stanceTones[stance] || this.stanceTones[this.defaultTone];
  }

  destroy() {}
  stop() {}
}

module.exports = { PersonalityTone };
