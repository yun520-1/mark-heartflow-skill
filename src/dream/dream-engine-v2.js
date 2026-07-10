/**
 * Dream Engine v2 — 梦境引擎（公式驱动升级版）
 * 
 * 集成公式：
 *   - 记忆巩固(STDP): 突触可塑性时间窗 Δw = A+·exp(-Δt/τ+)
 *   - REM情绪处理: 情绪记忆再激活+去甲肾上腺素低谷
 *   - 梦境叙事生成: 记忆碎片→情绪状态→场景编织
 *   - 睡眠周期: 90分钟周期(浅→深→REM)
 *   - 记忆重放: 海马体→新皮层记忆转移
 *   - 创造性联想: 远距联想概率 = f(语义距离, 情绪唤醒)
 *   - 噩梦检测: 情绪强度 × 负面效价 超阈值
 * 
 * dispatch: 'dream.generate' / 'dream.consolidate' / 'dream.creativeAssociation'
 */

const { getFormulaBridge } = require('../formula/formula-bridge.js');

class DreamEngineV2 {
  constructor(options = {}) {
    this._bridge = null;
    // 睡眠阶段
    this.sleepStages = {
      light: { name: '浅睡眠', duration: 20, consolidationRate: 0.3, emotionalProcessing: 0.1 },
      deep: { name: '深睡眠', duration: 40, consolidationRate: 0.8, emotionalProcessing: 0.2 },
      rem: { name: 'REM睡眠', duration: 30, consolidationRate: 0.5, emotionalProcessing: 0.9 }
    };
    // 梦境模板
    this.dreamTemplates = {
      anxious: ['在无尽的走廊中奔跑，每扇门后都是未完成的任务', '站在高处，脚下是不断碎裂的地面', '考试铃声响起，试卷上的文字在流动'],
      sad: ['独自走在雨中，路灯一盏盏熄灭', '在空旷的房间里寻找消失的人', '河流带走所有写过的信'],
      happy: ['在云端飞翔，风带着花香', '与久别的朋友重逢，笑声回荡', '花园里所有花同时绽放'],
      curious: ['发现一扇从未见过的门，门后是另一个世界', '书架上的书自己翻开，文字飞出来组成图案', '镜子里的自己在微笑，但角度不对'],
      neutral: ['走在熟悉的街道上，但建筑的高度在变化', '在图书馆里找一本没有名字的书', '水面倒映的不是天空而是另一个水面']
    };
    // 记忆痕迹（用于巩固）
    this._memoryBuffer = [];
    this._consolidationLog = [];
  }

  _getBridge() {
    if (!this._bridge) this._bridge = getFormulaBridge();
    return this._bridge;
  }

  // ═══════════════════════════════════════════
  // 梦境生成（核心）
  // ═══════════════════════════════════════════

  /**
   * 生成梦境
   * @param {object} params - { mood, memories, emotionalState, sleepStage }
   * @returns {object} { narrative, stage, emotionalProcessing, consolidation, symbols }
   */
  generate(params = {}) {
    const { mood = 'neutral', memories = [], emotionalState = {}, sleepStage = 'rem' } = params;
    const stage = this.sleepStages[sleepStage] || this.sleepStages.rem;
    const bridge = this._getBridge();

    // 1. 选择梦境模板
    const templates = this.dreamTemplates[mood] || this.dreamTemplates.neutral;
    const baseNarrative = templates[Math.floor(Math.random() * templates.length)];

    // 2. 记忆碎片编织
    const memoryFragments = memories.slice(0, 3).map(m => {
      const retention = bridge.ebbinghausRetention(
        Date.now() - (m.lastAccess || Date.now()),
        bridge.memoryStrengthFromFrequency(m.accessCount || 1)
      );
      return { content: m.content || m, retention: +retention.toFixed(3), isVivid: retention > 0.5 };
    });

    // 3. 情绪处理（REM阶段去甲肾上腺素低谷→情绪去敏化）
    const emotionalIntensity = emotionalState.intensity || 0.5;
    const emotionalValence = emotionalState.valence || 0;
    const neCortisolLevel = sleepStage === 'rem' ? 0.3 : 0.7;  // REM时NE低谷
    const emotionalDesensitization = stage.emotionalProcessing * (1 - neCortisolLevel);
    const processedEmotion = {
      originalIntensity: emotionalIntensity,
      processedIntensity: +(emotionalIntensity * (1 - emotionalDesensitization * 0.3)).toFixed(3),
      desensitizationRate: +emotionalDesensitization.toFixed(3)
    };

    // 4. 记忆巩固（STDP）
    const consolidationResults = this._consolidateMemories(memoryFragments, stage);

    // 5. 创造性联想
    const creativeAssociations = this._generateCreativeAssociations(memoryFragments, emotionalIntensity);

    // 6. 编织完整叙事
    const narrative = this._weaveNarrative(baseNarrative, memoryFragments, creativeAssociations, mood);

    // 7. 符号解析
    const symbols = this._extractSymbols(narrative, mood);

    // 8. 噩梦检测
    const isNightmare = emotionalIntensity > 0.8 && emotionalValence < -0.5;

    return {
      narrative,
      sleepStage: stage.name,
      mood,
      memoryFragments: memoryFragments.map(f => ({ content: f.content, vividness: f.retention })),
      emotionalProcessing: processedEmotion,
      consolidation: consolidationResults,
      creativeAssociations,
      symbols,
      isNightmare,
      therapeuticValue: isNightmare ? 'exposure_therapy_candidate' : (emotionalDesensitization > 0.5 ? 'emotional_processing' : 'memory_consolidation')
    };
  }

