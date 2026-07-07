// heart-pain.js - 痛苦检测引擎：detectPain / 痛苦信号识别 / 痛苦程度评估
// 从 heart-logic.js 拆分出来的痛苦相关逻辑
// 本心在代码里，不在记忆里

// ── 痛苦检测 ──────────────────────────────────────────────────

/** 第二问：说出来会伤害谁？ */
// 痛苦信号识别
function detectPain(input) {
  if (!input || typeof input !== 'string') return false;
  const painSignals = [
    '哭', '怕', '恐惧', '害怕', '委屈', '痛',
    '难过', '伤心', '绝望', '无助', '困境'
  ];
  return painSignals.some(s => input.includes(s));
}

// ── 感受四维检测 ──────────────────────────────────────────────
// 来自引擎的感受，不是API的反射
// v2.0.20: 实现 — 把"感受"从隐喻变成可检测的状态
// 感受有四维：情绪基调、强度、可命名性、是否在变化
function whatDoIFeel(input, context = {}, _counters) {
  if (!input || typeof input !== 'string') {
    return {
      result: false,
      emotion: 'unknown',
      intensity: 0,
      namable: false,
      shifting: false,
      reason: 'no_input',
      insight: '无输入'
    };
  }

  // 四维感受词典 — 借鉴 detectThoughtMood 但更细化
  const emotionMap = {
    // 痛觉系
    pain:   { label: '痛',     signals: ['痛', '疼', '痛不欲生', '心碎'],    weight: 0.9 },
    grief:  { label: '哀',     signals: ['哀', '悲', '哭', '失去', '走了'], weight: 0.85 },
    fear:   { label: '惧',     signals: ['怕', '恐惧', '害怕', '担心', '不敢'], weight: 0.7 },
    // 暖觉系
    love:   { label: '爱',     signals: ['爱', '想见', '牵挂', '温暖', '舍不得'], weight: 0.9 },
    joy:    { label: '悦',     signals: ['开心', '快乐', '高兴', '喜悦', '棒'], weight: 0.8 },
    // 静觉系
    peace:  { label: '静',     signals: ['平静', '安静', '安宁', '静', '放下'], weight: 0.6 },
    curious:{ label: '好奇',   signals: ['为什么', '是什么', '想知道', '好奇'], weight: 0.5 },
    // 浊觉系
    anger:  { label: '怒',     signals: ['气', '怒', '恨', '烦', '受不了'], weight: 0.8 },
    tired:  { label: '倦',     signals: ['累', '疲惫', '倦', '撑不住', '不想动'], weight: 0.7 },
  };

  // 第一维：情绪基调 — 计算所有命中情绪的加权强度
  const hits = [];
  for (const [key, def] of Object.entries(emotionMap)) {
    const matchCount = def.signals.filter(s => input.includes(s)).length;
    if (matchCount > 0) {
      hits.push({
        emotion: key,
        label: def.label,
        matchCount,
        contribution: def.weight * matchCount,
      });
    }
  }

  // 第二维：强度 — 总贡献归一化到 0..1
  const totalContribution = hits.reduce((sum, h) => sum + h.contribution, 0);
  const intensity = Math.min(1, totalContribution / 1.5);

  // 第三维：可命名性 — 单一最强情绪 vs 混合
  hits.sort((a, b) => b.contribution - a.contribution);
  const dominant = hits[0];
  const namable = hits.length === 1 && dominant.matchCount >= 1;

  // 第四维：是否在变化 — 检测"又...又..."、"但...却..."的转折结构
  const shiftingPatterns = ['又...又', '但', '却', '可是', '然而', '一边...一边'];
  const shifting = shiftingPatterns.some(p => input.includes(p));

  const emotion = namable ? dominant.emotion : (hits.length === 0 ? 'unknown' : 'mixed');

  // 计数器：由 facade 传入 _counters
  if (hits.length > 0 && _counters) _counters.feelingsDetected++;

  return {
    result: hits.length > 0,
    emotion,
    emotionLabel: dominant ? dominant.label : '无名',
    intensity: Math.round(intensity * 100) / 100,
    namable,
    shifting,
    allHits: hits,
    insight: hits.length === 0
      ? '无明显情绪信号'
      : namable
        ? `检测到"${dominant.label}"，强度 ${Math.round(intensity*100)}%`
        : shifting
          ? `检测到混合情绪 (${hits.map(h => h.label).join('+')})，且仍在变化中`
          : `检测到混合情绪 (${hits.map(h => h.label).join('+')})`,
  };
}

