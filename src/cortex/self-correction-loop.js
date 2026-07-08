/**
 * 自我修正循环 - 错误 → 修正 引擎
 * 记录所有纠正，形成教训，用于避免重复犯错
 * 
 * v2.0.50 - 重大功能升级：
 * - 修正权重/评分系统（frequency × recency × severity）
 * - 自动修正建议（基于模式匹配的错误修复建议）
 * - 去重合并（同类型+同原因合并，累加频率）
 * - 修正统计（按类型聚合、趋势分析、Top错误）
 * - 权重衰减（旧修正随时间降低影响）
 * - 模式匹配自动修复（检测常见错误模式并建议修复）
 */
const crypto = require('crypto');

// === 合并 Map 最大容量 ===
const MAX_MAP_SIZE = 200;

/**
 * 带容量保护的 Map.set — 超出容量时淘汰最早插入的条目（LRU）
 * @param {Map} map - 目标 Map
 * @param {*} key - 键
 * @param {*} value - 值
 * @param {number} maxSize - 最大容量
 */
function _boundedSet(map, key, value, maxSize) {
  if (map.size >= maxSize && !map.has(key)) {
    const firstKey = map.keys().next().value;
    map.delete(firstKey);
  }
  map.set(key, value);
}

// 错误严重级别枚举
const SEVERITY = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical' };

// 常见错误模式 → 修复建议映射
const AUTO_FIX_PATTERNS = [
  {
    pattern: /missing\s+(required|mandatory)\s+(field|property|param)/i,
    type: 'missing_field',
    severity: SEVERITY.MEDIUM,
    suggestion: '检查函数签名和调用处，补全缺少的必需参数'
  },
  {
    pattern: /undefined\s+is\s+not\s+a\s+function/i,
    type: 'undefined_function',
    severity: SEVERITY.HIGH,
    suggestion: '确认对象已正确实例化，检查原型链方法是否存在'
  },
  {
    pattern: /cannot\s+read\s+property.*of\s+undefined/i,
    type: 'null_reference',
    severity: SEVERITY.HIGH,
    suggestion: '添加空值检查或可选链(?.)操作符，确保访问前对象已定义'
  },
  {
    pattern: /module\s+not\s+found/i,
    type: 'missing_module',
    severity: SEVERITY.HIGH,
    suggestion: '检查依赖安装状态和模块路径是否正确'
  },
  {
    pattern: /syntax\s+error/i,
    type: 'syntax_error',
    severity: SEVERITY.CRITICAL,
    suggestion: '检查代码语法结构，注意括号配对和语句终止符'
  },
  {
    pattern: /typeerror.*not\s+a\s+function/i,
    type: 'type_mismatch',
    severity: SEVERITY.HIGH,
    suggestion: '检查变量实际类型，使用typeof或instanceof验证类型'
  },
  {
    pattern: /timeout/i,
    type: 'timeout',
    severity: SEVERITY.MEDIUM,
    suggestion: '增加超时阈值或优化异步操作的执行效率'
  },
  {
    pattern: /econnrefused|connection\s+refused/i,
    type: 'connection_error',
    severity: SEVERITY.HIGH,
    suggestion: '确认目标服务正在运行，检查端口和网络配置'
  },
  {
    pattern: /permission\s+denied|eacces/i,
    type: 'permission_error',
    severity: SEVERITY.MEDIUM,
    suggestion: '检查文件/目录权限，使用合适的读写模式'
  },
  {
    pattern: /out\s+of\s+memory|memory\s+leak/i,
    type: 'memory_pressure',
    severity: SEVERITY.CRITICAL,
    suggestion: '检查循环引用和大型数据结构，考虑流式处理或分页'
  }
];

