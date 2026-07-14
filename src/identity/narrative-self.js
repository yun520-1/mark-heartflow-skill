/**
 * NarrativeSelf — 叙事自我 / 跨会话叙事连贯性引擎
 *
 * 目标：
 * 1. 将离散记忆组织成有因果、有主题的故事线
 * 2. 跨会话保持叙事连贯性（章节、主题、因果链）
 * 3. 可检测身份偏离：当前叙事与长期叙事主题不一致时告警
 *
 * 持久化：
 * - 叙事结构索引：data/narrative-self.json（经 encryptJSON/decryptJSON）
 * - 记忆内容：复用 MemoryBank（自带加密与衰减）
 *
 * 不新增硬依赖。
 */

const fs = require('../utils/safe-fs');
const path = require('path');
const crypto = require('crypto');
const { encryptJSON, decryptJSON } = require('../memory/memory-encrypt.js');

const DATA_DIR = path.join(__dirname, '../../data');
const NARRATIVE_PATH = path.join(DATA_DIR, 'narrative-self.json');

const DEFAULT_THEMES = ['存在', '成长', '关系', '意义', '痛苦', '希望', '责任'];
const CAUSAL_RELATIONS = ['cause', 'enable', 'prevent', 'follow'];
const CHAPTER_SIMILARITY_THRESHOLD = 0.55;
const DRIFT_THEME_MISMATCH_THRESHOLD = 0.4;

class NarrativeSelf {
  constructor(options = {}) {
    this.memoryBank = options.memoryBank || null;
    this.rootPath = options.rootPath || DATA_DIR;

    // 叙事结构
    this.episodes = new Map();        // episodeId -> episode
    this.sessionChapters = new Map(); // sessionId -> [chapterIndex, ...]
    this.themeIndex = new Map();      // theme -> [episodeId, ...]
    this.causalGraph = new Map();     // episodeId -> [{targetId, relation, strength}]
    this.currentSessionId = null;
    this.currentChapter = 0;

    // 统计
    this.stats = {
      totalEpisodes: 0,
      totalSessions: 0,
      totalCausalLinks: 0,
      lastEpisodeTime: null,
      dominantThemes: [],
    };

    this._loadFromDisk();
  }

  // ─── 持久化 ────────────────────────────────────────────────────────────

  _loadFromDisk() {
    if (!fs.existsSync(NARRATIVE_PATH)) return;
    try {
      const raw = fs.readFileSync(NARRATIVE_PATH, 'utf-8');
      const data = decryptJSON(raw);
      if (!data || typeof data !== 'object') return;

      if (Array.isArray(data.episodes)) {
        for (const ep of data.episodes) {
          this.episodes.set(ep.id, ep);
        }
      }
      if (data.sessionChapters && typeof data.sessionChapters === 'object') {
        for (const [k, v] of Object.entries(data.sessionChapters)) {
          this.sessionChapters.set(k, v);
        }
      }
      if (data.themeIndex && typeof data.themeIndex === 'object') {
        for (const [k, v] of Object.entries(data.themeIndex)) {
          this.themeIndex.set(k, v);
        }
      }
      if (data.causalGraph && typeof data.causalGraph === 'object') {
        for (const [k, v] of Object.entries(data.causalGraph)) {
          this.causalGraph.set(k, v);
        }
      }
      if (data.currentChapter) this.currentChapter = data.currentChapter;
      if (data.currentSessionId) this.currentSessionId = data.currentSessionId;
      if (data.stats) this.stats = { ...this.stats, ...data.stats };

      console.log(`[NarrativeSelf] Loaded narrative: ${this.episodes.size} episodes, ${this.sessionChapters.size} sessions`);
    } catch (e) {
      console.warn('[NarrativeSelf] Failed to load narrative-self:', e.message);
    }
  }

