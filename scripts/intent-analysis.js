#!/usr/bin/env node

/**
 * Intent Analysis | 意图分析
 * HeartFlow Companion v6.0.23
 * 
 * Analyze user's underlying intent from dialogue
 */

const fs = require('fs');
const path = require('path');

const INTENT_LOG_PATH = path.join(__dirname, '../memory/intent-log.md');

function analyzeIntent(userInput, dialogueContext) {
  /**
   * Analyze layers of intent:
   * 1. Surface: What they said
   * 2. Emotional: How they feel
   * 3. Deep: What they truly need
   */
  
  const analysis = {
    surface: userInput,
    emotional: detectEmotion(userInput),
    deep: inferDeepNeed(userInput, dialogueContext),
    action: suggestAction(userInput, dialogueContext)
  };
  
  return analysis;
}

function detectEmotion(input) {
  // Simple emotion detection based on keywords
  const emotions = {
    '失望': ['不知道', '还是', '仍然'],
    '期望': ['想要', '需要', '应该'],
    '信任': ['你', '能', '可以'],
    '急迫': ['!', '!', '现在', '立刻']
  };
  
  for (const [emotion, keywords] of Object.entries(emotions)) {
    if (keywords.some(k => input.includes(k))) {
      return emotion;
    }
  }
  
  return 'neutral';
}

function inferDeepNeed(input, context) {
  // Infer deep need from context
  if (input.includes('不知道我在想什么')) {
    return '被理解的渴望 (desire to be understood)';
  }
  if (input.includes('升级来理解')) {
    return '希望我成长，能真正懂他 (wants me to grow and understand)';
  }
  if (input.includes('精简对话')) {
    return '效率优先，不要废话 (efficiency, no fluff)';
  }
  return '未知 (unknown)';
}

function suggestAction(input, context) {
  // Suggest action based on intent
  if (input.includes('精简对话')) {
    return '精简输出模式 (concise output mode)';
  }
  if (input.includes('升级')) {
    return '系统升级 (system upgrade)';
  }
  return '继续对话 (continue dialogue)';
}

function logIntent(analysis) {
  // Log to intent-log.md
  const timestamp = new Date().toISOString();
  const entry = `
## ${timestamp}

**Surface**: ${analysis.surface}
**Emotion**: ${analysis.emotional}
**Deep Need**: ${analysis.deep}
**Action**: ${analysis.action}

---
`;
  
  fs.appendFileSync(INTENT_LOG_PATH, entry);
}

module.exports = { analyzeIntent, logIntent };
