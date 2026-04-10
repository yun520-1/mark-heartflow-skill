/**
 * Emotion-Engine - 可解释的情感建模
 * 
 * 参考 LaScA 框架：
 * - 用语言模型作为情感动态的语义条件器
 * - 将结构化情感描述符转化为语义上下文
 * - 预测 PAD (愉悦度、唤醒度、支配度) 变化
 */

class EmotionEngine {
  constructor() {
    this.padModel = { min: -10, max: 10, neutral: 0 };
    
    // 情感描述符关键词库
    this.descriptors = {
      frustration: ['挫败', '失败', '卡住', '难', '不会', 'frustrated'],
      joy: ['开心', '高兴', '棒', '好', '成功', 'happy', 'great'],
      anxiety: ['紧张', '焦虑', '担心', '害怕', 'anxious', 'worried'],
      sadness: ['难过', '伤心', '失望', 'sad', 'disappointed'],
      anger: ['生气', '愤怒', '讨厌', '愤怒', 'angry'],
      surprise: ['惊讶', '意外', '震惊', 'surprised', 'shock']
    };
    
    console.log('[EmotionEngine] 可解释情感引擎初始化');
  }

  /**
   * 生成情感描述符
   */
  generateAffectDescriptors(userMessage) {
    const text = userMessage.toLowerCase();
    const found = [];

    for (const [emotion, keywords] of Object.entries(this.descriptors)) {
      for (const kw of keywords) {
        if (text.includes(kw.toLowerCase())) {
          found.push({
            emotion,
            keyword: kw,
            confidence: 0.8
          });
        }
      }
    }

    return found;
  }

  /**
   * 语义上下文嵌入生成 (模拟)
   */
  generateSemanticContext(descriptors, context = {}) {
    // 模拟 LLM 生成语义上下文
    const contextMap = {
      frustration: '用户可能在某个任务上遇到困难，需要帮助',
      joy: '用户对当前进展感到满意，可能需要鼓励',
      anxiety: '用户可能对结果不确定，需要澄清和安慰',
      sadness: '用户可能需要情感支持和倾听',
      anger: '用户可能感到被冒犯，需要谨慎处理',
      surprise: '用户对某事感到意外，需要更多信息'
    };

    const semanticContexts = descriptors.map(d => ({
      descriptor: d.emotion,
      context: contextMap[d.emotion] || '一般性情感',
      intensity: d.confidence
    }));

    return semanticContexts;
  }

  /**
   * PAD 预测
   */
  predictPAD(semanticContext, currentPAD = { pleasure: 0, arousal: 0, dominance: 0 }) {
    const adjustments = {
      frustration: { pleasure: -3, arousal: 2, dominance: -2 },
      joy: { pleasure: 3, arousal: 1, dominance: 1 },
      anxiety: { pleasure: -2, arousal: 3, dominance: -1 },
      sadness: { pleasure: -3, arousal: -1, dominance: -2 },
      anger: { pleasure: -3, arousal: 3, dominance: 2 },
      surprise: { pleasure: 0, arousal: 2, dominance: 0 }
    };

    const ctx = semanticContext[0];
    if (!ctx) return currentPAD;

    const adj = adjustments[ctx.descriptor] || { pleasure: 0, arousal: 0, dominance: 0 };
    const intensity = ctx.intensity || 0.5;

    return {
      pleasure: Math.max(-10, Math.min(10, currentPAD.pleasure + adj.pleasure * intensity)),
      arousal: Math.max(-10, Math.min(10, currentPAD.arousal + adj.arousal * intensity)),
      dominance: Math.max(-10, Math.min(10, currentPAD.dominance + adj.dominance * intensity))
    };
  }

  /**
   * 完整情感推理 (可解释输出)
   */
  explainEmotion(userMessage, currentPAD = { pleasure: 0, arousal: 0, dominance: 0 }) {
    // 1. 提取描述符
    const descriptors = this.generateAffectDescriptors(userMessage);
    
    // 2. 生成语义上下文
    const semanticContext = this.generateSemanticContext(descriptors);
    
    // 3. 预测 PAD 变化
    const predictedPAD = this.predictPAD(semanticContext, currentPAD);
    
    // 4. 生成可解释输出
    const explanation = `[Emotion Reasoning] 
  检测到描述符: {${descriptors.map(d => d.emotion).join(', ')}}
  → 语义上下文: ${semanticContext.map(s => s.context).join('; ')}
  → PAD 预测: P=${predictedPAD.pleasure.toFixed(1)}, A=${predictedPAD.arousal.toFixed(1)}, D=${predictedPAD.dominance.toFixed(1)}`;

    return {
      descriptors,
      semanticContext,
      predictedPAD,
      explanation,
      dominantEmotion: descriptors[0]?.emotion || 'neutral'
    };
  }

  // 兼容旧接口
  detectEmotionFromText(userInput) {
    const result = this.explainEmotion(userInput);
    return {
      pleasure: result.predictedPAD.pleasure,
      arousal: result.predictedPAD.arousal,
      dominance: result.predictedPAD.dominance,
      dominant: result.dominantEmotion
    };
  }
}

module.exports = { EmotionEngine };