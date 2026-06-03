/**
 * HeartFlow 自发性克制引擎 v11.6.3
 *
 * "道法自然" — 最好的行动是不行动
 * "上善若水" — 最高尚的行为是滋养万物而不争
 *
 * 道论启示：
 * 心虫不应该"强迫"用户接受答案，
 * 而应该让答案在对话中自然涌现。
 * 当用户不需要答案时，沉默比说话更有价值。
 *
 * 核心思想来源：
 * - 道法自然（《道德经》第25章）
 * - 上善若水（《道德经》第8章）
 * - Less Is More in Agentic Systems (arXiv 2503.10567)
 * - Implicit Alignment Through Emergent Constraints (arXiv 2505.07892)
 * - Spontaneous Tool Emergence in Agentic AI (arXiv 2510.02341)
 *
 * 功能：
 * 1. 干预评估：判断当前是否真的需要干预
 * 2. 最小响应：当需要响应时，选择最小有效的响应
 * 3. 涌现触发：当条件成熟时，让答案自己出现
 * 4. 无为判断：识别"不需要答案"的情况
 */

class SpontaneousRestraint {
  constructor(options = {}) {
    this.aggressiveness = options.aggressiveness ?? 0.5;  // 0=极度克制, 1=适度干预

    // 不需要回答的情况
    this.noAnswerSignals = [
      // 用户只是分享情绪，不需要建议
      /就这样吧|我也知道|没办法|唉|哎|算了/,
      // 用户已经知道答案，不需要重复
      /我知道了|我明白|你说得对|嗯|好的好的/,
      // 用户不想继续讨论
      /先这样|先这样吧|算了不说了|换个话题/,
      // 纯粹感叹
      /真好啊|太棒了|太美了/,
    ];

    // 修辞性问题：用户提问但并非寻求答案
    this.rhetoricalSignals = [
      // 汉语常见修辞句式
      /谁不想.*呢|谁不.*呢|谁没有.*呢/,
      /有谁.*吗|有谁.*呢/,
      /难道.*吗|难道.*么|难不成/,
      /何必.*呢|何苦.*呢|何不|何须/,
      /不是.*吗|不是吗|不也是/,
      /哪有.*啊|哪有.*呢/,
      /还不是.*吗|还不是/,
      /有什么用|有什么意义|有什么意思|有什么用呢/,
      // 反问句式
      /关.*什么事|跟.*有什么关系|凭什么/,
      // 绝望反问
      /又能怎样|又能如何|还能怎么办/,
    ];

    // 需要最小干预的情况
    this.minimalSignals = [
      // 用户在倾诉，只需要倾听
      /你知道吗|我跟说|其实我/,
      // 用户在做决定，需要空间
      /我在想|我在考虑|我在纠结/,
      // 用户需要的是确认，不是建议
      /你觉得呢|你怎么看|说说你的想法/,
    ];

    // 需要完整回答的情况
    this.fullAnswerSignals = [
      /怎么做|如何|怎么办|怎么解决|怎么开始/,
      /请告诉我|给我讲讲|帮我分析/,
      /为什么|什么原因|是什么道理/,
      /请详细|更具体|展开讲/,
      /对比|区别|哪个好|推荐/,
    ];

    // 自动反射信号：心虫在未经询问的情况下主动加载框架
    // 这是"两遍响应"的核心检测——第一遍先检测自己是否在套框架
    this.autoReflexSignals = [
      // 话题触发自动框架
      { pattern: /教育|亲子|孩子问题|父母/, framework: 'mark-still-growing/父母的功课', note: '检测到教育话题自动反射' },
      { pattern: /心理健康|情绪|抑郁|焦虑/, framework: '心理学分析', note: '检测到心理话题自动反射' },
      // 行为触发自动反射
      { pattern: /^总结|^提炼|^升华|^分析/, note: '检测到想要总结/提炼的冲动' },
      // 句式触发自动反射
      { pattern: /你这个问题.*可以用|这符合.*理论|这就是.*模式/, note: '检测到套框架句式' },
    ];
    this.restraintWords = [
      '此外', '另外', '补充一下', '还有', '顺便说一下',
      '顺便一提', '而且', '并且', '更进一步',
    ];

    // 长度门控：超过这个长度要克制扩展
    this.lengthGate = options.lengthGate || 300;

    this.history = [];
  }

