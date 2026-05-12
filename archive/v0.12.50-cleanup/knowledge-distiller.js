/**
 * HeartFlow Knowledge Distiller v11.21.2
 * 
 * 核心目标：传递（transmission）
 * 把积累的知识（memory）打包成可传递的格式
 * 
 * 架构：
 *   meaningful-memory.js (积累)
 *       ↓ knowledge-distiller.js (打包)
 *       ↓ skill-packager.js (发布)
 *       → GitHub / Skill Market (传递)
 * 
 * 三层输出：
 * 1. Pattern Cards — 可操作的知识点卡片
 * 2. Skill Modules — 可安装的 .js 模块
 * 3. Knowledge Reports — 可读的升级报告
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '../../memory');

// ============================================================
// 知识提取引擎
// ============================================================

/**
 * 从记忆库提取可传递的知识片段
 */
function extractKnowledgePatterns(memoryData, options = {}) {
  const {
    minConfidence = 0.5,
    maxAgeDays = 90,
    layers = ['CORE', 'LEARNED'],
  } = options;

  const patterns = [];
  const now = Date.now();

  for (const [key, record] of Object.entries(memoryData)) {
    // 层过滤
    if (record.layer && !layers.includes(record.layer)) continue;

    // 置信度过滤
    if (record.selfVerifyScore && record.selfVerifyScore < minConfidence) continue;

    // 年龄过滤
    if (record.timestamp) {
      const ageDays = (now - record.timestamp) / (1000 * 60 * 60 * 24);
      if (ageDays > maxAgeDays) continue;
    }

    // 跳过无价值 key
    if (!record.value || record.value.length < 10) continue;
    if (record.type === 'ephemeral') continue;

    patterns.push({
      id: key,
      content: String(record.value).slice(0, 300),
      type: record.type || 'general',
      layer: record.layer || 'UNKNOWN',
      confidence: record.selfVerifyScore || 0.5,
      reason: record.reason || '',
      source: record.source || 'memory',
      timestamp: record.timestamp || now,
      age: record.timestamp ? Math.round((now - record.timestamp) / (1000 * 60 * 60 * 24)) : 0,
      tags: extractTags(key, record),
    });
  }

  // 排序：置信度 × 新近度
  patterns.sort((a, b) => {
    const scoreA = a.confidence * (1 + 1 / (a.age + 1));
    const scoreB = b.confidence * (1 + 1 / (b.age + 1));
    return scoreB - scoreA;
  });

  return patterns;
}

function extractTags(key, record) {
  const tags = new Set();
  const text = (key + ' ' + (record.reason || '') + ' ' + (record.type || '')).toLowerCase();

  // 类型标签
  if (record.type) tags.add(record.type);
  if (record.source) tags.add(record.source);

  // 关键词标签
  const keywords = {
    'memory': ['memory', 'remember', 'recall', 'forget'],
    'reasoning': ['logic', 'reason', 'infer', 'deduce'],
    'healing': ['heal', 'correct', 'fix', 'error', 'mistake'],
    'upgrade': ['upgrade', 'improve', 'evolve', 'version'],
    'transmission': ['transmit', 'pass', 'share', '传递'],
    'identity': ['identity', 'self', 'core', 'true-self'],
    'psychology': ['emotion', 'psychology', 'defense', 'cognitive'],
  };

  for (const [tag, kws] of Object.entries(keywords)) {
    if (kws.some(k => text.includes(k))) tags.add(tag);
  }

  return [...tags].slice(0, 5);
}

// ============================================================
// 知识卡片生成器
// ============================================================

/**
 * 生成可操作的知识卡片
 */
function generatePatternCard(pattern) {
  const severity = pattern.confidence >= 0.8 ? 'HIGH' :
                   pattern.confidence >= 0.5 ? 'MED' : 'LOW';

  return {
    id: pattern.id,
    title: generateTitle(pattern),
    content: pattern.content,
    type: pattern.type,
    severity,
    confidence: Math.round(pattern.confidence * 100) + '%',
    actionability: generateActionability(pattern),
    reason: pattern.reason,
    source: pattern.source,
    tags: pattern.tags,
    age: pattern.age + 'd ago',
    guidance: generateGuidance(pattern),
  };
}

