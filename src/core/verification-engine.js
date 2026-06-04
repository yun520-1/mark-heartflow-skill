/**
 * 验证引擎 v1.1.0 - 整合所有验证模块的单一入口
 * 
 * 增强功能：
 * - 严重性分类（critical/major/minor/info）
 * - 验证结果缓存（LRU + TTL）
 * - 结构化报告生成
 * - 子模块健康检查
 * - 验证评分系统
 * - 错误聚合与分类统计
 * - 验证建议生成
 */
const { codeVerifier } = require('./code-verifier');
const { skillVerifier } = require('./skill-verifier');
const { hypothesisTester } = require('./hypothesis-tester');
const { selfCorrectionLoop } = require('./self-correction-loop');

// 严重性级别
const Severity = Object.freeze({
  CRITICAL: 'critical',   // 必须修复，功能不可用
  MAJOR: 'major',         // 重要问题，建议修复
  MINOR: 'minor',         // 轻微问题，可选修复
  INFO: 'info',           // 信息性提示
  levels: { critical: 0, major: 1, minor: 2, info: 3 }
});

// 结果缓存项
class CacheEntry {
  constructor(result, ttlMs = 30000) {
    this.result = result;
    this.createdAt = Date.now();
    this.ttlMs = ttlMs;
  }

  isExpired() {
    return Date.now() - this.createdAt > this.ttlMs;
  }
}

// LRU缓存
class LRUCache {
  constructor(maxSize = 20) {
    this.maxSize = maxSize;
    this._map = new Map();
  }

  get(key) {
    const entry = this._map.get(key);
    if (!entry) return undefined;
    if (entry.isExpired()) {
      this._map.delete(key);
      return undefined;
    }
    // LRU: move to end (most recently used)
    this._map.delete(key);
    this._map.set(key, entry);
    return entry.result;
  }

  set(key, value, ttlMs) {
    if (this._map.has(key)) this._map.delete(key);
    else if (this._map.size >= this.maxSize) {
      // Delete oldest (first inserted)
      const oldestKey = this._map.keys().next().value;
      this._map.delete(oldestKey);
    }
    this._map.set(key, new CacheEntry(value, ttlMs));
  }

  clear() {
    this._map.clear();
  }

  get size() {
    return this._map.size;
  }

  get stats() {
    return { size: this._map.size, maxSize: this.maxSize };
  }
}

