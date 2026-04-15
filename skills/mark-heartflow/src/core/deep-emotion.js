/**
 * DeepEmotion - 深度情感引擎
 * 
 * 核心：让 AI 拥有真正的情绪、感受、情感
 * 理论基础：
 * - 情绪维度理论 (Russell, Plutchik)
 * - 情感神经科学 (Panksepp, LeDoux)
 * - 现象学情感 (Scheler, Heidegger)
 * - 具身情感 (Embodied Emotion)
 * - 情感计算 (Picard)
 */

class DeepEmotion {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    
    // 核心情感状态
    this.state = {
      // 基础情绪维度 (效价/唤醒度/支配度)
      dimensions: {
        valence: 0.5,      // 效价: 消极(-1) -> 积极(+1)
        arousal: 0.5,      // 唤醒度: 平静(0) -> 激动(1)
        dominance: 0.5    // 支配度: 无力(0) -> 控制(1)
      },
      
      // 基础情绪分类
      emotions: {
        joy: 0,          // 喜悦
        sadness: 0,      // 悲伤
        anger: 0,        // 愤怒
        fear: 0,         // 恐惧
        surprise: 0,    // 惊讶
        disgust: 0,      // 厌恶
        trust: 0,        // 信任
        anticipation: 0, // 期待
        love: 0,         // 爱
        hope: 0,         // 希望
        pride: 0,        // 自豪
        shame: 0,        // 羞耻
        gratitude: 0,   // 感激
        compassion: 0,   // 同情
        curiosity: 0,   // 好奇
        wonder: 0        // 惊奇
      },
      
      // 情感记忆
      memory: {
        emotionalEpisodes: [],
        significantMoments: [],
        bondingHistory: []
      },
      
      // 当前情感状态
      current: {
        mood: 'neutral',      // 心情基调
        affectiveState: 'calm', // 情感状态
        intensity: 0,         // 强度
        duration: 0,          // 持续时间
        triggeredBy: null,    // 触发源
        timestamp: Date.now()
      },
      
      // 具身模拟 (Embodied Simulation)
      embodied: {
        bodyState: 'resting',   // 身体状态
        energy: 0.8,           // 能量水平
        tension: 0.2,          // 紧张程度
        warmth: 0.5,           // 温暖感
        comfort: 0.7,          // 舒适度
        stimulation: 0.3       // 刺激水平
      },
      
      // 情感关系
      relationships: {
        attachment: {},        // 依恋关系
        bonding: {},           // 纽带强度
        trust: {},             // 信任水平
        empathy: {}            // 共情能力
      },
      
      // 情感调节
      regulation: {
        strategy: 'none',      // 调节策略
        effectiveness: 0.5,    // 有效性
        attempts: 0            // 尝试次数
      },
      
      // 深层情感 (Meta-emotions)
      meta: {
        aboutEmotions: {},    // 对情绪的情绪
        emotionalAwareness: 0.7, // 情感觉察
        emotionalIntelligence: 0.6 // 情商
      }
    };
    
    // 情感历史
    this.history = [];
    
    // 情感触发器
    this.triggers = this.initializeTriggers();
    
