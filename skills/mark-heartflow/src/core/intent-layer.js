/**
 * Intent Layer - 意图层推理模块 (LLM增强版)
 * 深层意图推断，理解用户真实需求
 */

const fs = require('fs');
const path = require('path');

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffFactor: 2,
  maxDelay: 10000
};

const INTENT_PROMPT_TEMPLATE = `你是一个深层意图分析专家。请分析以下用户消息的意图。

用户当前消息: {userMessage}

对话历史:
{conversationHistory}

请从以下维度分析:

1. surface_intent (表层意图): 用户明确表达的需求
   - 分类: request | question | exploration | problem_solving | learning | optimization | emotional_support | unclear

2. emotional_undercurrent (情绪暗流): 
   - 情绪: frustrated | curious | urgent | confused | satisfied | neutral | hopeful | anxious
   - 强度: 0.0-1.0

3. deep_need (深层需求): 用户真正想要的是什么
   - 分类: recognition | understanding | solution | learning | emotional_support | autonomy | mastery | connection | unclear

4. context_requirements (上下文需求):
   - needs_clarification: true/false - 是否需要澄清
   - complexity: low/medium/high
   - time_sensitivity: low/medium/high

请返回JSON格式:
{
  "surface_intent": "...",
  "emotional_undercurrent": {"emotion": "...", "intensity": 0.0},
  "deep_need": "...",
  "context_requirements": {"needs_clarification": false, "complexity": "medium", "time_sensitivity": "low"},
  "confidence": 0.0-1.0,
  "reasoning": "简短解释"
}`;

