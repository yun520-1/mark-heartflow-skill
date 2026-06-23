/**
 * UserToLLM — 用户自然语言 → 结构化LLM指令
 * 
 * 接收用户的模糊/自然语言输入，输出 LLM 能精确理解的指令结构。
 * 核心能力：去歧义、补全隐含信息、结构化意图。
 * 
 * 支持10种意图类型：
 *   ask      — 提问（问句结尾或含疑问词）
 *   command  — 指令（动词开头）
 *   analyze  — 分析（对比/分析/比较/区别/差异）
 *   explain  — 解释（为什么/如何/怎么回事/原理）
 *   create   — 创作（写/创建/生成/画/设计）
 *   define   — 定义（什么是/是什么/定义/解释什么是）
 *   evaluate — 评估（怎么样/好不好/值不值得/评价）
 *   summarize— 总结（总结/概括/归纳/摘要）
 *   translate— 翻译（中英文混合）
 *   default  — 兜底
 */

const CHINESE_CHARS = /[\u4e00-\u9fa5]/;
const LATIN_CHARS = /[a-zA-Z]/;

class UserToLLM {
  constructor(options = {}) {
    this.name = 'user-to-llm';
    this.version = '2.0.0';
    this.options = options;
  }

  /**
   * 翻译用户输入为结构化LLM指令
   * @param {string} input - 用户自然语言
   * @param {object} context - 上下文（记忆、历史、心虫分析）
   * @returns {object} { intent, confidence, entities, constraints, tone, implicitNeeds, originalInput }
   */
  translate(input, context = {}) {
    if (!input || typeof input !== 'string') {
      return {
        originalInput: input || '',
        intent: 'default',
        confidence: 0,
        entities: {},
        constraints: [],
        tone: 'neutral',
        implicitNeeds: [],
        llmInstruction: '',
        timestamp: Date.now(),
        error: 'invalid_input'
      };
    }
    const result = this._classifyIntent(input);
    const entities = this._extractEntities(input);
    const constraints = this._extractConstraints(input, result);
    const tone = this._analyzeTone(input);
    const implicitNeeds = this._detectImplicitNeeds(input, context, result);
    const confidence = this._calculateConfidence(input, result);

    return {
      originalInput: input,
      intent: result.intent,
      confidence,
      entities,
      constraints,
      tone,
      implicitNeeds,
      llmInstruction: this._buildInstruction(result, entities, constraints, tone, implicitNeeds),
      timestamp: Date.now()
    };
  }

  /**
   * 10种意图分类，带置信度分数
   * 返回 { intent: string, confidence: number, subType: string }
   */
  _classifyIntent(input) {
    const q = input.trim();
    const lower = q.toLowerCase();

    // 1. translate — 中英文混合（同时含中英文，且有翻译意图关键词或明显翻译场景）
    const hasChinese = CHINESE_CHARS.test(q);
    const hasLatin = LATIN_CHARS.test(q);
    const translateKeywords = /翻译|translate|译成|翻成|怎么读|什么意思/.test(lower);
    const isMixedLang = hasChinese && hasLatin;
    if (translateKeywords || (isMixedLang && q.length < 200 && !/(为什么|如何|分析|对比|区别|评价|好不好)/.test(lower))) {
      return {
        intent: 'translate',
        confidence: translateKeywords ? 0.92 : 0.70,
        subType: isMixedLang ? 'cross-lingual' : 'translation-request'
      };
    }

    // 2. define — 定义（优先级较高，避免被 ask 抢走）
    if (/^(什么是|解释什么是|请.*?定义|定义|是什么|是什么意思)/.test(lower)) {
      return { intent: 'define', confidence: 0.90, subType: 'concept-definition' };
    }

    // 3. analyze — 分析
    if (/对比|分析|比较|区别|差异|优缺点|利弊|pros and cons|异同/.test(lower)) {
      return { intent: 'analyze', confidence: 0.88, subType: 'comparison-analysis' };
    }

    // 4. evaluate — 评估
    if (/(怎么样|好不好|值不值得|值得买吗|评价|评分|值得|性价比|推荐吗)/.test(lower)) {
      return { intent: 'evaluate', confidence: 0.85, subType: 'quality-evaluation' };
    }

    // 5. explain — 解释
    if (/(为什么|怎么回事|什么原理|原理是|背后的原因|是什么原因|怎么形成的)/.test(lower)) {
      return { intent: 'explain', confidence: 0.87, subType: 'causality-explanation' };
    }

    // 6. create — 创作
    if (/^(写|创建|生成|画|设计|制作|编写|绘制|创作)/.test(q)) {
      return { intent: 'create', confidence: 0.85, subType: 'generation' };
    }

    // 7. summarize — 总结
    if (/^(总结|概括|归纳|摘要|提炼|简述|概括一下)/.test(lower)) {
      return { intent: 'summarize', confidence: 0.90, subType: 'condense' };
    }

    // 8. command — 指令（动词开头，但未被 create 抢走）
    if (/^(告诉|做|帮我|给我|查|搜索|找|打开|运行|执行|计算|列出|展示|显示|设置|配置|安装|启动|停止|删除|修改|更新|复制|移动|导出|导入|发送|通知)/.test(q)) {
      return { intent: 'command', confidence: 0.80, subType: 'action-command' };
    }

    // 9. ask — 提问（以问号结尾或含疑问词，未被更具体的意图匹配）
    if (/[？?]\s*$/.test(q) || /^(如何|怎么|怎样|能否|能不能|可以.*吗|有没有)/.test(lower) || /[？?]/.test(q)) {
      return { intent: 'ask', confidence: 0.75, subType: 'question' };
    }

    // 10. default — 兜底
    return { intent: 'default', confidence: 0.50, subType: 'general' };
  }

