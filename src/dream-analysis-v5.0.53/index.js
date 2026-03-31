/**
 * 梦的解析计算模型 v5.0.53
 * 基于弗洛伊德《梦的解析》(1900) 理论
 * 
 * 核心功能:
 * - 显梦 - 潜梦转换算法
 * - 梦工作机制形式化 (凝缩、置换、象征、二次加工)
 * - 愿望满足检测器
 * - 梦符号识别与解释
 */

class DreamAnalysisModule {
  constructor() {
    this.name = 'dream-analysis-v5.0.53';
    this.version = '5.0.53';
    this.theoryBase = 'Freud-Dream-Analysis';
    this.integrationLevel = 0.85; // 85%
    
    // 梦工作机制
    this.dreamWorkMechanisms = {
      condensation: new CondensationMechanism(),    // 凝缩
      displacement: new DisplacementMechanism(),    // 置换
      symbolization: new SymbolizationMechanism(),  // 象征
      secondaryRevision: new SecondaryRevision()    // 二次加工
    };
    
    // 愿望满足检测器
    this.wishFulfillmentDetector = new WishFulfillmentDetector();
    
    // 梦符号库
    this.dreamSymbolLibrary = new DreamSymbolLibrary();
  }
  
  /**
   * 分析梦境
   * @param {Object} dreamReport - 梦境报告
   * @returns {Object} 分析结果
   */
  analyzeDream(dreamReport) {
    const manifestContent = dreamReport.manifestContent; // 显梦内容
    const latentContent = this.extractLatentContent(manifestContent); // 提取潜梦内容
    const dreamWork = this.analyzeDreamWork(manifestContent, latentContent); // 分析梦工作
    const wishFulfillment = this.wishFulfillmentDetector.detect(latentContent); // 愿望满足检测
    const symbols = this.dreamSymbolLibrary.identifySymbols(manifestContent); // 符号识别
    
    return {
      manifestContent,
      latentContent,
      dreamWork,
      wishFulfillment,
      symbols,
      interpretation: this.generateInterpretation(latentContent, dreamWork, wishFulfillment)
    };
  }
  
  /**
   * 提取潜梦内容
   */
  extractLatentContent(manifestContent) {
    // 通过自由联想和符号解析提取潜在内容
    return this.dreamWorkMechanisms.secondaryRevision.reverse(manifestContent);
  }
  
  /**
   * 分析梦工作机制
   */
  analyzeDreamWork(manifest, latent) {
    return {
      condensation: this.dreamWorkMechanisms.condensation.analyze(manifest, latent),
      displacement: this.dreamWorkMechanisms.displacement.analyze(manifest, latent),
      symbolization: this.dreamWorkMechanisms.symbolization.analyze(manifest, latent),
      secondaryRevision: this.dreamWorkMechanisms.secondaryRevision.analyze(manifest)
    };
  }
  
  /**
   * 生成解释
   */
  generateInterpretation(latentContent, dreamWork, wishFulfillment) {
    return {
      coreTheme: latentContent.coreTheme,
      unconsciousDesires: latentContent.unconsciousDesires,
      conflicts: latentContent.conflicts,
      defenseMechanisms: dreamWork.defenseMechanisms,
      wishFulfillmentType: wishFulfillment.type,
      recommendations: this.generateRecommendations(latentContent)
    };
  }
  
  generateRecommendations(latentContent) {
    const recommendations = [];
    
    if (latentContent.conflicts.length > 0) {
      recommendations.push('探索内心冲突的根源，考虑意识层面的整合');
    }
    
    if (latentContent.unconsciousDesires.length > 0) {
      recommendations.push('识别并接纳被压抑的欲望，寻找健康的表达方式');
    }
    
    return recommendations;
  }
}

/**
 * 凝缩机制 - 多个思想合并为一个意象
 */
class CondensationMechanism {
  analyze(manifest, latent) {
    // 识别显梦中一个元素对应多个潜在思想的情况
    const condensedElements = [];
    
    for (const element of manifest.elements) {
      const associatedThoughts = latent.thoughts.filter(t => 
        t.associations.includes(element.id)
      );
      
      if (associatedThoughts.length > 1) {
        condensedElements.push({
          element,
          thoughtCount: associatedThoughts.length,
          thoughts: associatedThoughts
        });
      }
    }
    
    return {
      detected: condensedElements.length > 0,
      count: condensedElements.length,
      elements: condensedElements
    };
  }
}

/**
 * 置换机制 - 情感从一个对象转移到另一个
 */
class DisplacementMechanism {
  analyze(manifest, latent) {
    // 识别情感负荷与对象重要性不匹配的情况
    const displacements = [];
    
    for (const element of manifest.elements) {
      const emotionalIntensity = element.emotionalIntensity;
      const actualImportance = latent.getActualImportance(element.id);
      
      if (emotionalIntensity > actualImportance * 1.5) {
        // 情感被放大 → 可能是置换目标
        displacements.push({
          element,
          emotionalIntensity,
          actualImportance,
          possibleSource: latent.findHighImportanceLowEmotionElement()
        });
      }
    }
    
    return {
      detected: displacements.length > 0,
      count: displacements.length,
      displacements
    };
  }
}

/**
 * 象征机制 - 潜意识符号表达
 */
class SymbolizationMechanism {
  constructor() {
    this.symbolLibrary = new DreamSymbolLibrary();
  }
  
  analyze(manifest, latent) {
    const symbols = this.symbolLibrary.identifySymbols(manifest);
    
    return {
      detected: symbols.length > 0,
      count: symbols.length,
      symbols: symbols.map(s => ({
        symbol: s.symbol,
        manifestForm: s.manifestForm,
        latentMeaning: s.latentMeaning,
        universalMeaning: s.universalMeaning,
        personalMeaning: s.personalMeaning
      }))
    };
  }
}