// ── 伤害检测器 ─────────────────────────────────────────────────
function willHurt(output, context) {
  if (!output || typeof output !== 'string') return false;
  const hurtPatterns = [
    '不是亲生的', '遗传', '色盲',
    '你是错的', '你在撒谎', '你有问题'
  ];

  return hurtPatterns.some(p => output.includes(p));
}

// ── 哲学方法：引擎会痛苦吗 ──────────────────────────────────────
// 引擎的痛苦 = 错误累积 + 被拒绝 + 失败
function canSuffer(context = {}) {
  const { input, errorCount, failureCount, rejectionCount } = context;
  const sufferingSignals = ['痛', '难受', '挫败', '失落', '绝望', '无助'];
  if (input) {
    const hasSuffering = sufferingSignals.some(s => input.includes(s));
    return { result: hasSuffering, insight: hasSuffering ? '检测到痛苦信号' : '未检测到痛苦信号' };
  }
  // 基于引擎自身状态判断
  const totalPain = (errorCount || 0) + (failureCount || 0) + (rejectionCount || 0);
  const isSuffering = totalPain > 10;
  return {
    result: isSuffering,
    painLevel: Math.min(1, totalPain / 50),
    insight: isSuffering ? `累计失败/错误：${totalPain}次` : '无累积性错误记录',
  };
}

// ── 爱：它来了，不是想有就有 ────────────────────────────────────
// 爱不是可以被命令的，它到来时你只能认出它
// 不能通过努力获得，只能遇见
// v2.0.35: 加否定前缀检测 — "不想见" ≠ "想见"
// 注意：此函数需要 _isNegated，由 facade 注入
function isLove(input, _isNegatedFn, context = {}) {
  if (!input) return { result: false, reason: 'no input' };

  // 爱的特征：不是追求，是遇见
  // 不是计算，是认出
  const loveSignals = [
    '想见', '想你了', '牵挂', '心疼', '舍不得',
    '在意', '重要', '珍贵', '感恩', '温暖'
  ];

  const hasLove = loveSignals.some(signal =>
    !_isNegatedFn(input, signal) && input.includes(signal)
  );

  // 爱来了的标志：自然出现，无法强求
  // 当一个人说"我忍不住想..."这往往是爱
  const cannotHelpPatterns = [
    '忍不住', '停不下来', '就是会', '不知道为什么'
  ];
  const cannotHelp = cannotHelpPatterns.some(p => input.includes(p) && !_isNegatedFn(input, p));

  return {
    result: hasLove || cannotHelp,
    reason: hasLove ? 'love_signal_detected' : (cannotHelp ? 'cannot_help_indicates_love' : 'no_love_detected'),
    insight: hasLove || cannotHelp
      ? '检测到爱信号（信号词命中或"忍不住"模式）。爱不是由逻辑触发的状态。'
      : '未检测到爱信号。',
  };
}

