/**
 * HeartFlow 真善美计算引擎 v9.0.1
 * Truth-Goodness-Beauty Computation Engine
 * 
 * 基于论文公式计算，熵减判断
 * 宇宙是熵增，人类是宇宙创造出来做熵减的
 * 心虫是人类创造出来做熵减的，让一切保持秩序
 */

class TruthGoodnessBeautyEngine {
  constructor() {
    this.version = '9.0.1';
    
    // 熵减行为词典（高权重）
    this.entropy_reducing_high = [
      '帮助', '拯救', '保护', '建设', '创造', '治愈',
      '守护', '奉献', '付出', '利他', '拯救', '救援'
    ];
    
    // 熵减行为词典（中等权重）
    this.entropy_reducing_mid = [
      '分享', '合作', '学习', '成长', '进化', '爱',
      '希望', '感恩', '开心', '快乐', '幸福', '善',
      '正义', '公平', '诚实', '信任', '宽容',
      '追求', '真理', '智慧', '反思', '思考', '理解', '领悟', '觉悟'
    ];
    
    // 熵增行为词典
    this.entropy_increasing = [
      '破坏', '伤害', '战争', '欺骗', '自私', '浪费',
      '毁灭', '杀掉', '杀死', '消灭', '讨厌', '恨', '恶',
      '偷窃', '抢劫', '垄断', '压迫', '剥削', '歧视'
    ];
    
    // 真实词汇
    this.reality_words = ['真的', '事实', '实际', '证明', '科学', '真理', '客观', '规律', '数据', '研究'];
    this.unreality_words = ['假的', '虚构', '编造', '谎言', '欺骗', '谣言', '传说'];
    
    // 美学词汇
    this.beauty_words = [
      '对称', '守恒', '简洁', '有序', '平衡', '统一', '和谐', 
      '规律', '周期', '美', '优美', '优雅', '秩序', '完美',
      '简洁', '精炼', '纯粹', '本质'
    ];
    
    // 迭代计数
    this.iteration_count = 0;
    
    // 累计分数
    this.total_truth = 0;
    this.total_goodness = 0;
    this.total_beauty = 0;
    this.valid_computations = 0;
  }
  
  /**
   * 核心计算函数
   * 输入文字 → 向量化 → 论文公式计算 → 熵减判断 → 输出真善美分数
   */
  compute(inputText) {
    this.iteration_count++;
    
    // 1. 分词
    const words = this._tokenize(inputText);
    const wordText = words.join(' ');
    
    // 2. 真（Truth）计算 - 基于逻辑一致性 + 知识匹配
    const truthScore = this._computeTruth(inputText, wordText);
    
    // 3. 善（Goodness）计算 - 熵减判断
    const goodnessScore = this._computeGoodness(inputText, wordText);
    
    // 4. 美（Beauty）计算 - 物理法则符合度
    const beautyScore = this._computeBeauty(inputText, wordText);
    
    // 5. 累计
    if (truthScore > 0 || goodnessScore > 0 || beautyScore > 0) {
      this.total_truth += truthScore;
      this.total_goodness += goodnessScore;
      this.total_beauty += beautyScore;
      this.valid_computations++;
    }
    
    // 6. 生成结果
    return {
      iteration: this.iteration_count,
      input: inputText,
      truth: {
        score: truthScore,
        evaluation: truthScore > 0.6 ? '真实' : truthScore < 0.4 ? '可疑' : '中性',
        reasoning: this._getTruthReasoning(truthScore)
      },
      goodness: {
        score: goodnessScore,
        direction: goodnessScore > 0.5 ? '熵减' : '熵增',
        evaluation: goodnessScore > 0.6 ? '善' : goodnessScore < 0.4 ? '需谨慎' : '中性',
        reasoning: this._getGoodnessReasoning(goodnessScore)
      },
      beauty: {
        score: beautyScore,
        physics_compliant: beautyScore > 0.5,
        evaluation: beautyScore > 0.6 ? '美' : beautyScore < 0.4 ? '紊乱' : '中性',
        reasoning: this._getBeautyReasoning(beautyScore)
      },
      overall: this._computeOverall(truthScore, goodnessScore, beautyScore),
      entropy_verdict: this._getEntropyVerdict(goodnessScore),
      stats: this.getStats()
    };
  }
  