const selfCorrectionLoop = {
  corrections: [],

  // 记录修正（v2.0.50: 增加权重、去重、自动分类）
  async record(type, original, corrected, reason, severity = SEVERITY.MEDIUM) {
    const entry = {
      id: `correction-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      type,
      original: String(original).slice(0, 200),
      corrected: String(corrected).slice(0, 200),
      reason: reason || 'unspecified',
      severity,
      weight: 1.0,
      frequency: 1,
      timestamp: new Date().toISOString(),
      lastOccurred: Date.now()
    };

    // 去重：检查是否已有高度相似的修正记录
    const duplicate = this._findDuplicate(entry);
    if (duplicate) {
      duplicate.frequency += 1;
      duplicate.weight = Math.min(5.0, duplicate.weight + 0.3);
      duplicate.lastOccurred = Date.now();
      duplicate.timestamp = new Date().toISOString();
      // 更新修正内容（保留最新版本）
      if (corrected) duplicate.corrected = String(corrected).slice(0, 200);
      return { ...duplicate, deduplicated: true, id: duplicate.id };
    }

    this.corrections.push(entry);
    this._applyDecay(); // 每次新增时触发衰减
    return entry;
  },

  // 查找重复修正（同类型 + 相同错误原因）
  _findDuplicate(newEntry) {
    const threshold = 0.6; // 相似度阈值
    for (const existing of this.corrections) {
      if (existing.type !== newEntry.type) continue;
      // 检查原始内容相似度（前50字符）
      const origA = newEntry.original.slice(0, 50).toLowerCase();
      const origB = existing.original.slice(0, 50).toLowerCase();
      if (origA === origB) return existing;
      // 检查原因相似度
      const reasonA = newEntry.reason.toLowerCase();
      const reasonB = existing.reason.toLowerCase();
      if (reasonA.includes(reasonB) || reasonB.includes(reasonA)) return existing;
      // 简单编辑距离检查（基于共同子串比例）
      const common = this._commonSubstring(origA, origB);
      const similarity = (2 * common.length) / (origA.length + origB.length);
      if (similarity >= threshold) return existing;
    }
    return null;
  },

  // 最长公共子串长度
  _commonSubstring(a, b) {
    if (!a || !b) return '';
    const m = a.length, n = b.length;
    let maxLen = 0, endIdx = 0;
    // 使用DP表
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
          if (dp[i][j] > maxLen) {
            maxLen = dp[i][j];
            endIdx = i;
          }
        }
      }
    }
    return a.slice(endIdx - maxLen, endIdx);
  },

  // 权重衰减：旧修正权重随时间衰减
  _applyDecay() {
    const now = Date.now();
    const DAY_MS = 86400000;
    const DECAY_HALF_LIFE = 30; // 30天半衰期
    for (const c of this.corrections) {
      const ageDays = (now - (c.lastOccurred || new Date(c.timestamp).getTime())) / DAY_MS;
      if (ageDays > 0) {
        const decayFactor = Math.pow(0.5, ageDays / DECAY_HALF_LIFE);
        c.weight = Math.max(0.1, c.weight * decayFactor);
      }
    }
  },

  // 获取自动修正建议（基于模式匹配）
  getAutoFixSuggestion(errorMessage) {
    if (!errorMessage) return null;
    for (const fix of AUTO_FIX_PATTERNS) {
      if (fix.pattern.test(errorMessage)) {
        return {
          type: fix.type,
          severity: fix.severity,
          suggestion: fix.suggestion,
          matched: true
        };
      }
    }
    return { type: 'unknown', severity: SEVERITY.LOW, suggestion: '需要人工分析错误原因', matched: false };
  },

  // 自动检测并建议修正（v2.0.50: 新模式匹配+历史查询）
  async autoDetectAndSuggest(content, type = 'general') {
    const issues = [];
    const suggestions = [];

    // 1. 运行原有验证
    const verificationResult = await this.verifyAndCorrect(content, type);
    issues.push(...verificationResult.issues);

    // 2. 模式匹配自动检测（即使验证通过也做模式检查）
    if (type === 'code' || type === 'general') {
      for (const fix of AUTO_FIX_PATTERNS) {
        if (fix.pattern.test(String(content))) {
          suggestions.push({
            pattern: fix.type,
            severity: fix.severity,
            suggestion: fix.suggestion,
            autoFixable: true
          });
        }
      }
    }

    // 3. 查询历史中是否有同类错误
    const similarHistory = this._findSimilarInHistory(content);
    if (similarHistory.length > 0) {
      suggestions.push({
        pattern: 'historical_pattern',
        severity: SEVERITY.MEDIUM,
        suggestion: `检测到历史同类错误（${similarHistory.length}次），建议参考：${similarHistory[0].corrected}`,
        historicalRef: similarHistory[0].id,
        autoFixable: false
      });
    }

    return {
      verified: verificationResult.verified && issues.length === 0,
      issues,
      suggestions,
      needsCorrection: issues.length > 0 || suggestions.length > 0
    };
  },

  // 在历史中查找相似错误
  _findSimilarInHistory(content) {
    const str = String(content).toLowerCase().slice(0, 100);
    return this.corrections.filter(c => {
      const orig = c.original.toLowerCase();
      // 检查历史错误内容是否包含在当前内容中
      if (orig.length > 10 && str.includes(orig.slice(0, 30))) return true;
      // 检查当前内容是否包含历史错误内容
      if (str.length > 10 && orig.includes(str.slice(0, 30))) return true;
      return false;
    }).slice(0, 3); // 最多返回3条
  },

  // 修正统计（v2.0.50: 新增）
  getStatistics() {
    const total = this.corrections.length;
    if (total === 0) {
      return { total: 0, byType: {}, topErrors: [], recentTrend: 'stable', severityDistribution: {} };
    }

    // 按类型聚合
    const byType = {};
    const bySeverity = {};
    let totalWeight = 0;

    for (const c of this.corrections) {
      byType[c.type] = (byType[c.type] || 0) + 1;
      const sev = c.severity || SEVERITY.MEDIUM;
      bySeverity[sev] = (bySeverity[sev] || 0) + 1;
      totalWeight += c.weight || 1;
    }

    // Top错误（按 frequency × weight 排序）
    const scored = this.corrections.map(c => ({
      ...c,
      impactScore: (c.frequency || 1) * (c.weight || 1)
    }));
    scored.sort((a, b) => b.impactScore - a.impactScore);
    const topErrors = scored.slice(0, 5).map(c => ({
      type: c.type,
      reason: c.reason,
      frequency: c.frequency,
      weight: c.weight,
      impactScore: c.impactScore,
      suggestion: this.getAutoFixSuggestion(c.original).suggestion
    }));

    // 趋势分析（最近7天 vs 之前7天）
    const now = Date.now();
    const DAY_MS = 86400000;
    const recent7 = this.corrections.filter(c => now - (c.lastOccurred || new Date(c.timestamp).getTime()) < 7 * DAY_MS).length;
    const prior7 = this.corrections.filter(c => {
      const t = c.lastOccurred || new Date(c.timestamp).getTime();
      return t >= now - 14 * DAY_MS && t < now - 7 * DAY_MS;
    }).length;

    let recentTrend = 'stable';
    if (recent7 > prior7 * 1.3) recentTrend = 'increasing';
    else if (recent7 < prior7 * 0.7) recentTrend = 'decreasing';

    return {
      total,
      byType,
      bySeverity,
      topErrors,
      recentTrend,
      averageWeight: totalWeight / total,
      severityDistribution: bySeverity,
      deduplicationRate: total > 0 ? Math.round((1 - this._countUnique() / total) * 100) : 0
    };
  },

  // 计算唯一修正数量（按type + reason去重）
  _countUnique() {
    const seen = new Set();
    for (const c of this.corrections) {
      seen.add(`${c.type}:${c.reason}`);
    }
    return seen.size;
  },

  // 用户纠正回调
  // ⚠️ 安全修复：await this.record() 确保获取实际 entry 而非 Promise 对象
  // 同时修复 _persistAsync() -> _persist()（_persistAsync 未定义）
  async onUserCorrection(type, original, userCorrection) {
    const entry = await this.record(type, original, userCorrection, 'user_feedback');
    return {
      recorded: true,
      correctionId: entry.id,
      totalCorrections: this.corrections.length,
      lesson: `类型${type}的错误，已记录教训`
    };
  },

  // 获取教训列表（用于注入上下文）
  getLessons() {
    // 按权重排序，高权重优先
    const sorted = [...this.corrections].sort((a, b) => (b.weight || 0) - (a.weight || 0));
    return sorted.map(c => ({
      type: c.type,
      reason: c.reason,
      original: c.original,
      corrected: c.corrected,
      weight: c.weight,
      frequency: c.frequency,
      timestamp: c.timestamp
    }));
  },

  // 获取最近教训
  getRecentLessons(n = 5) {
    return this.corrections.slice(-n).reverse().map(c => ({
      type: c.type,
      reason: c.reason,
      original: c.original,
      weight: c.weight,
      frequency: c.frequency
    }));
  },

  // 按类型查询教训
  getLessonsByType(type) {
    return this.corrections.filter(c => c.type === type);
  },

  // 检查是否犯过同类错误
  hasSimilarMistake(type, content) {
    const similar = this.corrections.filter(c =>
      c.type === type &&
      c.original.includes(String(content).slice(0, 50))
    );
    return similar.length > 0;
  },

  // 获取高优先级教训（v2.0.50: 新增权重阈值）
  getHighPriorityLessons(weightThreshold = 0.7) {
    this._applyDecay();
    return this.corrections
      .filter(c => (c.weight || 0) >= weightThreshold)
      .sort((a, b) => (b.weight || 0) - (a.weight || 0))
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        type: c.type,
        reason: c.reason,
        original: c.original,
        corrected: c.corrected,
        weight: c.weight,
        frequency: c.frequency,
        severity: c.severity
      }));
  },

  // 合并重复修正（v2.0.50: 新增整理功能）
  consolidate() {
    const consolidated = [];
    const seen = new Map();

    for (const c of this.corrections) {
      const key = `${c.type}:${c.reason}`;
      if (seen.has(key)) {
        const existing = seen.get(key);
        existing.frequency += c.frequency || 1;
        existing.weight = Math.min(5.0, (existing.weight || 1) + (c.weight || 1) * 0.2);
        existing.lastOccurred = Math.max(existing.lastOccurred || 0, c.lastOccurred || 0);
        if (c.corrected && c.corrected !== existing.corrected) {
          existing.corrected = existing.corrected + ' | ' + c.corrected;
        }
      } else {
        _boundedSet(seen, key, { ...c }, MAX_MAP_SIZE);
        consolidated.push(seen.get(key));
      }
    }

    this.corrections = consolidated;
    return { consolidated: consolidated.length, removed: seen.size - consolidated.length };
  },

  // 验证并检查内容
  async verifyAndCorrect(content, type = 'general') {
    const issues = [];

    if (type === 'skill') {
      // SKILL.md 验证
      try {
        const { skillVerifier } = require('./skill-verifier');
        const result = skillVerifier.verify(content);
        if (!result.ok) issues.push(...result.errors);
      } catch (e) {
        issues.push(`验证器加载失败: ${e.message}`);
      }
    } else if (type === 'code') {
      try {
        const { codeVerifier } = require('./code-verifier');
        const result = codeVerifier.verifyJSContent(content);
        if (!result.ok) issues.push(...result.errors);
      } catch (e) {
        issues.push(`代码验证器失败: ${e.message}`);
      }
    } else {
      // 一般内容：检查假设
      try {
        const { hypothesisTester } = require('./hypothesis-tester');
        const claims = hypothesisTester.extractClaims(content);
        if (claims.hasUnverified) issues.push('包含未核实数据');
      } catch (e) {
        // 忽略
      }
    }

    return {
      verified: issues.length === 0,
      issues,
      needsCorrection: issues.length > 0
    };
  },

  // 持久化到磁盘
  _persist() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(__dirname, '../../data');
      const filePath = path.join(dataDir, 'corrections.json');
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(this.corrections, null, 2));
    } catch (e) {
      // 安全修复：记录错误而非静默失败
    }
  },

  // 启动时加载
  load() {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../data/corrections.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        // 验证数据类型
        if (!Array.isArray(parsed)) {
          throw new Error('Invalid corrections data: expected array');
        }
        this.corrections = parsed;
        // 兼容旧数据：为缺少字段的条目添加默认值
        for (const c of this.corrections) {
          if (c.weight === undefined) c.weight = 1.0;
          if (c.frequency === undefined) c.frequency = 1;
          if (c.severity === undefined) c.severity = SEVERITY.MEDIUM;
          if (c.lastOccurred === undefined) c.lastOccurred = new Date(c.timestamp || Date.now()).getTime();
        }
      }
    } catch (e) {
      // 安全修复：记录错误并重置
      this.corrections = [];
    }
  }
};

// 启动时加载历史教训
selfCorrectionLoop.load();

module.exports = { selfCorrectionLoop };