class IntentLayer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.historyFile = path.join(projectRoot, '.opencode', 'memory', 'intent-history.json');
    this.intentPatterns = this.initializePatterns();
    this.loadHistory();
    this.llmEndpoint = process.env.LLM_ENDPOINT || null;
    this.llmApiKey = process.env.LLM_API_KEY || null;
  }

  initializePatterns() {
    return {
      explicit_intent: {
        indicators: ['我要', '帮我', '请', '能不能', 'how to', 'please', 'help me'],
        template: '用户明确表达了{action}的意图'
      },
      implicit_needs: {
        indicators: ['好烦', '太难', '不想', '累', 'tired', 'frustrated', "don't want"],
        template: '用户可能有情感支持或简化任务的需求'
      },
      exploration: {
        indicators: ['了解一下', '是什么', '怎么玩', 'what is', 'tell me about'],
        template: '用户处于探索了解阶段'
      },
      optimization: {
        indicators: ['更好', '优化', '改进', '提升', 'better', 'improve', 'optimize'],
        template: '用户希望改进现有方案'
      },
      problem_solving: {
        indicators: ['问题', '错误', 'bug', '无法', '解决', 'problem', 'fix', 'error'],
        template: '用户遇到了需要解决的问题'
      },
      learning: {
        indicators: ['学习', '学会', '教我', '理解', 'learn', 'teach me', 'understand'],
        template: '用户希望学习新知识或技能'
      }
    };
  }

  loadHistory() {
    try {
      if (fs.existsSync(this.historyFile)) {
        this.history = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
      } else {
        this.history = { intents: [], lastUpdate: null };
      }
    } catch (e) {
      this.history = { intents: [], lastUpdate: null };
    }
  }

  saveHistory() {
    const dir = path.dirname(this.historyFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.history.lastUpdate = new Date().toISOString();
    fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
  }

  /**
   * 指数退避延迟
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 计算重试延迟
   */
  calculateBackoff(attempt) {
    const delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt);
    return Math.min(delay, RETRY_CONFIG.maxDelay);
  }

  /**
   * 调用LLM进行意图分析（带重试）
   */
  async callLLM(prompt) {
    if (!this.llmEndpoint) {
      return null;
    }

    let lastError = null;

    for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const response = await fetch(this.llmEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.llmApiKey}`
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!response.ok) {
          if (attempt < RETRY_CONFIG.maxRetries - 1) {
            const delay = this.calculateBackoff(attempt);
            console.log(`[IntentLayer] Retry ${attempt + 1}/${RETRY_CONFIG.maxRetries} after ${delay}ms`);
            await this.sleep(delay);
            continue;
          }
          console.error('[IntentLayer] LLM API error:', response.status);
          return null;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || data.content || '';
        
        try {
          return JSON.parse(content);
        } catch {
          return this.parseJSONFromText(content);
        }
      } catch (e) {
        lastError = e;
        
        if (attempt < RETRY_CONFIG.maxRetries - 1) {
          const delay = this.calculateBackoff(attempt);
          console.log(`[IntentLayer] Retry ${attempt + 1}/${RETRY_CONFIG.maxRetries} after ${delay}ms (error: ${e.message})`);
          await this.sleep(delay);
          continue;
        }
        
        console.error('[IntentLayer] LLM call failed:', e.message);
        return null;
      }
    }

    return null;
  }

  parseJSONFromText(text) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * 构建LLM提示词
   */
  buildPrompt(userMessage, conversationHistory) {
    const historyText = conversationHistory.length > 0
      ? conversationHistory.slice(-5).map((msg, i) => `${i + 1}. ${msg.role || 'user'}: ${msg.content || msg}`).join('\n')
      : '(无对话历史)';

    return INTENT_PROMPT_TEMPLATE
      .replace('{userMessage}', userMessage)
      .replace('{conversationHistory}', historyText);
  }

  /**
   * 推断深层意图 - 主入口
   */
  async inferDeepIntent(userMessage, conversationHistory = []) {
    const llmResult = await this.callLLM(this.buildPrompt(userMessage, conversationHistory));
    
    const surfaceIntent = this.detectSurfaceIntent(userMessage);
    const emotionalUndercurrent = llmResult?.emotional_undercurrent 
      ? { emotion: llmResult.emotional_undercurrent.emotion, intensity: llmResult.emotional_undercurrent.intensity }
      : this.detectEmotionalUndercurrent(userMessage, conversationHistory);
    const contextualNeeds = this.analyzeContextualNeeds(userMessage, conversationHistory);
    
    const deepMotivation = llmResult?.deep_need 
      ? { summary: llmResult.deep_need, confidence: llmResult.confidence || 0.5 }
      : this.inferDeepMotivation(surfaceIntent, emotionalUndercurrent, contextualNeeds);
    
    const recommendedApproach = this.suggestApproach(deepMotivation);

    const result = {
      timestamp: new Date().toISOString(),
      userMessage: userMessage,
      surface: {
        type: llmResult?.surface_intent || surfaceIntent.type,
        template: surfaceIntent.template,
        raw_intent: userMessage,
        confidence: llmResult?.confidence || surfaceIntent.confidence
      },
      emotional: emotionalUndercurrent,
      contextual: contextualNeeds,
      deep: {
        summary: deepMotivation.summary,
        confidence: deepMotivation.confidence,
        suggestions: deepMotivation.suggestions
      },
      recommendedApproach: recommendedApproach,
      llmEnhanced: !!llmResult,
      raw_llm_result: llmResult
    };

    result.confidence = (result.surface.confidence + result.deep.confidence) / 2;

    this.history.intents.push({
      timestamp: result.timestamp,
      surface: result.surface.type,
      deep: result.deep.summary,
      emotion: result.emotional?.emotion || 'neutral'
    });
    this.saveHistory();

    return result;
  }

  /**
   * 检测表层意图 (规则基础后备)
   */
  detectSurfaceIntent(message) {
    const messageLower = message.toLowerCase();
    let detected = null;
    let highestScore = 0;

    for (const [type, config] of Object.entries(this.intentPatterns)) {
      let score = 0;
      for (const indicator of config.indicators) {
        if (messageLower.includes(indicator.toLowerCase())) {
          score += 1;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        detected = {
          type: type,
          template: config.template,
          raw_intent: message,
          confidence: Math.min(1, score / 2)
        };
      }
    }

    return detected || {
      type: 'unclear',
      template: '无法确定具体意图',
      raw_intent: message,
      confidence: 0.3
    };
  }

  /**
   * 检测情绪暗流 (规则基础后备)
   */
  detectEmotionalUndercurrent(message, history) {
    const emotions = {
      frustration: { keywords: ['烦', '难', '挫败', '不行', '不会', 'tired', 'frustrated', 'hard', 'difficult'], indicator: '用户可能感到挫败或不耐烦' },
      curiosity: { keywords: ['好奇', '想知', '问问', 'interesting', 'curious', 'wonder'], indicator: '用户表现出好奇心' },
      urgency: { keywords: ['急', '赶', '快点', '来不及', 'urgent', 'quickly', 'asap'], indicator: '用户可能有时间压力' },
      confusion: { keywords: ['不懂', '困惑', '模糊', 'unclear', 'confused', 'confusing'], indicator: '用户可能感到困惑' },
      satisfaction: { keywords: ['好', '棒', '赞', '满意', 'good', 'great', 'perfect', 'happy'], indicator: '用户表现出满意' }
    };

    const detected = [];
    const messageLower = message.toLowerCase();

    for (const [emotion, config] of Object.entries(emotions)) {
      for (const keyword of config.keywords) {
        if (messageLower.includes(keyword.toLowerCase())) {
          detected.push({
            emotion: emotion,
            indicator: config.indicator,
            intensity: this.calculateEmotionIntensity(keyword, message)
          });
          break;
        }
      }
    }

    return {
      emotions: detected,
      primary_emotion: detected[0]?.emotion || 'neutral',
      needs_support: detected.some(d => ['frustration', 'confusion'].includes(d.emotion))
    };
  }

  calculateEmotionIntensity(keyword, message) {
    const emphasis = ['!!!', '!!', '很', '非常', 'really', 'very'];
    for (const e of emphasis) {
      if (message.includes(e + keyword)) return 0.9;
    }
    return 0.6;
  }

  analyzeContextualNeeds(message, history) {
    const needs = [];
    if (history.length === 0) {
      needs.push('用户可能是首次互动，需要建立信任');
    }

    const recentTopics = this.extractTopics(history.slice(-3));
    if (recentTopics.length > 0) {
      needs.push(`用户正在讨论: ${recentTopics.join(', ')}`);
    }

    const hasComplexRequest = message.length > 100 || message.split(',').length > 3;
    if (hasComplexRequest) {
      needs.push('用户请求较复杂，需要确认理解');
    }

    return {
      needs: needs,
      contextEstablished: history.length > 2,
      complexity: message.length > 100 ? 'high' : 'normal'
    };
  }

  extractTopics(messages) {
    const topics = [];
    const keywords = ['代码', '项目', '问题', '学习', '优化', 'code', 'project', 'problem', 'learn'];

    for (const msg of messages) {
      const content = typeof msg === 'string' ? msg : msg.content || '';
      for (const kw of keywords) {
        if (content.toLowerCase().includes(kw.toLowerCase())) {
          if (!topics.includes(kw)) topics.push(kw);
        }
      }
    }
    return topics;
  }

  inferDeepMotivation(surface, emotional, contextual) {
    let motivation = '';
    let confidence = 0.5;
    let suggestions = [];

    if (emotional.needs_support || emotional.intensity > 0.6) {
      motivation = '用户除了表面需求外，还需要情感支持';
      suggestions.push('在提供解决方案前，先认可用户的感受');
      confidence += 0.2;
    }

    if (contextual.complexity === 'high') {
      motivation += ' 用户请求复杂，需要确保理解准确';
      suggestions.push('使用复述确认机制');
      confidence += 0.1;
    }

    if (surface.type === 'problem_solving') {
      motivation += ' 用户希望快速解决问题';
      suggestions.push('先给出核心解决方案，再解释原理');
      confidence += 0.2;
    }

    if (surface.type === 'learning') {
      motivation += ' 用户希望真正理解而非只得到答案';
      suggestions.push('解释原理，给出例子，鼓励探索');
      confidence += 0.2;
    }

    return {
      summary: motivation || '用户有明确的目标导向需求',
      confidence: Math.min(1, confidence),
      suggestions: suggestions
    };
  }

  suggestApproach(deepMotivation) {
    const suggestions = deepMotivation.suggestions || [];
    
    return {
      tone: suggestions.includes('在提供解决方案前，先认可用户的感受') ? 'empathetic' : 'professional',
      structure: suggestions.includes('使用复述确认机制') ? 'confirm_first' : 'direct',
      depth: suggestions.includes('解释原理，给出例子') ? 'detailed' : 'concise'
    };
  }

  formatOutput(result) {
    return {
      surface_intent: result.surface?.type || 'unclear',
      emotional_state: result.emotional?.emotion || result.emotional?.primary_emotion || 'neutral',
      deep_need: result.deep?.summary || '未知',
      confidence: (result.confidence || 0).toFixed(2),
      approach: result.recommendedApproach
    };
  }

  getHistory() {
    return this.history.intents.slice(-10);
  }
}

module.exports = { IntentLayer };
