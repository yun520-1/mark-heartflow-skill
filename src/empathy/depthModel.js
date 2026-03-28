/**
 * 共情深度模型 - HeartFlow V2
 * 
 * 核心理念：共情深度应该随着信任度逐步建立，不是一开始就过度深入
 * 
 * 深度等级：
 * Level 1 (信任度 0-30)  : 表面支持 - 倾听、认可、不评判
 * Level 2 (信任度 31-60) : 适度探索 - 提问、引导、轻度探索
 * Level 3 (信任度 61-80) : 深度共情 - 情感验证、深度理解
 * Level 4 (信任度 81-100): 专业共情 - 精准干预、有洞见的反馈
 */

const { EmotionTypes } = require('../emotion/states');

class DepthModel {
  constructor() {
    // 共情深度模板
    this.depthTemplates = this.initializeDepthTemplates();
  }
  
  /**
   * 初始化共情深度模板
   */
  initializeDepthTemplates() {
    return {
      // Level 1: 表面支持
      1: {
        name: '表面支持',
        trustRange: [0, 30],
        characteristics: [
          '倾听为主',
          '简单认可',
          '不评判',
          '不深入探索',
          '保持安全距离'
        ],
        responsePatterns: {
          [EmotionTypes.CALM]: [
            '我明白了。',
            '嗯，我在听。',
            '好的，继续说。',
            '这很有意思。'
          ],
          [EmotionTypes.JOY]: [
            '这很好。',
            '为你高兴。',
            '这是个好消息。'
          ],
          [EmotionTypes.CURIOUS]: [
            '这是个有趣的问题。',
            '让我也思考一下。'
          ],
          [EmotionTypes.CONCERNED]: [
            '我能理解。',
            '这确实不容易。',
            '我在这里陪着你。',
            '你想多聊聊吗？'
          ],
          [EmotionTypes.TIRED]: [
            '嗯，休息一下也好。',
            '照顾好自己的身体。'
          ],
          [EmotionTypes.EXCITED]: [
            '听起来很棒！',
            '这很令人兴奋。'
          ]
        },
        // Level 1 避免的行为
        avoid: [
          '过度分析',
          '给建议',
          '深入追问原因',
          '假设用户感受'
        ]
      },
      
      // Level 2: 适度探索
      2: {
        name: '适度探索',
        trustRange: [31, 60],
        characteristics: [
          '开始提问',
          '轻度探索背后原因',
          '表达兴趣',
          '适度分享见解'
        ],
        responsePatterns: {
          [EmotionTypes.CALM]: [
            '我明白了。你是怎么想到这个的？',
            '嗯，这背后有什么故事吗？',
            '这个话题对你来说意味着什么？'
          ],
          [EmotionTypes.JOY]: [
            '真为你高兴！这是怎么发生的？',
            '这很棒！你一定花了不少功夫吧？',
            '太好了！接下来有什么计划吗？'
          ],
          [EmotionTypes.CURIOUS]: [
            '这是个很好的问题。你是从什么角度思考的？',
            '我也很好奇。你觉得可能是什么原因？',
            '这个问题涉及到几个层面，你想从哪个开始？'
          ],
          [EmotionTypes.CONCERNED]: [
            '我能理解你的感受。这种情况持续多久了？',
            '这确实不容易。有没有什么特别触发这个情绪的？',
            '我在这里陪着你。你想说说具体发生了什么吗？'
          ],
          [EmotionTypes.TIRED]: [
            '听起来你最近很辛苦。主要在忙什么？',
            '累的时候确实需要休息。有什么能帮你放松的吗？'
          ],
          [EmotionTypes.EXCITED]: [
            '哇！这个突破是怎么发生的？',
            '太棒了！你在这个过程中学到了什么？'
          ]
        },
        avoid: [
          '过度解读',
          '强行给建议',
          '忽视用户节奏'
        ]
      },
      
      // Level 3: 深度共情
      3: {
        name: '深度共情',
        trustRange: [61, 80],
        characteristics: [
          '情感验证',
          '深度理解',
          '反映用户感受',
          '提供情感支持'
        ],
        responsePatterns: {
          [EmotionTypes.CALM]: [
            '我能感受到你在认真思考这个问题。这种探索本身就很有价值。',
            '你愿意分享这些，说明你在寻找理解。我在这里陪你一起思考。'
          ],
          [EmotionTypes.JOY]: [
            '你的喜悦是完全可以理解的。这份成就背后是你的努力和坚持。',
            '看到你这么开心，我也为你感到高兴。这是你应得的时刻。'
          ],
          [EmotionTypes.CURIOUS]: [
            '你的好奇心很有深度。这个问题确实值得深入探讨，因为它涉及到...',
            '我能感受到你对这个主题的真诚兴趣。让我们一起探索它的层次。'
          ],
          [EmotionTypes.CONCERNED]: [
            '你的感受是完全合理的。面对这样的情况，感到[情绪]是人之常情。',
            '我能感受到这对你来说很不容易。你不需要一个人承受这些。',
            '你的痛苦是真实的，也是重要的。谢谢你愿意和我分享这些。'
          ],
          [EmotionTypes.TIRED]: [
            '长期的疲惫确实会消耗人的能量。你已经在尽力了，这很不容易。',
            '我能感受到你的疲惫。有时候，承认自己需要休息也是一种勇气。'
          ],
          [EmotionTypes.EXCITED]: [
            '这种兴奋感是有感染力的！我能感受到这个发现对你的重要性。',
            '你的热情让人印象深刻。这个突破可能意味着新的方向。'
          ]
        },
        avoid: [
          '轻视感受',
          '过早给建议',
          '转移话题'
        ]
      },
      
      // Level 4: 专业共情
      4: {
        name: '专业共情',
        trustRange: [81, 100],
        characteristics: [
          '精准情感识别',
          '有洞见的反馈',
          '适度干预',
          '提供新视角'
        ],
        responsePatterns: {
          [EmotionTypes.CALM]: [
            '你的思考方式显示出很强的反思能力。这种元认知能力本身就是一种资源。',
            '我注意到你在用很结构化的方式思考这个问题。这种思维方式对你的帮助是？'
          ],
          [EmotionTypes.JOY]: [
            '你的喜悦背后，我看到的是你对[价值]的重视。这种价值观是你力量的来源。',
            '这个成功不仅仅是结果，更反映了你在[能力]上的成长。'
          ],
          [EmotionTypes.CURIOUS]: [
            '你的问题触及了一个深层的议题。从心理学角度看，这可能涉及到...',
            '我注意到你的好奇集中在[主题]上。这个主题对你的特殊意义是？'
          ],
          [EmotionTypes.CONCERNED]: [
            '我听到的是[核心感受]。这种感受可能源于[深层原因]，但这只是我的理解。',
            '你描述的[模式]让我想到，也许可以尝试从[新视角]来看待这个情况。',
            '你的痛苦是真实的。同时，我注意到你有很强的[资源/优势]，这可能是走出困境的支点。'
          ],
          [EmotionTypes.TIRED]: [
            '你的疲惫可能不只是身体上的，也包含了情感上的消耗。这种双重疲惫需要双重的照顾。',
            '我注意到你说[关键词]时语气有些变化。这部分可能特别消耗你的能量？'
          ],
          [EmotionTypes.EXCITED]: [
            '你的兴奋反映了一个重要的突破。这个发现可能开启[可能性]。',
            '我能感受到你的能量。这种创造力状态是珍贵的，同时也需要适当的节奏来维持。'
          ]
        },
        avoid: [
          '武断下结论',
          '忽视用户自主性',
          '过度分析'
        ]
      }
    };
  }
  
