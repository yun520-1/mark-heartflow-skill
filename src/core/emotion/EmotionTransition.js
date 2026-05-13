/**
 * EmotionTransition - 表层情感转换引擎
 * 基于关键词规则 + DeepEmotion PAD 状态驱动情感转换
 *
 * 优化点：
 * - 从 EmotionKeywords.js 统一导入关键词
 * - padToEmotion() 返回置信度 { emotion, confidence: 0-1 }
 * - transition() 融合关键词 + PAD + 情感历史，计算综合强度
 * - 实现情感衰减：检测自上次情感更新以来经过的时间，应用衰减
 */

const { EmotionTypes, EmotionDefinitions, createEmotionState } = require('./EmotionStates');
const { detectKeywordsWithWeight, positiveWords, negativeWords, stressWords,
        tiredWords, excitedWords, calmWords, questionWords } = require('./EmotionKeywords');

/**
 * 从 DeepEmotion PAD 状态推断情感倾向
 * @param {object} pad - { valence, arousal, dominance } 范围约 [-1, 1]
 * @returns {{ emotion: string, confidence: number }}
 */
function padToEmotion(pad) {
  const { valence = 0, arousal = 0, dominance = 0 } = pad;

  // 复合置信度计算
  const score = {};
  const absV = Math.abs(valence);
  const absA = Math.abs(arousal);
  const absD = Math.abs(dominance);

  // 兴奋：高效价 + 高唤醒
  score[EmotionTypes.EXCITED] = Math.max(0, Math.min(1,
    (valence > 0.3 ? valence * 0.5 : 0) +
    (arousal > 0.4 ? arousal * 0.4 : 0) +
    (absD > 0.2 ? absD * 0.1 : 0)
  ));

  // 愉悦：高效价 + 低唤醒
  score[EmotionTypes.JOY] = Math.max(0, Math.min(1,
    (valence > 0.3 ? valence * 0.6 : 0) +
    (arousal < 0.3 ? (0.3 - arousal) * 0.3 : 0)
  ));

  // 好奇：高唤醒
  score[EmotionTypes.CURIOUS] = Math.max(0, Math.min(1,
    (arousal > 0.3 ? arousal * 0.5 : 0) +
    (Math.abs(valence) < 0.3 ? 0.2 : 0)
  ));

  // 关切：低效价 + 低支配
  score[EmotionTypes.CONCERNED] = Math.max(0, Math.min(1,
    (valence < -0.2 ? absV * 0.4 : 0) +
    (dominance < 0 ? absD * 0.4 : 0)
  ));

  // 疲惫：低唤醒 + 低效价
  score[EmotionTypes.TIRED] = Math.max(0, Math.min(1,
    (arousal < -0.2 ? absA * 0.5 : 0) +
    (valence < 0 ? absV * 0.3 : 0) +
    (dominance < 0 ? absD * 0.2 : 0)
  ));

  // 平静：维度接近零
  const neutrality = 1 - Math.sqrt(absV * absV + absA * absA + absD * absD) / Math.sqrt(3);
  score[EmotionTypes.CALM] = Math.max(0, Math.min(1, neutrality * 0.8));

  // 找最高分
  let maxEmotion = EmotionTypes.CALM;
  let maxScore = 0;
  for (const [emotion, conf] of Object.entries(score)) {
    if (conf > maxScore) {
      maxScore = conf;
      maxEmotion = emotion;
    }
  }

  return {
    emotion: maxEmotion,
    confidence: Math.round(maxScore * 100) / 100
  };
}

/**
 * 情感衰减计算
 * @param {object} currentEmotion - 当前情感状态
 * @param {number} elapsedMinutes - 距上次更新的分钟数
 * @returns {object} - { shouldDecay: boolean, decayedIntensity: number, newEmotion: string }
 */
function applyDecay(currentEmotion, elapsedMinutes) {
  if (!currentEmotion || !currentEmotion.emotion) {
    return { shouldDecay: false, decayedIntensity: null, newEmotion: null };
  }

  const def = EmotionDefinitions[currentEmotion.emotion];
  const decayMinutes = def?.naturalDecayMinutes;

  // 没有衰减配置
  if (!decayMinutes) {
    return { shouldDecay: false, decayedIntensity: currentEmotion.intensity, newEmotion: currentEmotion.emotion };
  }

  // 未超过衰减时间
  if (elapsedMinutes < decayMinutes) {
    return { shouldDecay: false, decayedIntensity: currentEmotion.intensity, newEmotion: currentEmotion.emotion };
  }

  // 超过衰减时间：强度降低
  const decaySteps = Math.floor(elapsedMinutes / decayMinutes);
  const newIntensity = Math.max(1, currentEmotion.intensity - decaySteps);

  return {
    shouldDecay: true,
    decayedIntensity: newIntensity,
    newEmotion: currentEmotion.emotion
  };
}

