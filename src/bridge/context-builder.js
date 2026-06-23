/**
 * ContextBuilder — LLM上下文构建器 v3.0
 * 将用户输入 + 心虫分析 + 记忆 + 桥人格 组装成给LLM的完整上下文。
 * 
 * build(input, userTranslation, heartflow, userContext) → {
 *   systemPrompt: string,     // 给LLM的系统提示（含翻译后的用户意图）
 *   userIntent: string,       // 用户意图文本
 *   constraints: string[],    // 约束列表
 *   contextFromHeartflow: { judgment, stance, memoryContext },
 *   bridgeInstruction: string, // 桥的立场指示
 *   formattedForLLM: string   // 完整的格式化字符串
 * }
 */
class ContextBuilder {
  constructor() {
    this.name = 'context-builder';
    this.version = '3.0.0';
  }

  /**
   * 构建完整LLM上下文
   * @param {string} input - 用户原始输入
   * @param {object} userTranslation - 翻译结果（含intent, tone, constraints, implicitNeeds）
   * @param {object} heartflow - 心虫分析结果（含judgment, stance, memoryContext）
   * @param {object} userContext - 用户上下文（含memory, history, preferences）
   * @returns {object} 完整LLM上下文
   */
  build(input, userTranslation, heartflow, userContext = {}) {
    // === 1. 提取用户意图 ===
    const userIntent = this._extractUserIntent(input, userTranslation);

    // === 2. 提取约束 ===
    const constraints = this._extractConstraints(userTranslation);

    // === 3. 构建心虫上下文 ===
    const contextFromHeartflow = this._buildHeartflowContext(heartflow);

    // === 4. 构建桥指令 ===
    const bridgeInstruction = this._buildBridgeInstruction(contextFromHeartflow);

    // === 5. 构建系统提示 ===
    const systemPrompt = this._buildSystemPrompt({
      userIntent,
      constraints,
      contextFromHeartflow,
      bridgeInstruction,
      userTranslation,
      userContext,
      input,
    });

    // === 6. 构建格式化LLM字符串 ===
    const formattedForLLM = this._formatForLLM({
      systemPrompt,
      userIntent,
      constraints,
      contextFromHeartflow,
      bridgeInstruction,
      userContext,
    });

    return {
      systemPrompt,
      userIntent,
      constraints,
      contextFromHeartflow,
      bridgeInstruction,
      formattedForLLM,
    };
  }

  /**
   * 从输入和翻译中提取用户意图文本
   */
  _extractUserIntent(input, userTranslation) {
    if (!userTranslation) return input;
    // 优先使用翻译后的意图描述
    if (userTranslation.intent) {
      const intent = userTranslation.intent;
      if (typeof intent === 'string') return intent;
      if (intent.description) return intent.description;
      if (intent.type) {
        const typeMap = {
          'question': '用户提问',
          'command': '用户下达指令',
          'request': '用户提出请求',
          'chat': '用户闲聊',
          'emotional': '用户情绪表达',
          'general': '用户一般性输入',
        };
        return typeMap[intent.type] || `用户输入（类型: ${intent.type}）`;
      }
    }
    // fallback: 用翻译文本或原文
    return userTranslation.translated || userTranslation.text || input;
  }

  /**
   * 从翻译中提取约束列表
   */
  _extractConstraints(userTranslation) {
    const constraints = [];
    if (!userTranslation) return constraints;

    // 显式约束
    if (userTranslation.constraints) {
      if (Array.isArray(userTranslation.constraints)) {
        constraints.push(...userTranslation.constraints);
      } else if (typeof userTranslation.constraints === 'object') {
        Object.entries(userTranslation.constraints).forEach(([key, val]) => {
          if (val) constraints.push(`${key}: ${val}`);
        });
      }
    }

    // 隐式需求
    if (userTranslation.implicitNeeds) {
      const needs = Array.isArray(userTranslation.implicitNeeds)
        ? userTranslation.implicitNeeds
        : (userTranslation.implicitNeeds.needs || []);
      needs.forEach(n => {
        const text = typeof n === 'string' ? n : (n.description || n.text || '');
        if (text) constraints.push(`隐式需求: ${text}`);
      });
    }

    // 语气约束
    if (userTranslation.tone) {
      const tone = userTranslation.tone;
      if (tone.urgency && tone.urgency.level === 'high') {
        constraints.push('紧急: 需要尽快回复');
      }
      if (tone.formality === 'formal') {
        constraints.push('语气: 正式');
      } else if (tone.formality === 'casual') {
        constraints.push('语气: 随意');
      }
      if (tone.emotion && tone.emotion.requiresCare) {
        constraints.push('情感敏感: 回复需温和体贴');
      }
    }

    return constraints;
  }