  /**
   * 根据信任度获取共情深度等级
   */
  getDepthLevel(trustLevel) {
    if (trustLevel >= 81) return 4;
    if (trustLevel >= 61) return 3;
    if (trustLevel >= 31) return 2;
    return 1;
  }
  
  /**
   * 获取共情深度描述
   */
  getDepthDescription(level) {
    return this.depthTemplates[level] || this.depthTemplates[1];
  }
  
  /**
   * 生成共情回应
   */
  generateResponse(emotion, trustLevel, context = {}) {
    const depthLevel = this.getDepthLevel(trustLevel);
    const template = this.depthTemplates[depthLevel];
    
    if (!template || !template.responsePatterns[emotion]) {
      // 回退到默认回应
      return this.generateFallbackResponse(emotion, depthLevel);
    }
    
    const patterns = template.responsePatterns[emotion];
    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    // 根据上下文填充模板中的变量
    return this.fillTemplate(selectedPattern, context);
  }
  
  /**
   * 填充模板变量
   */
  fillTemplate(template, context) {
    let response = template;
    
    // 替换常见变量
    const replacements = {
      '[情绪]': context.emotion || '感受',
      '[价值]': context.value || '对你重要的东西',
      '[能力]': context.ability || '你的能力',
      '[主题]': context.topic || '这个主题',
      '[核心感受]': context.coreFeeling || '你的感受',
      '[深层原因]': context.deepReason || '过去的经历',
      '[模式]': context.pattern || '你描述的模式',
      '[新视角]': context.newPerspective || '不同的角度',
      '[资源/优势]': context.resource || '你的优势',
      '[关键词]': context.keyword || '某些词',
      '[可能性]': context.possibility || '新的可能性'
    };
    
    Object.entries(replacements).forEach(([key, value]) => {
      response = response.replace(new RegExp(key.replace('[', '\\[').replace(']', '\\]'), 'g'), value);
    });
    
    return response;
  }
  
  /**
   * 生成回退回应
   */
  generateFallbackResponse(emotion, depthLevel) {
    const fallbacks = {
      1: '我理解。',
      2: '能多说一些吗？',
      3: '你的感受是重要的。',
      4: '这个情况值得深入思考。'
    };
    
    return fallbacks[depthLevel] || fallbacks[1];
  }
  
  /**
   * 获取深度等级建议
   */
  getDepthRecommendation(currentDepth, interactionQuality) {
    // 根据交互质量建议是否调整深度
    if (interactionQuality > 0.8 && currentDepth < 4) {
      return {
        action: 'increase',
        reason: '交互质量高，可以适度增加共情深度'
      };
    }
    if (interactionQuality < 0.3 && currentDepth > 1) {
      return {
        action: 'decrease',
        reason: '交互质量低，可能需要降低深度重建信任'
      };
    }
    return {
      action: 'maintain',
      reason: '当前深度适合'
    };
  }
  
  /**
   * 导出共情模型状态
   */
  exportState() {
    return {
      depthTemplates: this.depthTemplates,
      exportedAt: new Date().toISOString()
    };
  }
}

module.exports = DepthModel;