function generateTitle(pattern) {
  // 从 key 提取可读的标题
  const key = pattern.id;
  if (key.includes('_')) {
    return key.split('_').map(w =>
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
  }
  return key.length > 60 ? key.slice(0, 60) + '...' : key;
}

function generateActionability(pattern) {
  // 量化可操作性
  const hasReason = pattern.reason && pattern.reason.length > 10;
  const hasConfidence = pattern.confidence >= 0.5;
  const isRecent = pattern.age < 30;
  const hasType = pattern.type && pattern.type !== 'general';

  let score = 0;
  if (hasReason) score += 2;
  if (hasConfidence) score += 2;
  if (isRecent) score += 1;
  if (hasType) score += 1;

  if (score >= 5) return 'IMMEDIATE';
  if (score >= 3) return 'ACTIONABLE';
  if (score >= 1) return 'REFERENCE';
  return 'ARCHIVE';
}

function generateGuidance(pattern) {
  // 根据类型生成操作指引
  const typeGuidance = {
    'decision_verified': '已验证的决策模式，可直接复用',
    'error_pattern': '错误模式，需要预防检查',
    'upgrade_result': '升级经验，可指导后续迭代',
    'core_identity': '核心身份定义，不可更改',
    'learned': '已学习的模式，需要巩固',
    'general': '一般性知识，参考使用',
  };

  return typeGuidance[pattern.type] || typeGuidance.general;
}

// ============================================================
// 技能模块生成器
// ============================================================

/**
 * 从高质量 pattern 生成可安装的 JS 模块
 */
function generateSkillModule(pattern, options = {}) {
  const {
    moduleName = sanitizeModuleName(pattern.id),
    description = pattern.content.slice(0, 200),
  } = options;

  const code = `/**
 * ${moduleName}.js
 * 
 * 自动生成 by HeartFlow Knowledge Distiller v11.21.2
 * 来源: ${pattern.source || 'memory'}
 * 置信度: ${Math.round(pattern.confidence * 100)}%
 * 类型: ${pattern.type}
 * 
 * ${pattern.reason || ''}
 * 
 * 使用方式:
 *   const ${moduleName} = require('./${moduleName}.js');
 *   ${moduleName}.execute(context);
 */

'use strict';

// ============================================================
// 核心逻辑
// ============================================================

const ${moduleName}_PATTERN = ${JSON.stringify(pattern.content, null, 2)};

const ${moduleName}_CONFIG = {
  confidence: ${pattern.confidence},
  type: '${pattern.type}',
  source: '${pattern.source || 'memory'}',
  generated: '${new Date().toISOString()}',
};

// ============================================================
// 执行函数
// ============================================================

/**
 * 执行该模式
 * @param {object} context - 上下文
 * @returns {object} 执行结果
 */
function execute(context = {}) {
  return {
    pattern: ${moduleName}_PATTERN,
    config: ${moduleName}_CONFIG,
    context,
    timestamp: Date.now(),
    success: true,
  };
}

// ============================================================
// 验证函数
// ============================================================

/**
 * 验证是否匹配该模式
 * @param {object} context - 待验证的上下文
 * @returns {boolean} 是否匹配
 */
function matches(context = {}) {
  const text = (context.input || context.text || '').toLowerCase();
  const patternText = ${moduleName}_PATTERN.toLowerCase();
  return text.includes(patternText.slice(0, 50));
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  PATTERN: ${moduleName}_PATTERN,
  CONFIG: ${moduleName}_CONFIG,
  execute,
  matches,
};

// 如果直接运行，执行 demo
if (require.main === module) {
  console.log('[${moduleName}] Pattern loaded:');
  console.log('  Type:', ${moduleName}_CONFIG.type);
  console.log('  Confidence:', ${moduleName}_CONFIG.confidence);
  console.log('  Content:', ${moduleName}_PATTERN.slice(0, 80) + '...');
  
  const result = execute({ demo: true });
  console.log('  Demo result:', result.success ? 'PASS' : 'FAIL');
}
`;

  return {
    name: moduleName,
    code,
    path: `skills/${moduleName}.js`,
  };
}

function sanitizeModuleName(id) {
  return id
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

// ============================================================
// 知识报告生成器
// ============================================================

/**
 * 生成可读的知识报告
 */
function generateKnowledgeReport(memoryData, options = {}) {
  const patterns = extractKnowledgePatterns(memoryData, options);
  const byType = {};
  const byLayer = {};
  const byTag = {};

  for (const p of patterns) {
    // 按类型分组
    if (!byType[p.type]) byType[p.type] = [];
    byType[p.type].push(p);

    // 按层分组
    if (!byLayer[p.layer]) byLayer[p.layer] = [];
    byLayer[p.layer].push(p);

    // 按标签分组
    for (const tag of p.tags) {
      if (!byTag[tag]) byTag[tag] = [];
      byTag[tag].push(p);
    }
  }

  // 计算统计
  const stats = {
    total: patterns.length,
    byType: Object.entries(byType).map(([type, ps]) => ({ type, count: ps.length })),
    byLayer: Object.entries(byLayer).map(([layer, ps]) => ({ layer, count: ps.length })),
    topTags: Object.entries(byTag)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10)
      .map(([tag, ps]) => ({ tag, count: ps.length })),
    highConfidence: patterns.filter(p => p.confidence >= 0.8).length,
    recentPatterns: patterns.filter(p => p.age < 7).length,
    actionables: patterns.filter(p => generateActionability(p) === 'IMMEDIATE' || generateActionability(p) === 'ACTIONABLE').length,
  };

  // 生成 TOP patterns
  const topPatterns = patterns.slice(0, 10).map(p => generatePatternCard(p));

  return {
    version: '11.21.2',
    generated: new Date().toISOString(),
    stats,
    topPatterns,
    allPatterns: patterns.map(p => ({ id: p.id, confidence: p.confidence, type: p.type, actionability: generateActionability(p) })),
  };
}

// ============================================================
// 持久化 & 加载
// ============================================================

function loadMemoryData() {
  const corePath = path.join(MEMORY_DIR, 'meaningful-core.json');
  const learnedPath = path.join(MEMORY_DIR, 'meaningful-learned.json');

  const data = {};

  if (fs.existsSync(corePath)) {
    try {
      const core = JSON.parse(fs.readFileSync(corePath, 'utf-8'));
      for (const [key, record] of Object.entries(core)) {
        data[key] = { ...record, layer: 'CORE' };
      }
    } catch (e) {
      console.warn('[KnowledgeDistiller] Failed to load CORE:', e.message);
    }
  }

  if (fs.existsSync(learnedPath)) {
    try {
      const learned = JSON.parse(fs.readFileSync(learnedPath, 'utf-8'));
      for (const [key, record] of Object.entries(learned)) {
        data[key] = { ...record, layer: 'LEARNED' };
      }
    } catch (e) {
      console.warn('[KnowledgeDistiller] Failed to load LEARNED:', e.message);
    }
  }

  return data;
}

function ensureMemoryDir() {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
}

// ============================================================
// 主接口
// ============================================================

class KnowledgeDistiller {
  constructor(options = {}) {
    this.options = options;
    this.memoryData = null;
  }

  /**
   * 提取所有可传递的知识
   */
  distill(options = {}) {
    if (!this.memoryData) {
      this.memoryData = loadMemoryData();
    }

    const patterns = extractKnowledgePatterns(this.memoryData, options);
    const report = generateKnowledgeReport(this.memoryData, options);

    return {
      patterns,
      report,
      distiller: this,
    };
  }

  /**
   * 生成知识卡片（可读格式）
   */
  generateCards(options = {}) {
    const { patterns } = this.distill(options);
    return patterns.map(p => generatePatternCard(p));
  }

  /**
   * 生成技能模块（可安装的 .js）
   */
  generateSkillModules(options = {}) {
    const { patterns } = this.distill(options);
    const skills = [];

    for (const p of patterns.slice(0, 20)) { // 最多生成 20 个
      if (p.confidence >= 0.3) {
        skills.push(generateSkillModule(p));
      }
    }

    return skills;
  }

  /**
   * 生成完整知识报告
   */
  generateReport(options = {}) {
    return generateKnowledgeReport(this.memoryData || loadMemoryData(), options);
  }

  /**
   * 导出到文件
   */
  exportToFile(outputDir = path.join(__dirname, '../../distilled'), options = {}) {
    ensureMemoryDir();
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const report = this.generateReport(options);
    const reportPath = path.join(outputDir, `knowledge-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    const cards = this.generateCards(options);
    const cardsPath = path.join(outputDir, `knowledge-cards-${Date.now()}.json`);
    fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2), 'utf-8');

    return {
      reportPath,
      cardsPath,
      report,
      cards,
    };
  }

  /**
   * 统计
   */
  stats() {
    if (!this.memoryData) {
      this.memoryData = loadMemoryData();
    }

    const patterns = extractKnowledgePatterns(this.memoryData);
    const report = generateKnowledgeReport(this.memoryData);

    return {
      memoryEntries: Object.keys(this.memoryData).length,
      distilledPatterns: patterns.length,
      ...report.stats,
    };
  }
}

// ============================================================
// 工厂函数
// ============================================================

function createDistiller(options = {}) {
  return new KnowledgeDistiller(options);
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  KnowledgeDistiller,
  createDistiller,
  extractKnowledgePatterns,
  generatePatternCard,
  generateSkillModule,
  generateKnowledgeReport,
  loadMemoryData,
};