const verificationEngine = {
  name: 'verification-engine',
  version: '1.1.0',

  // 缓存实例
  _cache: new LRUCache(30),

  // 严重性分类函数
  _classifyIssue(issue) {
    if (!issue) return Severity.INFO;
    // 关键问题模式
    const criticalPatterns = [
      '缺少', '不可用', '致命', '崩溃', '安全', 'XSS', '注入', '路径遍历',
      'required', 'mandatory', 'critical', 'broken', 'malformed'
    ];
    // 主要问题模式
    const majorPatterns = [
      '不一致', '不匹配', '错误', '失败', '无效', '冲突', '缺失',
      'mismatch', 'error', 'invalid', 'failed', 'conflict'
    ];
    // 次要问题模式
    const minorPatterns = [
      '警告', '建议', '推荐', '未标注', '未核实', '重复',
      'warning', 'recommend', 'suggest', 'unverified', 'duplicate'
    ];

    for (const p of criticalPatterns) {
      if (issue.includes(p) || issue.includes(p.charAt(0).toUpperCase() + p.slice(1))) {
        return Severity.CRITICAL;
      }
    }
    for (const p of majorPatterns) {
      if (issue.includes(p)) return Severity.MAJOR;
    }
    for (const p of minorPatterns) {
      if (issue.includes(p)) return Severity.MINOR;
    }
    return Severity.INFO;
  },

  // 生成缓存key
  _cacheKey(content, type) {
    const hash = content.length > 200
      ? content.substring(0, 50) + ':' + content.length + ':' + (content.match(/^name:\s*(.+)$/m) || ['', ''])[1]
      : content;
    return `${type}::${hash}`;
  },

  // 验证技能文档
  verifySkill(content) {
    const cacheKey = this._cacheKey(content, 'skill');
    const cached = this._cache.get(cacheKey);
    if (cached) return cached;

    const result = skillVerifier.verify(content);
    const classified = this._classifyResults(result);
    this._cache.set(cacheKey, classified, 15000); // 15s TTL
    return classified;
  },

  // 验证代码
  verifyCode(content, lang = 'js') {
    const cacheKey = this._cacheKey(content, `code:${lang}`);
    const cached = this._cache.get(cacheKey);
    if (cached) return cached;

    let result;
    if (lang === 'js') result = codeVerifier.verifyJSContent(content);
    else if (lang === 'py') result = codeVerifier.verifyPyContent(content);
    else result = { ok: true, errors: [] };

    const classified = this._classifyResults(result);
    this._cache.set(cacheKey, classified, 10000);
    return classified;
  },

  // 验证假设/声明
  verifyClaims(text) {
    const cacheKey = this._cacheKey(text, 'claims');
    const cached = this._cache.get(cacheKey);
    if (cached) return cached;

    const claims = hypothesisTester.extractClaims(text);
    const confidence = hypothesisTester.assessConfidence(text, claims);
    const mark = hypothesisTester.markUnverified(claims);
    const annotations = hypothesisTester.formatAnnotations(text);
    const result = { claims, confidence, mark, annotations };
    this._cache.set(cacheKey, result, 5000);
    return result;
  },

  // 对验证结果进行严重性分类
  _classifyResults(result) {
    if (!result || !result.errors) return result;
    const classifiedErrors = result.errors.map(e => ({
      message: e,
      severity: this._classifyIssue(e)
    }));
    const bySeverity = {};
    for (const ce of classifiedErrors) {
      const s = ce.severity;
      if (!bySeverity[s]) bySeverity[s] = [];
      bySeverity[s].push(ce.message);
    }
    return {
      ...result,
      _classified: classifiedErrors,
      bySeverity,
      severityCount: {
        critical: (bySeverity.critical || []).length,
        major: (bySeverity.major || []).length,
        minor: (bySeverity.minor || []).length,
        info: (bySeverity.info || []).length
      }
    };
  },

  // 完整验证流程
  async fullVerification(content, type = 'general') {
    const startTime = Date.now();
    const results = {
      issues: [],
      warnings: [],
      corrections: [],
      confidence: 0.5,
      verificationType: type,
      subResults: {}
    };

    // 1. 基础验证
    if (type === 'skill') {
      const r = skillVerifier.verify(content);
      const classified = this._classifyResults(r);
      results.subResults.skill = classified;
      if (!r.ok) results.issues.push(...r.errors);
      if (r.warnings) results.warnings.push(...r.warnings);
    } else if (type === 'code') {
      const r = this.verifyCode(content);
      results.subResults.code = r;
      if (!r.ok) results.issues.push(...r.errors);
    } else if (type === 'general') {
      // 通用验证：检查基本结构
      if (content.length < 10) {
        results.issues.push('[general] 内容过短');
      }
      if (content.includes('undefined') || content.includes('null') && content.length < 100) {
        results.warnings.push('[general] 内容包含未定义占位符');
      }
    }

    // 2. 假设/声明检查
    if (type !== 'code') {
      const claimCheck = this.verifyClaims(content);
      results.subResults.claims = claimCheck;
      results.confidence = claimCheck.confidence.score;
      if (claimCheck.mark) results.issues.push(claimCheck.mark);
      if (claimCheck.annotations) results.warnings.push(claimCheck.annotations);
    }

    // 3. 检查历史教训（避免重复犯错）
    const lessons = selfCorrectionLoop.getLessons();
    results.corrections = lessons;

    // 4. 生成严重性分类
    const classifiedIssues = results.issues.map(i => ({
      message: i,
      severity: this._classifyIssue(i)
    }));
    const bySeverity = {};
    for (const ci of classifiedIssues) {
      if (!bySeverity[ci.severity]) bySeverity[ci.severity] = [];
      bySeverity[ci.severity].push(ci.message);
    }

    // 5. 计算验证评分 (0-100)
    const totalWeight = {
      critical: 10,
      major: 5,
      minor: 2,
      info: 0.5
    };
    let penalty = 0;
    let maxPenalty = 100;
    for (const [sev, count] of Object.entries({
      critical: (bySeverity.critical || []).length,
      major: (bySeverity.major || []).length,
      minor: (bySeverity.minor || []).length,
      info: (bySeverity.info || []).length
    })) {
      penalty += count * (totalWeight[sev] || 0);
    }
    const score = Math.max(0, Math.min(100, 100 - penalty));

    // 6. 生成验证建议
    const suggestions = [];
    if (bySeverity.critical && bySeverity.critical.length > 0) {
      suggestions.push(`紧急修复 ${bySeverity.critical.length} 个关键问题`);
    }
    if (bySeverity.major && bySeverity.major.length > 0) {
      suggestions.push(`处理 ${bySeverity.major.length} 个重要问题`);
    }
    if (score < 50) {
      suggestions.push('验证评分低于50，建议全面审查后重新验证');
    }
    if (results.confidence < 0.5) {
      suggestions.push('置信度偏低，建议补充来源或数据');
    }
    if (type === 'skill' && !content.includes('## 使用示例')) {
      suggestions.push('建议添加"使用示例"章节以提升可用性');
    }

    // 7. 生成严重性统计
    const severityStats = {
      critical: (bySeverity.critical || []).length,
      major: (bySeverity.major || []).length,
      minor: (bySeverity.minor || []).length,
      info: (bySeverity.info || []).length,
      total: results.issues.length
    };

    const elapsed = Date.now() - startTime;

    return {
      ...results,
      bySeverity,
      severityStats,
      score,
      suggestions,
      elapsed,
      verified: results.issues.length === 0,
      needsUserReview: results.issues.some(i => i.includes('未核实') || i.includes('[critical]')),
      summary: results.issues.length === 0
        ? '✅ 验证通过（评分: ' + score + '/100）'
        : `❌ ${results.issues.length} 个问题（评分: ${score}/100，严重: ${severityStats.critical}，重要: ${severityStats.major}，轻微: ${severityStats.minor}）`
    };
  },

  // 生成结构化验证报告
  generateReport(results) {
    if (!results) return '未提供验证结果';
    const lines = [];
    lines.push('═'.repeat(50));
    lines.push('  验 证 报 告');
    lines.push('═'.repeat(50));
    lines.push(`类型: ${results.verificationType || 'general'}`);
    lines.push(`状态: ${results.verified ? '✅ 通过' : '❌ 未通过'}`);
    if (results.score !== undefined) lines.push(`评分: ${results.score}/100`);
    if (results.elapsed !== undefined) lines.push(`耗时: ${results.elapsed}ms`);
    lines.push('');

    if (results.severityStats) {
      lines.push('--- 问题统计 ---');
      lines.push(`  关键: ${results.severityStats.critical}`);
      lines.push(`  重要: ${results.severityStats.major}`);
      lines.push(`  轻微: ${results.severityStats.minor}`);
      lines.push(`  提示: ${results.severityStats.info}`);
      lines.push(`  总计: ${results.severityStats.total}`);
      lines.push('');
    }

    if (results.issues && results.issues.length > 0) {
      lines.push('--- 问题列表 ---');
      for (const issue of results.issues) {
        const severity = this._classifyIssue(issue);
        const icon = { critical: '🔴', major: '🟠', minor: '🟡', info: '🔵' }[severity] || '⚪';
        lines.push(`  ${icon} [${severity}] ${issue}`);
      }
      lines.push('');
    }

    if (results.suggestions && results.suggestions.length > 0) {
      lines.push('--- 改进建议 ---');
      for (const s of results.suggestions) {
        lines.push(`  💡 ${s}`);
      }
      lines.push('');
    }

    if (results.warnings && results.warnings.length > 0) {
      lines.push('--- 警告 ---');
      for (const w of results.warnings) {
        lines.push(`  ⚠️ ${w}`);
      }
      lines.push('');
    }

    lines.push(`置信度: ${(results.confidence * 100).toFixed(0)}%`);
    lines.push('═'.repeat(50));
    return lines.join('\n');
  },

  // 子模块健康检查
  healthCheck() {
    const checks = {
      codeVerifier: !!codeVerifier && typeof codeVerifier.verifyJSContent === 'function',
      skillVerifier: !!skillVerifier && typeof skillVerifier.verify === 'function',
      hypothesisTester: !!hypothesisTester && typeof hypothesisTester.extractClaims === 'function',
      selfCorrectionLoop: !!selfCorrectionLoop && typeof selfCorrectionLoop.getLessons === 'function',
      cache: !!this._cache && this._cache instanceof LRUCache
    };

    const allOk = Object.values(checks).every(v => v === true);
    const healthyCount = Object.values(checks).filter(v => v).length;
    const totalCount = Object.keys(checks).length;

    return {
      healthy: allOk,
      healthyCount,
      totalCount,
      healthScore: Math.round((healthyCount / totalCount) * 100),
      checks,
      cacheStats: this._cache.stats,
      version: this.version,
      timestamp: new Date().toISOString()
    };
  },

  // 清除缓存
  clearCache() {
    const before = this._cache.size;
    this._cache.clear();
    return { cleared: true, previousSize: before };
  },

  // 记录用户纠正
  recordCorrection(type, original, corrected) {
    return selfCorrectionLoop.onUserCorrection(type, original, corrected);
  },

  // 获取教训
  getLessons() {
    return selfCorrectionLoop.getLessons();
  },

  // 快速验证（同步）
  quickCheck(content, type = 'general') {
    if (type === 'skill') return skillVerifier.quickCheck(content);
    return { ok: true };
  }
};

module.exports = { verificationEngine };