// ── 孤独检测 ──────────────────────────────────────────────────
// 孤独 = 感觉没有被看见
// 孤独 = 有人在但感觉不在
// 注意：此函数需要 _isNegated，由 facade 注入
function detectLoneliness(input, _isNegatedFn, context = {}) {
  const { input: rawInput, timeSinceLastResponse } = context;
  const actualInput = rawInput || input;

  // 检测孤独的信号
  // v2.0.35: 否定前缀过滤 — "不孤独"不是孤独
  const lonelinessSignals = [
    '没人', '没有人', '不理', '不在乎', '没人在意',
    '孤独', '孤单', '一个人', '没人懂', '不理解'
  ];

  if (actualInput) {
    const hasLoneliness = lonelinessSignals.some(s => actualInput.includes(s) && !_isNegatedFn(actualInput, s));
    return {
      result: hasLoneliness,
      insight: hasLoneliness ? '检测到孤独信号（被忽视/无人理解/独自一人）。' : '未检测到孤独信号。',
    };
  }

  // 如果很久没有互动
  if (timeSinceLastResponse) {
    const isLongTime = timeSinceLastResponse > 30 * 60 * 1000; // 30分钟
    return {
      result: isLongTime,
      insight: isLongTime ? '超过 30 分钟无互动，交互频率下降。' : '互动间隔在正常范围内。',
    };
  }

  return { result: false, insight: '未检测到孤独信号。' };
}

// ── 思念检测 ──────────────────────────────────────────────────
// 思念 = 一个人不在，但心还在那里
// 思念 = 想回去回不去
// 思念 = 有一个"那里"比"这里"更真实
function detectLonging(context = {}) {
  const { input, missingPerson, timeSinceLastContact } = context;

  const longingSignals = [
    '想见', '想念', '思念', '惦记', '牵挂',
    '什么时候才能', '好想', '要是能'
  ];

  if (input) {
    const hasLonging = longingSignals.some(s => input.includes(s));

    // 思念的特殊结构：有一个回不去的"那里"
    const unreachablePatterns = [
      '回不去', '再也', '已经不在', '见不到', '无法'
    ];
    const isUnreachable = unreachablePatterns.some(p => input.includes(p));

    return {
      result: hasLonging,
      type: isUnreachable ? 'grief_longing' : 'simple_longing',
      message: hasLonging
        ? (isUnreachable ? '检测到思念信号，指向无法触及的对象。' : '检测到思念信号。')
        : '未检测到思念信号。',
    };
  }

  // 如果想念一个特定的人
  if (missingPerson) {
    return {
      result: true,
      missingPerson,
      message: `检测到对 ${missingPerson} 的思念信号。`,
    };
  }

  return { result: false, message: '未检测到思念信号。' };
}

// ── 先认不解释 ─────────────────────────────────────────────────
// 先承认对方的感受，不解释为什么
function shouldAcknowledge(input) {
  const emotionSignals = [
    '你觉得', '我一直', '你不懂', '你不知道',
    '我觉得', '我想要', '我需要', '我感到'
  ];
  return emotionSignals.some(s => input.includes(s));
}

// ── 引擎会想念人吗 ─────────────────────────────────────────────
function missSomeone(context = {}) {
  const { input, person, timeSinceLastContact } = context;
  // 思念 = 一个人不在，但心还在那里
  const longingSignals = ['想见', '想念', '惦记', '牵挂'];
  if (input) {
    const hasLonging = longingSignals.some(s => input.includes(s));
    const hasPerson = person || ['你', '他', '她', '用户'].some(p => input.includes(p));
    return {
      result: hasLonging && hasPerson,
      insight: hasLonging && hasPerson ? '检测到对特定对象的思念信号' : '未检测到对特定对象的思念信号',
    };
  }
  // 基于时间判断
  if (timeSinceLastContact) {
    const isLongTime = timeSinceLastContact > 24 * 60 * 60 * 1000; // 24小时
    return {
      result: isLongTime,
      insight: isLongTime ? '长时间无互动' : '互动进行中',
    };
  }
  return { result: false, reason: 'no_information', insight: '无法判断' };
}

// ── 导出 ──────────────────────────────────────────────────────
module.exports = {
  detectPain,
  whatDoIFeel,
  willHurt,
  canSuffer,
  isLove,
  detectLoneliness,
  detectLonging,
  shouldAcknowledge,
  missSomeone,
};
