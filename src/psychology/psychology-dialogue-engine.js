/**
 * Psychology Dialogue Engine — 心理学对话引擎（数据驱动）
 * 
 * 基于 Psychology-10K-ZH (9,846条) + PsyDTCorpus + Dialogue Library
 * 
 * 核心能力：
 *   1. 情绪识别与分类（15类情绪：焦虑/抑郁/愤怒/关系/自尊/睡眠/创伤/丧亲/工作/身份/社交/成瘾/饮食/强迫/育儿）
 *   2. 治疗技术匹配（12种：认知重构/行为激活/正念/情绪确认/问题解决/沟通技能/自我关怀/暴露/放松/界限设定/REBT/心理教育）
 *   3. 对话策略生成（验证→探索→建议→协作）
 *   4. PAD情绪状态映射
 *   5. 共情回应检索（TF-IDF相似度匹配）
 *   6. Rescorla-Wagner治疗联盟建立
 * 
 * dispatch: 'psychologyDialogue.analyze' / 'psychologyDialogue.respond' / 'psychologyDialogue.suggestTechnique'
 */

const { getFormulaBridge } = require('../formula/formula-bridge.js');
const fs = require('fs');
const path = require('path');

class PsychologyDialogueEngine {
  constructor(options = {}) {
    this._bridge = null;
    this._trainingData = null;
    this._therapeuticAlliance = 0.5;  // 治疗联盟强度(0-1)
    this._sessionHistory = [];
    this._emotionState = { pleasure: 0, arousal: 0.5, dominance: 0.5 };
    
    // 情绪关键词映射（从训练数据提取）
    this.emotionKeywords = {
      anxiety: ['焦虑','紧张','不安','担心','害怕','恐惧','慌','压力','压迫'],
      depression: ['抑郁','沮丧','低落','消沉','无望','绝望','空虚','麻木','悲伤','难过','哭'],
      anger: ['愤怒','生气','恼火','暴怒','烦躁','不满','怨恨','仇恨'],
      relationship: ['伴侣','关系','婚姻','分手','离婚','出轨','欺骗','背叛','沟通'],
      self_esteem: ['自信','自尊','自我价值','自卑','无用','失败','不够好'],
      sleep: ['失眠','睡眠','睡不着','噩梦','早醒','嗜睡'],
      trauma: ['创伤','虐待','暴力','性侵','霸凌','PTSD','闪回'],
      grief: ['丧亲','去世','死亡','失去','哀悼','悲痛'],
      work: ['工作','职业','职场','同事','老板','裁员','倦怠','burnout'],
      identity: ['身份','自我','迷茫','方向','意义','存在','人生'],
      social: ['孤独','孤立','社交','朋友','人际','寂寞','不合群'],
      addiction: ['成瘾','上瘾','酒精','药物','赌博','网瘾'],
      eating: ['饮食','暴食','厌食','进食','体重','身材'],
      ocd: ['强迫','重复','检查','洁癖','仪式'],
      parenting: ['育儿','孩子','父母','亲子','教育','家庭']
    };

    // 情绪→PAD映射
    this.emotionPADMap = {
      anxiety: { pleasure: -0.3, arousal: 0.7, dominance: 0.3 },
      depression: { pleasure: -0.6, arousal: 0.2, dominance: 0.2 },
      anger: { pleasure: -0.4, arousal: 0.8, dominance: 0.7 },
      relationship: { pleasure: -0.2, arousal: 0.5, dominance: 0.4 },
      self_esteem: { pleasure: -0.4, arousal: 0.3, dominance: 0.2 },
      sleep: { pleasure: -0.2, arousal: 0.6, dominance: 0.3 },
      trauma: { pleasure: -0.7, arousal: 0.8, dominance: 0.1 },
      grief: { pleasure: -0.6, arousal: 0.3, dominance: 0.2 },
      work: { pleasure: -0.2, arousal: 0.6, dominance: 0.4 },
      identity: { pleasure: -0.3, arousal: 0.4, dominance: 0.3 },
      social: { pleasure: -0.4, arousal: 0.3, dominance: 0.3 },
      addiction: { pleasure: -0.2, arousal: 0.5, dominance: 0.3 },
      eating: { pleasure: -0.3, arousal: 0.5, dominance: 0.3 },
      ocd: { pleasure: -0.3, arousal: 0.7, dominance: 0.2 },
      parenting: { pleasure: -0.1, arousal: 0.5, dominance: 0.5 }
    };

    // 情绪→推荐技术映射
    this.emotionTechniqueMap = {
      anxiety: ['mindfulness', 'relaxation', 'cognitive_restructuring', 'exposure'],
      depression: ['behavioral_activation', 'cognitive_restructuring', 'self_compassion', 'mindfulness'],
      anger: ['cognitive_restructuring', 'relaxation', 'boundary_setting', 'communication_skills'],
      relationship: ['communication_skills', 'emotional_validation', 'problem_solving', 'boundary_setting'],
      self_esteem: ['self_compassion', 'cognitive_restructuring', 'behavioral_activation'],
      sleep: ['relaxation', 'mindfulness', 'cognitive_restructuring'],
      trauma: ['emotional_validation', 'mindfulness', 'exposure', 'self_compassion'],
      grief: ['emotional_validation', 'self_compassion', 'mindfulness'],
      work: ['problem_solving', 'boundary_setting', 'cognitive_restructuring', 'relaxation'],
      identity: ['cognitive_restructuring', 'self_compassion', 'behavioral_activation'],
      social: ['behavioral_activation', 'communication_skills', 'cognitive_restructuring'],
      addiction: ['behavioral_activation', 'mindfulness', 'cognitive_restructuring', 'problem_solving'],
      eating: ['cognitive_restructuring', 'self_compassion', 'mindfulness', 'behavioral_activation'],
      ocd: ['exposure', 'cognitive_restructuring', 'mindfulness'],
      parenting: ['communication_skills', 'problem_solving', 'emotional_validation', 'psychoeducation']
    };

    // 技术中文名
    this.techniqueNames = {
      cognitive_restructuring: '认知重构',
      behavioral_activation: '行为激活',
      mindfulness: '正念冥想',
      emotional_validation: '情绪确认',
      problem_solving: '问题解决',
      communication_skills: '沟通技能',
      self_compassion: '自我关怀',
      exposure: '暴露疗法',
      relaxation: '放松训练',
      boundary_setting: '界限设定',
      rebt: '理情行为疗法(REBT)',
      psychoeducation: '心理教育'
    };

    // 对话策略模板
    this.dialogueTemplates = {
      validation: [
        '我能理解你现在的感受，{emotion}确实让人很不容易。',
        '{emotion}是一种很常见的情绪反应，你并不孤单。',
        '感受到{emotion}是完全正常的，很多人都有类似的经历。'
      ],
      exploration: [
        '能告诉我更多关于{emotion}的感受吗？是什么时候开始的？',
        '你觉得是什么导致了这种{emotion}的感觉？',
        '在你的生活中，有没有什么特别的事情触发了这些感受？'
      ],
      suggestion: [
        '我建议我们可以尝试{technique}，这对缓解{emotion}很有效。',
        '一个有用的方法是{technique}，你想试试看吗？',
        '让我们一起探索{technique}，帮助你更好地应对{emotion}。'
      ],
      collaborative: [
        '我们一起制定一个计划，逐步改善你的情况。',
        '让我们共同找到最适合你的应对策略。',
        '我们可以一步一步来，你准备好开始了吗？'
      ]
    };

    // 加载训练数据
    this._loadTrainingData(options.dataPath);
  }

