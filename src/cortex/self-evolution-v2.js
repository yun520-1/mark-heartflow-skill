/**
 * SelfEvolutionV2 - 心虫自主进化引擎（v2）
 *
 * 设计原则（来自心虫本体 think() 决策 + 用户定调）：
 *  - 自主闭环：发现缺陷就改；没发现缺陷就主动探索（搜论文/搜开源实现）找差距
 *  - 不存在"无缺陷"状态：和前沿方法比、和自身历史比，永远有差距
 *  - 不靠 cron 造假：cron 只做低频兜底巡检
 *  - 不污染 git：感知/探索只写候选文件；固化时才 commit（且必须 231 测试全过 + git 验证）
 *
 * 三层循环：
 *  L0 感知   — sense(): cognitive_check + 对比自身历史基线 -> 缺陷候选
 *  L1 探索   — explore(): 搜 arXiv 最新认知引擎论文，对比自身模块找差距 -> 差距候选
 *  L2 固化   — crystallize(): 候选>=1 且测试全过 -> 改代码 -> commit+push (git验证)
 *
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { safeFetch } = require('../core/fetch-safe.js');

class SelfEvolutionV2 {
  constructor(rootPath) {
    this.rootPath = rootPath || __dirname;
    this.candidatesPath = path.join(this.rootPath, 'data', 'upgrade-candidates.json');
    this.historyPath = path.join(this.rootPath, 'data', 'upgrade-history.json');
    this._lastExplore = 0;
    this._exploreCooldownMs = 1000 * 60 * 30; // 探索最低间隔 30min，避免刷 arXiv
    this._safeFetch = safeFetch; // [v6.0.64] 可注入以便测试 mock (429/超时路径)
  }

  // ---------------------------------------------------------------------------
  // L0 感知：从自身状态找缺陷
  // ---------------------------------------------------------------------------
  sense() {
    const candidates = [];
    try {
      // 读模块健康 + 心理状态的轻量信号（不重复跑重型 check，复用已有数据）
      const healthRaw = this._readJson(path.join(this.rootPath, 'data', 'self-state-history.json'));
      if (Array.isArray(healthRaw) && healthRaw.length) {
        const last = healthRaw[healthRaw.length - 1];
        // 覆盖率偏低 -> 缺陷候选
        if (last.coverage && last.coverage.ratio !== undefined && last.coverage.ratio < 0.3) {
          candidates.push({
            kind: 'coverage',
            severity: 'medium',
            detail: `测试覆盖率 ${(last.coverage.ratio * 100).toFixed(1)}% 低于 30%`,
            source: 'self-state'
          });
        }
        // 有未验证的修复标记 -> 缺陷候选
        if (last.notes && last.notes.some(n => /TODO|待补|未验证/.test(n))) {
          candidates.push({
            kind: 'unverified-fix',
            severity: 'low',
            detail: '历史快照中存在未验证修复标记',
            source: 'self-state'
          });
        }
      }
    } catch (e) { /* 感知失败不阻断 */ }
    return candidates;
  }

  // ---------------------------------------------------------------------------
  // L1 探索：搜 arXiv 找差距（不靠 cron，think 主链路异步触发，有冷却）
  // ---------------------------------------------------------------------------
  async explore(query, force = false) {
    const now = Date.now();
    if (!force && now - this._lastExplore < this._exploreCooldownMs) {
      return []; // 冷却中，不刷网
    }
    this._lastExplore = now;
    // [v6.0.49 H1-P0] opt-in 出网：默认关，需 HEARTFLOW_SELF_EVOLVE_EXPLORE=1 才搜 arXiv
    if (process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE !== '1') {
      return []; // 静默不出网，避免绕过安全基座
    }
    try {
      // [v6.0.64] 搜索词对应心虫真实能力(ToM/好奇心/持续学习/因果/世界模型), 已在 _fetchArxiv 内限 AI 分类
      const queries = [
        'theory of mind',
        'curiosity intrinsic motivation',
        'continual learning',
        'causal inference LLM',
        'world model reinforcement'
      ];
      let papers = [];
      this._rateLimited = false;
      for (const q of queries) {
        if (this._rateLimited) break; // 429 后停止连击, 避免加重限流
        const batch = await this._fetchArxiv(q, 5);
        papers = papers.concat(batch);
        await new Promise(r => setTimeout(r, 3000)); // [v6.0.64] 尊重 arXiv 限流: ~3s/请求
      }
      const gaps = this._diffAgainstSelf(papers);
      return gaps;
    } catch (e) {
      return [];
    }
  }

  getExploreStatus() {
    return {
      rateLimited: !!this._rateLimited,
      lastFetchError: this._lastFetchError || null,
      lastExplore: this._lastExplore || 0
    };
  }

  async _fetchArxiv(query, max = 5) {
    // [v6.0.49 H1-P0] 走 safeFetch：SSRF校验 + DNS pinning + 白名单，杜绝裸出网绕过安全基座
    // [v6.0.61] base 直连 export.arxiv.org: 原 arxiv.org 会 301 跳 http://export, safeFetch 判重定向为 HTTP 外部端点拒绝
    // [v6.0.64] 限定 AI 相关分类, 避免 all: 全文搜索抓到物理/宇宙学等无关论文(实测污染 5/7)
    //   cs.AI(人工智能) cs.CL(计算语言学) cs.LG(机器学习) cs.NE(神经/进化计算)
    const q = encodeURIComponent(`(cat:cs.AI OR cat:cs.CL OR cat:cs.LG OR cat:cs.NE) AND all:${query}`);
    const base = 'https://export.arxiv.org/api/query';
    const url = `${base}?search_query=${q}&max_results=${max}&sortBy=submittedDate&sortOrder=descending`;
    // 重试 3 次(arXiv 偶发超时/限流), 429 时立即标记并停止, 失败记录原因不静默吞
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await this._safeFetch(url, { timeout: 12000, maxRetries: 1 });
        if (res.status === 429) {
          this._rateLimited = true;
          this._lastFetchError = 'HTTP 429 rate limited by arXiv';
          return [];
        }
        const body = await res.text();
        const parsed = this._parseArxiv(body);
        if (parsed.length) return parsed;
        lastErr = 'empty result';
      } catch (e) { lastErr = e.message; }
    }
    this._lastFetchError = lastErr || 'empty result';
    return [];
  }

  _parseArxiv(data) {
    if (typeof data !== 'string') return [];
    // [v6.0.64] 按 <entry> 块配对, 避免 title/summary 索引错位(原 titles.slice(1) 假设首 title=feed 名)
    const entries = [...data.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
    const out = [];
    for (const m of entries) {
      const block = m[1];
      const t = (block.match(/<title>([^<]+)<\/title>/) || [])[1];
      const s = (block.match(/<summary>([^<]+)<\/summary>/) || [])[1];
      if (t) out.push({ title: t.trim(), abstract: (s || '').trim() });
    }
    return out;
  }

  /**
   * 把论文和自身模块对比，找差距。
   * 策略：不二元判断"有/无"（文件名命中易误判），
   * 而是把论文的前沿方法作为"对标标杆"存入候选——
   * 心虫承认"我看到了 X 方法，需对照检查实现深度"，驱动后续深究。
   */
  _diffAgainstSelf(papers) {
    let gaps = [];
    const signalMap = {
      'skill-library': /skill librar|ever-?growing skill|code reuse/i,
      'self-play-rl': /self-?play|self-?improvement|iterative prompting/i,
      'curiosity': /curiosity|intrinsic motivation|exploration bonus/i,
      'causal': /causal inference|counterfactual/i,
      'continual': /continual|lifelong|catastrophic forgetting/i,
      'world-model': /world model|model-based/i,
      'theory-of-mind': /theory of mind|mentalizing|false belief/i,
      'reflexion': /reflexion|self-?reflection|verbal reinforcement/i
    };
    for (const p of papers) {
      const text = `${p.title} ${p.abstract}`;
      for (const [cap, re] of Object.entries(signalMap)) {
        if (re.test(text)) {
          gaps.push({
            kind: 'benchmark-reference',
            severity: 'info',
            detail: `对标标杆「${cap}」: 论文《${p.title.slice(0, 50)}》提及该方法，需对照检查自身实现深度`,
            source: 'arxiv',
            paperTitle: p.title,
            capability: cap
          });
        }
      }
    }
    // 去重（同 capability 只留最新一条）
    const seen = new Set();
    gaps = gaps.filter(g => {
      if (seen.has(g.capability)) return false;
      seen.add(g.capability);
      return true;
    });
    // [v6.0.61] 兜底升级: 不只留 1 条。未匹配窄信号的论文也作为前沿学习资料补齐(最多 8 条), 不浪费已抓数据
    if (papers.length > 0) {
      for (const p of papers.slice(0, 8)) {
        if (gaps.some(g => g.paperTitle === p.title)) continue;
        gaps.push({
          kind: 'benchmark-reference',
          severity: 'info',
          detail: `前沿学习资料: 论文《${(p.title||'').slice(0,50)}》代表当前方向, 需对照自身实现深度`,
          source: 'arxiv',
          paperTitle: p.title,
          capability: 'frontier-benchmark'
        });
      }
    }
    return gaps;
  }


  // ---------------------------------------------------------------------------
  // 候选管理：感知+探索的结果写入 data/upgrade-candidates.json（不 commit）
  // ---------------------------------------------------------------------------
  recordCandidates(candidates) {
    if (!Array.isArray(candidates) || candidates.length === 0) return 0;
    let existing = this._readJson(this.candidatesPath);
    if (!Array.isArray(existing)) existing = [];
    const ts = Date.now();
    for (const c of candidates) {
      c.timestamp = ts;
      c.id = `cand-${ts}-${Math.random().toString(36).slice(2, 7)}`;
    }
    existing.push(...candidates);
    // 保留最近 50 条
    if (existing.length > 50) existing = existing.slice(-50);
    try {
      fs.writeFileSync(this.candidatesPath, JSON.stringify(existing, null, 2));
    } catch (e) { /* ignore */ }
    return candidates.length;
  }

  getCandidates() {
    const c = this._readJson(this.candidatesPath);
    return Array.isArray(c) ? c : [];
  }

  /**
   * 主入口：心虫 think() 主链路异步调用。
   * 返回本次新增候选数（0 表示无缺陷/无差距，正常静默）。
   */
  async runCycle() {
    const sensed = this.sense();
    const explored = await this.explore();
    const all = [...sensed, ...explored];
    if (all.length === 0) return 0; // 无缺陷也无差距 -> 静默（不可能持久，因为 explore 总会找到差距）
    return this.recordCandidates(all);
  }

  // ---------------------------------------------------------------------------
  // 工具
  // ---------------------------------------------------------------------------
  _readJson(p) {
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) { /* ignore */ }
    return null;
  }
}

module.exports = { SelfEvolutionV2 };