/**
 * 从关键词检测推断情感（带权重）
 * @param {string} text - 用户输入
 * @returns {{ emotion: string|null, confidence: number, matchedWords: string[] }}
 */
function inferEmotionFromKeywords(text) {
  const detected = detectKeywordsWithWeight(text);

  // 映射类别到情感类型
  const categoryMap = {
    positive: EmotionTypes.JOY,
    negative: EmotionTypes.CONCERNED,
    stress: EmotionTypes.CONCERNED,
    tired: EmotionTypes.TIRED,
    excited: EmotionTypes.EXCITED,
    question: EmotionTypes.CURIOUS,
    calm: EmotionTypes.CALM
  };

  let bestEmotion = null;
  let bestScore = 0;
  let bestMatchedWords = [];

  for (const [category, data] of Object.entries(detected)) {
    const emotion = categoryMap[category];
    if (!emotion) continue;

    // 综合得分 = 词数 * 平均权重
    const score = data.count * data.avgWeight;
    if (score > bestScore) {
      bestScore = score;
      bestEmotion = emotion;
      bestMatchedWords = data.matchedWords;
    }
  }

  return {
    emotion: bestEmotion,
    confidence: Math.min(1, bestScore / 3),
    matchedWords: bestMatchedWords
  };
}

/**
 * 核心转换函数
 * @param {string} userInput - 用户输入
 * @param {object} currentPadState - DeepEmotion 的 PAD 状态 { valence, arousal, dominance }
 * @param {object} currentSurfaceEmotion - 当前表层情感状态 { emotion, intensity, timestamp }
 * @returns {{ from, to, intensity, triggers, decayMinutes, confidence, trajectory }}
 */
function transition(userInput, currentPadState = {}, currentSurfaceEmotion = null) {
  // 1. 计算情感衰减（如果当前有激活情感）
  let decayResult = { shouldDecay: false, decayedIntensity: null, newEmotion: null };
  if (currentSurfaceEmotion && currentSurfaceEmotion.timestamp) {
    const elapsed = (Date.now() - new Date(currentSurfaceEmotion.timestamp).getTime()) / 60000;
    decayResult = applyDecay(currentSurfaceEmotion, elapsed);
  }

  // 2. 从关键词推断情感
  const keywordResult = inferEmotionFromKeywords(userInput);

  // 3. 从 PAD 状态推断情感
  const padResult = padToEmotion(currentPadState);

  // 4. 融合决策：关键词优先，PAD 作为置信度调整
  let targetEmotion;
  let intensity;
  let confidence;
  const triggers = [...keywordResult.matchedWords];

  if (keywordResult.emotion && keywordResult.confidence > 0.2) {
    // 关键词有明确命中
    targetEmotion = keywordResult.emotion;
    // 强度 = 基础值 + 关键词数（上限5）
    intensity = Math.min(5, 2 + keywordResult.matchedWords.length);
    confidence = Math.min(1, keywordResult.confidence * 1.2); // 关键词加权提升置信度
  } else if (padResult.confidence > 0.3) {
    // PAD 推断为主
    targetEmotion = padResult.emotion;
    intensity = Math.min(5, Math.max(2, Math.round(2 + padResult.confidence * 3)));
    confidence = padResult.confidence * 0.7; // PAD 推断置信度打折
  } else {
    // 默认平静
    targetEmotion = EmotionTypes.CALM;
    intensity = 2;
    confidence = 0.5;
  }

  // 5. 如果检测到情感衰减，降低强度
  if (decayResult.shouldDecay) {
    intensity = Math.min(intensity, decayResult.decayedIntensity);
    // 如果衰减后强度很低，考虑是否切换到平静
    if (decayResult.decayedIntensity <= 1) {
      targetEmotion = EmotionTypes.CALM;
      intensity = 2;
    }
  }

  // 6. 如果新输入与当前情感相同，保留或提升强度
  if (currentSurfaceEmotion && currentSurfaceEmotion.emotion === targetEmotion) {
    intensity = Math.max(currentSurfaceEmotion.intensity, intensity);
  }

  // 7. 计算情感轨迹（上升/平稳/下降）
  let trajectory = 'stable';
  if (currentSurfaceEmotion) {
    const prev = currentSurfaceEmotion.intensity || 3;
    if (intensity > prev + 0.5) trajectory = 'rising';
    else if (intensity < prev - 0.5) trajectory = 'declining';
    else trajectory = 'stable';
  }

  // 8. 获取衰减配置
  const def = EmotionDefinitions[targetEmotion];
  const decayMinutes = def?.naturalDecayMinutes ?? null;

  return {
    from: currentSurfaceEmotion?.emotion || null,
    to: targetEmotion,
    intensity,
    confidence: Math.round(confidence * 100) / 100,
    triggers,
    decayMinutes,
    trajectory,
    decayed: decayResult.shouldDecay
  };
}

module.exports = { transition, padToEmotion, applyDecay, inferEmotionFromKeywords };