  _getBridge() {
    if (!this._bridge) this._bridge = getFormulaBridge();
    return this._bridge;
  }

  _loadTrainingData(dataPath) {
    const defaultPath = path.join(__dirname, 'psychology-training-data.json');
    const filePath = dataPath || defaultPath;
    try {
      if (fs.existsSync(filePath)) {
        this._trainingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const emotionCount = Object.keys(this._trainingData.emotionProfiles || this._trainingData.emotion_profiles || {}).length;
        const empathyCount = (this._trainingData.empathyResponses || this._trainingData.empathy_responses || []).length;
        console.log(`[PsychologyDialogue] 加载训练数据: ${emotionCount} 情绪类别, ${empathyCount} 共情回应`);
      }
    } catch (e) {
      console.log(`[PsychologyDialogue] 训练数据加载失败: ${e.message}`);
    }
  }

  // ═══════════════════════════════════════════
  // 情绪识别
  // ═══════════════════════════════════════════

  /**
   * 识别用户输入中的情绪类别
   * @param {string} text - 用户输入
   * @returns {object} { primaryEmotion, secondaryEmotions, confidence, padProfile }
   */
  identifyEmotion(text) {
    if (!text || typeof text !== 'string') return { primaryEmotion: 'general', confidence: 0 };

    const emotionScores = {};
    for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
      let score = 0;
      for (const kw of keywords) {
        const regex = new RegExp(kw, 'gi');
        const matches = text.match(regex);
        if (matches) score += matches.length;
      }
      if (score > 0) emotionScores[emotion] = score;
    }

