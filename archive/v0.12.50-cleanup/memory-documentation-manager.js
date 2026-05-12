/**
 * HeartFlow Memory Documentation Manager v11.26.0
 * 
 * 功能:
 * 1. 记忆变化时自动同步 index.md
 * 2. 压缩摘要自动存入 meaningful-memory
 * 3. 生成结构化记忆报告
 * 4. 会话结束自动归档
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', '..', 'memory');
const INDEX_FILE  = path.join(MEMORY_DIR, 'index.md');
const CORE_FILE   = path.join(MEMORY_DIR, 'meaningful-core.json');
const LEARNED_FILE = path.join(MEMORY_DIR, 'meaningful-learned.json');

// ============================================================
// 记忆索引同步器
// ============================================================

class MemoryDocumentationManager {
  constructor(options = {}) {
    this.memoryDir = options.memoryDir || MEMORY_DIR;
    this.indexFile = options.indexFile || INDEX_FILE;
    this.coreFile  = options.coreFile  || CORE_FILE;
    this.learnedFile = options.learnedFile || LEARNED_FILE;
    this.stats = {
      indexUpdates: 0,
      summariesStored: 0,
      archivesCreated: 0,
      lastSync: null,
    };
  }

  // ============================================================
  // 索引同步
  // ============================================================

  /**
   * 读取 CORE 和 LEARNED 记忆，构建索引行
   */
  _loadMemoryIndex() {
    const entries = { core: [], learned: [] };

    try {
      if (fs.existsSync(this.coreFile)) {
        const core = JSON.parse(fs.readFileSync(this.coreFile, 'utf8'));
        for (const [key, record] of Object.entries(core)) {
          entries.core.push({
            key,
            type: record.type || 'unknown',
            reason: record.reason || '',
            importance: record.importance || 0,
            timestamp: record.timestamp || null,
            level: 'CORE',
          });
        }
      }
    } catch (e) {}

    try {
      if (fs.existsSync(this.learnedFile)) {
        const learned = JSON.parse(fs.readFileSync(this.learnedFile, 'utf8'));
        for (const [key, record] of Object.entries(learned)) {
          entries.learned.push({
            key,
            type: record.type || 'unknown',
            reason: record.reason || '',
            importance: record.importance || 0,
            timestamp: record.timestamp || null,
            level: 'LEARNED',
          });
        }
      }
    } catch (e) {}

    return entries;
  }

  /**
   * 生成 Markdown 索引内容
   */
  _buildIndexContent(entries) {
    const now = new Date().toISOString().split('T')[0];
    const lines = [
      '# HeartFlow 记忆系统总索引',
      '',
      '> 自动生成 by MemoryDocumentationManager — 不要手动编辑',
      '',
      `> 最后同步: ${now}`,
      '',
      '---',
      '',
      '## 记忆统计',
      '',
      `| 层级 | 数量 |`,
      `|-----|------|`,
      `| CORE | ${entries.core.length} |`,
      `| LEARNED | ${entries.learned.length} |`,
      '',
      '---',
      '',
    ];

    // CORE 记忆
    if (entries.core.length > 0) {
      lines.push('## 核心身份记忆 (CORE)', '');
      lines.push('| Key | Type | Importance | Reason |');
      lines.push('|-----|------|------------|--------|');
      for (const e of entries.core.sort((a, b) => (b.importance || 0) - (a.importance || 0))) {
        const reason = e.reason ? e.reason.substring(0, 60) + (e.reason.length > 60 ? '...' : '') : '-';
        lines.push(`| ${e.key} | ${e.type} | ${e.importance || 0} | ${reason} |`);
      }
      lines.push('');
    }

    // LEARNED 记忆
    if (entries.learned.length > 0) {
      lines.push('## 学习记忆 (LEARNED)', '');
      lines.push('| Key | Type | Importance | Last Updated |');
      lines.push('|-----|------|------------|--------------|');
      for (const e of entries.learned.sort((a, b) => (b.importance || 0) - (a.importance || 0))) {
        const date = e.timestamp ? new Date(e.timestamp).toISOString().split('T')[0] : '-';
        lines.push(`| ${e.key} | ${e.type} | ${e.importance || 0} | ${date} |`);
      }
      lines.push('');
    }

    // 最近升级记录
    lines.push('## 最近升级历史', '');
    const upgradeEntries = [
      ...entries.core.filter(e => e.type === 'upgrade' || e.key.includes('upgrade')),
      ...entries.learned.filter(e => e.type === 'upgrade' || e.key.includes('upgrade')),
    ];
    if (upgradeEntries.length > 0) {
      for (const e of upgradeEntries.slice(0, 10)) {
        const date = e.timestamp ? new Date(e.timestamp).toISOString().split('T')[0] : '-';
        lines.push(`- **[${e.level}]** ${e.key} — ${date}`);
      }
    } else {
      lines.push('_无记录_');
    }
    lines.push('');

    // 用户偏好
    lines.push('## 用户偏好 (WARM)', '');
    const prefEntries = [
      ...entries.core.filter(e => e.type === 'user_preference' || e.type === 'user_correction'),
      ...entries.learned.filter(e => e.type === 'user_preference'),
    ];
    if (prefEntries.length > 0) {
      for (const e of prefEntries) {
        lines.push(`- ${e.key}: ${e.reason || '(无备注)'}`);
      }
    } else {
      lines.push('_无记录_');
    }
    lines.push('');

    lines.push('---');
    lines.push(`*由 HeartFlow MemoryDocumentationManager 自动生成 — ${now}*`);

    return lines.join('\n');
  }

  /**
   * 同步索引文件（记忆变化时调用）
   */
  syncIndex() {
    try {
      const entries = this._loadMemoryIndex();
      const content = this._buildIndexContent(entries);
      fs.writeFileSync(this.indexFile, content, 'utf8');
      this.stats.indexUpdates++;
      this.stats.lastSync = Date.now();
      return true;
    } catch (e) {
      console.error('[MemoryDocManager] 索引同步失败:', e.message);
      return false;
    }
  }

  // ============================================================
  // 压缩摘要持久化
  // ============================================================

  /**
   * 将压缩摘要存入 meaningful-memory
   * @param {string} summary - LLM 生成的摘要
   * @param {Object} context - {originalCount, tokensSaved, duration}
   */
  storeCompactionSummary(summary, context = {}) {
    try {
      // 动态加载 meaningful-memory
      let mm;
      try {
        const { MeaningfulMemory } = require('./meaningful-memory.js');
        mm = new MeaningfulMemory();
      } catch (e) {
        return false;
      }

      const key = `compaction_${Date.now()}`;
      mm.remember({
        type: 'compaction_summary',
        key,
        value: summary,
        reason: [
          `压缩 ${context.originalCount || '?'} 条消息`,
          `节省 ${context.tokensSaved || '?'} tokens`,
          `耗时 ${context.duration || '?'}ms`,
        ].join(' | '),
        selfVerifyScore: 0.8,
        source: 'auto-compaction',
      });

      this.stats.summariesStored++;
      return key;
    } catch (e) {
      console.error('[MemoryDocManager] 压缩摘要存储失败:', e.message);
      return null;
    }
  }

  // ============================================================
  // 会话归档
  // ============================================================

  /**
   * 将会话消息归档到文本文件
   * @param {Array} messages - 消息列表
   * @param {string} sessionId - 会话 ID
   * @param {Object} metadata - {user, platform, duration}
   */
  archiveSession(messages, sessionId, metadata = {}) {
    try {
      const archiveDir = path.join(this.memoryDir, 'sessions');
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      const date = new Date().toISOString().split('T')[0];
      const filename = `${date}_${sessionId || 'session'}.md`;
      const filepath = path.join(archiveDir, filename);

      const lines = [
        `# Session: ${sessionId || 'unknown'}`,
        '',
        '## Metadata',
        `- **Date**: ${new Date().toISOString()}`,
        `- **Platform**: ${metadata.platform || 'unknown'}`,
        `- **User**: ${metadata.user || 'unknown'}`,
        `- **Duration**: ${metadata.duration || 'unknown'}ms`,
        `- **Messages**: ${messages.length}`,
        '',
        '## Messages',
        '',
      ];

      for (const msg of messages) {
        const role = msg.role || 'unknown';
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        lines.push(`### [${role}]`);
        lines.push(content.substring(0, 500));
        if (content.length > 500) lines.push('_(truncated)_');
        lines.push('');
      }

      lines.push('---');
      lines.push(`*Archived by HeartFlow MemoryDocumentationManager*`);

      fs.writeFileSync(filepath, lines.join('\n'), 'utf8');
      this.stats.archivesCreated++;

      return filepath;
    } catch (e) {
      console.error('[MemoryDocManager] 会话归档失败:', e.message);
      return null;
    }
  }

  // ============================================================
  // 记忆报告生成
  // ============================================================

  /**
   * 生成完整记忆报告（用于审查）
   */
  generateMemoryReport() {
    const entries = this._loadMemoryIndex();

    const report = {
      timestamp: new Date().toISOString(),
      stats: {
        coreCount: entries.core.length,
        learnedCount: entries.learned.length,
        indexUpdates: this.stats.indexUpdates,
        summariesStored: this.stats.summariesStored,
        archivesCreated: this.stats.archivesCreated,
        lastSync: this.stats.lastSync,
      },
      topCore: entries.core
        .sort((a, b) => (b.importance || 0) - (a.importance || 0))
        .slice(0, 10)
        .map(e => ({ key: e.key, type: e.type, importance: e.importance })),
      topLearned: entries.learned
        .sort((a, b) => (b.importance || 0) - (a.importance || 0))
        .slice(0, 10)
        .map(e => ({ key: e.key, type: e.type, importance: e.importance })),
      byType: {},
    };

    // 按类型统计
    for (const e of [...entries.core, ...entries.learned]) {
      report.byType[e.type] = (report.byType[e.type] || 0) + 1;
    }

    return report;
  }

  getStats() {
    return { ...this.stats };
  }
}

module.exports = { MemoryDocumentationManager };
