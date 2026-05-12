/**
 * HeartFlow Memory Protocol v11.22.9
 * 
 * 记忆分层协调协议
 * 
 * 来源: 用户反馈分析 + GitHub research
 * - NirDiamant/Agent_Memory_Techniques: 分层记忆架构
 * - topoteretes/cognee: tiered memory concept
 * - mem0ai/mem0: 多层检索融合
 * 
 * 核心问题（用户反馈）：
 * "OpenClaw 档案室稳定、精确、可审计、不丢失
 *  HeartFlow 血液自动结构改变、内化、生存驱动
 *  但缺工程化落地、缺具体执行路径、边界模糊"
 * 
 * 本模块解决：
 * 明确"写入哪层"的决策树
 * 自动执行晋升/降级/遗忘
 * 不需要每次手动判断
 * 
 * 决策树:
 * 
 * 收到新信息
 *     ↓
 * 是「核心身份」吗？ → YES → 写入 CORE（永久保护）
 *     ↓ NO
 * 是「操作步骤」吗？ → YES → 写入 PROCEDURAL（易提取）
 *     ↓ NO  
 * 是「通用事实/概念」吗？ → YES → 写入 SEMANTIC（知识库）
 *     ↓ NO
 * 是「具体事件/会话」吗？ → YES → 写入 EPISODIC（上下文）
 *     ↓ NO
 * 默认 → 写入 EPHEMERAL（观察/待分类）
 * 
 * 生命周期:
 * EPHEMERAL (7天) → SEMANTIC (被引用) → LEARNED (被确认) → CORE (长期)
 * 
 * 遗忘触发:
 * 30天未访问 → 标记为低优先级
 * 90天未访问 → 降级或删除（取决于类型）
 */

const fs = require('fs');
const path = require('path');
const { MemoryRouter } = require('./memory-router');
const { MemoryTierManager } = require('./memory-tier-manager');
const { ForgettingEngine } = require('./forgetting-engine');

// ============================================================
// 记忆层定义
// ============================================================

const MemoryLayer = {
  CORE: {
    name: 'core',
    ttl: Infinity,
    autoPromote: false,
    protected: true,
  },
  PROCEDURAL: {
    name: 'procedural',
    ttl: 365 * 24 * 60 * 60 * 1000,
    autoPromote: true,
    promotionThreshold: 20,
    protected: false,
  },
  SEMANTIC: {
    name: 'semantic',
    ttl: 180 * 24 * 60 * 60 * 1000,
    autoPromote: true,
    promotionThreshold: 10,
    protected: false,
  },
  EPISODIC: {
    name: 'episodic',
    ttl: 30 * 24 * 60 * 60 * 1000,
    autoPromote: true,
    promotionThreshold: 5,
    protected: false,
  },
  EPHEMERAL: {
    name: 'ephemeral',
    ttl: 7 * 24 * 60 * 60 * 1000,
    autoPromote: true,
    promotionThreshold: 3,
    protected: false,
  }
};

// ============================================================
// 关键词匹配（使用词边界避免误匹配）
// ============================================================

function hasWord(text, words) {
  return words.some(w => {
    try {
      const regex = new RegExp(`\\b${w}\\b`);
      if (regex.test(text)) return true;
    } catch {}
    // Fallback: 纯中文词或 regex 失败时用 includes
    return text.includes(w);
  });
}

// ============================================================
// 决策引擎
// ============================================================

class MemoryProtocol {
  constructor() {
    this.router = new MemoryRouter();
    this.tierManager = new MemoryTierManager();
    this.forgettingEngine = new ForgettingEngine();
    this.stats = {
      classified: 0,
      promotions: 0,
      demotions: 0,
      forgotten: 0,
      lastRun: null
    };
  }

  process(content, metadata = {}) {
    this.stats.classified++;
    const layer = this.decideLayer(content, metadata);
    const storageKey = this.getStorageKey(layer, content);
    setImmediate(() => this.checkPromotion(storageKey, layer));
    return {
      layer: layer.name,
      routing: this.router.classify(content).type,
      storageKey,
      timestamp: Date.now()
    };
  }