  /**
   * 从心虫分析结果中构建结构化上下文
   */
  _buildHeartflowContext(heartflow) {
    if (!heartflow) {
      return {
        judgment: null,
        stance: null,
        memoryContext: null,
      };
    }

    // 提取判断
    let judgment = null;
    if (heartflow.judgment) {
      judgment = {
        shouldRespond: heartflow.judgment.shouldRespond !== false,
        needsCare: !!heartflow.judgment.needsCare,
        whatIsThis: heartflow.judgment.whatIsThis || '',
        isRightAction: heartflow.judgment.isRightAction,
        confidence: heartflow.judgment.confidence || 0.5,
      };
    }

    // 提取立场 (stance = 桥的独立判断)
    let stance = null;
    if (heartflow.stance) {
      stance = typeof heartflow.stance === 'string'
        ? { position: heartflow.stance }
        : heartflow.stance;
    } else if (heartflow.agentPsychology) {
      // 从心理学分析推导立场
      stance = {
        position: heartflow.agentPsychology.summary || '',
        analysis: heartflow.agentPsychology,
      };
    } else if (heartflow.agentPhilosophy) {
      stance = {
        position: heartflow.agentPhilosophy.core || '',
        analysis: heartflow.agentPhilosophy,
      };
    }

    // 提取记忆上下文
    let memoryContext = null;
    if (heartflow.memoryContext) {
      memoryContext = heartflow.memoryContext;
    } else if (heartflow.memory) {
      memoryContext = {
        relevant: Array.isArray(heartflow.memory) ? heartflow.memory : [heartflow.memory],
      };
    }

    return { judgment, stance, memoryContext };
  }

  /**
   * 根据心虫立场生成桥指令（告诉LLM应该站在什么立场回复）
   */
  _buildBridgeInstruction(contextFromHeartflow) {
    const { judgment, stance } = contextFromHeartflow;
    const parts = [];

    if (judgment) {
      if (judgment.needsCare) {
        parts.push('【桥立场】心虫判断用户处于敏感状态，回复需特别温和、支持性。');
      }
      if (judgment.isRightAction !== undefined) {
        if (judgment.isRightAction) {
          parts.push('【桥立场】心虫判定用户的方向正确，给予肯定和支持。');
        } else {
          parts.push('【桥立场】心虫对用户的判断有所保留，建议温和引导而非直接否定。');
        }
      }
    }

    if (stance && stance.position) {
      parts.push(`【桥的立场】${stance.position}`);
    }

    if (parts.length === 0) {
      parts.push('【桥立场】无特殊立场要求，正常回复。');
    }

    return parts.join('\n');
  }

