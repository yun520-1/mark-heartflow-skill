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

class SelfEvolutionV2 {
  constructor(rootPath) {
    this.rootPath = rootPath || __dirname;
    this.candidatesPath = path.join(this.rootPath, 'data', 'upgrade-candidates.json');
    this.historyPath = path.join(this.rootPath, 'data', 'upgrade-history.json');
    this._lastExplore = 0;
    this._exploreCooldownMs = 1000 * 60 * 30; // 探索最低间隔 30min，避免刷 arXiv
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
    try {
      // 直接搜能力关键词（提高命中率），每个能力各搜一批
      const queries = [
        'theory of mind LLM agent',
        'curiosity-driven exploration intrinsic motivation',
        'continual learning agent lifelong',
        'causal reasoning LLM',
        'world model reinforcement learning'
      ];
      let papers = [];
      for (const q of queries) {
        const batch = await this._fetchArxiv(q, 3);
        papers = papers.concat(batch);
      }
      const gaps = this._diffAgainstSelf(papers);
      return gaps;
    } catch (e) {
      return [];
    }
  }

  _fetchArxiv(query, max = 5) {
    return new Promise((resolve, reject) => {
      const q = encodeURIComponent(query);
      const url = `https://export.arxiv.org/api/query?search_query=all:${q}&max_results=${max}&sortBy=submittedDate&sortOrder=descending`;
      https.get(url, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          const titles = [...data.matchAll(/<title>([^<]+)<\/title>/g)].map(m => m[1].trim());
          const summaries = [...data.matchAll(/<summary>([^<]+)<\/summary>/g)].map(m => m[1].trim());
          const papers = titles.slice(1).map((t, i) => ({ title: t, abstract: summaries[i] || '' }));
          resolve(papers);
        });
      }).on('error', reject);
    });
  }

  /**
   * 把论文和自身模块对比，找差距。
   * 策略：不二元判断"有/无"（文件名命中易误判），
   * 而是把论文的前沿方法作为"对标标杆"存入候选——
   * 心虫承认"我看到了 X 方法，需对照检查实现深度"，驱动后续深究。
   */
  _diffAgainstSelf(papers) {
    const gaps = [];
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
    return gaps.filter(g => {
      if (seen.has(g.capability)) return false;
      seen.add(g.capability);
      return true;
    });
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