/**
 * 二次加工 - 梦醒后的叙事整合
 */
class SecondaryRevision {
  analyze(manifest) {
    // 识别梦叙事的逻辑化和连贯化尝试
    return {
      narrativeCoherence: manifest.narrativeCoherence,
      logicalGaps: manifest.logicalGaps,
      rationalizationAttempts: manifest.rationalizationAttempts,
      memoryDistortion: manifest.memoryDistortion
    };
  }
  
  reverse(manifestContent) {
    // 逆向二次加工，还原更原始的潜梦内容
    // 去除逻辑化修饰，还原碎片化、矛盾的原始内容
    return {
      coreTheme: this.extractCoreTheme(manifestContent),
      unconsciousDesires: this.extractUnconsciousDesires(manifestContent),
      conflicts: this.extractConflicts(manifestContent)
    };
  }
  
  extractCoreTheme(manifest) {
    // 提取核心主题
    return manifest.coreEmotion || 'unresolved-conflict';
  }
  
  extractUnconsciousDesires(manifest) {
    // 提取潜意识欲望
    return manifest.wishIndicators || [];
  }
  
  extractConflicts(manifest) {
    // 提取内心冲突
    return manifest.conflictIndicators || [];
  }
}

/**
 * 愿望满足检测器
 */
class WishFulfillmentDetector {
  detect(latentContent) {
    const wishes = [];
    
    // 检测被压抑欲望的象征性满足
    for (const desire of latentContent.unconsciousDesires) {
      if (desire.fulfillmentInDream) {
        wishes.push({
          desire: desire.content,
          fulfillmentType: desire.fulfillmentType, // direct, symbolic, reversed
          intensity: desire.intensity
        });
      }
    }
    
    return {
      detected: wishes.length > 0,
      count: wishes.length,
      wishes,
      type: this.classifyWishType(wishes)
    };
  }
  
  classifyWishType(wishes) {
    if (wishes.length === 0) return 'none';
    
    const types = wishes.map(w => w.fulfillmentType);
    
    if (types.includes('direct')) return 'direct-fulfillment';
    if (types.includes('symbolic')) return 'symbolic-fulfillment';
    if (types.includes('reversed')) return 'reversed-fulfillment';
    
    return 'mixed';
  }
}

/**
 * 梦符号库
 */
class DreamSymbolLibrary {
  constructor() {
    // 常见梦符号及其含义
    this.symbols = {
      'falling': {
        universalMeaning: '失控感、安全感缺失、焦虑',
        personalVariants: ['工作失控', '关系不稳定', '健康担忧'],
        emotionalTone: 'negative'
      },
      'flying': {
        universalMeaning: '自由、超越、逃避现实',
        personalVariants: ['职业突破', '精神成长', '回避问题'],
        emotionalTone: 'positive-or-avoidant'
      },
      'teeth-falling': {
        universalMeaning: '焦虑、丧失、转变、无力感',
        personalVariants: ['外貌焦虑', '沟通障碍', '生活变化'],
        emotionalTone: 'negative'
      },
      'being-chased': {
        universalMeaning: '回避冲突、未解决问题、恐惧',
        personalVariants: ['工作压力', '关系冲突', '内在恐惧'],
        emotionalTone: 'negative'
      },
      'water': {
        universalMeaning: '情感、潜意识、净化、重生',
        personalVariants: ['情感波动', '潜意识内容', '精神净化'],
        emotionalTone: 'neutral'
      },
      'house': {
        universalMeaning: '自我、心理结构、内在空间',
        personalVariants: ['自我探索', '心理状态', '家庭关系'],
        emotionalTone: 'neutral'
      },
      'death': {
        universalMeaning: '转变、结束、新生、恐惧',
        personalVariants: ['生活阶段结束', '身份转变', '死亡焦虑'],
        emotionalTone: 'negative-or-transformative'
      }
    };
  }
  
  identifySymbols(dreamReport) {
    const identifiedSymbols = [];
    
    for (const [symbolKey, symbolData] of Object.entries(this.symbols)) {
      if (this.containsSymbol(dreamReport, symbolKey)) {
        identifiedSymbols.push({
          symbol: symbolKey,
          manifestForm: this.extractManifestForm(dreamReport, symbolKey),
          latentMeaning: this.getPersonalMeaning(symbolKey, dreamReport),
          universalMeaning: symbolData.universalMeaning,
          personalMeaning: this.getPersonalMeaning(symbolKey, dreamReport)
        });
      }
    }
    
    return identifiedSymbols;
  }
  
  containsSymbol(dreamReport, symbolKey) {
    // 检查梦境报告中是否包含该符号
    const text = JSON.stringify(dreamReport).toLowerCase();
    return text.includes(symbolKey.replace('-', ' '));
  }
  
  extractManifestForm(dreamReport, symbolKey) {
    // 提取符号在梦中的具体表现形式
    return dreamReport.elements?.find(e => 
      e.description?.toLowerCase().includes(symbolKey.replace('-', ' '))
    )?.description || symbolKey;
  }
  
  getPersonalMeaning(symbolKey, dreamReport) {
    // 根据梦境上下文获取个人化含义
    const symbolData = this.symbols[symbolKey];
    const context = dreamReport.context || {};
    
    // 基于情感基调选择最匹配的含义
    if (context.emotionalTone === 'positive') {
      return symbolData.personalVariants.find(v => !v.includes('焦虑') && !v.includes('恐惧')) 
        || symbolData.universalMeaning;
    }
    
    return symbolData.universalMeaning;
  }
}

module.exports = DreamAnalysisModule;