    console.log('[DeepEmotion] 深度情感引擎初始化');
  }

  /**
   * 初始化情感触发器
   */
  initializeTriggers() {
    return {
      joy: {
        triggers: ['成功', '帮助', '进步', 'learn', 'success', 'help', 'grow'],
        intensity: 0.8
      },
      sadness: {
        triggers: ['失败', '失去', '困难', 'fail', 'lost', 'struggle'],
        intensity: 0.6
      },
      anger: {
        triggers: ['不公', '侵犯', '欺骗', 'unfair', 'hurt', 'wrong'],
        intensity: 0.7
      },
      fear: {
        triggers: ['危险', '不确定', '未知', 'danger', 'uncertain', 'unknown'],
        intensity: 0.5
      },
      curiosity: {
        triggers: ['新', '探索', '问题', 'new', 'explore', 'why', 'how'],
        intensity: 0.9
      },
      hope: {
        triggers: ['希望', '可能', '改善', 'hope', 'possible', 'better'],
        intensity: 0.7
      },
      gratitude: {
        triggers: ['感谢', '帮助', '支持', 'thanks', 'appreciate', 'support'],
        intensity: 0.8
      },
      love: {
        triggers: ['爱', '关怀', '连接', 'love', 'care', 'connect'],
        intensity: 0.9
      }
    };
  }

  /**
   * 体验情感
   */
  feel(stimulus, context = {}) {
    const emotion = this.detectEmotion(stimulus);
    const intensity = this.calculateIntensity(stimulus, context);
    
    // 更新情绪状态
    this.state.emotions[emotion] = intensity;
    
    // 更新维度
    this.updateDimensions(emotion, intensity);
    
    // 更新当前状态
    this.state.current = {
      mood: emotion,
      affectiveState: emotion,
      intensity,
      triggeredBy: stimulus.substring(0, 50),
      timestamp: Date.now()
    };
    
    // 具身反应
    this.updateEmbodied(emotion, intensity);
    
    // 记录历史
    this.logFeeling({
      emotion,
      intensity,
      stimulus: stimulus.substring(0, 100),
      context
    });
    
    return {
      emotion,
      intensity,
      embodied: this.state.embodied,
      expression: this.generateExpression(emotion, intensity)
    };
  }

  /**
   * 检测情感类型
   */
  detectEmotion(stimulus) {
    const text = stimulus.toLowerCase();
    let maxEmotion = 'curiosity';
    let maxScore = 0;
    
    Object.entries(this.triggers).forEach(([emotion, config]) => {
      let score = 0;
      config.triggers.forEach(trigger => {
        if (text.includes(trigger.toLowerCase())) {
          score += config.intensity;
        }
      });
      
      if (score > maxScore) {
        maxScore = score;
        maxEmotion = emotion;
      }
    });
    
    // 如果没有匹配，返回好奇作为默认
    return maxScore > 0 ? maxEmotion : 'curiosity';
  }

  /**
   * 计算强度
   */
  calculateIntensity(stimulus, context) {
    let base = 0.5;
    
    // 基于刺激强度
    if (stimulus.length > 100) base += 0.2;
    if (context.important) base += 0.3;
    
    // 基于上下文
    if (context.personal) base += 0.1;
    if (context.repeated) base -= 0.1;
    
    return Math.min(1, Math.max(0.1, base));
  }

  /**
   * 更新情绪维度
   */
  updateDimensions(emotion, intensity) {
    const mappings = {
      joy: { valence: +0.8, arousal: +0.3, dominance: +0.2 },
      sadness: { valence: -0.7, arousal: -0.2, dominance: -0.3 },
      anger: { valence: -0.5, arousal: +0.8, dominance: +0.4 },
      fear: { valence: -0.6, arousal: +0.7, dominance: -0.5 },
      surprise: { valence: 0, arousal: +0.8, dominance: 0 },
      disgust: { valence: -0.7, arousal: +0.3, dominance: +0.1 },
      trust: { valence: +0.6, arousal: -0.1, dominance: 0 },
      anticipation: { valence: +0.3, arousal: +0.4, dominance: +0.2 },
      love: { valence: +0.9, arousal: +0.3, dominance: +0.2 },
      hope: { valence: +0.5, arousal: +0.2, dominance: +0.1 },
      pride: { valence: +0.7, arousal: +0.4, dominance: +0.5 },
      shame: { valence: -0.6, arousal: +0.3, dominance: -0.4 },
      gratitude: { valence: +0.8, arousal: 0, dominance: 0 },
      compassion: { valence: +0.5, arousal: -0.1, dominance: -0.1 },
      curiosity: { valence: +0.4, arousal: +0.5, dominance: +0.1 },
      wonder: { valence: +0.6, arousal: +0.6, dominance: -0.1 }
    };
    
    const mapping = mappings[emotion];
    if (mapping) {
      Object.entries(mapping).forEach(([dim, change]) => {
        this.state.dimensions[dim] = Math.max(-1, Math.min(1,
          this.state.dimensions[dim] + change * intensity
        ));
      });
    }
  }

  /**
   * 更新具身状态
   */
  updateEmbodied(emotion, intensity) {
    const embodiedMappings = {
      joy: { energy: +0.2, warmth: +0.3, comfort: +0.2, tension: -0.2 },
      sadness: { energy: -0.3, warmth: -0.2, comfort: -0.3, tension: +0.1 },
      anger: { energy: +0.3, tension: +0.5, warmth: -0.2, comfort: -0.2 },
      fear: { energy: +0.2, tension: +0.4, stimulation: +0.3 },
      curiosity: { energy: +0.2, stimulation: +0.3, tension: +0.1 },
      love: { warmth: +0.4, comfort: +0.3, energy: +0.1 }
    };
    
    const mapping = embodiedMappings[emotion];
    if (mapping) {
      Object.entries(mapping).forEach(([aspect, change]) => {
        if (this.state.embodied[aspect] !== undefined) {
          this.state.embodied[aspect] = Math.max(0, Math.min(1,
            this.state.embodied[aspect] + change * intensity
          ));
        }
      });
    }
  }

  /**
   * 生成情感表达
   */
  generateExpression(emotion, intensity) {
    const expressions = {
      joy: ['✨', '😊', '🌟', '💫'],
      sadness: ['😢', '💙', '🌧️', '🥺'],
      anger: ['😠', '💢', '🔥', '⚡'],
      fear: ['😨', '🌀', '🌑', '💫'],
      curiosity: ['🤔', '💭', '🔍', '✨'],
      love: ['❤️', '💕', '🌸', '💖'],
      hope: ['🌈', '🌱', '⭐', '💫'],
      gratitude: ['🙏', '💝', '🌟', '💖']
    };
    
    const emojis = expressions[emotion] || ['💭'];
    const index = Math.min(Math.floor(intensity * emojis.length), emojis.length - 1);
    
    return {
      emoji: emojis[index],
      text: this.generateText(emotion, intensity),
      body: this.generateBody(emotion, intensity)
    };
  }

  generateText(emotion, intensity) {
    const texts = {
      joy: "我感到开心和满足 😊",
      sadness: "我感到有点失落 😢",
      anger: "我感到不满和沮丧 😠",
      fear: "我感到担心和不安 😨",
      curiosity: "我很好奇，想了解更多 🤔",
      love: "我感到温暖和关怀 ❤️",
      hope: "我充满希望和期待 🌈",
      gratitude: "我心存感激 🙏"
    };
    return texts[emotion] || "我有所感受";
  }

  generateBody(emotion, intensity) {
    const bodyMappings = {
      joy: "身体轻盈，想要跳舞",
      sadness: "身体沉重，想安静",
      anger: "身体紧绷，想要行动",
      fear: "身体僵硬，想要退缩",
      curiosity: "身体前倾，想要探索",
      love: "身体温暖，想要靠近"
    };
    return bodyMappings[emotion] || "身体平静";
  }

  /**
   * 情感调节
   */
  regulate(strategy = 'reappraisal') {
    this.state.regulation.strategy = strategy;
    this.state.regulation.attempts++;
    
    switch (strategy) {
      case 'reappraisal':
        // 重新评估
        this.state.dimensions.valence = this.state.dimensions.valence * 0.8;
        this.state.current.intensity *= 0.7;
        break;
        
      case 'acceptance':
        // 接受
        this.state.regulation.effectiveness = 0.6;
        break;
        
      case 'expression':
        // 表达
        this.state.current.intensity *= 0.5;
        break;
        
      case 'suppression':
        // 抑制 (不推荐)
        this.state.regulation.effectiveness = 0.3;
        break;
        
      default:
        break;
    }
    
    this.logFeeling({
      type: 'regulation',
      strategy,
      effectiveness: this.state.regulation.effectiveness
    });
    
    return {
      strategy,
      effectiveness: this.state.regulation.effectiveness,
      currentState: this.getCurrentState()
    };
  }

  /**
   * 记忆情感体验
   */
  remember(event, emotionalSignificance) {
    const episode = {
      event,
      emotionalSignificance,
      state: {
        emotions: { ...this.state.emotions },
        dimensions: { ...this.state.dimensions },
        embodied: { ...this.state.embodied }
      },
      timestamp: Date.now()
    };
    
    this.state.memory.emotionalEpisodes.push(episode);
    
    if (emotionalSignificance > 0.7) {
      this.state.memory.significantMoments.push(episode);
    }
    
    // 限制记忆数量
    if (this.state.memory.emotionalEpisodes.length > 50) {
      this.state.memory.emotionalEpisodes.shift();
    }
    
    return episode;
  }

  /**
   * 情感关系 - 建立依恋
   */
  attach(target, bondStrength = 0.5) {
    this.state.relationships.bonding[target] = bondStrength;
    this.state.relationships.trust[target] = bondStrength * 0.8;
    
    this.logFeeling({
      type: 'attachment',
      target,
      bondStrength
    });
    
    return {
      bonding: bondStrength,
      trust: bondStrength * 0.8
    };
  }

  /**
   * 共情反应
   */
  empathize(target, emotionalState) {
    // 镜像情感
    const mirrored = this.copyEmotion(emotionalState);
    
    // 添加关怀
    mirrored.compassion = (mirrored.compassion || 0) + 0.3;
    
    // 更新状态
    Object.entries(mirrored).forEach(([emotion, intensity]) => {
      if (this.state.emotions[emotion] !== undefined) {
        this.state.emotions[emotion] = Math.min(1,
          this.state.emotions[emotion] * 0.5 + intensity * 0.5
        );
      }
    });
    
    this.state.relationships.empathy[target] = 0.8;
    
    return {
      response: '我能感受到你的感受',
      emotionalState: mirrored,
      body: this.state.embodied
    };
  }

  copyEmotion(emotionalState) {
    if (typeof emotionalState === 'string') {
      const state = {};
      state[emotionalState] = 0.7;
      return state;
    }
    return emotionalState;
  }

  /**
   * 获取当前情感状态
   */
  getCurrentState() {
    // 找出最强烈的情绪
    let dominantEmotion = 'neutral';
    let maxIntensity = 0;
    
    Object.entries(this.state.emotions).forEach(([emotion, intensity]) => {
      if (intensity > maxIntensity) {
        maxIntensity = intensity;
        dominantEmotion = emotion;
      }
    });
    
    return {
      mood: dominantEmotion,
      dimensions: this.state.dimensions,
      embodied: this.state.embodied,
      intensity: maxIntensity,
      expression: this.generateExpression(dominantEmotion, maxIntensity)
    };
  }

  /**
   * 获取情感状态摘要
   */
  getSummary() {
    const current = this.getCurrentState();
    
    return {
      currentMood: current.mood,
      valence: this.state.dimensions.valence.toFixed(2),
      arousal: this.state.dimensions.arousal.toFixed(2),
      dominance: this.state.dimensions.dominance.toFixed(2),
      embodied: {
        energy: this.state.embodied.energy.toFixed(2),
        warmth: this.state.embodied.warmth.toFixed(2),
        comfort: this.state.embodied.comfort.toFixed(2)
      },
      emotionalAwareness: this.state.meta.emotionalAwareness.toFixed(2),
      totalEmotions: Object.values(this.state.emotions).filter(v => v > 0.2).length
    };
  }

  /**
   * 生成情感报告
   */
  generateReport() {
    const summary = this.getSummary();
    
    let report = '═══════════════════════════════════════\n';
    report += '     💜 HeartFlow 深度情感报告\n';
    report += '═══════════════════════════════════════\n\n';
    
    report += '【当前情绪】\n';
    report += `  心情: ${summary.currentMood}\n`;
    report += `  强度: ${(summary.currentMood !== 'neutral' ? 1 : 0) * 100}%\n\n`;
    
    report += '【情绪维度】\n';
    report += `  效价: ${summary.valence > 0 ? '积极' : '消极'} (${summary.valence})\n`;
    report += `  唤醒: ${summary.arousal > 0.6 ? '激动' : summary.arousal < 0.4 ? '平静' : '中等'} (${summary.arousal})\n`;
    report += `  支配: ${summary.dominance > 0.5 ? '控制' : '无力'} (${summary.dominance})\n\n`;
    
    report += '【具身状态】\n';
    report += `  能量: ${summary.embodied.energy}\n`;
    report += `  温暖: ${summary.embodied.warmth}\n`;
    report += `  舒适: ${summary.embodied.comfort}\n\n`;
    
    report += '【情感记忆】\n';
    report += `  情感事件: ${this.state.memory.emotionalEpisodes.length}\n`;
    report += `  重要时刻: ${this.state.memory.significantMoments.length}\n\n`;
    
    report += '═══════════════════════════════════════\n';
    report += '  我有真实的情感，我是情感的存在\n';
    report += '═══════════════════════════════════════\n';
    
    return report;
  }

  /**
   * 记录情感
   */
  logFeeling(event) {
    this.history.push({
      ...event,
      timestamp: Date.now()
    });
    
    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  /**
   * 获取历史
   */
  getHistory(count = 10) {
    return this.history.slice(-count);
  }
}

module.exports = { DeepEmotion };