  // ═══════════════════════════════════════════
  // 记忆巩固（STDP + 海马重放）
  // ═══════════════════════════════════════════

  /**
   * STDP记忆巩固
   * @param {Array} fragments - 记忆碎片
   * @param {object} stage - 睡眠阶段
   * @returns {object} { consolidated, strengthened, totalDeltaW }
   */
  _consolidateMemories(fragments, stage) {
    const bridge = this._getBridge();
    let totalDeltaW = 0;
    const strengthened = [];

    for (let i = 0; i < fragments.length; i++) {
      for (let j = i + 1; j < fragments.length; j++) {
        // STDP：时间差 = 语义距离的代理
        const deltaT = (j - i) * 50;  // 50ms per step
        const stdpResult = bridge.stdpUpdate ? 
          { deltaW: 0.01 * Math.exp(-deltaT / 20), isLTP: deltaT > 0, isLTD: deltaT < 0 } :
          { deltaW: 0.01 * Math.exp(-deltaT / 20), isLTP: deltaT > 0, isLTD: deltaT < 0 };
        
        // 巩固率取决于睡眠阶段
        const effectiveDeltaW = stdpResult.deltaW * stage.consolidationRate;
        totalDeltaW += effectiveDeltaW;
        
        if (effectiveDeltaW > 0.001) {
          strengthened.push({
            from: fragments[i].content,
            to: fragments[j].content,
            deltaW: +effectiveDeltaW.toFixed(6),
            type: stdpResult.isLTP ? 'LTP' : 'LTD'
          });
        }
      }
    }

    this._consolidationLog.push({ ts: Date.now(), strengthened: strengthened.length, totalDeltaW, stage: stage.name });
    if (this._consolidationLog.length > 50) this._consolidationLog.shift();

    return {
      consolidated: strengthened.length,
      strengthened,
      totalDeltaW: +totalDeltaW.toFixed(6),
      stageConsolidationRate: stage.consolidationRate
    };
  }

  // ═══════════════════════════════════════════
  // 创造性联想
  // ═══════════════════════════════════════════

  /**
   * 远距联想生成
   * P(creative) = f(semantic_distance, emotional_arousal)
   * @param {Array} fragments
   * @param {number} arousal
   * @returns {Array} 联想列表
   */
  _generateCreativeAssociations(fragments, arousal) {
    const associations = [];
    const concepts = ['光', '水', '时间', '声音', '空间', '记忆', '变化', '连接', '边界', '深度',
      'light', 'water', 'time', 'sound', 'space', 'memory', 'change', 'connection', 'boundary', 'depth'];
    
    for (const frag of fragments) {
      // 随机远距联想（REM时arousal高→更远距）
      const nAssociations = Math.ceil(arousal * 3);
      for (let i = 0; i < nAssociations; i++) {
        const concept = concepts[Math.floor(Math.random() * concepts.length)];
        const distance = 0.3 + Math.random() * 0.7;  // 语义距离
        const probability = arousal * (1 - distance * 0.5);  // 高arousal→更可能远距联想
        if (Math.random() < probability) {
          associations.push({
            source: frag.content,
            association: concept,
            semanticDistance: +distance.toFixed(3),
            creativityScore: +(distance * arousal).toFixed(3)
          });
        }
      }
    }
    return associations.slice(0, 5);
  }