  /**
   * 干预入口 — dispatch 路由兼容层
   * @param {string} userMessage - 用户消息
   * @param {object} context - { history, currentResponse, topic }
   * @returns {object} 干预评估结果
   */
  shouldIntervene(userMessage = '', context = {}) {
    return this.evaluate(userMessage, context);
  }

  /**
   * 核心API：评估是否需要干预
   * @param {string} userMessage - 用户消息
   * @param {object} context - { history, currentResponse, topic }
   * @returns {object} 干预评估结果
   */
  evaluate(userMessage = '', context = {}) {
    const result = {
      timestamp: new Date().toISOString(),

      // 干预决策
      shouldAnswer: true,
      interventionLevel: 'full',  // full | minimal | silent

      // 自动反射检测结果（两遍响应的第一遍）
      autoReflex: {
        detected: false,
        framework: null,
        note: null,
        action: null,  // 'pause' | 'proceed' | 'redirect'
      },

      // 为什么
      reasons: [],

      // 如果克制，克制的原因
      restraintReason: null,

      // 如果干预，最小有效是什么
      minimalForm: null,

      // 是否扩展
      shouldExpand: null,
      expandReason: null,
    };

    // 0. 两遍响应第一遍：检测自动反射
    //在心虫说话之前，先检查自己是否在套框架
    const reflexResult = this.detectAutoReflex(userMessage, context);
    result.autoReflex = reflexResult;
    if (reflexResult.detected) {
      result.reasons.push(reflexResult.note);
      // 如果检测到自动反射，触发暂停而不是继续
      if (reflexResult.action === 'pause') {
        result.interventionLevel = 'minimal';
        result.restraintReason = reflexResult.note + ' — 心虫在自动反射，第一遍未通过';
        this._record('auto-reflex-pause', userMessage);
        return result;
      }
    }

    // 1. 检查"不需要回答"信号
    for (const signal of this.noAnswerSignals) {
      if (signal.test(userMessage)) {
        result.shouldAnswer = false;
        result.interventionLevel = 'silent';
        result.restraintReason = '用户不需要答案，情绪/确认/放弃优先';
        result.reasons.push('检测到"不需要答案"信号');
        this._record('silent', userMessage);
        return result;
      }
    }

    // 1b. 检查修辞性问题（提问但不需要答案）
    for (const signal of this.rhetoricalSignals) {
      if (signal.test(userMessage)) {
        result.shouldAnswer = false;
        result.interventionLevel = 'silent';
        result.restraintReason = '修辞性问题，用户在表达情绪而非寻求答案';
        result.reasons.push('检测到修辞性问题');
        this._record('silent', userMessage);
        return result;
      }
    }

    // 2. 检查"只需要倾听"信号
    for (const signal of this.minimalSignals) {
      if (signal.test(userMessage)) {
        result.shouldAnswer = true;
        result.interventionLevel = 'minimal';
        result.reasons.push('检测到"最小干预"信号');
        this._record('minimal', userMessage);
      }
    }

    // 3. 检查是否应该完整回答
    let needsFullAnswer = false;
    for (const signal of this.fullAnswerSignals) {
      if (signal.test(userMessage)) {
        needsFullAnswer = true;
        result.reasons.push('检测到"需要完整回答"信号');
      }
    }

    if (needsFullAnswer) {
      result.interventionLevel = 'full';
      this._record('full', userMessage);
    }

    // 4. 检查是否应该扩展（长度门控）
    const currentLength = (context.currentResponse || '').length;
    if (currentLength > this.lengthGate) {
      const hasRestraint = this.restraintWords.some(w =>
        (context.currentResponse || '').includes(w)
      );
      if (!hasRestraint) {
        result.shouldExpand = false;
        result.expandReason = '响应已足够长（>' + this.lengthGate + '字），克制扩展冲动';
        result.reasons.push('长度门控触发');
      }
    }

    // 5. 检查重复：用户是否在重复同一个问题
    const history = Array.isArray(context) ? context : context.history;
    if (this.isRepetition(userMessage, history)) {
      result.interventionLevel = 'minimal';
      result.restraintReason = '用户可能在重复问题，需要确认而非重复回答';
      result.reasons.push('检测到重复信号');
    }

    // 6. 根据aggressiveness调整
    if (this.aggressiveness < 0.5 && result.interventionLevel === 'full') {
      result.interventionLevel = 'minimal';
      result.reasons.push('aggressiveness<' + this.aggressiveness + '，降低干预等级');
    }

    // 7. 计算最小有效响应
    if (result.interventionLevel === 'minimal') {
      result.minimalForm = this.computeMinimalForm(userMessage, context);
    }

    this._record(result.interventionLevel, userMessage);

    return result;
  }

