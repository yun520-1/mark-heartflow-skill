/**
 * 自我修正循环 - 错误 → 修正 引擎
 * 记录所有纠正，形成教训，用于避免重复犯错
 */
const selfCorrectionLoop = {
  corrections: [],

  // 记录修正
  record(type, original, corrected, reason) {
    const entry = {
      id: `correction-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      original: String(original).slice(0, 200),
      corrected: String(corrected).slice(0, 200),
      reason,
      timestamp: new Date().toISOString()
    };
    this.corrections.push(entry);
    this._persist();
    return entry;
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

  // 用户纠正回调
  onUserCorrection(type, original, userCorrection) {
    const entry = this.record(type, original, userCorrection, 'user_feedback');
    return {
      recorded: true,
      correctionId: entry.id,
      totalCorrections: this.corrections.length,
      lesson: `类型${type}的错误，已记录教训`
    };
  },

  // 获取教训列表（用于注入上下文）
  getLessons() {
    return this.corrections.map(c => ({
      type: c.type,
      reason: c.reason,
      original: c.original,
      timestamp: c.timestamp
    }));
  },

  // 获取最近教训
  getRecentLessons(n = 5) {
    return this.corrections.slice(-n);
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
      console.error('[SelfCorrection] Persist failed:', e.message);
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
      }
    } catch (e) {
      // 安全修复：记录错误并重置
      console.warn('[SelfCorrection] Load failed, starting fresh:', e.message);
      this.corrections = [];
    }
  }
};

// 启动时加载历史教训
selfCorrectionLoop.load();

module.exports = { selfCorrectionLoop };
