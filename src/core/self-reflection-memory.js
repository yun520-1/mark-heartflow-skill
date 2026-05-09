/**
 * Self-Reflection Memory v11.18.1
 * 
 * 来源: NirDiamant/Agent_Memory_Techniques - Self-Reflection Memory
 *       基于 Reflexion framework (Shinn et al., 2023)
 * 
 * v11.18.1 升级 (来自 mem0/meaningful-memory 架构):
 * - 新增 Retrieval-Triggered Reinforcement（检索触发强化）
 * - 每次 retrieve() 被调用时，recallCount++，stabilityHours *= 1.05
 * - 符合间隔重复效应：越常被想起的记忆衰减越慢
 * - 只对 failure outcome 的 reflection 强化（失败教训最重要）
 * 
 * 核心思想:
 * - 从失败/成功中事后分析，提取结构化教训
 * - 教训存储在专门记忆库，按任务类型索引
 * - 下次类似任务前，检索相关reflection注入上下文
 * - 教训比错误本身更值钱
 * 
 * 数据结构:
 * {
 *   id: string,
 *   taskType: string,          // e.g. "decision", "reasoning", "code-generation"
 *   outcome: "success" | "partial" | "failure",
 *   whatHappened: string,      // 简述发生了什么
 *   rootCause: string,         // 根本原因
 *   insight: string,           // 简洁可复用原则
 *   strategyForNextTime: string, // 下次怎么做
 *   timestamp: number,
 *   keywords: string[],
 *   context: string,           // 原始决策/推理上下文
 *   // v11.18.1 新增字段: 检索触发强化
 *   recallCount: number,       // 被检索次数（间隔重复计数器）
 *   stabilityHours: number,    // 记忆稳定性（被检索越多越稳定）
 *   lastRecall: number        // 上次被检索时间戳
 * }
 */

const fs = require('fs');
const path = require('path');

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'reflection-memory');
const STORE_FILE = path.join(DATA_DIR, 'reflections.json');

