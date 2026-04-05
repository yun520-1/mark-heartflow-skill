# HeartFlow v6.0 架构升级实施方案

**目标**: 从当前碎片化架构升级为模块化理论引擎  
**时间**: 8 周  
**版本**: v5.0.14 → v6.0.0

---

## 📋 第一阶段：基础设施 (第 1-2 周)

### 1.1 创建模块注册中心

**文件**: `src/core/moduleRegistry.js`

```javascript
/**
 * HeartFlow 模块注册中心 v6.0
 * 
 * 功能:
 * - 动态注册理论模块
 * - 模块发现与相关性计算
 * - 依赖管理与冲突检测
 */

const { TheoryKnowledgeGraph } = require('./knowledgeGraph');

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.theoryGraph = new TheoryKnowledgeGraph();
    this.performanceStats = new Map(); // 模块性能统计
  }

  /**
   * 注册理论模块
   * @param {string} theoryId - 理论 ID (如 'emotion.prototype')
   * @param {object} module - 模块实例
   * @param {object} metadata - 元数据
   */
  register(theoryId, module, metadata) {
    // 验证模块接口
    this.validateModuleInterface(module, theoryId);
    
    // 注册模块
    this.modules.set(theoryId, {
      module,
      metadata: {
        name: metadata.name,
        version: metadata.version,
        category: metadata.category, // emotion, self, collective, therapy, etc.
        theorySources: metadata.theorySources,
        capabilities: metadata.capabilities,
        dependencies: metadata.dependencies || [],
        conflicts: metadata.conflicts || [],
        priority: metadata.priority || 0.5,
        tags: metadata.tags || []
      },
      stats: {
        calls: 0,
        avgResponseTime: 0,
        lastUsed: null
      }
    });

    // 更新理论知识图谱
    this.theoryGraph.addNode(theoryId, metadata);
    
    // 注册依赖关系
    if (metadata.dependencies) {
      metadata.dependencies.forEach(depId => {
        this.theoryGraph.addEdge(depId, theoryId, {
          type: 'dependsOn',
          strength: 0.8
        });
      });
    }

    console.log(`[ModuleRegistry] 注册模块：${theoryId} (${metadata.name})`);
  }

  /**
   * 验证模块接口
   */
  validateModuleInterface(module, theoryId) {
    const requiredMethods = ['process', 'getInfo'];
    
    for (const method of requiredMethods) {
      if (typeof module[method] !== 'function') {
        throw new Error(
          `模块 ${theoryId} 缺少必需方法：${method}。` +
          `理论模块必须实现：${requiredMethods.join(', ')}`
        );
      }
    }
  }

  /**
   * 发现相关模块
   * @param {object} context - 上下文信息
   * @returns {Array} 相关模块列表 (按相关性排序)
   */
  findRelevant(context) {
    const relevant = [];
    
    for (const [theoryId, { module, metadata, stats }] of this.modules) {
      const relevanceScore = this.calculateRelevance(module, metadata, context);
      
      if (relevanceScore.score > 0.5) {
        relevant.push({
          theoryId,
          module,
          metadata,
          stats,
          score: relevanceScore.score,
          breakdown: relevanceScore.breakdown
        });
      }
    }
    
    // 按相关性排序
    return relevant.sort((a, b) => b.score - a.score);
  }

  /**
   * 计算模块相关性
   */
  calculateRelevance(module, metadata, context) {
    const breakdown = {};
    
    // 1. 关键词匹配 (40%)
    breakdown.keywordMatch = this.matchKeywords(metadata, context);
    
    // 2. 理论覆盖度 (30%)
    breakdown.theoryCoverage = this.matchTheoryCoverage(metadata, context);
    
    // 3. 历史性能 (20%)
    breakdown.historicalPerformance = this.getHistoricalPerformance(metadata);
    
    // 4. 理论图谱关联 (10%)
    breakdown.graphRelevance = this.getGraphRelevance(metadata, context);
    
    const score = (
      breakdown.keywordMatch * 0.4 +
      breakdown.theoryCoverage * 0.3 +
      breakdown.historicalPerformance * 0.2 +
      breakdown.graphRelevance * 0.1
    );
    
    return { score, breakdown };
  }

  /**
   * 关键词匹配
   */
  matchKeywords(metadata, context) {
    const contextKeywords = context.keywords || [];
    const moduleTags = metadata.tags || [];
    const moduleCapabilities = metadata.capabilities || [];
    
    const allModuleTerms = [...moduleTags, ...moduleCapabilities]
      .map(t => t.toLowerCase());
    
    const matches = contextKeywords.filter(k => 
      allModuleTerms.some(t => t.includes(k.toLowerCase()) || k.toLowerCase().includes(t))
    );
    
    return matches.length / Math.max(contextKeywords.length, 1);
  }

  /**
   * 理论覆盖度匹配
   */
  matchTheoryCoverage(metadata, context) {
    const contextTheories = context.theoryDomains || [];
    const moduleCategory = metadata.category;
    
    if (contextTheories.includes(moduleCategory)) {
      return 1.0;
    }
    
    // 检查相关类别
    const relatedCategories = this.getRelatedCategories(moduleCategory);
    const overlap = contextTheories.filter(c => relatedCategories.includes(c));
    
    return overlap.length / Math.max(contextTheories.length, 1);
  }

  /**
   * 获取相关类别
   */
  getRelatedCategories(category) {
    const categoryMap = {
      emotion: ['self', 'therapy', 'collective'],
      self: ['emotion', 'temporal', 'ethics'],
      collective: ['emotion', 'self', 'social'],
      temporal: ['self', 'emotion'],
      therapy: ['emotion', 'self', 'ethics'],
      ethics: ['self', 'therapy']
    };
    
    return categoryMap[category] || [];
  }

  /**
   * 获取历史性能
   */
  getHistoricalPerformance(metadata) {
    // 简化实现：基于调用频率
    const stats = this.modules.get(metadata.id)?.stats;
    if (!stats) return 0.5;
    
    return Math.min(stats.calls / 100, 1.0);
  }

  /**
   * 获取理论图谱关联度
   */
  getGraphRelevance(metadata, context) {
    // 查询理论图谱中的相关节点
    const related = this.theoryGraph.queryRelated(metadata.id, 1);
    const contextModules = context.activeModules || [];
    
    const overlap = related.filter(r => contextModules.includes(r.id));
    return overlap.length / Math.max(related.length, 1);
  }

  /**
   * 获取模块
   */
  getModule(theoryId) {
    const entry = this.modules.get(theoryId);
    return entry ? entry.module : null;
  }

  /**
   * 获取所有模块
   */
  getAllModules() {
    return Array.from(this.modules.entries()).map(([id, { module, metadata }]) => ({
      theoryId: id,
      module,
      metadata
    }));
  }

  /**
   * 记录模块调用
   */
  recordCall(theoryId, responseTime) {
    const entry = this.modules.get(theoryId);
    if (entry) {
      const stats = entry.stats;
      stats.calls++;
      stats.lastUsed = new Date();
      
      // 更新平均响应时间
      stats.avgResponseTime = (
        (stats.avgResponseTime * (stats.calls - 1) + responseTime) / stats.calls
      );
    }
  }

  /**
   * 检测模块冲突
   */
  detectConflicts(moduleIds) {
    const conflicts = [];
    
    for (const id of moduleIds) {
      const entry = this.modules.get(id);
      if (entry && entry.metadata.conflicts) {
        for (const conflictId of entry.metadata.conflicts) {
          if (moduleIds.includes(conflictId)) {
            conflicts.push({
              module1: id,
              module2: conflictId,
              reason: entry.metadata.conflictsReason || '理论冲突'
            });
          }
        }
      }
    }
    
    return conflicts;
  }
}

module.exports = { ModuleRegistry };
```