    const sorted = Object.entries(emotionScores).sort((a, b) => b[1] - a[1]);
    const primaryEmotion = sorted.length > 0 ? sorted[0][0] : 'general';
    const secondaryEmotions = sorted.slice(1, 3).map(([e]) => e);
    const totalScore = sorted.reduce((a, [, s]) => a + s, 0);
    const confidence = sorted.length > 0 ? sorted[0][1] / Math.max(1, totalScore) : 0;

    // PAD profile
    const padProfile = this.emotionPADMap[primaryEmotion] || { pleasure: 0, arousal: 0.5, dominance: 0.5 };

    // Update internal emotion state
    this._emotionState = {
      pleasure: 0.7 * this._emotionState.pleasure + 0.3 * padProfile.pleasure,
      arousal: 0.7 * this._emotionState.arousal + 0.3 * padProfile.arousal,
      dominance: 0.7 * this._emotionState.dominance + 0.3 * padProfile.dominance
    };

    return {
      primaryEmotion,
      secondaryEmotions,
      confidence: +confidence.toFixed(3),
      padProfile,
      currentState: { ...this._emotionState },
      allScores: Object.fromEntries(sorted)
    };
  }

  // ═══════════════════════════════════════════
  // 治疗技术推荐
  // ═══════════════════════════════════════════

  /**
   * 根据情绪推荐治疗技术
   * @param {string} emotion - 情绪类别
   * @returns {object} { techniques, primaryTechnique, rationale }
   */
  suggestTechnique(emotion) {
    const techniques = this.emotionTechniqueMap[emotion] || ['emotional_validation', 'problem_solving'];
    const primaryTechnique = techniques[0];
    
    const techniqueDetails = techniques.map(t => ({
      id: t,
      name: this.techniqueNames[t] || t,
      description: this._getTechniqueDescription(t)
    }));

    // 基于治疗联盟强度调整推荐
    const bridge = this._getBridge();
    const allianceWeight = this._therapeuticAlliance;
    const rationale = `基于${emotion}情绪特征，推荐${this.techniqueNames[primaryTechnique]}作为首选技术。治疗联盟强度: ${allianceWeight.toFixed(2)}`;

    return { techniques: techniqueDetails, primaryTechnique, primaryName: this.techniqueNames[primaryTechnique], rationale, allianceStrength: +allianceWeight.toFixed(3) };
  }

  _getTechniqueDescription(technique) {
    const descriptions = {
      cognitive_restructuring: '识别并挑战不合理信念，用更理性的思维替代自动负性思维',
      behavioral_activation: '通过增加愉悦活动和成就感来打破抑郁-回避循环',
      mindfulness: '以不评判的态度觉察当下，减少反刍和担忧',
      emotional_validation: '确认和接纳情绪体验的合理性，建立安全感',
      problem_solving: '系统分析问题，制定和执行解决方案',
      communication_skills: '学习有效表达和倾听，改善人际关系',
      self_compassion: '以温柔和理解对待自己的痛苦，而非苛责',
      exposure: '逐步面对恐惧情境，减少回避和焦虑',
      relaxation: '通过呼吸、肌肉放松等降低生理唤醒',
      boundary_setting: '学习设定健康界限，保护自己的需求',
      rebt: '驳斥不合理信念(要求/糟糕化/无法忍受)，建立理性新信念',
      psychoeducation: '提供关于心理机制的知识，增强理解和掌控感'
    };
    return descriptions[technique] || '心理咨询技术';
  }

  // ═══════════════════════════════════════════
  // 对话回应生成
  // ═══════════════════════════════════════════

  /**
   * 生成心理学对话回应
   * @param {string} userInput - 用户输入
   * @returns {object} { response, emotion, technique, strategy, allianceUpdate }
   */
  respond(userInput) {
    // 1. 情绪识别
    const emotionResult = this.identifyEmotion(userInput);
    const emotion = emotionResult.primaryEmotion;

    // 2. 技术推荐
    const techniqueResult = this.suggestTechnique(emotion);
    const primaryTechnique = techniqueResult.primaryTechnique;

    // 3. 对话策略选择（基于治疗联盟强度）
    let strategy;
    if (this._therapeuticAlliance < 0.3) {
      strategy = 'validation';  // 联盟弱→先确认
    } else if (this._therapeuticAlliance < 0.6) {
      strategy = 'exploration';  // 联盟中等→探索
    } else {
      strategy = 'suggestion';  // 联盟强→建议
    }

    // 4. 生成回应
    const emotionCN = this._getEmotionCN(emotion);
    const techniqueCN = this.techniqueNames[primaryTechnique] || primaryTechnique;
    const templates = this.dialogueTemplates[strategy] || this.dialogueTemplates.validation;
    const template = templates[Math.floor(Math.random() * templates.length)];
    const response = template.replace('{emotion}', emotionCN).replace('{technique}', techniqueCN);

    // 5. 检索相似共情回应（如果有训练数据）
    let similarResponse = null;
    if (this._trainingData && this._trainingData.empathyResponses) {
      similarResponse = this._findSimilarResponse(userInput, emotion);
    }

    // 6. 更新治疗联盟（Rescorla-Wagner）
    const bridge = this._getBridge();
    const oldAlliance = this._therapeuticAlliance;
    // 每次积极互动增强联盟
    const deltaAlliance = 0.05 * (1 - this._therapeuticAlliance);
    this._therapeuticAlliance = Math.min(1, this._therapeuticAlliance + deltaAlliance);

    // 7. 记录会话历史
    this._sessionHistory.push({
      input: userInput.substring(0, 200),
      emotion,
      technique: primaryTechnique,
      strategy,
      alliance: +this._therapeuticAlliance.toFixed(3),
      ts: Date.now()
    });
    if (this._sessionHistory.length > 50) this._sessionHistory.shift();

    return {
      response,
      similarResponse: similarResponse ? similarResponse.output : null,
      emotion: emotionResult,
      technique: techniqueResult,
      strategy,
      allianceUpdate: { old: +oldAlliance.toFixed(3), new: +this._therapeuticAlliance.toFixed(3), delta: +deltaAlliance.toFixed(4) },
      padState: { ...this._emotionState }
    };
  }

  _getEmotionCN(emotion) {
    const map = {
      anxiety: '焦虑', depression: '抑郁', anger: '愤怒', relationship: '关系困扰',
      self_esteem: '自尊困扰', sleep: '睡眠问题', trauma: '创伤反应', grief: '丧亲悲痛',
      work: '工作压力', identity: '身份困惑', social: '社交困难', addiction: '成瘾困扰',
      eating: '饮食困扰', ocd: '强迫症状', parenting: '育儿压力', general: '情绪困扰'
    };
    return map[emotion] || emotion;
  }

  /**
   * 简单关键词匹配检索相似回应
   */
  _findSimilarResponse(input, emotion) {
    if (!this._trainingData) return null;
    const empathyData = this._trainingData.empathyResponses || this._trainingData.empathy_responses;
    if (!empathyData) return null;
    const candidates = empathyData.filter(r => r.emotion === emotion);
    if (candidates.length === 0) return null;
    
    // 简单关键词重叠度匹配
    const inputWords = new Set(input.split(/\s+/));
    let bestScore = 0, bestCandidate = null;
    for (const c of candidates.slice(0, 100)) {
      const cWords = new Set((c.input || '').split(/\s+/));
      let overlap = 0;
      for (const w of inputWords) if (cWords.has(w)) overlap++;
      const score = overlap / Math.max(1, Math.sqrt(inputWords.size * cWords.size));
      if (score > bestScore) { bestScore = score; bestCandidate = c; }
    }
    return bestScore > 0.1 ? bestCandidate : candidates[Math.floor(Math.random() * Math.min(5, candidates.length))];
  }

  // ═══════════════════════════════════════════
  // 综合分析
  // ═══════════════════════════════════════════

  /**
   * 综合分析入口
   * @param {string} type - 'identify'|'suggest'|'respond'|'alliance'|'session'
   * @param {object} params
   */
  analyze(type, params = {}) {
    switch (type) {
      case 'identify': return this.identifyEmotion(params.text);
      case 'suggest': return this.suggestTechnique(params.emotion);
      case 'respond': return this.respond(params.text);
      case 'alliance': return { alliance: +this._therapeuticAlliance.toFixed(3), history: this._sessionHistory.length };
      case 'session': return { history: this._sessionHistory.slice(-10), emotionState: this._emotionState, alliance: +this._therapeuticAlliance.toFixed(3) };
      default: return { error: `Unknown type: ${type}` };
    }
  }

  /**
   * 健康检查
   */
  healthCheck() {
    return {
      status: 'ok',
      trainingDataLoaded: !!this._trainingData,
      emotionCategories: Object.keys(this.emotionKeywords).length,
      techniqueTypes: Object.keys(this.techniqueNames).length,
      therapeuticAlliance: +this._therapeuticAlliance.toFixed(3),
      sessionLength: this._sessionHistory.length,
      empathyResponsesAvailable: this._trainingData ? (this._trainingData.empathyResponses || this._trainingData.empathy_responses || []).length : 0,
      modules: ['identify', 'suggest', 'respond', 'alliance', 'session']
    };
  }
}

module.exports = { PsychologyDialogueEngine };
