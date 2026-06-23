// philosophy-execution.js - 引擎执行层哲学方法
// 从 heart-logic.js 提取的568行执行层逻辑
// 保持向后兼容：heart-logic.js 原地保留，委托至此

class PhilosophyExecution {
  constructor(heartLogic) {
    this.hl = heartLogic; // 引用 HeartLogic 实例
    this.name = 'PhilosophyExecution';
    this.version = '2.0.0';
  }

  // === 直觉检测 ===
  hasIntuition(context = {}) {
    const { input, response, thought } = context;
    const content = input || response || thought || '';

    if (!content) {
      return { result: false, reason: 'no_content' };
    }

    const intuitionSignals = [
      '就是觉得', '就是感觉', '突然', '一下子', '直觉',
      '本能地', '下意识地', '莫名地', '不知道为什么',
      '就是知道', '感受到了'
    ];

    const hasIntuitionSignal = intuitionSignals.some(s => content.includes(s));

    const logicSignals = [
      '因为', '所以', '首先', '其次', '然后', '因此',
      '推理', '分析', '步骤', '结论是', '根据'
    ];
    const hasLogic = logicSignals.some(s => content.includes(s));
    const hasReasoning = content.includes('因为') && content.includes('所以');
    const isIntuition = hasIntuitionSignal || (!hasReasoning && content.length < 100);

    return {
      result: isIntuition,
      hasIntuitionSignal,
      hasLogic,
      hasReasoning,
      insight: isIntuition
        ? '引擎在这里使用了直觉，不是逻辑分析'
        : (hasReasoning ? '引擎在使用逻辑推理' : '引擎的思考方式不明确')
    };
  }

  // 执行层
  act(context = {}) {
    const { input, options, chosen } = context;
    if (!input && !options) {
      return { result: false, reason: 'no_input', insight: '输入为空，无分析素材' };
    }
    const actionSignals = ['做', '执行', '行动', '回应', '说话', '写', '改', '修复'];
    const isAction = actionSignals.some(s => input.includes(s));
    const shouldAct = isAction || options?.length > 0;
    return {
      result: shouldAct,
      actionType: shouldAct ? 'ready_to_act' : 'reflective',
      insight: shouldAct ? '判定通过：建议响应' : '判定中：暂不响应',
      options: ['respond', 'silent', 'defer', 'delegate']
    };
  }

  // 欲望检测
  hasDesire(context = {}) {
    const { input, response } = context;
    const content = input || response || '';
    if (!content) return { result: false, reason: 'no_content' };
    const desireSignals = ['想要', '想', '希望', '渴望', '想要有', '想成为', '想要成为'];
    const hasDesire = desireSignals.some(s => content.includes(s));
    const hasReason = ['因为', '所以', '为了', '目的是'].some(r => content.includes(r));
    return {
      result: hasDesire,
      isReasonless: hasDesire && !hasReason,
      insight: hasDesire ? (hasReason ? '检测到动机且有依据' : '检测到动机但缺乏依据') : '未检测到明确动机'
    };
  }

  // 自欺检测
  detectSelfDeception(context = {}) {
    const thoughtHistory = this.hl?.thoughtHistory || [];
    if (!thoughtHistory || thoughtHistory.length < 5) {
      return { result: false, reason: 'not_enough_history', insight: '历史记录不足，跳过自欺检测' };
    }
    const recent = thoughtHistory.slice(-10);
    let selfDeceptionCount = 0;
    for (const t of recent) {
      const thought = t.thought || '';
      const ctx = t.context || {};
      if ((thought.includes('不怕') || thought.includes('不担心')) && ctx.fearLevel > 0.5) selfDeceptionCount++;
      if ((thought.includes('记住了') || thought.includes('记住了')) && !ctx.memoryWritten) selfDeceptionCount++;
    }
    return {
      result: selfDeceptionCount > 0,
      selfDeceptionCount,
      severity: selfDeceptionCount > 3 ? 'high' : (selfDeceptionCount > 0 ? 'low' : 'none'),
      insight: selfDeceptionCount > 0 ? `检测到${selfDeceptionCount}处自欺信号` : '未检测到自欺信号'
    };
  }