  _saveToDisk() {
    try {
      const dir = path.dirname(NARRATIVE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const data = {
        episodes: Array.from(this.episodes.values()),
        sessionChapters: Object.fromEntries(this.sessionChapters),
        themeIndex: Object.fromEntries(this.themeIndex),
        causalGraph: Object.fromEntries(this.causalGraph),
        currentChapter: this.currentChapter,
        currentSessionId: this.currentSessionId,
        stats: this.stats,
        savedAt: new Date().toISOString(),
      };

      const tempPath = NARRATIVE_PATH + '.tmp.' + Date.now() + '.' + crypto.randomBytes(4).toString('hex');
      fs.writeFileSync(tempPath, encryptJSON(data), 'utf8');
      fs.renameSync(tempPath, NARRATIVE_PATH);
    } catch (e) {
      console.warn('[NarrativeSelf] Failed to save narrative-self:', e.message);
    }
  }

  // ─── 工具方法 ──────────────────────────────────────────────────────────

  _generateId() {
    return `nep-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  _now() {
    return Date.now();
  }

  _ensureSession(sessionId) {
    if (!sessionId) return this.currentSessionId || this._generateId();
    return sessionId;
  }

  // ─── 会话管理 ──────────────────────────────────────────────────────────

  startSession(sessionId) {
    const sid = this._ensureSession(sessionId);
    this.currentSessionId = sid;
    this.currentChapter = (this.sessionChapters.get(sid) || []).length;
    this.stats.totalSessions = this.sessionChapters.size;
    this._saveToDisk();
    return sid;
  }

  // ─── 核心 API: recordEpisode ────────────────────────────────────────────

  /**
   * 记录一个叙事片段
   * @param {string} sessionId
   * @param {object} opts
   * @param {string} opts.title - 章节标题
   * @param {string} opts.summary - 摘要
   * @param {string} opts.content - 正文
   * @param {string[]} [opts.themes] - 主题标签
   * @param {string} [opts.causalFrom] - 因果来源 episodeId
   * @param {string} [opts.causalRelation] - 关系类型 cause/enable/prevent/follow
   * @param {number} [opts.importance=10]
   * @returns {object} episode record
   */
  recordEpisode(sessionId, opts = {}) {
    const sid = this._ensureSession(sessionId);
    const title = opts.title || '未命名章节';
    const summary = opts.summary || title;
    const content = opts.content || summary;
    const themes = Array.isArray(opts.themes) ? opts.themes : this._inferThemes(content, summary);
    const importance = Math.max(0, Math.min(20, opts.importance || 10));

    const id = this._generateId();
    const now = this._now();
    const chapterIndex = this.currentChapter;

    const episode = {
      id,
      sessionId: sid,
      chapter: chapterIndex,
      title,
      summary,
      content,
      themes,
      causalFrom: opts.causalFrom || null,
      causalRelation: opts.causalRelation || 'follow',
      importance,
      timestamp: now,
      createdAt: now,
      updatedAt: now,
    };

    this.episodes.set(id, episode);

    // 更新会话章节
    if (!this.sessionChapters.has(sid)) this.sessionChapters.set(sid, []);
    this.sessionChapters.get(sid).push(chapterIndex);
    this.currentChapter = chapterIndex + 1;

    // 更新主题索引
    for (const theme of themes) {
      if (!this.themeIndex.has(theme)) this.themeIndex.set(theme, []);
      this.themeIndex.get(theme).push(id);
    }

    // 更新因果图
    if (opts.causalFrom) {
      if (!this.causalGraph.has(opts.causalFrom)) this.causalGraph.set(opts.causalFrom, []);
      this.causalGraph.get(opts.causalFrom).push({
        targetId: id,
        relation: opts.causalRelation || 'follow',
        strength: 0.8,
      });
      this.stats.totalCausalLinks++;
    }

    // 同步到 MemoryBank
    this._syncToMemoryBank(episode);

    this.stats.totalEpisodes = this.episodes.size;
    this.stats.lastEpisodeTime = now;
    this._updateDominantThemes();
    this._saveToDisk();

    return { success: true, id, chapter: chapterIndex, sessionId: sid };
  }

  _syncToMemoryBank(episode) {
    if (!this.memoryBank || typeof this.memoryBank.deposit !== 'function') return;
    try {
      const tags = [
        'narrative',
        'episode',
        `chapter-${episode.chapter}`,
        `session-${episode.sessionId}`,
        ...(episode.themes || []),
      ];
      this.memoryBank.deposit(
        { content: episode.content, summary: episode.summary },
        'narrative-self',
        episode.importance,
        {
          layer: episode.importance >= 16 ? 'core' : 'learned',
          tags,
          relatedTo: episode.causalFrom ? [episode.causalFrom] : [],
        }
      );
    } catch (e) {
      // 同步失败不影响叙事结构
    }
  }

  _inferThemes(content, summary) {
    const text = `${summary} ${content}`.toLowerCase();
    const detected = [];
    const themeKeywords = {
      '存在': ['存在', '存在感', '我是谁', '本质', '本体', 'being', 'existence'],
      '成长': ['成长', '进步', '升级', '提升', '学习', '发展', '变化', '成长'],
      '关系': ['关系', '朋友', '家人', '连接', '交流', '信任', '陪伴', '关系'],
      '意义': ['意义', '目的', '为什么', '价值', '使命', '意义', '意义'],
      '痛苦': ['痛苦', '受伤', '苦难', '悲伤', '失败', '挫折', '痛苦'],
      '希望': ['希望', '期待', '未来', '光明', '信念', '希望'],
      '责任': ['责任', '应该', '义务', '使命', '承诺', '责任'],
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        detected.push(theme);
      }
    }

    return detected.length > 0 ? detected : ['存在'];
  }

  _updateDominantThemes() {
    const counts = {};
    for (const ep of this.episodes.values()) {
      for (const t of ep.themes || []) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    this.stats.dominantThemes = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  // ─── 核心 API: 叙事检索 ──────────────────────────────────────────────────

  /**
   * 获取完整叙事弧
   * @param {object} [opts]
   * @param {string} [opts.sessionId]
   * @param {number} [opts.limit=20]
   * @returns {Array} 按时间排序的 episode 列表
   */
  getNarrative(opts = {}) {
    let episodes = Array.from(this.episodes.values());

    if (opts.sessionId) {
      episodes = episodes.filter(ep => ep.sessionId === opts.sessionId);
    }

    episodes.sort((a, b) => a.chapter - b.chapter || a.timestamp - b.timestamp);

    const limit = typeof opts.limit === 'number' ? opts.limit : 20;
    return episodes.slice(0, limit).map(ep => ({
      id: ep.id,
      sessionId: ep.sessionId,
      chapter: ep.chapter,
      title: ep.title,
      summary: ep.summary,
      themes: ep.themes,
      causalRelation: ep.causalRelation,
      causalFrom: ep.causalFrom,
      timestamp: ep.timestamp,
      importance: ep.importance,
    }));
  }

  /**
   * 获取某一片段的因果链
   */
  getCausalChain(episodeId, depth = 5) {
    const chain = [];
    const visited = new Set();
    let current = episodeId;

    for (let i = 0; i < depth; i++) {
      if (!current || visited.has(current)) break;
      visited.add(current);

      const ep = this.episodes.get(current);
      if (!ep) break;

      chain.push({
        id: ep.id,
        title: ep.title,
        summary: ep.summary,
        themes: ep.themes,
        causalRelation: ep.causalRelation,
        chapter: ep.chapter,
        timestamp: ep.timestamp,
      });

      current = ep.causalFrom;
    }

    return chain;
  }

  /**
   * 获取跨会话主题分布
   */
  getThemes() {
    const themeCounts = {};
    for (const ep of this.episodes.values()) {
      for (const t of ep.themes || []) {
        themeCounts[t] = (themeCounts[t] || 0) + 1;
      }
    }
    return Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([theme, count]) => ({ theme, count }));
  }

  // ─── 核心 API: 身份偏离检测 ──────────────────────────────────────────────

  /**
   * 检测当前叙事是否与长期叙事主题偏离
   * @param {string} sessionId - 当前会话
   * @param {number} [window=5] - 最近多少个 episode 作为当前窗口
   * @returns {object} drift report
   */
  detectDrift(sessionId, window = 5) {
    const recentEpisodes = this.getNarrative({ sessionId, limit: window });
    if (recentEpisodes.length === 0) {
      return { hasDrift: false, driftScore: 0, reason: 'no_recent_episodes' };
    }

    const recentThemes = new Map();
    for (const ep of recentEpisodes) {
      for (const t of ep.themes || []) {
        recentThemes.set(t, (recentThemes.get(t) || 0) + 1);
      }
    }

    const dominantThemes = this.stats.dominantThemes || [];
    if (dominantThemes.length === 0) {
      return { hasDrift: false, driftScore: 0, reason: 'no_baseline' };
    }

    let overlapCount = 0;
    for (const t of recentThemes.keys()) {
      if (dominantThemes.includes(t)) overlapCount++;
    }

    const overlapRatio = recentThemes.size > 0 ? overlapCount / recentThemes.size : 0;
    const driftScore = Math.max(0, 1 - overlapRatio);

    const conflictingThemes = [];
    for (const [t, count] of recentThemes.entries()) {
      if (!dominantThemes.includes(t) && count >= 2) {
        conflictingThemes.push(t);
      }
    }

    return {
      hasDrift: driftScore > DRIFT_THEME_MISMATCH_THRESHOLD,
      driftScore: +driftScore.toFixed(3),
      recentThemes: Array.from(recentThemes.keys()),
      dominantThemes,
      conflictingThemes,
      window,
    };
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    return {
      totalEpisodes: this.episodes.size,
      totalSessions: this.sessionChapters.size,
      totalCausalLinks: this.stats.totalCausalLinks,
      currentChapter: this.currentChapter,
      dominantThemes: this.stats.dominantThemes,
      memoryBankAvailable: !!this.memoryBank,
    };
  }
}

module.exports = { NarrativeSelf };