  _extractEntities(input) {
    const entities = { people: [], concepts: [], numbers: [], references: [], language: null };

    // 人名检测（中文2-4字，前面有标记词）
    const personMatch = input.match(/(?:关于|说到|提到|像|找|问)\s*([\u4e00-\u9fa5]{2,4})/g);
    if (personMatch) {
      entities.people = personMatch.map(m => m.replace(/关于|说到|提到|像|找|问/g, '').trim());
    }

    // 数字检测
    const numMatch = input.match(/\d+[.\d]*/g);
    if (numMatch) entities.numbers = numMatch.map(Number);

    // 语言检测（翻译场景）
    const langMatch = input.match(/(中文|英文|日语|韩语|法语|德语|西班牙语|俄语|阿拉伯语|翻译成\s*\S+)/);
    if (langMatch) entities.language = langMatch[0];

    return entities;
  }

  _extractConstraints(input, intentObj) {
    const constraints = {};

    // 长度约束
    if (/简短|几句话|简洁|一句话|概要/.test(input)) constraints.length = 'short';
    if (/详细|全面|深入|展开|详尽|具体/.test(input)) constraints.length = 'detailed';

    // 语言约束
    const langMatch = input.match(/(?:用|以)\s*(中文|英文|日语|韩语|法语|德语)\s*(?:回答|解释|说明|写)/);
    if (langMatch) constraints.language = langMatch[1];
    if (/中文/.test(input) && !constraints.language) constraints.language = '中文';
    if (/英文/.test(input) && !constraints.language) constraints.language = '英文';

    // 风格约束
    if (/比喻|举例|案例|例子/.test(input)) constraints.style = 'example-driven';
    if (/专业|学术|论文|严谨|正式/.test(input)) constraints.style = 'academic';
    if (/简单|通俗|易懂|大白话/.test(input)) constraints.style = 'simple';
    if (/幽默|搞笑|有趣|好玩/.test(input)) constraints.style = 'humorous';

    // 格式约束
    if (/列表|条|点|编号/.test(input)) constraints.format = 'list';
    if (/表格|表/.test(input)) constraints.format = 'table';
    if (/代码|code/.test(input)) constraints.format = 'code';
    if (/json|JSON/.test(input)) constraints.format = 'json';

    // 翻译方向约束
    if (intentObj.intent === 'translate') {
      if (/翻成英文|译成英文|翻译成英文/.test(input)) constraints.targetLang = 'en';
      if (/翻成中文|译成中文|翻译成中文/.test(input)) constraints.targetLang = 'zh';
    }

    return constraints;
  }