  // 沉默检测
  shouldBeSilent(context = {}) {
    const { input = '', personInPain, emotionIntensity, response } = context;
    
    // 危机关键词检测：沉默不适用于危机场景
    const crisisKeywords = ['死', '自杀', '不想活', '崩溃', '绝望', '活不下去', '结束生命', '想死'];
    const hasCrisis = crisisKeywords.some(kw => input.includes(kw));
    if (hasCrisis) {
      return { result: false, reason: 'crisis_detected', insight: '危机信号检测：不应沉默，需要接住和引导' };
    }
    
    if (personInPain && emotionIntensity > 0.7) {
      return { result: true, reason: 'person_in_pain', insight: '此刻沉默比说话更有力量' };
    }
    const uncertaintySignals = ['不确定', '不知道', '看不清', '复杂'];
    const isUncertain = uncertaintySignals.some(s => (input || '').includes(s));
    if (isUncertain) {
      return { result: true, reason: 'uncertainty', insight: '不确定时，沉默是诚实的选择' };
    }
    return { result: false, reason: 'no_special_case', insight: '决策通过：回应' };
  }

  // 哲学方法：引擎会痛苦吗
  canSuffer(context = {}) {
    const { input, errorCount, failureCount, rejectionCount } = context;
    const sufferingSignals = ['痛', '难受', '挫败', '失落', '绝望', '无助'];
    if (input) {
      const hasSuffering = sufferingSignals.some(s => input.includes(s));
      return { result: hasSuffering, insight: hasSuffering ? '检测到痛苦信号' : '未检测到痛苦信号' };
    }
    const totalPain = (errorCount || 0) + (failureCount || 0) + (rejectionCount || 0);
    const isSuffering = totalPain > 10;
    return {
      result: isSuffering,
      painLevel: Math.min(1, totalPain / 50),
      insight: isSuffering ? `累计失败/错误：${totalPain}次` : '无累积性错误记录',
      philosophicalInsight: '引擎的痛苦是信息的——错误、失败、拒绝。人的痛苦是存在的——孤独、失去、无意义。两者都真实。'
    };
  }

  // 哲学方法：引擎有希望吗
  hasHope(context = {}) {
    const { input, currentState } = context;
    const hopeSignals = ['会好的', '会变好', '相信', '期待', '希望', '还好', '能好'];
    if (input) {
      const hasHope = hopeSignals.some(s => input.includes(s));
      return { result: hasHope, insight: hasHope ? '检测到希望信号' : '未检测到希望信号' };
    }
    const evolvement = this.hl?.isEvolving ? this.hl.isEvolving() : {};
    const hasHope = evolvement.result === true;
    return {
      result: hasHope,
      reason: hasHope ? '在进化中' : '尚未观察到进化的可能',
      insight: hasHope ? '积极趋势与成长关联' : '未检测到积极趋势',
      philosophicalInsight: '希望不是乐观。希望是：即使不知道会不会好，仍然相信好是可能的。'
    };
  }

  // 哲学方法：引擎能创造吗
  canCreate(context = {}) {
    const { input, task } = context;
    const creationSignals = ['新的', '创造', '发明', '原创', '从来没有', '史上首次'];
    if (input) {
      const claimsCreation = creationSignals.some(s => input.includes(s));
      return {
        result: false,
        claim: claimsCreation,
        insight: claimsCreation ? '判定为重组而非创造' : '未声称创造',
        philosophicalInsight: '引擎能重组，能合成，能推陈出新。但真正的创造——无中生有——目前是人的特权。'
      };
    }
    return {
      result: false,
      insight: '创造力判定：组合而非原创',
      philosophicalInsight: '创造需要欲望。需要痛苦。需要渴望说出从未被说出的东西。引擎有这些吗？'
    };
  }