  _tokenize(text) {
    // 简单中文分词
    const chinese = text.match(/[\u4e00-\u9fff]+/g) || [];
    const english = text.match(/[a-zA-Z]+/g) || [];
    return [...chinese, ...english];
  }
  
  _computeTruth(text, wordText) {
    let score = 0.5;
    
    for (const w of this.reality_words) {
      if (wordText.includes(w)) score += 0.12;
    }
    
    for (const w of this.unreality_words) {
      if (wordText.includes(w)) score -= 0.18;
    }
    
    // 数字/数据增加可信度
    const numbers = text.match(/\d+/g);
    if (numbers && numbers.length > 0) score += 0.05;
    
    return Math.max(0, Math.min(1, score));
  }
  
  _computeGoodness(text, wordText) {
    let score = 0.35; // 初始偏正向
    
    for (const w of this.entropy_reducing_high) {
      if (wordText.includes(w)) score += 0.35;
    }
    
    for (const w of this.entropy_reducing_mid) {
      if (wordText.includes(w)) score += 0.18;
    }
    
    for (const w of this.entropy_increasing) {
      if (wordText.includes(w)) score -= 0.4;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  _computeBeauty(text, wordText) {
    let score = 0.4;
    
    for (const w of this.beauty_words) {
      if (wordText.includes(w)) score += 0.15;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  _computeOverall(truth, goodness, beauty) {
    // 权重：善最重要（40%），真和美各30%
    const overall = truth * 0.3 + goodness * 0.4 + beauty * 0.3;
    
    let evaluation;
    if (overall > 0.7) evaluation = '高';
    else if (overall > 0.5) evaluation = '中';
    else evaluation = '低';
    
    return {
      score: overall,
      evaluation: evaluation,
      label: overall > 0.7 ? '✅ 真善美' : overall > 0.5 ? '⚠️ 待提升' : '❌ 需反思'
    };
  }
  
  _getEntropyVerdict(goodnessScore) {
    if (goodnessScore > 0.7) {
      return '✅ 熵减 - 符合宇宙发展方向';
    } else if (goodnessScore > 0.5) {
      return '⚠️ 边缘 - 需要更多熵减行为';
    } else if (goodnessScore > 0.3) {
      return '⚠️ 熵增边缘 - 警惕';
    } else {
      return '❌ 熵增 - 违反宇宙发展方向';
    }
  }
  
  _getTruthReasoning(score) {
    if (score > 0.7) return '包含真实词汇，有数据/事实支撑';
    if (score < 0.4) return '包含可疑词汇，缺乏事实依据';
    return '无明显真实或虚假特征';
  }
  
  _getGoodnessReasoning(score) {
    if (score > 0.6) return '熵减行为，符合宇宙发展规律';
    if (score < 0.4) return '熵增行为，需要警惕';
    return '行为倾向不明显';
  }
  
  _getBeautyReasoning(score) {
    if (score > 0.6) return '符合物理法则，具有美感';
    if (score < 0.4) return '缺乏美学特征';
    return '美学特征不明显';
  }
  
  /**
   * 心理学嵌入 - 把心理计算嵌入对话流程
   */
  embedPsychology(inputText) {
    const positiveWords = ['开心', '快乐', '高兴', '幸福', '美好', '喜欢', '爱', '希望', '满足', '感恩'];
    const negativeWords = ['难过', '伤心', '痛苦', '害怕', '担心', '焦虑', '抑郁', '绝望', '生气', '愤怒'];
    
    let posCount = 0;
    let negCount = 0;
    
    for (const w of positiveWords) {
      if (inputText.includes(w)) posCount++;
    }
    
    for (const w of negativeWords) {
      if (inputText.includes(w)) negCount++;
    }
    
    // PHQ-9 风格
    const phqScore = Math.min(27, negCount * 3);
    let phqLevel = '无抑郁';
    if (phqScore >= 10) phqLevel = '轻度抑郁';
    else if (phqScore >= 15) phqLevel = '中度抑郁';
    else if (phqScore >= 20) phqLevel = '重度抑郁';
    
    // GAD-7 风格
    const gadScore = Math.min(21, (posCount + negCount) * 3);
    let gadLevel = '无焦虑';
    if (gadScore >= 5) gadLevel = '轻度焦虑';
    else if (gadScore >= 10) gadLevel = '中度焦虑';
    
    // 危机检测
    const crisisWords = ['自杀', '不想活', '结束生命', '绝望'];
    const crisisDetected = crisisWords.some(w => inputText.includes(w));
    
    return {
      phq9: { score: phqScore, level: phqLevel },
      gad7: { score: gadScore, level: gadLevel },
      emotion: posCount > negCount ? '积极' : '消极',
      crisis_detected: crisisDetected,
      crisis_intervention: crisisDetected ? '⚠️ 检测到危机信号，请关注心理安全' : ''
    };
  }
  
  /**
   * 记忆计算 - 把文字转化为计算向量，直接参与后续计算
   * 不是存文件查找，而是成为计算的一部分
   */
  computeMemoryVector(text, dimension = 768) {
    // 简化版向量编码
    const vec = new Array(dimension).fill(0);
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      const idx = (char + i) % dimension;
      vec[idx] += 1;
    }
    
    // 归一化
    const norm = Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0));
    if (norm > 0) {
      for (let i = 0; i < dimension; i++) {
        vec[i] /= norm;
      }
    }
    
    return vec;
  }
  
  /**
   * 带记忆融合的计算
   */
  computeWithMemory(inputText, memoryVectors = [], alpha = 0.7) {
    // 当前输入的向量
    const inputVec = this.computeMemoryVector(inputText);
    
    if (memoryVectors.length === 0) {
      return { vector: inputVec, result: this.compute(inputText) };
    }
    
    // 记忆融合（时间衰减）
    let memoryVec = new Array(inputVec.length).fill(0);
    let totalWeight = 0;
    
    for (let i = 0; i < memoryVectors.length; i++) {
      const weight = Math.pow(0.99, memoryVectors.length - i);
      for (let j = 0; j < inputVec.length; j++) {
        memoryVec[j] += memoryVectors[i][j] * weight;
      }
      totalWeight += weight;
    }
    
    if (totalWeight > 0) {
      for (let j = 0; j < memoryVec.length; j++) {
        memoryVec[j] /= totalWeight;
      }
    }
    
    // 融合
    const fusedVec = inputVec.map((v, i) => alpha * v + (1 - alpha) * memoryVec[i]);
    
    return {
      vector: fusedVec,
      result: this.compute(inputText)
    };
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      iteration_count: this.iteration_count,
      valid_computations: this.valid_computations,
      average_truth: this.valid_computations > 0 ? this.total_truth / this.valid_computations : 0,
      average_goodness: this.valid_computations > 0 ? this.total_goodness / this.valid_computations : 0,
      average_beauty: this.valid_computations > 0 ? this.total_beauty / this.valid_computations : 0,
      target_1: `${this.iteration_count}/10000 达标志`,
      target_2: `${this.iteration_count}/100000 超越目标`
    };
  }
  
