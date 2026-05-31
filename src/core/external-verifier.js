/**
 * 外部验证调度器 - 整合所有外部验证模块
 */
const { openalexClient } = require('./openalex-client');
const { factChecker } = require('./fact-checker');
const { claimExtractor } = require('./claim-extractor');
const { confidenceAnnotator } = require('./confidence-annotator');
const fs = require('fs');
const path = require('path');
const { atomicWrite } = require('../utils/atomic-write');

const CACHE_FILE = path.join(__dirname, '../../data/verification-cache.json');

const externalVerifier = {
  cache: { entries: [] },

  // 加载缓存
  loadCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = fs.readFileSync(CACHE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        // 验证数据结构
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entries)) {
          throw new Error('Invalid cache structure');
        }
        this.cache = parsed;
        // 清理过期条目（24小时）
        const now = Date.now();
        const DAY = 86400000;
        this.cache.entries = this.cache.entries.filter(e => now - e.verifiedAt < DAY);
      }
    } catch (e) {
      // 安全修复：记录错误而非静默失败
      console.warn('[ExternalVerifier] Cache load failed, starting fresh:', e.message);
      this.cache = { entries: [] };
    }
    return this;
  },

  // 保存缓存（异步原子写入）
  async saveCacheAsync() {
    const fs = require('fs');
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    await atomicWrite(CACHE_FILE, JSON.stringify(this.cache, null, 2));
  },

  // 从缓存获取
  getCached(claim) {
    return this.cache.entries.find(e => e.claim === claim);
  },

  // 验证单个声明
  async verify(claim) {
    this.loadCache();
    const cached = this.getCached(claim);
    if (cached) return cached;

    const result = {
      claim,
      verified: false,
      confidence: 'unverified',
      sources: [],
      verifiedAt: Date.now()
    };

    // 1. 尝试学术验证
    const academic = await openalexClient.searchPaper(claim, 3);
    if (academic.ok && academic.works.length > 0) {
      result.verified = true;
      result.confidence = academic.works[0].citations > 100 ? 'high' : 'medium';
      result.sources.push(...academic.works.slice(0, 2).map(w => w.title));
    }

    // 2. 事实检查
    const fact = await factChecker.checkFact(claim);
    if (fact.checked) {
      result.confidence = fact.confidence || result.confidence;
      if (fact.issue) result.issue = fact.issue;
    }

    this.cache.entries.push(result);
    this.saveCacheAsync().catch(e => console.error("[ExternalVerifier] Cache save failed:", e.message));
    return result;
  },

  // 异步验证多个声明
  async verifyAsync(claims) {
    return Promise.all(claims.map(c => this.verify(c)));
  },

  // 验证文本中的所有声明
  async verifyText(text) {
    const claims = claimExtractor.extractAll(text);
    const allClaims = [
      ...claims.citations,
      ...claims.percentages,
      ...claims.numbers
    ];
    if (allClaims.length === 0) {
      return { verified: true, issues: [], annotations: null };
    }
    const results = await this.verifyAsync(allClaims);
    const annotations = confidenceAnnotator.generateAnnotationReport(text);
    const issues = results.filter(r => !r.verified);
    return { verified: issues.length === 0, issues, annotations };
  },

  // 清理缓存
  clearCache() {
    this.cache = { entries: [] };
    this.saveCacheAsync().catch(e => console.error("[ExternalVerifier] Cache save failed:", e.message));
    return { cleared: true };
  }
};

externalVerifier.loadCache();

module.exports = { externalVerifier };