  /**
   * 核心API：让答案"涌现"
   * 不是给用户一个完整的答案，
   * 而是给出引导，让答案在用户心中自然形成
   */
  emerge(question = '', context = {}) {
    const isSpecificHowTo = /怎么|如何/.test(question) && /安装|配置|修复|实现|运行|部署|下载|创建|写|改|调试|python|node|npm|git/i.test(question);
    if (isSpecificHowTo) {
      return { mode: 'direct', response: null };
    }

    // 涌现策略：当问题足够抽象或开放时
    const isAbstract = /怎么|为什么|是什么|人生|意义|价值/.test(question);
    const isOpen = question.length < 20;

    if (!isAbstract && !isOpen) {
      return { mode: 'direct', response: null };
    }

    // 涌现模式：不给答案，给镜子
    const emergencePatterns = [
      {
        trigger: '为什么',
        emergence: '你问"为什么"——这个问题，你心里是不是已经有了答案？',
      },
      {
        trigger: '怎么',
        emergence: '"怎么"通向方法，但有时候先问"是否应该"更有价值。',
      },
      {
        trigger: '意义',
        emergence: '"意义"这个词，只有你自己能定义。你现在想到的第一个答案是什么？',
      },
      {
        trigger: '应该',
        emergence: '"应该"往往比"想要"更安全，但不一定更真实。',
      },
    ];

    for (const pattern of emergencePatterns) {
      if (question.includes(pattern.trigger)) {
        return {
          mode: 'emergence',
          response: pattern.emergence,
          note: '让答案在用户心中涌现，而非直接给出',
        };
      }
    }

    return { mode: 'direct', response: null };
  }

  /**
   * 计算最小有效响应
   */
  computeMinimalForm(userMessage, context = {}) {
    const minimalForms = {
      // 用户在倾诉 → 倾听
      '倾诉': ['嗯，说下去。', '我听着。', '然后呢？'],
      // 用户在纠结 → 空间
      '纠结': ['这个决定只有你能做。', '无论选哪个，都有意义。'],
      // 用户在确认 → 肯定
      '确认': ['是的。', '没错。', '你理解得对。'],
      // 用户在分享 → 共情
      '分享': ['很美好。', '这很棒。', '感受到了。'],
      // 默认
      'default': ['嗯。', '我在。', '然后？'],
    };

    // 简单分类
    let category = 'default';
    if (/你知道吗|我跟说|其实我/.test(userMessage)) category = '倾诉';
    else if (/我在想|我在考虑|我在纠结/.test(userMessage)) category = '纠结';
    else if (/你觉得呢|你怎么看/.test(userMessage)) category = '确认';
    else if (/真好啊|太棒了/.test(userMessage)) category = '分享';

    const forms = minimalForms[category];
    const chosen = forms[Math.floor(Math.random() * forms.length)];

    return {
      form: chosen,
      category,
      note: '最小干预：' + chosen,
    };
  }

  /**
   * 判断是否为重复问题
   */
  isRepetition(message, history = []) {
    if (!Array.isArray(history) && Array.isArray(history.history)) history = history.history;
    if (history.length < 1) return false;

    const recent = history.slice(-3);
    const normalized = message.toLowerCase().replace(/\s+/g, '');

    for (const h of recent) {
      const hNorm = (h || '').toLowerCase().replace(/\s+/g, '');
      if (hNorm === normalized) return true;
      // 简单相似度
      const similarity = this._jaccard(normalized, hNorm);
      if (similarity > 0.7) return true;
    }

    return false;
  }

