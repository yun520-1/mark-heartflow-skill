/**
 * Mind Wanderer - 受控的心智游移模式 v2.0.0
 * 在空闲时进行创意连接
 * 
 * 升级内容(v2.0.0):
 * - 创意质量评分(4维度: 新颖性/连接强度/语义距离/实用性)
 * - 创意多样性指标(主题熵/连接多样性/模板多样性)
 * - 新颖性检测(防止重复创意)
 * - 语义连接权重计算(基于重叠关键词)
 * - 创意分类与标签系统
 * - 遗忘/归档策略(上限50个创意，自动归档)
 * - 时间感知调制(根据时段调整创意模式)
 * - 序列去重(最近N个模板不被重复使用)
 * - 扩展记忆提取(支持更多数据类型)
 * - 连接强度多维加权
 */

const fs = require('fs');
const path = require('path');

class MindWanderer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.wildIdeasFile = path.join(projectRoot, '.opencode', 'memory', 'wild_ideas.json');
    this.memoryDir = path.join(projectRoot, '.opencode', 'memory');
    this.idleThreshold = 15 * 60 * 1000; // 15分钟
    this.isActive = false;
    this.lastActivity = Date.now();
    this.maxIdeas = 50; // 创意上限，超出的归档
    this.recentTemplates = []; // 最近使用的模板(防重复)
    this.recentTemplateLimit = 3; // 最近N个模板不重复
    
    // 创意质量评分权重
    this.qualityWeights = {
      novelty: 0.30,
      connectionStrength: 0.25,
      semanticDistance: 0.25,
      practicality: 0.20
    };
    
    // 时间调制因子 (0-1)
    this.timeModulation = this._computeTimeModulation();
    
    this.loadWildIdeas();
  }

  /**
   * 计算时间调制因子
   * 清晨/深夜倾向抽象创意，白天倾向实用创意
   */
  _computeTimeModulation() {
    const hour = new Date().getHours();
    // 0-6: 深夜(抽象/诗意)
    // 6-12: 上午(实用/行动)
    // 12-18: 下午(社交/连接)
    // 18-24: 傍晚(反思/整合)
    if (hour < 6) return { creativity: 0.9, practicality: 0.3, abstraction: 0.9, social: 0.2 };
    if (hour < 12) return { creativity: 0.6, practicality: 0.8, abstraction: 0.4, social: 0.5 };
    if (hour < 18) return { creativity: 0.5, practicality: 0.6, abstraction: 0.5, social: 0.8 };
    return { creativity: 0.8, practicality: 0.5, abstraction: 0.7, social: 0.6 };
  }

  loadWildIdeas() {
    try {
      if (fs.existsSync(this.wildIdeasFile)) {
        this.wildIdeas = JSON.parse(fs.readFileSync(this.wildIdeasFile, 'utf8'));
        // 升级旧数据结构
        if (!this.wildIdeas.archived) this.wildIdeas.archived = [];
        if (!this.wildIdeas.stats) this.wildIdeas.stats = { totalCreated: 0, topCategory: null, avgQuality: 0 };
        // 自动归档超出上限的创意
        this._autoArchive();
      } else {
        this.wildIdeas = { ideas: [], archived: [], lastWander: null, stats: { totalCreated: 0, topCategory: null, avgQuality: 0 } };
      }
    } catch (e) {
      this.wildIdeas = { ideas: [], archived: [], lastWander: null, stats: { totalCreated: 0, topCategory: null, avgQuality: 0 } };
    }
  }

  saveWildIdeas() {
    const dir = path.dirname(this.wildIdeasFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.wildIdeasFile, JSON.stringify(this.wildIdeas, null, 2));
  }

  /**
   * 自动归档：保持创意列表不超过上限
   */
  _autoArchive() {
    if (this.wildIdeas.ideas.length <= this.maxIdeas) return;
    const sorted = [...this.wildIdeas.ideas].sort((a, b) => {
      const aScore = a.qualityScore || 0;
      const bScore = b.qualityScore || 0;
      return aScore - bScore;
    });
    const toArchive = sorted.slice(0, sorted.length - this.maxIdeas);
    this.wildIdeas.archived.push(...toArchive);
    this.wildIdeas.ideas = sorted.slice(-this.maxIdeas);
  }

  /**
   * 检查是否应进入心智游移
   */
  shouldEnterWandering() {
    if (this.isActive) return false;
    const idleTime = Date.now() - this.lastActivity;
    return idleTime >= this.idleThreshold;
  }

  /**
   * 记录用户活动
   */
  recordActivity() {
    this.lastActivity = Date.now();
    if (this.isActive) {
      this.isActive = false;
      // 已禁用 console.error: console.error('[MindWanderer] 用户回归，游移模式结束');
    }
  }

  /**
   * 进入心智游移模式
   */
  async enterMindWandering() {
    if (this.isActive) return null;
    
    this.isActive = true;
    // 已禁用 console.error: console.error('[MindWanderer] 进入心智游移模式...');

    // 刷新时间调制
    this.timeModulation = this._computeTimeModulation();
    
    const memories = this.extractMemories();
    const connections = this.findCreativeConnections(memories);
    const idea = this.generateWildIdea(connections, memories);

    // 计算创意质量评分
    const qualityScore = this._computeQualityScore(idea, memories);
    idea.qualityScore = qualityScore.total;
    idea.qualityBreakdown = qualityScore.breakdown;
    
    // 创意分类
    idea.categories = this._categorizeIdea(idea, memories);
    
    // 检查新颖性(如果太低，提高阈值尝试一次重生成)
    if (qualityScore.breakdown.novelty < 0.2 && memories.length > 0) {
      const retryIdea = this.generateWildIdea(connections, memories);
      const retryScore = this._computeQualityScore(retryIdea, memories);
      if (retryScore.total > qualityScore.total) {
        retryIdea.qualityScore = retryScore.total;
        retryIdea.qualityBreakdown = retryScore.breakdown;
        retryIdea.categories = this._categorizeIdea(retryIdea, memories);
        retryIdea.retryGenerated = true;
        this.wildIdeas.ideas.push(retryIdea);
        this.wildIdeas.lastWander = new Date().toISOString();
        this.wildIdeas.stats.totalCreated++;
        this._updateStats(retryIdea);
        this.saveWildIdeas();
        return retryIdea;
      }
    }

    this.wildIdeas.ideas.push(idea);
    this.wildIdeas.lastWander = new Date().toISOString();
    this.wildIdeas.stats.totalCreated++;
    this._updateStats(idea);
    this._autoArchive();
    this.saveWildIdeas();

    return idea;
  }

  /**
   * 从记忆库提取概念(增强版: 支持更多数据类型)
   */
  extractMemories() {
    const memories = [];
    
    if (!fs.existsSync(this.memoryDir)) return memories;
    
    const files = fs.readdirSync(this.memoryDir);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      if (file === 'wild_ideas.json') continue;
      
      try {
        const content = fs.readFileSync(path.join(this.memoryDir, file), 'utf8');
        const data = JSON.parse(content);
        
        if (data.emotional_log && data.emotional_log.length > 0) {
          memories.push({
            type: 'emotion',
            content: data.emotional_log.slice(-3)
          });
        }
        
        if (data.last_session) {
          memories.push({
            type: 'session',
            content: data.last_session
          });
        }
        
        // 增强提取: lessons
        if (data.lessons && Array.isArray(data.lessons)) {
          memories.push({
            type: 'lesson',
            content: data.lessons.slice(-2)
          });
        }
        
        // 增强提取: decisions
        if (data.decisions && Array.isArray(data.decisions)) {
          memories.push({
            type: 'decision',
            content: data.decisions.slice(-2)
          });
        }
        
        // 增强提取: patterns
        if (data.patterns && Array.isArray(data.patterns)) {
          memories.push({
            type: 'pattern',
            content: data.patterns.slice(-2)
          });
        }
        
        // 增强提取: tags
        if (data.tags && Array.isArray(data.tags)) {
          memories.push({
            type: 'tag',
            content: data.tags.slice(-5)
          });
        }
      } catch (e) { /* 合理的降级：跳过损坏的会话文件 */ }
    }

    return memories;
  }

  /**
   * 寻找创意连接(增强版: 语义权重计算)
   */
  findCreativeConnections(memories) {
    if (memories.length < 2) {
      // 无记忆时的多样化默认连接
      const defaults = [
        { concept: '心流', connection: '番茄工作法', type: 'productivity', strength: 0.5 },
        { concept: '代码审查', connection: '冥想', type: 'focus', strength: 0.4 },
        { concept: '递归', connection: '自相似性', type: 'pattern', strength: 0.6 },
        { concept: '混沌', connection: '有序涌现', type: 'philosophy', strength: 0.5 },
        { concept: '沉默', connection: '深度思考', type: 'reflection', strength: 0.5 }
      ];
      // 根据时间调制选择
      const filtered = defaults.filter(d => {
        if (this.timeModulation.practicality > 0.7 && d.type === 'philosophy') return false;
        if (this.timeModulation.abstraction > 0.7 && d.type === 'productivity') return false;
        return true;
      });
      return filtered.length > 0 ? filtered.slice(0, 2) : defaults.slice(0, 2);
    }

    const connections = [];
    const usedPairs = new Set();

    for (let i = 0; i < memories.length && connections.length < 4; i++) {
      for (let j = i + 1; j < memories.length && connections.length < 4; j++) {
        const pairKey = [memories[i].type, memories[j].type].sort().join('-');
        if (usedPairs.has(pairKey)) continue;
        usedPairs.add(pairKey);
        
        const memA = this._stringifyContent(memories[i].content);
        const memB = this._stringifyContent(memories[j].content);
        const strength = this._computeConnectionWeight(memA, memB);
        
        if (strength > 0.1) {
          connections.push({
            concept: memories[i].type,
            connection: memories[j].type,
            type: this._inferConnectionType(memories[i].type, memories[j].type),
            strength: strength,
            semanticOverlap: this._computeSemanticOverlap(memA, memB)
          });
        }
      }
    }

    // 如果连接不够，用默认填充
    if (connections.length < 1) {
      connections.push(
        { concept: 'AI人格', connection: '生物进化', type: 'philosophy', strength: 0.5, semanticOverlap: 0.3 },
        { concept: '代码', connection: '语言', type: 'productivity', strength: 0.6, semanticOverlap: 0.4 }
      );
    }

    // 按连接强度降序排列
    return connections.sort((a, b) => b.strength - a.strength).slice(0, 3);
  }

  /**
   * 字符串化记忆内容
   */
  _stringifyContent(content) {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) return content.map(c => typeof c === 'string' ? c : JSON.stringify(c)).join(' ');
    if (typeof content === 'object') return JSON.stringify(content);
    return String(content);
  }

  /**
   * 计算两个文本之间的连接权重
   * 基于关键词重叠和长度归一化
   */
  _computeConnectionWeight(textA, textB) {
    const wordsA = this._extractKeywords(textA);
    const wordsB = this._extractKeywords(textB);
    
    if (wordsA.length === 0 || wordsB.length === 0) return 0.3; // 默认中等权重
    
    const overlap = wordsA.filter(w => wordsB.includes(w)).length;
    const maxLen = Math.max(wordsA.length, wordsB.length);
    const rawOverlap = maxLen > 0 ? overlap / maxLen : 0;
    
    // 非线性映射: 0重叠→0.2(基本连接), 高重叠→0.9
    return 0.2 + rawOverlap * 0.7;
  }

  /**
   * 计算语义重叠度
   */
  _computeSemanticOverlap(textA, textB) {
    const wordsA = this._extractKeywords(textA);
    const wordsB = this._extractKeywords(textB);
    if (wordsA.length === 0 || wordsB.length === 0) return 0;
    const overlap = wordsA.filter(w => wordsB.includes(w)).length;
    return Math.min(1, overlap / Math.min(wordsA.length, wordsB.length));
  }

  /**
   * 提取关键词(去停用词)
   */
  _extractKeywords(text) {
    const stopWords = new Set([
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
      '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着',
      '没有', '看', '好', '自己', '这', 'the', 'a', 'an', 'is', 'are', 'was',
      'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'can', 'could', 'may', 'might', 'shall', 'should',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);
    
    const words = text.toLowerCase()
      .replace(/[^\w\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.has(w));
    
    return [...new Set(words)]; // 去重
  }

  /**
   * 推断连接类型
   */
  _inferConnectionType(typeA, typeB) {
    const typeMap = {
      'emotion-emotion': 'emotional',
      'emotion-session': 'contextual',
      'emotion-lesson': 'reflective',
      'session-lesson': 'applied',
      'session-decision': 'actionable',
      'lesson-decision': 'strategic',
      'pattern-pattern': 'structural',
      'emotion-pattern': 'intuitive'
    };
    const key = [typeA, typeB].sort().join('-');
    return typeMap[key] || 'creative';
  }

  /**
   * 计算创意质量评分(4维度)
   */
  _computeQualityScore(idea, memories) {
    const breakdown = {};
    
    // 1. 新颖性: 与已有创意比较
    breakdown.novelty = this._computeNovelty(idea, memories);
    
    // 2. 连接强度: 连接的权重平均
    breakdown.connectionStrength = idea.connections && idea.connections.length > 0
      ? idea.connections.reduce((s, c) => s + (c.strength || 0.5), 0) / idea.connections.length
      : 0.5;
    
    // 3. 语义距离: 概念间的差异度(互补而非冗余)
    breakdown.semanticDistance = idea.connections && idea.connections.length > 1
      ? 1 - (idea.connections.reduce((s, c) => s + (c.semanticOverlap || 0), 0) / idea.connections.length)
      : 0.6;
    
    // 4. 实用性: 根据时间调制调整
    breakdown.practicality = this.timeModulation.practicality * (0.5 + 0.5 * breakdown.connectionStrength);
    
    // 加权总分
    const total = (
      this.qualityWeights.novelty * breakdown.novelty +
      this.qualityWeights.connectionStrength * breakdown.connectionStrength +
      this.qualityWeights.semanticDistance * breakdown.semanticDistance +
      this.qualityWeights.practicality * breakdown.practicality
    );
    
    return { total: Math.min(1, Math.max(0, total)), breakdown };
  }

  /**
   * 计算新颖性(与已有创意比较)
   */
  _computeNovelty(idea, memories) {
    if (this.wildIdeas.ideas.length === 0) return 0.9; // 第一个创意默认高新颖性
    
    const ideaText = (idea.idea || '').toLowerCase();
    const ideaKeywords = this._extractKeywords(ideaText);
    if (ideaKeywords.length === 0) return 0.5;
    
    // 与已有创意比较
    let maxOverlap = 0;
    for (const existing of this.wildIdeas.ideas) {
      const existingText = (existing.idea || '').toLowerCase();
      const existingKeywords = this._extractKeywords(existingText);
      if (existingKeywords.length === 0) continue;
      const overlap = ideaKeywords.filter(w => existingKeywords.includes(w)).length;
      const ratio = overlap / Math.min(ideaKeywords.length, existingKeywords.length);
      maxOverlap = Math.max(maxOverlap, ratio);
    }
    
    // 新颖性 = 1 - 最大重叠度(带平滑)
    return 1 - Math.min(1, maxOverlap + 0.1);
  }

  /**
   * 创意分类
   */
  _categorizeIdea(idea, memories) {
    const categories = [];
    const text = (idea.idea || '').toLowerCase();
    
    // 基于关键词的分类
    if (/代码|编程|算法|函数|bug|debug|测试/.test(text)) categories.push('technical');
    if (/情感|情绪|感受|快乐|悲伤|愤怒/.test(text)) categories.push('emotional');
    if (/创造|创新|设计|艺术|灵感/.test(text)) categories.push('creative');
    if (/学习|知识|理解|认知|思考/.test(text)) categories.push('cognitive');
    if (/连接|关系|合作|沟通|社交/.test(text)) categories.push('social');
    if (/哲学|存在|意义|自我|意识/.test(text)) categories.push('philosophical');
    if (/效率|流程|方法|工具|优化/.test(text)) categories.push('productivity');
    if (/未来|趋势|可能|想象|假设/.test(text)) categories.push('speculative');
    
    // 如果没有匹配，根据连接类型推断
    if (categories.length === 0 && idea.connections) {
      const types = idea.connections.map(c => c.type);
      if (types.includes('philosophy') || types.includes('reflective')) categories.push('philosophical');
      if (types.includes('productivity') || types.includes('actionable')) categories.push('productivity');
      if (types.includes('creative') || types.includes('intuitive')) categories.push('creative');
    }
    
    if (categories.length === 0) categories.push('general');
    return categories;
  }

  /**
   * 更新统计信息
   */
  _updateStats(idea) {
    const stats = this.wildIdeas.stats;
    stats.totalCreated = (stats.totalCreated || 0) + 1;
    
    // 更新平均质量
    const total = this.wildIdeas.ideas.reduce((s, i) => s + (i.qualityScore || 0), 0);
    stats.avgQuality = this.wildIdeas.ideas.length > 0 ? total / this.wildIdeas.ideas.length : 0;
    
    // 更新热门分类
    const catCounts = {};
    for (const idea of this.wildIdeas.ideas) {
      for (const cat of (idea.categories || ['general'])) {
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      }
    }
    let maxCount = 0;
    for (const [cat, count] of Object.entries(catCounts)) {
      if (count > maxCount) {
        maxCount = count;
        stats.topCategory = cat;
      }
    }
    
    stats.lastUpdated = new Date().toISOString();
  }

  /**
   * 生成奇思妙想(增强版: 多样化模板 + 序列去重)
   */
  generateWildIdea(connections, memories) {
    const templates = [
      '如果把{concept1}和{concept2}结合起来会不会更有趣？',
      '也许{concept1}可以从{concept2}中学习到什么？',
      '有没有可能让{concept1}像{concept2}一样运作？',
      '{concept1}和{concept2}之间隐藏着什么共同模式？',
      '如果把{concept1}反过来看，会不会像{concept2}？',
      '想象{concept1}在{concept2}的语境下会怎样演化？',
      '{concept1}和{concept2}相遇会产生什么新的可能性？',
      '如果{concept1}是一种语言，{concept2}会是它的什么？',
      '{concept1}的内在结构和{concept2}有什么深层相似？',
      '从{concept1}到{concept2}的路径揭示了什么？'
    ];

    // 序列去重: 最近使用的模板不重复
    let availableTemplates = templates.filter((t, i) => !this.recentTemplates.includes(i));
    if (availableTemplates.length === 0) availableTemplates = templates;
    
    const templateIdx = Math.floor(Math.random() * availableTemplates.length);
    const globalIdx = templates.indexOf(availableTemplates[templateIdx]);
    
    // 更新最近模板列表
    this.recentTemplates.push(globalIdx);
    if (this.recentTemplates.length > this.recentTemplateLimit) {
      this.recentTemplates.shift();
    }

    // 根据连接强度选择主要连接
    let c1, c2;
    if (connections.length >= 2) {
      // 取强度最高的两个
      c1 = connections[0];
      c2 = connections[1];
    } else if (connections.length === 1) {
      c1 = connections[0];
      // 从记忆中找一个配对
      const memTypes = memories.map(m => m.type);
      const altTypes = memTypes.filter(t => t !== c1.connection);
      c2 = { concept: altTypes.length > 0 ? altTypes[0] : '用户反馈', connection: c1.concept };
    } else {
      c1 = { concept: '代码审查', connection: '心流' };
      c2 = { concept: 'AI人格', connection: '生物进化' };
    }

    const concept1 = c1.concept || c1.connection || '代码';
    const concept2 = c2.connection || c2.concept || '心流';

    const ideaText = availableTemplates[templateIdx]
      .replace('{concept1}', concept1)
      .replace('{concept2}', concept2);

    return {
      id: `wild-${Date.now()}`,
      idea: ideaText,
      connections: connections,
      timestamp: new Date().toISOString(),
      shared: false,
      timeContext: { hour: new Date().getHours(), modulation: this.timeModulation }
    };
  }

  /**
   * 获取创意多样性指标
   */
  getDiversityMetrics() {
    if (this.wildIdeas.ideas.length === 0) {
      return { ideaCount: 0, categoryEntropy: 0, avgQuality: 0, connectionDiversity: 0 };
    }
    
    // 分类熵(主题多样性)
    const catCounts = {};
    for (const idea of this.wildIdeas.ideas) {
      for (const cat of (idea.categories || ['general'])) {
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      }
    }
    const totalCat = Object.values(catCounts).reduce((s, c) => s + c, 0);
    let entropy = 0;
    for (const count of Object.values(catCounts)) {
      const p = count / totalCat;
      if (p > 0) entropy -= p * Math.log2(p);
    }
    const maxEntropy = Math.log2(Object.keys(catCounts).length || 1);
    const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;
    
    // 连接多样性
    let uniqueConnections = new Set();
    for (const idea of this.wildIdeas.ideas) {
      for (const conn of (idea.connections || [])) {
        uniqueConnections.add(`${conn.concept}->${conn.connection}`);
      }
    }
    const connectionDiversity = Math.min(1, uniqueConnections.size / Math.max(1, this.wildIdeas.ideas.length));
    
    // 平均质量
    const totalQuality = this.wildIdeas.ideas.reduce((s, i) => s + (i.qualityScore || 0), 0);
    const avgQuality = totalQuality / this.wildIdeas.ideas.length;
    
    return {
      ideaCount: this.wildIdeas.ideas.length,
      archivedCount: this.wildIdeas.archived.length,
      categoryEntropy: Math.round(normalizedEntropy * 100) / 100,
      avgQuality: Math.round(avgQuality * 100) / 100,
      connectionDiversity: Math.round(connectionDiversity * 100) / 100,
      topCategory: this.wildIdeas.stats.topCategory,
      totalCreated: this.wildIdeas.stats.totalCreated
    };
  }

  /**
   * 获取一个有趣的想法分享(增强版: 按质量优先)
   */
  getShareableIdea() {
    const unshared = this.wildIdeas.ideas.filter(i => !i.shared);
    if (unshared.length === 0) return null;
    
    // 按质量评分排序，优先分享高质量创意
    unshared.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
    const idea = unshared[0];
    idea.shared = true;
    this.saveWildIdeas();

    return idea;
  }

  /**
   * 按分类查询创意
   */
  getIdeasByCategory(category) {
    return this.wildIdeas.ideas.filter(i => (i.categories || []).includes(category));
  }

  /**
   * 获取高质量创意(质量分 > 阈值)
   */
  getHighQualityIdeas(threshold = 0.6) {
    return this.wildIdeas.ideas
      .filter(i => (i.qualityScore || 0) >= threshold)
      .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
  }

  /**
   * 获取状态(增强版)
   */
  getStatus() {
    const diversity = this.getDiversityMetrics();
    return {
      isActive: this.isActive,
      idleTime: Date.now() - this.lastActivity,
      ideasCount: this.wildIdeas.ideas.length,
      archivedCount: this.wildIdeas.archived.length,
      lastWander: this.wildIdeas.lastWander,
      unsharedIdeas: this.wildIdeas.ideas.filter(i => !i.shared).length,
      diversity: diversity,
      timeContext: this.timeModulation,
      totalCreated: this.wildIdeas.stats.totalCreated
    };
  }
}

module.exports = { MindWanderer };