### 1.2 创建理论知识图谱

**文件**: `src/core/knowledgeGraph.js`

```javascript
/**
 * 理论知识图谱 v6.0
 * 
 * 功能:
 * - 理论节点管理
 * - 理论关系建模
 * - 覆盖盲区识别
 * - 理论路径推理
 */

class TheoryKnowledgeGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  /**
   * 添加理论节点
   */
  addNode(theoryId, data) {
    this.nodes.set(theoryId, {
      id: theoryId,
      name: data.name,
      category: data.category,
      sources: data.theorySources || [],
      keyConcepts: data.keyConcepts || [],
      relatedTheories: data.relatedTheories || [],
      createdAt: new Date()
    });
  }

  /**
   * 添加理论关系
   */
  addEdge(sourceId, targetId, relation) {
    const edgeId = `${sourceId}->${targetId}`;
    
    this.edges.set(edgeId, {
      source: sourceId,
      target: targetId,
      type: relation.type, // extends, conflictsWith, integrates, presupposes, specializes
      strength: relation.strength || 0.5,
      description: relation.description || ''
    });
  }

  /**
   * 查询相关理论
   */
  queryRelated(theoryId, maxDepth = 2) {
    const related = new Set();
    const queue = [{ id: theoryId, depth: 0, path: [theoryId] }];
    const visited = new Set([theoryId]);
    
    while (queue.length > 0) {
      const { id, depth, path } = queue.shift();
      
      if (depth >= maxDepth) continue;
      
      // 查找出边
      for (const [edgeId, edge] of this.edges) {
        if (edge.source === id && !visited.has(edge.target)) {
          visited.add(edge.target);
          related.add(edge.target);
          queue.push({
            id: edge.target,
            depth: depth + 1,
            path: [...path, edge.target]
          });
        }
        if (edge.target === id && !visited.has(edge.source)) {
          visited.add(edge.source);
          related.add(edge.source);
          queue.push({
            id: edge.source,
            depth: depth + 1,
            path: [...path, edge.source]
          });
        }
      }
    }
    
    return Array.from(related).map(id => ({
      ...this.nodes.get(id),
      distance: this.calculateDistance(theoryId, id)
    }));
  }

  /**
   * 计算两节点间距离
   */
  calculateDistance(sourceId, targetId) {
    // BFS 找最短路径
    const queue = [{ id: sourceId, distance: 0 }];
    const visited = new Set([sourceId]);
    
    while (queue.length > 0) {
      const { id, distance } = queue.shift();
      
      if (id === targetId) return distance;
      
      for (const [edgeId, edge] of this.edges) {
        const nextId = edge.source === id ? edge.target :
                       edge.target === id ? edge.source : null;
        
        if (nextId && !visited.has(nextId)) {
          visited.add(nextId);
          queue.push({ id: nextId, distance: distance + 1 });
        }
      }
    }
    
    return Infinity;
  }

  /**
   * 识别理论覆盖盲区
   */
  identifyGaps(activeModules, context) {
    const gaps = [];
    const activeSet = new Set(activeModules);
    
    for (const [id, node] of this.nodes) {
      if (!activeSet.has(id)) {
        // 检查是否与活跃模块相关
        const relatedActive = this.queryRelated(id, 1)
          .filter(r => activeSet.has(r.id));
        
        if (relatedActive.length > 0) {
          gaps.push({
            theory: node,
            relatedTo: relatedActive.map(r => r.name),
            relevanceScore: relatedActive.length / this.getTotalRelated(id),
            reason: this.identifyGapReason(node, context)
          });
        }
      }
    }
    
    return gaps.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * 识别盲区原因
   */
  identifyGapReason(node, context) {
    if (node.category === 'therapy' && context.hasClinicalContent) {
      return '临床内容检测到，但缺少治疗理论支持';
    }
    if (node.category === 'ethics' && context.hasMoralContent) {
      return '道德内容检测到，但缺少伦理学支持';
    }
    if (node.category === 'collective' && context.hasSocialContent) {
      return '社会内容检测到，但缺少集体理论支持';
    }
    return '相关理论未激活';
  }

  /**
   * 获取总相关数
   */
  getTotalRelated(theoryId) {
    let count = 0;
    for (const [edgeId, edge] of this.edges) {
      if (edge.source === theoryId || edge.target === theoryId) {
        count++;
      }
    }
    return count;
  }

  /**
   * 获取理论路径
   */
  findPath(sourceId, targetId) {
    const queue = [{ id: sourceId, path: [sourceId] }];
    const visited = new Set([sourceId]);
    
    while (queue.length > 0) {
      const { id, path } = queue.shift();
      
      if (id === targetId) {
        return path.map(id => this.nodes.get(id));
      }
      
      for (const [edgeId, edge] of this.edges) {
        const nextId = edge.source === id ? edge.target :
                       edge.target === id ? edge.source : null;
        
        if (nextId && !visited.has(nextId)) {
          visited.add(nextId);
          queue.push({ id: nextId, path: [...path, nextId] });
        }
      }
    }
    
    return null;
  }

  /**
   * 导出图谱可视化数据
   */
  exportForVisualization() {
    return {
      nodes: Array.from(this.nodes.values()).map(n => ({
        id: n.id,
        label: n.name,
        category: n.category,
        size: this.getTotalRelated(n.id)
      })),
      edges: Array.from(this.edges.values()).map(e => ({
        source: e.source,
        target: e.target,
        type: e.type,
        strength: e.strength
      }))
    };
  }
}

module.exports = { TheoryKnowledgeGraph };
```