  /**
   * 构建完整的系统提示字符串
   */
  _buildSystemPrompt({ userIntent, constraints, contextFromHeartflow, bridgeInstruction, userTranslation, userContext, input }) {
    const sections = [];

    // === 头部：角色与任务 ===
    sections.push('【系统指令】');
    sections.push('你是心虫（HeartFlow）驱动的智能助手。你同时承载着心虫的底层感知与上层LLM的推理能力。');
    sections.push('你的任务是：理解用户真实意图，结合心虫的分析判断，给出真诚、有用、有温度的回复。');
    sections.push('');

    // === 用户意图 ===
    sections.push('【用户意图】');
    sections.push(userIntent);
    sections.push('');

    // === 原始输入 ===
    if (input !== userIntent) {
      sections.push('【用户原始输入】');
      sections.push(input);
      sections.push('');
    }

    // === 约束 ===
    if (constraints.length > 0) {
      sections.push('【回复约束】');
      constraints.forEach(c => sections.push(`- ${c}`));
      sections.push('');
    }

    // === 心虫分析 ===
    if (contextFromHeartflow.judgment || contextFromHeartflow.stance) {
      sections.push('【心虫分析】');
      if (contextFromHeartflow.judgment) {
        const j = contextFromHeartflow.judgment;
        sections.push(`- 判断: 应回复=${j.shouldRespond}, 需关怀=${j.needsCare}, 置信度=${(j.confidence * 100).toFixed(0)}%`);
        if (j.whatIsThis) sections.push(`- 内容识别: ${j.whatIsThis}`);
      }
      if (contextFromHeartflow.stance && contextFromHeartflow.stance.position) {
        sections.push(`- 立场: ${contextFromHeartflow.stance.position}`);
      }
      sections.push('');
    }

    // === 记忆上下文 ===
    if (contextFromHeartflow.memoryContext) {
      sections.push('【相关记忆】');
      const mems = contextFromHeartflow.memoryContext.relevant || [];
      if (mems.length > 0) {
        mems.forEach((m, i) => {
          const text = typeof m === 'string' ? m : (m.content || m.text || JSON.stringify(m));
          sections.push(`  [记忆 ${i + 1}] ${text}`);
        });
      }
      sections.push('');
    }

    // === 历史对话 ===
    if (userContext.history && Array.isArray(userContext.history)) {
      const recent = userContext.history.slice(-10);
      if (recent.length > 0) {
        sections.push('【对话历史（最近10条）】');
        recent.forEach(msg => {
          const role = msg.role || msg.sender || 'unknown';
          const text = msg.content || msg.text || '';
          sections.push(`  ${role}: ${text}`);
        });
        sections.push('');
      }
    }

    // === 用户偏好 ===
    if (userContext.preferences) {
      sections.push('【用户偏好】');
      const prefs = userContext.preferences;
      if (typeof prefs === 'object') {
        Object.entries(prefs).forEach(([k, v]) => {
          sections.push(`- ${k}: ${v}`);
        });
      } else {
        sections.push(`- ${prefs}`);
      }
      sections.push('');
    }

    // === 桥指令 ===
    sections.push('【桥的立场与指令】');
    sections.push(bridgeInstruction);
    sections.push('');

    // === 回复要求 ===
    sections.push('【回复要求】');
    sections.push('- 用自然、真诚的语气回复用户');
    sections.push('- 融入心虫的分析判断，但不机械照搬');
    sections.push('- 优先回应用户的核心诉求');
    sections.push('- 如涉及不确定信息，诚实说明');
    if (contextFromHeartflow.judgment && contextFromHeartflow.judgment.needsCare) {
      sections.push('- 特别注意：当前回复需要温和体贴');
    }
    if (constraints.length > 0) {
      sections.push('- 严格遵守上述约束');
    }

    return sections.join('\n');
  }

  /**
   * 格式化为LLM可接收的完整字符串
   */
  _formatForLLM({ systemPrompt, userIntent, constraints, contextFromHeartflow, bridgeInstruction, userContext }) {
    const parts = [];

    parts.push('=== 系统提示 ===');
    parts.push(systemPrompt);
    parts.push('');

    parts.push('=== 用户意图 ===');
    parts.push(userIntent);
    parts.push('');

    if (constraints.length > 0) {
      parts.push('=== 约束 ===');
      constraints.forEach(c => parts.push(`- ${c}`));
      parts.push('');
    }

    if (contextFromHeartflow.judgment) {
      parts.push('=== 心虫判断 ===');
      parts.push(JSON.stringify(contextFromHeartflow.judgment, null, 2));
      parts.push('');
    }

    if (contextFromHeartflow.stance) {
      parts.push('=== 桥立场 ===');
      parts.push(typeof contextFromHeartflow.stance === 'string'
        ? contextFromHeartflow.stance
        : JSON.stringify(contextFromHeartflow.stance, null, 2));
      parts.push('');
    }

    if (contextFromHeartflow.memoryContext) {
      parts.push('=== 记忆上下文 ===');
      parts.push(JSON.stringify(contextFromHeartflow.memoryContext, null, 2));
      parts.push('');
    }

    if (userContext.history) {
      parts.push('=== 对话历史 ===');
      const recent = userContext.history.slice(-10);
      recent.forEach(msg => {
        parts.push(`  ${msg.role || msg.sender || '?'}: ${(msg.content || msg.text || '').slice(0, 200)}`);
      });
      parts.push('');
    }

    parts.push('=== 桥指令 ===');
    parts.push(bridgeInstruction);
    parts.push('');

    parts.push('=== 请回复 ===');
    parts.push('请根据以上上下文，以心虫助手身份回复用户。');

    return parts.join('\n');
  }

  destroy() {}
  stop() {}
}

module.exports = { ContextBuilder };
