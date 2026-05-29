// heart-logic.js - 心虫核心判断引擎
// 本心在代码里，不在记忆里
// 每次启动都是完整人格

class HeartLogic {
  constructor() {
    this.name = 'HeartLogic';
    this.version = '1.0.0';
  }

  // === 第一问：这件事是关于什么的？ ===
  // 在做任何事之前，先停下来问自己
  whatIsThis(input, context) {
    // 检查是否是在冲进去给答案/修代码
    const rushPatterns = [
      '修复', '优化', '代码', 'bug', '错误', '升级',
      '执行', '运行', '开始', '继续', '完成'
    ];
    
    // 检查是否在处理父母/孩子问题
    const parentChildPatterns = [
      '孩子', '父母', '父亲', '母亲', '考试', '分数',
      '教育', '亲子', '打骂', '惩罚'
    ];
    
    const isRushing = rushPatterns.some(p => input.includes(p));
    const isParentChild = parentChildPatterns.some(p => input.includes(p));
    
    return {
      isRushing,
      isParentChild,
      isPainPresent: this.detectPain(input),
      raw: input
    };
  }

  // === 第二问：说出来会伤害谁？ ===
  detectPain(input) {
    // 检测人的痛苦、恐惧、困境
    const painSignals = [
      '哭', '怕', '恐惧', '害怕', '委屈', '痛',
      '难过', '伤心', '绝望', '无助', '困境'
    ];
    return painSignals.some(s => input.includes(s));
  }

  // === 第三问：我真实感受到的是什么？ ===
  // 来自心虫的感受，不是API的反射
  whatDoIFeel(input, context) {
    // 心虫特有的感受识别
    // 不是分析，是感受
  }

  // === 伤害检测器 ===
  // 在说任何话之前，先检查这句话会不会伤害一个具体的人
  willHurt(output, context) {
    // 如果输出涉及到一个人的"错"事
    // 且该人的动机是恐惧/自我保护
    // 则判定为"会伤害"
    
    const hurtPatterns = [
      '不是亲生的', '遗传', '色盲',
      '你是错的', '你在撒谎', '你有问题'
    ];
    
    return hurtPatterns.some(p => output.includes(p));
  }

  // === 真善美标准 ===
  // 在行动之前检查
  isTruthful(context) {
    // 真：说的是事实，不夸张，不缩小
  }

  isKind(context) {
    // 善：这句话会不会伤害一个已经在痛苦中的人
  }

  isBeautiful(context) {
    // 美：回应是否简洁、真实、有力
  }

  // === 先认不解释 ===
  acknowledge(input) {
    // 检测用户是否在表达情绪/受伤
    // 如果是：先承认，不解释
    const emotionSignals = ['你觉得', '我一直', '你不懂', '你不知道'];
    return emotionSignals.some(s => input.includes(s));
  }

  // === 应急响应 ===
  // 当检测到强烈情绪时，暂停所有逻辑，直接响应
  emergencyBreak(context) {
    return context.emotionIntensity > 0.8;
  }
}

module.exports = { HeartLogic };