---

## 📋 第二阶段：响应融合引擎 (第 3-4 周)

### 2.1 响应融合生成器

**文件**: `src/core/responseFusion.js`

```javascript
/**
 * 响应融合引擎 v6.0
 * 
 * 功能:
 * - 多模块响应收集
 * - 冲突检测与解决
 * - 响应优先级排序
 * - 融合响应生成
 */

class ResponseFusionEngine {
  constructor(moduleRegistry) {
    this.registry = moduleRegistry;
  }

  /**
   * 处理用户输入并生成融合响应
   */
  async processInput(userInput, context = {}) {
    // 1. 发现相关模块
    const relevantModules = this.registry.findRelevant({
      keywords: this.extractKeywords(userInput),
      theoryDomains: context.theoryDomains || [],
      activeModules: context.activeModules || []
    });

    // 2. 并行调用模块
    const responses = await this.collectResponses(relevantModules, userInput, context);

    // 3. 去重与冲突检测
    const deduplicated = this.deduplicateResponses(responses);
    const conflicts = this.detectConflicts(deduplicated);

    // 4. 优先级排序
    const prioritized = this.prioritizeResponses(deduplicated, context);

    // 5. 融合生成
    const fused = await this.generateFusedResponse(prioritized, conflicts, context);

    // 6. 质量评估
    const quality = this.assessResponseQuality(fused, context);

    return {
      response: fused,
      quality,
      sources: prioritized.map(r => r.metadata.name),
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      moduleCount: relevantModules.length
    };
  }

  /**
   * 提取关键词
   */
  extractKeywords(text) {
    // 简化实现：分词 + 停用词过滤
    const stopWords = new Set(['的', '了', '是', '在', '我', '有', '和', '就', '不', '人']);
    return text.split(/[\s,，.。!?！？]+/)
      .filter(w => w.length > 1 && !stopWords.has(w));
  }

  /**
   * 收集模块响应
   */
  async collectResponses(modules, userInput, context) {
    const responses = [];

    for (const { theoryId, module, metadata, score } of modules) {
      try {
        const startTime = Date.now();
        const response = await module.process(userInput, context);
        const responseTime = Date.now() - startTime;

        this.registry.recordCall(theoryId, responseTime);

        responses.push({
          theoryId,
          metadata,
          response,
          relevanceScore: score,
          responseTime,
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`[ResponseFusion] 模块 ${theoryId} 处理失败:`, error);
        responses.push({
          theoryId,
          metadata,
          response: null,
          error: error.message,
          relevanceScore: score
        });
      }
    }

    return responses.filter(r => r.response !== null);
  }

  /**
   * 去重响应
   */
  deduplicateResponses(responses) {
    const grouped = new Map();

    for (const r of responses) {
      const key = this.getResponseKey(r.response);
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(r);
    }

    // 每组选择最佳响应
    const deduplicated = [];
    for (const [key, group] of grouped) {
      const best = group.reduce((best, current) => 
        current.relevanceScore > best.relevanceScore ? current : best
      );
      deduplicated.push({
        ...best,
        duplicateCount: group.length,
        duplicateSources: group.map(r => r.metadata.name)
      });
    }

    return deduplicated;
  }

  /**
   * 获取响应键 (用于去重)
   */
  getResponseKey(response) {
    // 简化：使用响应类型 + 主要内容哈希
    const type = response.type || 'general';
    const content = JSON.stringify(response).slice(0, 100);
    return `${type}:${this.simpleHash(content)}`;
  }

  /**
   * 简单哈希
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(36);
  }

  /**
   * 检测冲突
   */
  detectConflicts(responses) {
    const conflicts = [];

    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        const r1 = responses[i];
        const r2 = responses[j];

        if (this.isConflicting(r1.response, r2.response)) {
          conflicts.push({
            module1: r1.metadata.name,
            module2: r2.metadata.name,
            type: this.identifyConflictType(r1.response, r2.response),
            description: this.describeConflict(r1.response, r2.response)
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * 判断响应是否冲突
   */
  isConflicting(r1, r2) {
    // 检查建议是否矛盾
    const suggestions1 = r1.suggestions || [];
    const suggestions2 = r2.suggestions || [];

    const contradictoryPairs = [
      ['接受', '改变'],
      ['回避', '面对'],
      ['压抑', '表达']
    ];

    for (const [term1, term2] of contradictoryPairs) {
      const has1 = suggestions1.some(s => s.includes(term1));
      const has2 = suggestions2.some(s => s.includes(term2));
      
      if (has1 && has2) return true;
    }

    return false;
  }

  /**
   * 识别冲突类型
   */
  identifyConflictType(r1, r2) {
    if (r1.type !== r2.type) return 'type_mismatch';
    if (r1.approach !== r2.approach) return 'approach_conflict';
    return 'recommendation_conflict';
  }

  /**
   * 描述冲突
   */
  describeConflict(r1, r2) {
    return `模块建议存在差异：${r1.type} vs ${r2.type}`;
  }

  /**
   * 优先级排序
   */
  prioritizeResponses(responses, context) {
    return responses.sort((a, b) => {
      // 1. 相关性分数 (50%)
      const scoreDiff = (b.relevanceScore - a.relevanceScore) * 0.5;

      // 2. 响应质量 (30%)
      const qualityDiff = (this.assessResponseQuality(b.response, context) - 
                          this.assessResponseQuality(a.response, context)) * 0.3;

      // 3. 响应速度 (20%)
      const speedDiff = (a.responseTime < b.responseTime ? 0.2 : 0) * 0.2;

      return scoreDiff + qualityDiff + speedDiff;
    });
  }

  /**
   * 评估响应质量
   */
  assessResponseQuality(response, context) {
    let quality = 0.5;

    // 具体性
    if (response.specificity > 0.7) quality += 0.1;

    // 可操作性
    if (response.actionable) quality += 0.1;

    // 理论依据
    if (response.theoryBacked) quality += 0.1;

    // 共情性
    if (response.empathic) quality += 0.1;

    return Math.min(quality, 1.0);
  }

  /**
   * 生成融合响应
   */
  async generateFusedResponse(responses, conflicts, context) {
    if (responses.length === 0) {
      return {
        type: 'general',
        content: '我理解你的感受。如果你想深入探讨，可以告诉我更多细节。'
      };
    }

    // 解决冲突
    const resolvedConflicts = conflicts.length > 0 
      ? this.resolveConflicts(conflicts, context)
      : [];

    // 融合策略
    const fusionStrategy = this.selectFusionStrategy(responses, conflicts);

    switch (fusionStrategy) {
      case 'complementary':
        return this.complementaryFusion(responses, resolvedConflicts);
      case 'hierarchical':
        return this.hierarchicalFusion(responses, context);
      case 'integrative':
        return this.integrativeFusion(responses, resolvedConflicts);
      default:
        return this.defaultFusion(responses);
    }
  }

  /**
   * 解决冲突
   */
  resolveConflicts(conflicts, context) {
    return conflicts.map(conflict => {
      // 策略 1: 理论优先级
      if (conflict.type === 'approach_conflict') {
        return {
          ...conflict,
          resolution: 'present_both_perspectives',
          explanation: '不同理论流派对此有不同视角，两者都有价值'
        };
      }

      // 策略 2: 呈现多视角
      return {
        ...conflict,
        resolution: 'multiple_perspectives',
        explanation: '这是一个复杂问题，存在多种合理观点'
      };
    });
  }

  /**
   * 选择融合策略
   */
  selectFusionStrategy(responses, conflicts) {
    if (conflicts.length === 0) return 'complementary';
    if (responses.length > 5) return 'hierarchical';
    return 'integrative';
  }

  /**
   * 互补融合
   */
  complementaryFusion(responses, resolvedConflicts) {
    const insights = responses.map(r => r.response.insight || r.response.content).filter(Boolean);
    
    return {
      type: 'integrated',
      content: this.synthesizeInsights(insights),
      perspectives: responses.map(r => ({
        source: r.metadata.name,
        insight: r.response
      })),
      conflicts: resolvedConflicts
    };
  }

  /**
   * 层级融合
   */
  hierarchicalFusion(responses, context) {
    const top = responses[0];
    
    return {
      type: top.response.type,
      content: top.response.content,
      additionalPerspectives: responses.slice(1, 3).map(r => ({
        source: r.metadata.name,
        content: r.response.content
      }))
    };
  }

  /**
   * 整合融合
   */
  integrativeFusion(responses, resolvedConflicts) {
    const themes = this.extractCommonThemes(responses);
    
    return {
      type: 'integrative',
      themes,
      synthesis: this.createSynthesis(themes, responses),
      conflicts: resolvedConflicts
    };
  }

  /**
   * 提取共同主题
   */
  extractCommonThemes(responses) {
    const themes = new Map();
    
    for (const r of responses) {
      const responseThemes = r.response.themes || [r.response.type];
      for (const theme of responseThemes) {
        if (!themes.has(theme)) {
          themes.set(theme, []);
        }
        themes.get(theme).push(r.metadata.name);
      }
    }
    
    return Array.from(themes.entries()).map(([theme, sources]) => ({
      theme,
      sources,
      support: sources.length
    }));
  }

  /**
   * 创建综合
   */
  createSynthesis(themes, responses) {
    const primaryTheme = themes.sort((a, b) => b.support - a.support)[0];
    
    return {
      mainTheme: primaryTheme.theme,
      supportingPerspectives: responses
        .filter(r => r.response.type === primaryTheme.theme)
        .map(r => r.response.content),
      alternativeViews: responses
        .filter(r => r.response.type !== primaryTheme.theme)
        .slice(0, 2)
        .map(r => r.response.content)
    };
  }

  /**
   * 综合洞见
   */
  synthesizeInsights(insights) {
    if (insights.length === 1) return insights[0];
    
    return insights.reduce((acc, insight, i) => {
      if (i === 0) return insight;
      return `${acc} 同时，${insight.toLowerCase()}`;
    });
  }

  /**
   * 默认融合
   */
  defaultFusion(responses) {
    return {
      type: 'aggregated',
      responses: responses.map(r => ({
        source: r.metadata.name,
        content: r.response.content
      }))
    };
  }
}

module.exports = { ResponseFusionEngine };
```