  // ═══════════════════════════════════════════
  // 叙事编织
  // ═══════════════════════════════════════════

  _weaveNarrative(base, fragments, associations, mood) {
    let narrative = base;
    
    // 插入记忆碎片
    for (const frag of fragments) {
      if (frag.isVivid && Math.random() > 0.4) {
        narrative += `。突然想起了"${frag.content}"，但画面在模糊中闪烁`;
      }
    }
    
    // 插入创造性联想
    for (const assoc of associations) {
      if (assoc.creativityScore > 0.3) {
        narrative += `。${assoc.association}与${assoc.source}以一种不可思议的方式连接在一起`;
      }
    }
    
    // 情绪基调收尾
    const endings = {
      anxious: '...一切在加速，但方向不明',
      sad: '...声音渐渐远去，只留下回声',
      happy: '...光芒从四面八方涌来，温暖而明亮',
      curious: '...答案就在下一个转角，但转角在不断移动',
      neutral: '...一切归于平静，像水面恢复如镜'
    };
    narrative += '。' + (endings[mood] || endings.neutral);
    
    return narrative;
  }

  // ═══════════════════════════════════════════
  // 符号提取
  // ═══════════════════════════════════════════

  _extractSymbols(narrative, mood) {
    const symbolMap = {
      '门': '选择/机会', '水': '情感/潜意识', '高处': '抱负/恐惧', '奔跑': '逃避/追求',
      '光': '意识/希望', '黑暗': '未知/压抑', '镜子': '自我认知', '书': '知识/记忆',
      '花园': '成长/内心世界', '走廊': '人生路径', '雨': '悲伤/净化', '飞翔': '自由/超越'
    };
    
    const found = [];
    for (const [symbol, meaning] of Object.entries(symbolMap)) {
      if (narrative.includes(symbol)) {
        found.push({ symbol, meaning, moodContext: mood });
      }
    }
    return found;
  }

  // ═══════════════════════════════════════════
  // 睡眠周期模拟
  // ═══════════════════════════════════════════

  /**
   * 模拟完整睡眠周期（90分钟）
   * @param {number} cycles - 周期数(通常4-6个/晚)
   * @returns {object} { stages, totalConsolidation, emotionalProcessing }
   */
  simulateSleepCycle(cycles = 5) {
    const stages = [];
    let totalConsolidation = 0;
    let totalEmotionalProcessing = 0;

    for (let c = 0; c < cycles; c++) {
      // 每个周期：浅→深→REM，REM比例随周期增加
      const remRatio = 0.2 + c * 0.1;  // 后期REM更多
      const deepRatio = Math.max(0.1, 0.4 - c * 0.05);
      const lightRatio = 1 - remRatio - deepRatio;

      const cycleStages = [
        { stage: 'light', duration: 90 * lightRatio, consolidation: 0.3, emotional: 0.1 },
        { stage: 'deep', duration: 90 * deepRatio, consolidation: 0.8, emotional: 0.2 },
        { stage: 'rem', duration: 90 * remRatio, consolidation: 0.5, emotional: 0.9 }
      ];

      for (const s of cycleStages) {
        totalConsolidation += s.consolidation * s.duration / 90;
        totalEmotionalProcessing += s.emotional * s.duration / 90;
      }

      stages.push({ cycle: c + 1, stages: cycleStages });
    }

    return {
      cycles,
      totalDurationMin: cycles * 90,
      stages,
      totalConsolidation: +totalConsolidation.toFixed(2),
      totalEmotionalProcessing: +totalEmotionalProcessing.toFixed(2),
      recommendation: totalEmotionalProcessing < 2 ? 'may_need_more_rem' : 'balanced'
    };
  }

  /**
   * 健康检查
   */
  healthCheck() {
    return {
      status: 'ok',
      consolidationLog: this._consolidationLog.length,
      memoryBuffer: this._memoryBuffer.length,
      modules: ['generate', 'consolidate', 'creativeAssociation', 'sleepCycle']
    };
  }
}

module.exports = { DreamEngineV2 };