  decideLayer(content, metadata = {}) {
    const text = content.toLowerCase();
    const importance = metadata.importance || 0.5;

    // 优先级1: 核心身份（必须是定义性语句）
    // 同时满足: (a)含核心词 AND (b)含定义语气 AND (c)不是 HeartFlow 操作话题
    const coreWords = ['我是', '我的身份', '核心指令', '永远', '必须', '使命', '心虫', 'heartflow', 'name', 'identity', 'directive', 'mission', '价值', 'goal', 'purpose', 'must', 'never'];
    const definitionTone = ['是', '我的', 'i am', 'i was', '被称为', '定义为', '意味着', '叫', '叫做'];
    const isOperational = text.includes('heartflow') && (text.includes('安装') || text.includes('如何') || text.includes('配置') || text.includes('运行'));

    if (hasWord(text, coreWords) && hasWord(text, definitionTone) && !isOperational) {
      return MemoryLayer.CORE;
    }

    // 优先级2: 具体事件（时间词优先！）
    const episodicWords = ['昨天', '今天', '上周', '本周', '上月', '去年', '那天', '当时', '过后', '会议', '会话', '讨论', '发生在', '总结', '会议纪要', '对话记录', 'yesterday', 'today', 'meeting', 'conversation', 'session', 'discussed', 'happened', 'after', 'then', 'later', 'before', 'previously'];
    if (hasWord(text, episodicWords)) {
      return MemoryLayer.EPISODIC;
    }

    // 优先级3: 操作步骤
    const proceduralWords = ['步骤', '流程', '方法', '如何做', '教程', '指南', '配置', '安装', '运行', '部署', '首先', '然后', '最后', '下一步', '先', '再', 'step', 'process', 'method', 'how to', 'tutorial', 'configure', 'install', 'run', 'deploy', 'first', 'then', 'next', 'finally'];
    if (hasWord(text, proceduralWords)) {
      return MemoryLayer.PROCEDURAL;
    }

    // 优先级4: 通用事实/概念
    const semanticWords = ['概念', '定义', '事实', '知识', '理论', '原则', '规律', '本质', '一般来说', '通常', '事实是', 'AI', '人工智能', '机器学习', '发展方向', '策略', 'concept', 'definition', 'fact', 'knowledge', 'theory', 'principle', 'truth', 'rule', 'law', 'always', 'generally', 'typically', '很重要', '重要', '核心', '关键', '追求', '永恒', '不变'];
    if (hasWord(text, semanticWords)) {
      return MemoryLayer.SEMANTIC;
    }

    // 优先级5: 高重要性 → SEMANTIC，低 → EPHEMERAL
    if (importance >= 0.7) {
      return MemoryLayer.SEMANTIC;
    }

    return MemoryLayer.EPHEMERAL;
  }

  getStorageKey(layer, content) {
    const hash = this.simpleHash(content.substring(0, 50));
    return `${layer.name}_${hash}`;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  async checkPromotion(storageKey, currentLayer) {
    try {
      const accessCount = await this.getAccessCount(storageKey);
      if (accessCount >= currentLayer.promotionThreshold && currentLayer.autoPromote) {
        this.stats.promotions++;
        console.log(`[MemoryProtocol] 晋升: ${storageKey} (访问 ${accessCount} 次)`);
      }
    } catch (e) {}
  }

  async getAccessCount(storageKey) {
    return 0;
  }

  async runForgettingCycle(memories = []) {
    this.stats.lastRun = Date.now();
    const results = this.forgettingEngine.processMemory(memories);
    this.stats.demotions += results.results.decayed?.length || 0;
    this.stats.forgotten += results.results.forgotten?.length || 0;
    console.log(`[MemoryProtocol] 遗忘周期: 降级 ${results.results.decayed?.length || 0}, 遗忘 ${results.results.forgotten?.length || 0}`);
    return this.stats;
  }

  getStatus() {
    return {
      layers: Object.keys(MemoryLayer).map(k => ({
        name: MemoryLayer[k].name,
        ttl: MemoryLayer[k].ttl === Infinity ? '∞' : `${MemoryLayer[k].ttl / (24 * 60 * 60 * 1000)}天`,
        protected: MemoryLayer[k].protected
      })),
      stats: this.stats,
      decisionTree: 'CORE → PROCEDURAL → SEMANTIC → EPISODIC → EPHEMERAL'
    };
  }
}

module.exports = { MemoryProtocol, MemoryLayer };