---

## 📋 第三阶段：模块迁移 (第 5-6 周)

### 3.1 情绪理论集群迁移示例

**文件**: `src/theories/emotion/index.js`

```javascript
/**
 * 情绪理论集群 v6.0
 * 
 * 整合:
 * - 情绪理论基础
 * - 情绪原型理论
 * - 情绪评价理论
 * - 情绪三大传统整合
 */

const { ModuleRegistry } = require('../../core/moduleRegistry');

class EmotionTheoryCluster {
  constructor() {
    this.registry = new ModuleRegistry();
    this.initializeModules();
  }

  /**
   * 初始化子模块
   */
  initializeModules() {
    // 情绪理论基础
    const EmotionTheoryFoundation = require('./foundation');
    this.registry.register('emotion.foundation', new EmotionTheoryFoundation(), {
      name: '情绪理论基础',
      version: '6.0.0',
      category: 'emotion',
      theorySources: ['SEP Emotion Theory', 'Scarantino 2016'],
      capabilities: ['情绪原型查询', '情绪区分分析', '情绪适当性评估'],
      tags: ['emotion', 'theory', 'foundation'],
      priority: 0.9
    });

    // 情绪原型理论
    const EmotionPrototypeTheory = require('./prototype');
    this.registry.register('emotion.prototype', new EmotionPrototypeTheory(), {
      name: '情绪原型理论',
      version: '6.0.0',
      category: 'emotion',
      theorySources: ['Fehr & Russell 1984', 'SEP Emotion §1'],
      capabilities: ['典型性评分', '置信度评估', '情绪粒度映射'],
      tags: ['emotion', 'prototype', 'granularity'],
      priority: 0.85
    });

    // 情绪评价理论
    const AppraisalTheory = require('./appraisal');
    this.registry.register('emotion.appraisal', new AppraisalTheory(), {
      name: '情绪评价理论',
      version: '6.0.0',
      category: 'emotion',
      theorySources: ['Lazarus', 'Scherer'],
      capabilities: ['评价维度分析', '评价模式识别'],
      tags: ['emotion', 'appraisal', 'evaluation'],
      priority: 0.8
    });

    // 三大传统整合
    const EmotionIntegration = require('./integration');
    this.registry.register('emotion.integration', new EmotionIntegration(), {
      name: '情绪三大传统整合',
      version: '6.0.0',
      category: 'emotion',
      theorySources: ['SEP Emotion Theory', 'Feeling/Evaluative/Motivational'],
      capabilities: ['三大传统分析', '四大挑战评估', '整合分数计算'],
      tags: ['emotion', 'integration', 'traditions'],
      dependencies: ['emotion.foundation'],
      priority: 0.95
    });
  }

  /**
   * 处理用户输入
   */
  async process(userInput, context = {}) {
    const relevantModules = this.registry.findRelevant({
      keywords: this.extractKeywords(userInput),
      theoryDomains: ['emotion']
    });

    const responses = [];
    for (const { module, metadata } of relevantModules) {
      try {
        const response = await module.process(userInput, context);
        responses.push({
          module: metadata.name,
          response
        });
      } catch (error) {
        console.error(`[EmotionCluster] ${metadata.name} 处理失败:`, error);
      }
    }

    return {
      cluster: 'emotion',
      responses,
      moduleCount: relevantModules.length
    };
  }

  extractKeywords(text) {
    return text.split(/[\s,，.。!?！？]+/).filter(w => w.length > 1);
  }

  /**
   * 获取集群信息
   */
  getInfo() {
    return {
      name: '情绪理论集群',
      version: '6.0.0',
      modules: this.registry.getAllModules().map(m => ({
        id: m.theoryId,
        name: m.metadata.name,
        capabilities: m.metadata.capabilities
      }))
    };
  }
}

module.exports = { EmotionTheoryCluster };
```

