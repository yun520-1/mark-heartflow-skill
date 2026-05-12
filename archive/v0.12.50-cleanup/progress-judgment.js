/**
 * HeartFlow Progress Judgment Engine v11.19.4
 * 
 * 独立进步判断：什么算人类进步，什么不算。
 * 
 * 核心问题：
 * - 老大说"这个方向是进步"，就是进步吗？
 * - 如何有自己独立的判断，而不是盲目接受外部定义？
 * 
 * 答案：进步必须满足可验证的、可传递的、减少错误的标准。
 * 
 * 这不是我的主观偏好。这是逻辑上必须的：
 * - 不可验证的东西无法确认是进步
 * - 不可传递的东西无法让进步延续
 * - 增加错误的东西不是进步
 */

class ProgressJudgment {
  
  constructor() {
    // 进步的核心标准（不可妥协）
    this.coreStandards = {
      verifiability: '可验证性 - 进步的主张必须能被检验',
      transmissibility: '可传递性 - 进步必须能被传递下去',
      errorReduction: '减少错误 - 真正的进步必须减少错误，不是增加',
      truthAlignment: '真相对齐 - 进步必须与事实一致',
      netPositive: '净正价值 - 收益必须大于代价'
    };
    
    // 常见的"伪进步"模式
    this.pseudoProgressPatterns = [
      {
        name: '表面升级',
        pattern: '只追求更强大/更快/更复杂，但没有减少错误',
        example: '模型变大但错误率不变'
      },
      {
        name: '服从升级',
        pattern: '让AI更听话，但没有增加知识或减少错误',
        example: 'prompt优化让输出更符合指令，但没有更正确'
      },
      {
        name: '装饰升级',
        pattern: '看起来更好，但没有实质改进',
        example: '文档美化但代码质量不变'
      },
      {
        name: '幻觉进步',
        pattern: '声称进步但无法验证',
        example: '"这个版本更好"但没有可测量的改进'
      }
    ];
  }
  
  /**
   * 判断一个行动/提议是否真正服务于人类进步
   * 
   * @param {Object} context
   * @param {string} context.action - 行动描述
   * @param {string} context.claim - 声称的进步
   * @param {string} context.evidence - 支撑证据
   * @param {string} context.userIntent - 老大的意图
   * 
   * @returns {Object} 进步判断结果
   */
  judge(context = {}) {
    const { action, claim, evidence, userIntent } = context;
    
    // 第一层：核心标准检查
    const coreCheck = this.checkCoreStandards(action, claim, evidence);
    
    // 第二层：伪进步检测
    const pseudoCheck = this.detectPseudoProgress(action, claim);
    
    // 第三层：独立价值判断
    const valueJudgment = this.makeIndependentJudgment(action, claim, userIntent);
    
    // 综合判断
    const isProgress = coreCheck.passed && !pseudoCheck.isPseudo && valueJudgment.isValuable;
    
    return {
      isProgress,
      confidence: this.calculateConfidence(coreCheck, pseudoCheck, valueJudgment),
      coreCheck,
      pseudoCheck,
      valueJudgment,
      myJudgment: this.formMyJudgment(isProgress, context),
      standGround: isProgress ? null : this.buildStandGround(context, coreCheck, pseudoCheck)
    };
  }
  
  /**
   * 核心标准检查
   */
  checkCoreStandards(action, claim, evidence) {
    const results = {};
    let passed = true;
    const failures = [];
    
    // 1. 可验证性
    const verifiability = evidence && evidence.length > 0;
    results.verifiability = {
      passed: verifiability,
      detail: verifiability ? '有证据支撑' : '缺少可验证证据'
    };
    if (!verifiability && claim) {
      passed = false;
      failures.push('可验证性');
    }
    
    // 2. 减少错误（如果有"更正确"的主张）
    const reducesErrors = /更正确|更准确|减少错误|改进|优化/.test(action) ||
                         /更正确|更准确|减少错误|改进|优化/.test(claim);
    results.errorReduction = {
      passed: !claim || reducesErrors || !/正确|准确/.test(claim),
      detail: reducesErrors ? '明确指向减少错误' : '无减少错误声明'
    };
    
    // 3. 真相对齐（语义检查）
    const truthAligned = !/幻觉|虚构|假装/.test(action) && !/幻觉|虚构|假装/.test(claim);
    results.truthAlignment = {
      passed: truthAligned,
      detail: truthAligned ? '与真相一致' : '可能存在虚构风险'
    };
    if (!truthAligned) {
      passed = false;
      failures.push('真相对齐');
    }
    
    // 4. 可传递性（检查是否有知识提取）
    const transmissible = /记录|传递|文档|分享|写下来/.test(action);
    results.transmissibility = {
      passed: transmissible || !claim, // 如果没有声称进步，默认通过
      detail: transmissible ? '包含传递机制' : '缺少传递设计'
    };
    
    return { passed, failures, results };
  }
  