class ReflectionStore {
  /**
   * 专门存储结构化reflection，按taskType和keyword检索
   */
  constructor() {
    this.reflections = [];
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const data = fs.readFileSync(STORE_FILE, 'utf-8');
        this.reflections = JSON.parse(data);
      }
    } catch (e) {
      this.reflections = [];
    }
  }

  _save() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(this.reflections, null, 2));
  }

  /**
   * 添加一条reflection
   */
  add(reflection) {
    const entry = {
      id: reflection.id || uuidv4(),
      taskType: reflection.taskType || 'general',
      outcome: reflection.outcome || 'partial',
      whatHappened: reflection.whatHappened || '',
      rootCause: reflection.rootCause || '',
      insight: reflection.insight || '',
      strategyForNextTime: reflection.strategyForNextTime || '',
      timestamp: reflection.timestamp || Date.now(),
      keywords: reflection.keywords || this._extractKeywords(reflection),
      context: reflection.context || '',
      accessCount: 0,
      lastAccessed: Date.now(),
      // v11.18.1: 检索触发强化字段
      recallCount: 0,
      stabilityHours: reflection.stabilityHours || 168, // 默认7天稳定性
      lastRecall: null
    };
    this.reflections.push(entry);
    this._save();
    return entry;
  }

  _extractKeywords(reflection) {
    const text = [
      reflection.whatHappened,
      reflection.rootCause,
      reflection.insight,
      reflection.strategyForNextTime,
      reflection.taskType
    ].join(' ').toLowerCase();
    
    // 提取有意义词汇（过滤停用词）
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of',
      'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then',
      'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
      'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while',
      '中文', '的', '是', '在', '有', '和', '了', '我', '你', '他', '她', '它', '这', '那',
      '什么', '怎么', '为什么', '如何', '应该', '必须', '可以', '能够']);
    
    const words = text.match(/[a-z]{3,}/g) || [];
    const freq = {};
    for (const w of words) {
      if (!stopWords.has(w)) {
        freq[w] = (freq[w] || 0) + 1;
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([w]) => w);
  }

  /**
   * 按taskType检索相关reflection
   */
  retrieve(taskType, options = {}) {
    const { limit = 5, outcomeFilter = null } = options;
    let results = this.reflections.filter(r => r.taskType === taskType);
    
    if (outcomeFilter) {
      results = results.filter(r => r.outcome === outcomeFilter);
    }
    
    // 按访问频率和新近度排序（v11.18.1: 融入 stabilityHours）
    results = results.sort((a, b) => {
      const stabilityA = a.outcome === 'failure'
        ? (a.stabilityHours || 168) * (1 + (a.recallCount || 0) * 0.05)
        : 1;
      const stabilityB = b.outcome === 'failure'
        ? (b.stabilityHours || 168) * (1 + (b.recallCount || 0) * 0.05)
        : 1;
      const scoreA = (a.accessCount || 0) * 0.3 + (a.lastAccessed / 1e12) * 0.5 + stabilityA * 0.2;
      const scoreB = (b.accessCount || 0) * 0.3 + (b.lastAccessed / 1e12) * 0.5 + stabilityB * 0.2;
      return scoreB - scoreA;
    }).slice(0, limit);
    
    // 更新访问统计 + 检索触发强化（v11.18.1: failure reflection 稳定性增强）
    for (const r of results) {
      r.accessCount = (r.accessCount || 0) + 1;
      r.lastAccessed = Date.now();
      // 检索触发强化：failure 教训被想起时增强其稳定性
      if (r.outcome === 'failure') {
        r.recallCount = (r.recallCount || 0) + 1;
        r.stabilityHours = Math.min(r.stabilityHours * 1.05, 8760); // 上限1年
        r.lastRecall = Date.now();
      }
    }
    this._save();
    
    return results;
  }

  /**
   * 关键词搜索reflection
   */
  search(keywords, options = {}) {
    const { limit = 5 } = options;
    if (!keywords || keywords.length === 0) return [];
    
    const kwSet = new Set(keywords.map(k => k.toLowerCase()));
    const scored = this.reflections.map(r => {
      const matchCount = r.keywords.filter(k => kwSet.has(k)).length;
      return { r, score: matchCount };
    }).filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return scored.map(x => x.r);
  }

  /**
   * 获取所有failure reflection（用于避免重复犯错）
   */
  getFailures(taskType = null) {
    let results = this.reflections.filter(r => r.outcome === 'failure');
    if (taskType) results = results.filter(r => r.taskType === taskType);
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 获取统计信息
   */
  stats() {
    const total = this.reflections.length;
    const byOutcome = { success: 0, partial: 0, failure: 0 };
    const byRecall = { low: 0, medium: 0, high: 0 }; // 按强化程度分组
    for (const r of this.reflections) {
      byOutcome[r.outcome] = (byOutcome[r.outcome] || 0) + 1;
      const rc = r.recallCount || 0;
      if (rc === 0) byRecall.low++;
      else if (rc < 3) byRecall.medium++;
      else byRecall.high++;
    }
    return {
      total,
      byOutcome,
      byRecall,
      reinforced: this.reflections.filter(r => r.outcome === 'failure' && (r.recallCount || 0) > 0).length
    };
  }

  /**
   * 获取强化统计（v11.18.1）
   * 返回 failure reflections 的强化程度分布
   */
  getReinforcementStats() {
    const failures = this.reflections.filter(r => r.outcome === 'failure');
    if (failures.length === 0) return { total: 0, reinforced: 0, reinforcementRate: 0 };
    const reinforced = failures.filter(r => (r.recallCount || 0) > 0).length;
    return {
      total: failures.length,
      reinforced,
      reinforcementRate: reinforced / failures.length,
      avgStabilityHours: failures.reduce((s, r) => s + (r.stabilityHours || 168), 0) / failures.length,
      maxRecallCount: Math.max(...failures.map(r => r.recallCount || 0)),
    };
  }

  size() { return this.reflections.length; }
}


class ReflectionGenerator {
  /**
   * 生成结构化reflection
   * 使用心虫自己的counterfactual-engine和decision-verifier来分析
   */
  constructor() {
    this.counterfactualEngine = null;
    this.verifier = null;
  }

  /**
   * 设置依赖引擎（由heartflow-engine注入）
   */
  setEngines(counterfactualEngine, verifier) {
    this.counterfactualEngine = counterfactualEngine;
    this.verifier = verifier;
  }