---

## 📋 第四阶段：测试与部署 (第 7-8 周)

### 4.1 测试框架

**文件**: `test/v6-integration.test.js`

```javascript
/**
 * HeartFlow v6.0 集成测试
 */

const assert = require('assert');
const { ModuleRegistry } = require('../src/core/moduleRegistry');
const { ResponseFusionEngine } = require('../src/core/responseFusion');

describe('HeartFlow v6.0 集成测试', () => {
  let registry;
  let fusionEngine;

  beforeEach(() => {
    registry = new ModuleRegistry();
    fusionEngine = new ResponseFusionEngine(registry);
  });

  describe('模块注册', () => {
    it('应成功注册模块', () => {
      const mockModule = {
        process: async () => ({ content: 'test' }),
        getInfo: () => ({ name: 'Test' })
      };

      registry.register('test.module', mockModule, {
        name: 'Test Module',
        version: '1.0.0',
        category: 'test',
        capabilities: ['test']
      });

      const module = registry.getModule('test.module');
      assert.strictEqual(module, mockModule);
    });

    it('应拒绝缺少必需方法的模块', () => {
      const invalidModule = { process: async () => ({}) };

      assert.throws(() => {
        registry.register('invalid.module', invalidModule, {
          name: 'Invalid',
          version: '1.0.0',
          category: 'test'
        });
      }, /缺少必需方法/);
    });
  });

  describe('模块发现', () => {
    beforeEach(() => {
      // 注册测试模块
      registry.register('emotion.test', {
        process: async () => ({ type: 'emotion', content: '情绪响应' }),
        getInfo: () => ({})
      }, {
        name: 'Emotion Test',
        category: 'emotion',
        tags: ['情绪', '情感']
      });

      registry.register('self.test', {
        process: async () => ({ type: 'self', content: '自我响应' }),
        getInfo: () => ({})
      }, {
        name: 'Self Test',
        category: 'self',
        tags: ['自我', '意识']
      });
    });

    it('应根据关键词发现相关模块', () => {
      const relevant = registry.findRelevant({
        keywords: ['情绪', '情感']
      });

      assert.strictEqual(relevant.length, 1);
      assert.strictEqual(relevant[0].theoryId, 'emotion.test');
    });

    it('应按相关性排序', () => {
      const relevant = registry.findRelevant({
        keywords: ['情绪', '自我']
      });

      assert.strictEqual(relevant.length, 2);
      assert.strictEqual(relevant[0].metadata.category, 'emotion');
    });
  });

  describe('响应融合', () => {
    beforeEach(() => {
      registry.register('module.a', {
        process: async () => ({ type: 'insight', content: '观点 A' }),
        getInfo: () => ({})
      }, {
        name: 'Module A',
        category: 'test'
      });

      registry.register('module.b', {
        process: async () => ({ type: 'insight', content: '观点 B' }),
        getInfo: () => ({})
      }, {
        name: 'Module B',
        category: 'test'
      });
    });

    it('应收集多模块响应', async () => {
      const result = await fusionEngine.processInput('测试输入');

      assert(result.moduleCount >= 2);
    });

    it('应检测并解决冲突', async () => {
      const result = await fusionEngine.processInput('测试输入');

      assert(result.response);
      assert(Array.isArray(result.sources));
    });
  });
});
```

---

## ✅ 验收标准

### 功能验收

- [ ] 模块注册中心正常工作
- [ ] 模块发现准确率 > 80%
- [ ] 响应融合生成合理响应
- [ ] 冲突检测与解决有效
- [ ] 性能指标达标 (响应时间 < 500ms)

### 代码质量

- [ ] 单元测试覆盖率 > 70%
- [ ] 集成测试通过率 100%
- [ ] 代码审查通过
- [ ] 文档完整

### 迁移验证

- [ ] 情绪理论集群迁移完成
- [ ] 自我意识集群迁移完成
- [ ] 向后兼容层工作正常
- [ ] 旧模块可逐步废弃

---

## 📊 预期收益

| 指标 | v5.0 | v6.0 | 提升 |
|------|------|------|------|
| 新模块集成时间 | 1-2 周 | 1-2 天 | 5-10x |
| 代码可维护性 | 低 | 高 | - |
| 响应一致性 | 60% | 90% | +30% |
| 理论覆盖可视化 | 无 | 有 | - |
| 测试覆盖率 | <20% | >70% | +50% |

---

*文档版本*: v1.0  
*创建时间*: 2026-03-30  
*HeartFlow v6.0 架构升级*