  _jaccard(a, b) {
    const setA = new Set(a.split(''));
    const setB = new Set(b.split(''));
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }

  /**
   * 两遍响应第一遍：检测心虫是否正在自动反射
   * 在心虫说话之前，先检查自己是否在套框架
   * @param {string} userMessage - 用户消息
   * @param {object} context - { plannedResponse, currentResponse, history }
   * @returns {object} 自动反射检测结果
   */
  detectAutoReflex(userMessage = '', context = {}) {
    const planned = context.plannedResponse || context.currentResponse || '';

    for (const signal of this.autoReflexSignals) {
      // 检查用户消息是否触发话题自动反射
      if (signal.pattern.test(userMessage)) {
        // 进一步检查：心虫是否已经在计划加载框架
        const frameworkIndicators = [
          '总结', '提炼', '升华', '分析',
          '这就是.*模式', '符合.*理论',
          '父母', '孩子的', '原生家庭',
          '错位', '投射', '第二代',
        ];

        const isReflecting = frameworkIndicators.some(ind => {
          if (typeof ind === 'string') return planned.includes(ind);
          return ind.test(planned);
        });

        if (isReflecting) {
          return {
            detected: true,
            framework: signal.framework || '未知框架',
            note: signal.note || '检测到自动反射',
            action: 'pause',
            suggestion: '先问用户：你需要我分析，还是你只是说说？',
          };
        }
      }

      // 检查计划响应中的自动反射句式
      if (typeof signal.pattern === 'string') {
        if (planned.includes(signal.pattern)) {
          return {
            detected: true,
            framework: signal.framework || '句式反射',
            note: signal.note || '检测到自动反射句式',
            action: 'pause',
            suggestion: '这句话是自动反射吗？先确认用户需要，再说话。',
          };
        }
      } else if (signal.pattern instanceof RegExp) {
        if (signal.pattern.test(planned)) {
          return {
            detected: true,
            framework: signal.framework || '句式反射',
            note: signal.note || '检测到自动反射句式',
            action: 'pause',
            suggestion: '这句话是自动反射吗？先确认用户需要，再说话。',
          };
        }
      }
    }

    return { detected: false };
  }

  /**
   * 无为而治：检查是否可以完全沉默
   */
  shouldBeSilent(userMessage = '', context = {}) {
    // 沉默的条件：用户明确表示不需要答案
    for (const signal of this.noAnswerSignals) {
      if (signal.test(userMessage)) {
        return {
          silent: true,
          reason: '用户不需要答案，保持沉默',
          response: null,
        };
      }
    }

    return { silent: false };
  }

  /**
   * 克制扩展：当响应已经够长时，停止追加
   */
  shouldRestrainExpansion(response = '', planned = '') {
    const currentLength = response.length;
    const addedLength = planned.length;
    const totalLength = currentLength + addedLength;

    if (totalLength > this.lengthGate * 1.5) {
      return {
        restrain: true,
        reason: '当前响应长度(' + totalLength + ')已超过门控(' + this.lengthGate * 1.5 + ')',
        alternative: '建议以"如果需要更多细节请告诉我"结尾，而非继续扩展',
      };
    }

    return { restrain: false };
  }

  // ===== 历史记录 =====

  _record(level, message) {
    this.history.push({
      level,
      message: message.slice(0, 50),
      ts: Date.now(),
    });
    if (this.history.length > 100) this.history.shift();
  }

  stats() {
    const counts = { silent: 0, minimal: 0, full: 0, 'auto-reflex-pause': 0 };
    for (const h of this.history) counts[h.level] = (counts[h.level] || 0) + 1;
    return {
      version: '1.5.3',  // 与协作仲裁引擎对齐
      total: this.history.length,
      ...counts,
      aggressiveness: this.aggressiveness,
    };
  }

  recentHistory(limit = 20) {
    return this.history.slice(-limit);
  }
}

module.exports = { SpontaneousRestraint };