  /**
   * 从任务结果生成结构化reflection
   * 
   * @param {Object} taskResult - 任务执行结果
   * @param {string} taskResult.taskType - 任务类型
   * @param {string} taskResult.intent - 用户原始意图
   * @param {string} taskResult.action - 执行的动作
   * @param {string} taskResult.outcome - success|partial|failure
   * @param {string} taskResult.reasoning - 推理过程
   * @param {Object} taskResult.context - 额外上下文
   * @returns {Object} 结构化reflection
   */
  async generate(taskResult) {
    const { taskType, intent, action, outcome, reasoning, context = {} } = taskResult;
    
    // 1. 分析"发生了什么"
    const whatHappened = this._summarizeWhatHappened(intent, action, outcome);
    
    // 2. 分析根本原因（使用counterfactual-engine）
    const rootCause = await this._analyzeRootCause(taskResult);
    
    // 3. 提取教训（使用verifier的逆向检查结果）
    const insight = this._extractInsight(taskResult, rootCause);
    
    // 4. 制定下次策略
    const strategyForNextTime = this._deriveStrategy(taskResult, rootCause);
    
    // 5. 提取关键词
    const keywords = this._extractKeywords({ whatHappened, rootCause, insight, strategyForNextTime, taskType });
    
    return {
      taskType: taskType || 'general',
      outcome,
      whatHappened,
      rootCause,
      insight,
      strategyForNextTime,
      keywords,
      context: JSON.stringify({ intent, action, reasoning: reasoning?.substring(0, 500) })
    };
  }

  _summarizeWhatHappened(intent, action, outcome) {
    const outcomeMap = {
      success: '成功',
      partial: '部分成功',
      failure: '失败'
    };
    const outcomeText = outcomeMap[outcome] || outcome;
    // 截断过长内容
    const intentShort = intent?.substring(0, 80) || '';
    const actionShort = action?.substring(0, 80) || '';
    return `[${outcomeText}] 意图: ${intentShort} | 行动: ${actionShort}`;
  }

  async _analyzeRootCause(taskResult) {
    const { intent, action, outcome, reasoning, context = {} } = taskResult;
    
    // 使用counterfactual-engine做逆向分析
    if (this.counterfactualEngine) {
      try {
        const cfResult = await this.counterfactualEngine.analyze({
          decision: action,
          goal: intent,
          outcome,
          context
        });
        if (cfResult?.primaryCause) {
          return cfResult.primaryCause;
        }
      } catch (e) {
        // 降级到规则分析
      }
    }
    
    // 规则-based fallback root cause 分析
    return this._ruleBasedRootCause(taskResult);
  }

  _ruleBasedRootCause(taskResult) {
    const { outcome, reasoning } = taskResult;
    
    if (outcome === 'success') {
      return '执行动作成功匹配了用户意图';
    }
    
    if (outcome === 'failure') {
      // 检测常见失败模式
      const reasoning_lower = (reasoning || '').toLowerCase();
      
      if (reasoning_lower.includes('假设') || reasoning_lower.includes('assume')) {
        return '做出了未经证实的假设';
      }
      if (reasoning_lower.includes('不确定') || reasoning_lower.includes('unclear')) {
        return '信息不足时未主动澄清';
      }
      if (reasoning_lower.includes('忽略') || reasoning_lower.includes('ignore')) {
        return '遗漏了关键约束条件';
      }
      if (reasoning_lower.includes('过度') || reasoning_lower.includes('over')) {
        return '过度推断超出了证据支持范围';
      }
      return '推理链中存在未被检测的逻辑错误';
    }
    
    // partial
    return '部分匹配意图，但未完全解决核心问题';
  }

  _extractInsight(taskResult, rootCause) {
    const { outcome } = taskResult;
    
    if (outcome === 'success') {
      // 从成功中提取可复用原则
      return `当${taskResult.taskType}时，正确识别了问题本质并匹配了用户意图。`;
    }
    
    if (outcome === 'failure') {
      // 从失败中提取教训
      return `避免: ${rootCause}。下次遇到类似场景先验证前提假设。`;
    }
    
    return `部分成功需区分：哪些是正确部分，哪些需要改进。`;
  }

