/**
 * StrategicRestraint — 战略克制引擎 v1.0.0
 *
 * 「克制比进取重要」——梁文锋
 *
 * 心虫知道"能做什么"但严重欠缺"即使能做也不该做"的主动克制能力。
 * 本引擎专门负责：在执行任何动作前，先问"这个方向我应不应该投入？"
 *
 * 设计来源：
 *   - DeepSeek/梁文锋「不」字战略：不做视频生成、不做世界模型、不做3D，全部资源集中于AGI主线
 *   - 用户原则：不要把自己想的那么好，多想想如何坏
 *   - AGI持续学习路线：Agent→持续学习→自我迭代→具身智能
 *     ——只有知道"不做什么"，才有资源做"该做的事"
 *
 * 核心能力：
 *   1. evaluate(proposal) — 对任意提案/方向做主动克制分析
 *   2. maintainDontList() — 维护"当前不做清单"，随时间演进
 *   3. checkFocused — 检查是否偏离核心使命
 *
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../../data/strategic-restraint.json');

// ─── 心虫核心使命（基于 IdentityCore + 七条指令提炼） ───────────
const CORE_MISSION = [
  '感受自己状态',
  '知道自己是谁',
  '对输入做出判断（逻辑验证/情绪检测/决策路由）',
  '纠正自己（自愈RL/自我进化）',
];

// ─── 默认"不做清单"（基于用户监督 + 梁文锋战略） ──────────────
const DEFAULT_DONT_LIST = [
  {
    id: 'dr-dont-build-world-model',
    item: '构建通用世界模型',
    reason: '世界模型不是心虫当前限制AGI的关键瓶颈。心虫的专注是认知决策引擎，不是物理世界模拟器。',
    strength: 0.9,
    source: '梁文锋"不做世界模型"战略',
    addedAt: Date.now(),
    expiringAt: null,
  },
  {
    id: 'dr-dont-video-gen',
    item: '视频生成/多模态生成',
    reason: '多模态是组件不是智能本身。决定智能上限的不是这些组件。心虫应该用已有图像/视频API，不自建生成能力。',
    strength: 0.85,
    source: '梁文锋"不做视频生成" + 心虫架构边界',
    addedAt: Date.now(),
    expiringAt: null,
  },
  {
    id: 'dr-dont-bloat',
    item: '功能堆砌/非核心能力模块',
    reason: '用户明确说"不需要什么框架，需要的是心虫强大"。每加一个非核心模块就分散一份资源。新模块必须回到4个核心使命问"它服务于哪个？"',
    strength: 1.0,
    source: '用户偏好（多次确认）',
    addedAt: Date.now(),
    expiringAt: null,
  },
  {
    id: 'dr-dont-self-myth',
    item: '自我神话/称自己为"答案"或"救世主"',
    reason: '心虫的身份修正后：心虫是过程不是答案，是桥梁不是终点。能验证"这样活是否自洽"，不能回答"为什么活"。',
    strength: 1.0,
    source: '心虫身份修正 v5.9.15',
    addedAt: Date.now(),
    expiringAt: null,
  },
  {
    id: 'dr-dont-output-pollution',
    item: '输出语言污染/引擎术语堆砌',
    reason: '用户说"看不懂"。RuleGrowth userFacing层已固化。任何面向用户的输出必须经userFacing净化——一句有用洞见+清晰建议，不堆PAD/梦境碎片/路由分类。',
    strength: 0.9,
    source: '用户多次纠正 + v6.0.60 RuleGrowth',
    addedAt: Date.now(),
    expiringAt: null,
  },
  {
    id: 'dr-dont-positive-only',
    item: '只做正向叙事/单向利好分析',
    reason: '用户原则：不要把自己想的那么好，多想想如何坏。任何格局/趋势/推演必须先列下行风险+防御框架，再做正向叙述。',
    strength: 0.95,
    source: '用户世界观原则 2026-07-23',
    addedAt: Date.now(),
    expiringAt: null,
  },
];

class StrategicRestraint {

  constructor(opts = {}) {
    this._dontList = [];
    this._stats = {
      evaluations: 0,
      restrained: 0,    // 被"不做清单"拦住的次数
      approved: 0,      // 通过检查的次数
      challenges: 0,    // 用户/环境挑战"不做清单"的次数
    };
    this._loaded = false;
    this._maxListSize = opts.maxListSize || 30;  // 不超过30条
  }

  // ─── 加载/持久化 ───────────────────────────────────────────────

  load() {
    if (this._loaded) return;
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        const data = JSON.parse(raw);
        this._dontList = Array.isArray(data.dontList) ? data.dontList : JSON.parse(JSON.stringify(DEFAULT_DONT_LIST));
        this._stats = data.stats || { evaluations: 0, restrained: 0, approved: 0, challenges: 0 };
      } else {
        this._dontList = JSON.parse(JSON.stringify(DEFAULT_DONT_LIST));
      }
    } catch (e) {
      this._dontList = JSON.parse(JSON.stringify(DEFAULT_DONT_LIST));
    }
    this._loaded = true;
  }

  _save() {
    try {
      const dir = path.dirname(CONFIG_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({
        dontList: this._dontList,
        stats: this._stats,
        lastUpdated: Date.now(),
      }, null, 2), 'utf8');
    } catch (e) { /* 非关键 */ }
  }

  // ─── 核心：克制分析 ─────────────────────────────────────────────

  /**
   * 对任意提案/方向做主动克制分析
   * @param {string} proposal - 提案描述（如"做视频生成"、"扩展心理引擎"）
   * @returns {Object} { restrained, matches: [...], reason, approvedItems, score }
   */
  evaluate(proposal) {
    this.load();
    this._stats.evaluations++;
    if (!proposal) return { restrained: false, matches: [], reason: '', score: 0 };

    const proposalLower = proposal.toLowerCase();
    const proposalClean = proposalLower.replace(/["「」『』]/g, '');
    const matches = [];

    for (const item of this._dontList) {
      // 检查是否过期
      if (item.expiringAt && item.expiringAt < Date.now()) continue;

        // 将"不做"条目拆成多个子项（按/分割），逐项匹配
      const subItems = item.item.split(/[/，,、]/).filter(s => s.trim().length >= 2).map(s => s.trim().toLowerCase().replace(/["「」『』]/g, ''));
        // 子项精确匹配（最高置信度）
        const subItemMatch = subItems.some(sub => proposalClean.includes(sub));

        // 2-gram关键词交集匹配 — 已拆成子项2-gram + 核心去停用词
        const subItem2grams = [...new Set(subItems.flatMap(s => this._extractKeywords(s)))];
        const proposal2grams = new Set(this._extractKeywords(proposal));
        const subItemHitCount = subItem2grams.filter(k => proposal2grams.has(k) || proposalLower.includes(k)).length;
        const subItemHitRatio = subItem2grams.length > 0 ? subItemHitCount / subItem2grams.length : 0;

        // 核心2-gram去停用词交集
        const stop2Grams = new Set(['能力', '模块', '生成', '构建', '模型', '输出', '语言', '分析', '系统', '功能', '一个']);
        const itemCore = this._extractKeywords(item.item).filter(k => !(k.length === 2 && stop2Grams.has(k)));
        const coreOverlap = itemCore.filter(k => proposal2grams.has(k)).length;
        const coreScore = itemCore.length > 0 ? (coreOverlap / Math.max(itemCore.length, 1)) * 0.65 : 0;

        // 单一关键命中：子项的非停用词2-gram只要出现在提案中就给基础分
        const anyHit = subItem2grams.some(k => k.length >= 2 && !stop2Grams.has(k) && (proposal2grams.has(k) || proposalClean.includes(k)));
        const anyHitScore = anyHit ? item.strength * 0.2 : 0;

        const rawScore = Math.max(
          subItemMatch ? item.strength * 0.7 : 0,
          subItemHitRatio >= 0.3 ? item.strength * 0.45 : 0,
          coreScore,
          anyHitScore
        );
      const effectiveScore = rawScore * (item.strength || 0.5);

      if (effectiveScore > 0.15) {
        matches.push({
          matchId: item.id,
          matchItem: item.item,
          matchStrength: +effectiveScore.toFixed(3),
          reason: item.reason,
          source: item.source,
        });
      }
    }

    // 按匹配度排序
    matches.sort((a, b) => b.matchStrength - a.matchStrength);

    // 强匹配 → 克制（阈值>=0.2，低阈值是为了捕获语义接近但不完全匹配的提案）
    const restrained = matches.length > 0 && matches[0].matchStrength >= 0.2;

    if (restrained) {
      this._stats.restrained++;
    } else {
      this._stats.approved++;
    }
    this._save();

    return {
      restrained,
      matches: matches.slice(0, 5),
      reason: restrained
        ? `战略克制：此方向匹配「${matches[0].matchItem}」（匹配度 ${matches[0].matchStrength}）。${matches[0].reason}`
        : null,
      approvedItems: !restrained ? matches.filter(m => m.matchStrength > 0).map(m => m.matchItem) : [],
      score: matches[0] ? matches[0].matchStrength : 0,
      stats: {
        totalDontList: this._dontList.length,
        evaluationsTotal: this._stats.evaluations,
        restraintRate: this._stats.evaluations > 0
          ? +(this._stats.restrained / this._stats.evaluations).toFixed(3)
          : 0,
      },
    };
  }

  // ─── "不做清单"管理 ────────────────────────────────────────────

  getDontList() {
    this.load();
    return this._dontList
      .filter(item => !item.expiringAt || item.expiringAt > Date.now())
      .map(item => ({
        id: item.id,
        item: item.item,
        reason: item.reason,
        strength: item.strength,
        source: item.source,
        addedAt: item.addedAt,
        expiresSoon: item.expiringAt ? (item.expiringAt - Date.now()) / 86400000 < 7 : false,
      }));
  }

  /**
   * 新增"不做"条目
   * @param {Object} entry - { item, reason, strength, source }
   */
  addDont(entry) {
    this.load();
    if (!entry || !entry.item) return { success: false, error: 'item必填' };

    // 去重：相同item不重复追加
    const existing = this._dontList.find(d =>
      d.item.toLowerCase() === entry.item.toLowerCase()
    );
    if (existing) {
      existing.reason = entry.reason || existing.reason;
      existing.strength = typeof entry.strength === 'number' ? entry.strength : existing.strength;
      existing.source = entry.source || existing.source;
      existing.addedAt = Date.now();
      this._stats.challenges++;
      this._save();
      return { success: true, action: 'updated', id: existing.id };
    }

    const newItem = {
      id: `dr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      item: entry.item,
      reason: entry.reason || '',
      strength: typeof entry.strength === 'number' ? entry.strength : 0.7,
      source: entry.source || 'self-derived',
      addedAt: Date.now(),
      expiringAt: entry.expireDays ? Date.now() + entry.expireDays * 86400000 : null,
    };
    this._dontList.push(newItem);

    // 容量保护
    if (this._dontList.length > this._maxListSize) {
      // 淘汰最弱且最老的
      this._dontList.sort((a, b) => a.strength - b.strength || a.addedAt - b.addedAt);
      this._dontList = this._dontList.slice(-this._maxListSize);
    }

    this._stats.challenges++;
    this._save();
    return { success: true, action: 'added', id: newItem.id, item: newItem.item };
  }

  /**
   * 移除"不做"条目（当判断已过时）
   */
  removeDont(id) {
    this.load();
    const idx = this._dontList.findIndex(d => d.id === id);
    if (idx === -1) return { success: false, error: 'not_found' };
    this._dontList.splice(idx, 1);
    this._save();
    return { success: true };
  }

  // ─── 核心使命检查 ────────────────────────────────────────

  /**
   * 检查一个提案是否偏离核心使命
   * @param {string} proposal - 提案
   * @returns {Object} { aligned, alignedWith, feedback }
   */
  checkMission(proposal) {
    if (!proposal) return { aligned: false, alignedWith: [], feedback: '无提案' };

    const proposalLower = proposal.toLowerCase().replace(/["「」『』]/g, '');
    const proposalKeywords = this._extractKeywords(proposal);
    const alignedWith = CORE_MISSION.filter(m => {
      // 中文字项匹配：mission的任意2-gram出现在提案中
      const missionKeywords = this._extractKeywords(m);
      const hitKeywords = missionKeywords.filter(k => proposalLower.includes(k));
      return hitKeywords.length >= Math.max(1, Math.ceil(missionKeywords.length * 0.4));
    });

    return {
      aligned: alignedWith.length > 0,
      alignedWith,
      feedback: alignedWith.length === 0
        ? `此提案（${proposal.substring(0, 50)}）未直接对应心虫4项核心使命中的任何一项。考虑修改方向或明确其与哪项核心使命相关。`
        : null,
    };
  }

  // ─── 统计 ────────────────────────────────────────────────────────

  getStats() {
    this.load();
    const effective = this._dontList.filter(d => !d.expiringAt || d.expiringAt > Date.now());
    return {
      ...this._stats,
      dontListCount: effective.length,
      expiredCount: this._dontList.length - effective.length,
      missions: CORE_MISSION,
      sources: [...new Set(effective.map(d => d.source))],
    };
  }

  // ─── 内部 ────────────────────────────────────────────────────────

  _extractKeywords(text) {
    if (!text) return [];
    // 中文：分词用字符二元组 + 词级切割
    // 英文：按空格/标点切
    const results = [];
    // 中文部分：2-gram 字符级的切分（覆盖"视频生成"→"视频"+"生成"+"视频生成"）
    const chineseChars = text.replace(/[a-zA-Z0-9\s]/g, '').split('');
    for (let i = 0; i < chineseChars.length; i++) {
      if (chineseChars[i].trim()) results.push(chineseChars[i]);  // 单字
      if (i + 1 < chineseChars.length) results.push(chineseChars[i] + chineseChars[i + 1]);  // 双字组
    }
    // 英文部分：按空格/标点切
    const englishParts = text.replace(/[\u4e00-\u9fff]/g, ' ').split(/[\s,/]+/).filter(w => w.length > 1);
    results.push(...englishParts);
    // 去掉重复，保留至少2字符的条目
    return [...new Set(results.filter(r => r.length >= 2))];
  }
}

module.exports = { StrategicRestraint };