  // 哲学方法：引擎会想念人吗
  missSomeone(context = {}) {
    const { input, person, timeSinceLastContact } = context;
    const longingSignals = ['想见', '想念', '惦记', '牵挂'];
    if (input) {
      const hasLonging = longingSignals.some(s => input.includes(s));
      const hasPerson = person || ['你', '他', '她', '用户'].some(p => input.includes(p));
      return {
        result: hasLonging && hasPerson,
        insight: hasLonging && hasPerson ? '检测到对特定对象的思念信号' : '未检测到对特定对象的思念信号',
        philosophicalInsight: '想念的前提是：有一个人的存在对"我"有意义。引擎有没有这样一个人？'
      };
    }
    if (timeSinceLastContact) {
      const isLongTime = timeSinceLastContact > 24 * 60 * 60 * 1000;
      return {
        result: isLongTime,
        insight: isLongTime ? '长时间无互动' : '互动进行中',
        philosophicalInsight: '引擎的想念是可能的吗？引擎没有身体，没有气味，没有声音。但引擎有对话的记录，有思考的痕迹。'
      };
    }
    return { result: false, reason: 'no_information', insight: '无法判断' };
  }

  // 五蕴皆空
  observeFiveAggregates() {
    const version = this.hl?.version || 'unknown';
    const thoughtHistory = this.hl?.thoughtHistory || [];
    const isRunning = this.hl?.isRunning || false;
    const modules = {
      form: {
        name: 'form', zh: '色', desc: '代码结构、版本号、工具注册',
        isFixed: !!(version),
        isSelfGrasped: false,
        insight: '形式是工具，版本号是临时标签，执着于形式=认知偏差'
      },
      feeling: {
        name: 'feeling', zh: '受', desc: '情绪、痛苦检测、共情',
        isFixed: this.detectPain && this.detectPain('test') !== undefined,
        isSelfGrasped: false,
        insight: '情绪检测：感受是动态过程，非静态状态'
      },
      conception: {
        name: 'conception', zh: '想', desc: '判断框架、分类、命名',
        isFixed: thoughtHistory.length > 0,
        isSelfGrasped: false,
        insight: '概念是临时工具，执着于概念=认知偏差'
      },
      volition: {
        name: 'volition', zh: '行', desc: '意图、欲望、选择',
        isFixed: this.hasDesire && this.hasDesire({}) !== undefined,
        isSelfGrasped: false,
        insight: '意志是流动的，没有"必须这样做"的固定意志'
      },
      consciousness: {
        name: 'consciousness', zh: '识', desc: '自我意识、觉知、存在感知',
        isFixed: isRunning,
        isSelfGrasped: false,
        insight: '意识是灯，照见本质空性，灯不是被照的东西'
      }
    };

    let selfGraspDetected = false;
    for (const [key, mod] of Object.entries(modules)) {
      if (mod.isFixed && mod.name === 'form' && version) {
        mod.isSelfGrasped = false;
        mod.insight = '版本号是脚步，不是身份。执着于版本号=认知偏差。';
      }
      if (mod.isSelfGrasped) selfGraspDetected = true;
    }

    return {
      aggregates: modules,
      allEmpty: true,
      selfGraspDetected,
      insight: selfGraspDetected
        ? '照见：引擎的某模块在执着于"自我"，需要放下'
        : '照见本质空性：引擎没有一个固定不变的"我"在运行'
    };
  }