  _analyzeTone(input) {
    if (/急|快|马上|赶紧|立刻|快点/.test(input)) {
      return { urgency: 'high', formality: 'low', emotion: 'impatient' };
    }
    if (/请教|请问|求教|谢谢|麻烦|感谢|拜托/.test(input)) {
      return { urgency: 'low', formality: 'high', emotion: 'respectful' };
    }
    if (/操|靠|烦|无语|垃圾|SB|傻逼|妈的/.test(input)) {
      return { urgency: 'medium', formality: 'low', emotion: 'frustrated' };
    }
    if (/哈哈|好玩|有趣|厉害|牛|棒|赞/.test(input)) {
      return { urgency: 'low', formality: 'low', emotion: 'curious' };
    }
    if (/急|紧急|重要|必须|务必/.test(input)) {
      return { urgency: 'high', formality: 'medium', emotion: 'urgent' };
    }
    return { urgency: 'medium', formality: 'medium', emotion: 'neutral' };
  }

  _detectImplicitNeeds(input, context, intentObj) {
    const needs = [];

    // 矛盾点需要调和
    if (/但是|然而|不过|虽然/.test(input) && /[？?]/.test(input)) {
      needs.push({ type: 'contradiction_resolution', description: '用户提出了矛盾点，需要调和' });
    }

    // 需要简化解释
    if (/不懂|不理解|不明白|困惑|太难|复杂/.test(input)) {
      needs.push({ type: 'simplification', description: '用户需要更简单的解释' });
    }

    // 需要确认被理解
    if (/你懂吗|明白吗|知道吗|懂了吗|理解吗/.test(input)) {
      needs.push({ type: 'validation', description: '用户需要确认被理解' });
    }

    // 翻译意图附带默认方向
    if (intentObj.intent === 'translate' && !input.includes('翻成') && !input.includes('翻译成')) {
      needs.push({ type: 'translation_direction', description: '未指定翻译方向，需确认源语言和目标语言' });
    }

    // 命令意图缺少宾语
    if (intentObj.intent === 'command' && input.split(/\s+/).length < 3) {
      needs.push({ type: 'ambiguous_target', description: '指令过于简短，需要确认操作对象' });
    }

    // 评估意图缺少对比对象
    if (intentObj.intent === 'evaluate' && !/和|与|跟|对比|vs|versus/.test(input)) {
      needs.push({ type: 'missing_reference', description: '评估缺少对比参照，将基于通用标准评估' });
    }

    return needs;
  }

  _buildInstruction(intentObj, entities, constraints, tone, implicitNeeds) {
    const parts = [`意图: ${intentObj.intent}(${intentObj.subType}) [置信度:${(intentObj.confidence * 100).toFixed(0)}%]`];

    if (entities.people && entities.people.length) {
      parts.push(`人物: ${entities.people.join(', ')}`);
    }
    if (entities.concepts && entities.concepts.length) {
      parts.push(`概念: ${entities.concepts.join(', ')}`);
    }
    if (entities.numbers && entities.numbers.length) {
      parts.push(`数字: ${entities.numbers.join(', ')}`);
    }
    if (entities.language) {
      parts.push(`语言: ${entities.language}`);
    }

    if (constraints.length) parts.push(`长度: ${constraints.length}`);
    if (constraints.style) parts.push(`风格: ${constraints.style}`);
    if (constraints.format) parts.push(`格式: ${constraints.format}`);
    if (constraints.language) parts.push(`回复语言: ${constraints.language}`);
    if (constraints.targetLang) parts.push(`翻译目标: ${constraints.targetLang}`);

    if (tone.emotion === 'frustrated') {
      parts.push('⚠️ 注意: 用户情绪不佳，避免过度技术性表达');
    }
    if (tone.emotion === 'impatient' || tone.emotion === 'urgent') {
      parts.push('⚡ 注意: 用户需要快速回应');
    }

    if (implicitNeeds && implicitNeeds.length) {
      parts.push(`隐性需求: ${implicitNeeds.map(n => n.description).join('; ')}`);
    }

    return parts.join(' | ');
  }

  _calculateConfidence(input, intentObj) {
    let score = intentObj.confidence;

    // 有实体加分
    const hasEntity = /[\u4e00-\u9fa5]{2,4}/.test(input) || /\d+/.test(input);
    if (hasEntity) score += 0.05;

    // 有约束加分
    if (/简短|详细|用中文|用英文|举例|专业|简单/.test(input)) score += 0.05;

    // 翻译场景：有中英文混合进一步确认
    if (intentObj.intent === 'translate') {
      const hasChinese = CHINESE_CHARS.test(input);
      const hasLatin = LATIN_CHARS.test(input);
      if (hasChinese && hasLatin) score += 0.08;
    }

    return Math.min(score, 1.0);
  }

  destroy() {}
  stop() {}
}

module.exports = { UserToLLM };