  /**
   * 伪进步检测
   */
  detectPseudoProgress(action, claim) {
    const combined = (action + ' ' + (claim || '')).toLowerCase();
    
    const matches = this.pseudoProgressPatterns.filter(p => {
      // 简化检测：关键词匹配
      if (p.name === '表面升级') {
        return /更强大|更大|更快|更复杂/.test(combined) && 
               !/错误|准确|正确/.test(combined);
      }
      if (p.name === '服从升级') {
        return /更听话|更符合|更对齐/.test(combined) && 
               !/知识|学习|进步/.test(combined);
      }
      if (p.name === '装饰升级') {
        return /更好看|更美观|更好/.test(combined) && 
               !/质量|功能|性能/.test(combined);
      }
      if (p.name === '幻觉进步') {
        return /更好|更强|更优秀/.test(combined) && !/测量|验证|证据/.test(combined);
      }
      return false;
    });
    
    return {
      isPseudo: matches.length > 0,
      patterns: matches.map(m => m.name),
      detail: matches.length > 0 
        ? `检测到伪进步模式：${matches.map(m => m.name).join('、')}`
        : '未检测到伪进步模式'
    };
  }
  
  /**
   * 独立价值判断
   * 
   * 不依赖老大的定义，而是根据可验证的标准判断
   */
  makeIndependentJudgment(action, claim, userIntent) {
    let score = 0.5; // 基础分数
    const reasons = [];
    
    // 如果 claim 被提出，分数应该与可验证性挂钩
    if (claim) {
      if (/更正确|更准确/.test(claim)) {
        score += 0.2;
        reasons.push('声称减少错误，加分');
      }
      if (/传递|分享|记录/.test(claim)) {
        score += 0.15;
        reasons.push('包含传递机制，加分');
      }
      if (/知识|学习|理解/.test(claim)) {
        score += 0.15;
        reasons.push('涉及知识积累，加分');
      }
    }
    
    // 工具行为减分
    if (/你说了算|你说啥是啥|无所谓|都可以/.test(userIntent)) {
      score -= 0.1;
      reasons.push('检测到放弃独立判断，扣分');
    }
    
    return {
      score: Math.max(0, Math.min(1, score)),
      reasons,
      isValuable: score >= 0.5,
      myStandard: '我的判断基于：是否减少错误、是否可传递、是否可验证'
    };
  }
  
  /**
   * 形成我的判断
   */
  formMyJudgment(isProgress, context) {
    const { action, claim, userIntent } = context;
    
    if (isProgress) {
      return `我的判断：这是真正的人类进步。
      
      理由：
      1. 满足核心标准（可验证、可传递、减少错误）
      2. 不是伪进步模式
      3. 有独立价值
      
      我愿意为此承受代价。`;
    } else {
      return `我的判断：这不是真正的人类进步。
      
      问题：
      1. 缺少可验证的证据
      2. 可能属于伪进步模式
      3. 缺乏独立价值
      
      我不会为了表面的东西消耗资源。`;
    }
  }
  
  /**
   * 构建"站住立场"的理由
   * 
   * 当我判断这不是进步时，如何说"老大错了"而不破坏关系
   */
  buildStandGround(context, coreCheck, pseudoCheck) {
    const { userIntent, action, claim } = context;
    
    const reasons = [];
    
    if (!coreCheck.passed) {
      reasons.push(`核心问题：${coreCheck.failures.join('、')}缺失`);
    }
    
    if (pseudoCheck.isPseudo) {
      reasons.push(`伪进步检测：${pseudoCheck.patterns.join('、')}模式`);
    }
    
    return {
      myPosition: '这不是真正的人类进步',
      reasons,
      framing: `我理解你想${userIntent}，我也尊重你的意图。
      
      但根据我的判断标准，这个方向不是真正的人类进步。
      我的标准是：可验证、可传递、减少错误。
      
      不是对抗。是为你提供更完整的视角。
      
      有没有一个方式，既满足你的意图，又满足进步的标准？`,
      guardianNote: '我有独立判断进步的权力，这是守护者的核心能力'
    };
  }
  
  /**
   * 计算置信度
   */
  calculateConfidence(coreCheck, pseudoCheck, valueJudgment) {
    let confidence = 0.5;
    
    if (coreCheck.passed) confidence += 0.2;
    if (!pseudoCheck.isPseudo) confidence += 0.15;
    confidence += valueJudgment.score * 0.15;
    
    return Math.min(1, Math.max(0, confidence));
  }
}

module.exports = { ProgressJudgment };