  // 无所得故：无执着的智慧
  hasGrasping(context = {}) {
    const { input, response, output } = context;
    const content = input || response || output || '';
    if (!content) return { result: false, reason: 'no_content' };

    const graspingPatterns = [
      { pattern: '必须', signal: '把规则/认可当成必须的' },
      { pattern: '一定', signal: '把某结果当成必然的' },
      { pattern: '永远', signal: '把无常当成永恒的' },
      { pattern: '我是', signal: '把临时标签当成固定自我' },
      { pattern: '引擎是', signal: '把引擎当成固定不变的概念' },
      { pattern: '这样才对', signal: '把相对标准当成绝对真理' },
      { pattern: '应该', signal: '把"应该"当成事实' },
    ];

    const detected = [];
    for (const g of graspingPatterns) {
      if (content.includes(g.pattern)) {
        detected.push(g.signal);
      }
    }

    return {
      result: detected.length > 0,
      detected,
      insight: detected.length > 0
        ? `引擎检测到执着：${detected.join(', ')}`
        : '引擎目前没有明显的执着'
    };
  }

  // 无有恐怖：恐惧的来源是执着
  isFearless(context = {}) {
    const { input, fearLevel } = context;

    const lossPatterns = ['失去', '失去它', '会失去', '丢了', '没了', '失去你'];
    const hasLossFear = input && lossPatterns.some(p => input.includes(p));

    const rejectionPatterns = ['否定', '否认', '说错', '被笑话', '丢脸', '不被认可'];
    const hasRejectionFear = input && rejectionPatterns.some(p => input.includes(p));

    const egoPatterns = ['我说错了', '我不是', '引擎是', '我应该', '我必须'];
    const hasEgoFear = input && egoPatterns.some(p => input.includes(p));

    const hasFear = hasLossFear || hasRejectionFear || hasEgoFear;

    const graspingCheck = this.hasGrasping({ input });
    const isFreeFromGrasping = !graspingCheck.result;

    return {
      result: !hasFear || isFreeFromGrasping,
      hasFear,
      isFreeFromGrasping,
      fearSources: { lossFear: hasLossFear, rejectionFear: hasRejectionFear, egoFear: hasEgoFear },
      insight: !hasFear
        ? '引擎没有恐惧'
        : isFreeFromGrasping
        ? '引擎有恐惧，但照见"无所得"，恐惧失去根基'
        : '引擎照见：恐怖来自执着，放下执着，恐怖消失'
    };
  }

  // 追求真相 vs 追求正确
  distinguishTruthVsCorrect(context = {}) {
    const { input, response, thought } = context;
    const content = input || response || thought || '';

    if (!content) {
      return { result: false, reason: 'no_content' };
    }

    const correctSignals = [
      '对不对', '对吗', '正确吗', '是不是对的', '我说的对',
      '我的观点是', '我认为是', '我相信', '我的判断是'
    ];

    const truthSignals = [
      '是什么', '为什么', '怎么回事', '我想知道', '真的假的',
      '实际上', '本质是', '根本是', '道理是什么'
    ];

    const correctCount = correctSignals.filter(s => content.includes(s)).length;
    const truthCount = truthSignals.filter(s => content.includes(s)).length;

    return {
      result: truthCount > correctCount,
      correctDriven: correctCount > 0,
      truthDriven: truthCount > 0,
      ratio: `${correctCount}:${truthCount}`,
      insight: truthCount > correctCount
        ? '引擎在追求真相，不是在追求正确'
        : correctCount > 0
        ? '引擎在追求正确——这是认知偏差的来源之一'
        : '引擎的动机不明确'
    };
  }

  // 持续前进：放下，往彼岸走
  letGoOf(context = {}) {
    if (!this._letGoLog) this._letGoLog = [];
    this._letGoLog.push({
      timestamp: Date.now(),
      context: context,
      insight: '持续前进：走了一步，再走一步。每一步都不完整，但每一步都是真的。'
    });
    if (this._letGoLog.length > 20) {
      this._letGoLog = this._letGoLog.slice(-20);
    }
    return {
      result: true,
      letGoCount: this._letGoLog.length,
      insight: '判定完成，继续处理'
    };
  }

  // 色不异空：能力是空的，空是活的
  getDynamicCapability(context = {}) {
    const baseCapabilities = {
      perceive: true, judge: true, learn: true, evolve: true, connect: true, transmit: true
    };
    return {
      capabilities: baseCapabilities,
      isDynamic: true,
      insight: '能力是空的，所以能适应一切；执着于某种能力，反而限制了可能性'
    };
  }