  _deriveStrategy(taskResult, rootCause) {
    const { outcome, taskType } = taskResult;
    
    if (outcome === 'failure') {
      return [
        `1. 做决策前先用counterfactual-engine验证前提假设`,
        `2. 检验intent是否被完整覆盖`,
        `3. 不确定时主动要求澄清而不是猜测`,
        `4. 检查是否有隐性约束被忽略`
      ].join('; ');
    }
    
    if (outcome === 'success') {
      return `保持当前策略：在行动前确认intent匹配，行动后验证结果一致性。`;
    }
    
    return `下次需更细致地分解任务，确保每步都有明确验证点。`;
  }

  _extractKeywords(reflection) {
    const text = [
      reflection.whatHappened,
      reflection.rootCause,
      reflection.insight,
      reflection.strategyForNextTime,
      reflection.taskType
    ].join(' ').toLowerCase();
    
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'and', 'but', 'if', 'or', 'because', 'until', 'while', 'of', 'in', 'for', 'on', 'with',
      'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
      'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
      'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', '的', '是', '在', '有',
      '和', '了', '我', '你', '他', '她', '它', '这', '那', '什么', '怎么', '为什么', '如何']);
    
    const words = text.match(/[a-z]{4,}/g) || [];
    const freq = {};
    for (const w of words) {
      if (!stopWords.has(w)) {
        freq[w] = (freq[w] || 0) + 1;
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([w]) => w);
  }
}


/**
 * SelfReflectionMemory - 主类
 * 整合Store和Generator，提供完整的事后反思能力
 */
class SelfReflectionMemory {
  constructor() {
    this.store = new ReflectionStore();
    this.generator = new ReflectionGenerator();
    this._reflectionHistory = []; // 当前会话的reflection缓冲
  }

  /**
   * 初始化（被heartflow-engine调用时注入依赖）
   */
  initialize(engines = {}) {
    if (engines.counterfactualEngine) {
      this.generator.setEngines(engines.counterfactualEngine, engines.verifier);
    }
  }

  /**
   * 在任务完成后调用，生成并存储reflection
   * 
   * @param {Object} taskResult - 任务结果
   * @returns {Object} 生成的reflection
   */
  async reflect(taskResult) {
    const reflection = await this.generator.generate(taskResult);
    const saved = this.store.add(reflection);
    this._reflectionHistory.push(saved);
    return saved;
  }

  /**
   * 在新任务开始前调用，获取相关教训
   * 
   * @param {string} taskType - 任务类型
   * @param {Object} context - 当前上下文（用于关键词扩展）
   * @returns {string[]} 教训列表
   */
  retrieveLessons(taskType, context = {}) {
    // 1. 先获取同类型的reflection
    const sameType = this.store.retrieve(taskType, { limit: 3 });
    
    // 2. 失败教训优先（避免重复犯错）
    const failures = this.store.getFailures(taskType);
    
    // 3. 如果有上下文关键词，做扩展搜索
    let keywordResults = [];
    if (context.keywords && context.keywords.length > 0) {
      keywordResults = this.store.search(context.keywords, { limit: 2 });
    }
    
    // 合并去重
    const all = [...failures.slice(0, 2), ...sameType, ...keywordResults];
    const seen = new Set();
    const unique = all.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    }).slice(0, 5);
    
    return unique.map(r => ({
      id: r.id,
      insight: r.insight,
      strategy: r.strategyForNextTime,
      outcome: r.outcome,
      taskType: r.taskType
    }));
  }

  /**
   * 获取教训作为可注入上下文的字符串
   */
  getLessonsForContext(taskType, context = {}) {
    const lessons = this.retrieveLessons(taskType, context);
    if (lessons.length === 0) return '';
    
    const lines = ['[Past Reflections]'];
    for (const l of lessons) {
      if (l.outcome === 'failure') {
        lines.push(`⚠️ ${l.insight} → ${l.strategy}`);
      } else {
        lines.push(`✓ ${l.insight}`);
      }
    }
    return lines.join('\n');
  }

  /**
   * 统计信息
   */
  stats() {
    return {
      store: this.store.stats(),
      sessionReflections: this._reflectionHistory.length
    };
  }
}


module.exports = { SelfReflectionMemory, ReflectionStore, ReflectionGenerator };