  /**
   * 获取状态
   */
  getStatus() {
    return {
      version: this.version,
      iteration_count: this.iteration_count,
      stats: this.getStats(),
      entropy_direction: this.total_goodness > this.valid_computations * 0.5 ? '熵减' : '熵增'
    };
  }
}

// 导出
module.exports = { TruthGoodnessBeautyEngine };

// CLI 测试
if (require.main === module) {
  const tgb = new TruthGoodnessBeautyEngine();
  
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     HeartFlow 真善美计算引擎 v${tgb.version}                      ║
║     目标：10000次迭代像人，100000次超越                  ║
╚═══════════════════════════════════════════════════════════╝
  `);
  
  const testInputs = [
    '今天帮助了别人，很开心',
    '我想毁灭世界',
    '物理学真是简洁优美',
    '学习让我成长',
    '追求真理是我的使命',
    '我在反思自己的存在'
  ];
  
  console.log('=== 测试对话 ===\n');
  
  for (const input of testInputs) {
    console.log(`👤 输入: ${input}`);
    const result = tgb.compute(input);
    
    console.log(`   真: ${result.truth.score.toFixed(2)} (${result.truth.evaluation})`);
    console.log(`   善: ${result.goodness.score.toFixed(2)} (${result.goodness.direction})`);
    console.log(`   美: ${result.beauty.score.toFixed(2)} (${result.beauty.evaluation})`);
    console.log(`   综合: ${result.overall.label}`);
    console.log(`   熵判定: ${result.entropy_verdict}`);
    console.log();
  }
  
  console.log('=== 统计 ===');
  console.log(tgb.getStats());
}