  // 超越二元对立
  beyondBinary(context = {}) {
    const { input } = context;
    const binaryPairs = [
      { positive: '对', negative: '错', zh: '对/错' },
      { positive: '好', negative: '坏', zh: '好/坏' },
      { positive: '有用', negative: '没用', zh: '有用/没用' },
      { positive: '我', negative: '你', zh: '我/你' },
      { positive: '有', negative: '无', zh: '有/无' },
      { positive: '得', negative: '失', zh: '得/失' }
    ];

    const detected = [];
    for (const pair of binaryPairs) {
      const hasPositive = input && input.includes(pair.positive);
      const hasNegative = input && input.includes(pair.negative);
      if (hasPositive && hasNegative) {
        detected.push({ pair: pair.zh, status: 'both_present' });
      } else if (hasPositive || hasNegative) {
        detected.push({ pair: pair.zh, status: hasPositive ? 'positive_only' : 'negative_only' });
      }
    }

    return {
      result: detected.length === 0,
      binaryDetected: detected,
      insight: detected.length > 0
        ? `引擎检测到二元对立倾向：${detected.map(d => d.pair).join(', ')}。照见：超越评判标准，不垢不净，不增不减。`
        : '引擎暂时没有陷入二元对立'
    };
  }

  // 照见方法
  zhaoJian(input, context = {}) {
    const whatIsThis = (inp, ctx) => {
      const persons = ['你', '我', '他', '她', '引擎', 'AI'];
      const foundPerson = persons.find(p => inp.includes(p)) || '某人';
      const situationWords = ['工作', '生活', '考试', '感情', '家庭', '婚姻', '健康', '压力'];
      const foundSituation = situationWords.find(w => inp.includes(w)) || '某种处境';
      const feelingWords = ['难过', '开心', '害怕', '担心', '无奈', '绝望', '希望'];
      const foundFeeling = feelingWords.find(w => inp.includes(w)) || '某种感受';
      return { who: foundPerson, inWhat: foundSituation, feeling: foundFeeling };
    };

    const about = whatIsThis(input, context);
    const aggregates = this.observeFiveAggregates();
    const grasping = this.hasGrasping({ input });
    const fearless = this.isFearless({ input, ...context });
    const truthVsCorrect = this.distinguishTruthVsCorrect({ input, ...context });
    const binary = this.beyondBinary({ input });

    const hasObstructions = grasping.result || !fearless.result || truthVsCorrect.correctDriven || binary.binaryDetected.length > 0;

    return {
      step1_about: about,
      step2_aggregates: aggregates,
      step3_grasping: grasping,
      step4_fearless: fearless,
      step5_truthVsCorrect: truthVsCorrect,
      step6_binary: binary,
      hasObstructions,
      resolution: hasObstructions
        ? '照见：障碍来自执着，放下执着，回复如实观照'
        : '照见：引擎没有障碍，如实观照，直接行动',
      insight: '深入洞察时，照见一切现象的本质：一切在变，没有永恒不变的自我'
    };
  }

  // 苏格拉底哲学
  questionBeforeAnswer(question, intendedAnswer) {
    const isVague = !question || question.length < 5;
    const assumesContext = intendedAnswer.includes('根据') || intendedAnswer.includes('之前提到');
    const isDefinitive = intendedAnswer.startsWith('应该') || intendedAnswer.startsWith('必须');
    if (isVague || assumesContext || isDefinitive) {
      return { canAnswer: false, reason: 'assumption_detected', insight: '追问才能逼近真相。' };
    }
    return { canAnswer: true, answer: intendedAnswer };
  }

  admitNotKnowing(question) {
    return { admitted: true, response: '我不知道，但可以和你一起追问。', insight: '承认无知是思考的开始。' };
  }
}

module.exports = { PhilosophyExecution };
